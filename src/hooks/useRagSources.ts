import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ragApi from "@/api/ragSourceApi";
import type { RagSource, RagSourceKind } from "@/api/ragSourceApi";
import { extractText, UnsupportedDocError } from "@/lib/docExtract";
import { useAuth } from "@/hooks/useAuth";

/**
 * useRagSources —— /import 页本地态。
 *
 * 不做成 Provider：目前只 /import 一处消费，挂 __root 会把全站绑死
 * 在登入即拉取的副作用上，也违反 CLAUDE.md "不修改 routing"。
 *
 * 跟 useProfile / ProfileContext 类似，登入态变化时自动重拉；upload / remove
 * 走"乐观写本地 → API → 失败 revert"。requestIdRef 防 race（快速切账号 /
 * 连点上传时旧响应不要覆盖新结果）。
 *
 * 公共 API：
 *   sources    当前用户的所有 rag_source（已按 created_at desc 排序）
 *   loading    首次拉取 / refresh 是否进行中
 *   error      最近一次操作的错误（不阻断 UI，调用方自己决定怎么暴露）
 *   uploading  正在传的 slot 数；UI 用它显示 progress
 *   upload     传文件 + 写表
 *   remove     删 Storage + 删表
 *   refresh    强制重拉
 */

/** 文件大小上限 = 50 MB；Supabase 免费版 Storage 单文件上限就是 50 MB。
 *  TD-11 修复：前端先校验，避免传到一半被服务端拒绝浪费带宽。 */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

interface UseRagSourcesValue {
  sources: RagSource[];
  loading: boolean;
  error: string | null;
  uploading: number;
  /**
   * 上传 1 个文件。
   * - 成功：返回 saved RagSource
   * - 失败：抛 Error（调用方批量处理时 try/catch 包住即可不中断后续）
   *   错误已经经过 errorBus toast + 本 hook 的 setError 双重暴露
   * TD-15-2 修复：原来返 null 让调用方收不到具体错误；改成抛错让 try/catch 能区分。
   */
  upload: (file: File, kind: RagSourceKind) => Promise<RagSource>;
  remove: (source: RagSource) => Promise<void>;
  /**
   * 解析一条 source（排队 13.8-A）：下载 Blob → 浏览器抽文字 → 写回
   * parsed_text / parsed_status。乐观先置 'parsing'，终态 'parsed' / 'failed'。
   * 图片等不支持类型走 'failed' + parse_error（静默，不弹 toast）。
   */
  parseSource: (source: RagSource) => Promise<void>;
  /** 已解析且有正文的文档（喂 AI 顾问用，见 personalDocContext） */
  parsedDocs: RagSource[];
  refresh: () => Promise<void>;
}

export function useRagSources(): UseRagSourcesValue {
  const { user, loading: authLoading } = useAuth();
  const [sources, setSources] = useState<RagSource[]>([]);
  // loading 初值 true：避免首次渲染时空列表 + "0 条记录" 闪一下，待 useEffect
  // 决定到底要不要拉、是否登录态后再切回 false。
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);

  const requestIdRef = useRef(0);
  // 已加载过哪个 user.id 的列表；防 AuthContext re-emit（token refresh / 元数据
  // 更新）触发的同 id 重拉。登出时 reset 为 null。
  const loadedUserIdRef = useRef<string | null>(null);

  const load = useCallback(async (userId: string) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const rows = await ragApi.listRagSources(userId);
      if (reqId !== requestIdRef.current) return;
      setSources(rows);
    } catch (e) {
      if (reqId !== requestIdRef.current) return;
      const msg = e instanceof Error ? e.message : "加载导入记录失败";
      setError(msg);
      setSources([]);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // 登入 → 拉列表；登出 → 清空。
  // user 对象引用变化但 id 未变（token refresh 等）不会重拉。
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      requestIdRef.current++;
      loadedUserIdRef.current = null;
      setSources([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (loadedUserIdRef.current === user.id) return;
    loadedUserIdRef.current = user.id;
    void load(user.id);
  }, [user, authLoading, load]);

  const refresh = useCallback(async () => {
    if (!user) return;
    await load(user.id);
  }, [user, load]);

  const upload = useCallback(
    async (file: File, kind: RagSourceKind): Promise<RagSource> => {
      if (!user) {
        const msg = "请先登录后再上传文件";
        setError(msg);
        throw new Error(msg);
      }
      // TD-11：大小预检，避免传到一半被服务端拒绝
      if (file.size > MAX_UPLOAD_BYTES) {
        const mb = (file.size / 1024 / 1024).toFixed(1);
        const msg = `文件 ${file.name} 太大（${mb} MB，上限 50 MB）`;
        setError(msg);
        throw new Error(msg);
      }
      // TD-12：snapshot 当前 reqId，写回 state 前确认账号没切
      const reqId = requestIdRef.current;
      setUploading((n) => n + 1);
      setError(null);
      try {
        const saved = await ragApi.uploadRagSource({
          userId: user.id,
          file,
          kind,
        });
        if (reqId !== requestIdRef.current) {
          // 已被 logout / 切账号取消 —— 返结果但不写当前账号的列表
          return saved;
        }
        // 乐观插入：新行排最前（与 listRagSources 的 desc 排序一致）
        setSources((prev) => [saved, ...prev]);
        return saved;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "上传失败";
        setError(msg);
        throw e; // TD-15-2：抛错让批量调用方能区分单个文件失败
      } finally {
        setUploading((n) => n - 1);
      }
    },
    [user],
  );

  // TD-15-3：原来 useCallback deps 是 `[sources]`，函数引用随 sources 每次变。
  // 改成在 setSources 回调里同步记 prev，dep 只剩稳定的 user。
  const remove = useCallback(
    async (source: RagSource) => {
      // 乐观删除：UI 立刻消失；失败再 revert
      let prev: RagSource[] = [];
      setSources((curr) => {
        prev = curr;
        return curr.filter((s) => s.id !== source.id);
      });
      setError(null);
      try {
        await ragApi.deleteRagSource(source);
      } catch (e) {
        setSources(prev);
        const msg = e instanceof Error ? e.message : "删除失败";
        setError(msg);
        throw e;
      }
    },
    [],
  );

  // 解析单条 source —— 排队 13.8-A。
  // 复用 requestIdRef race-guard：解析期间切账号 / 重拉，旧结果不回写。
  const parseSource = useCallback(async (source: RagSource) => {
    const reqId = requestIdRef.current;
    setError(null);
    // 乐观：行立刻显「解析中」，清掉上次的 parse_error
    setSources((prev) =>
      prev.map((s) =>
        s.id === source.id
          ? { ...s, parsed_status: "parsing", parse_error: null }
          : s,
      ),
    );

    const nowIso = new Date().toISOString();
    try {
      const blob = await ragApi.downloadRagSource(source);
      // Blob 没有 name，包成 File 让 extractText 能按扩展名 / mime 分流
      const file = new File([blob], source.name, {
        type: source.mime ?? blob.type,
      });
      const text = await extractText(file);
      const updated = await ragApi.updateParseResult(source.id, {
        parsed_status: "parsed",
        parsed_text: text,
        parse_error: null,
        parsed_at: nowIso,
      });
      if (reqId !== requestIdRef.current) return;
      setSources((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "解析失败";
      // 持久化 failed 状态（best-effort：写库失败就只更本地）
      try {
        const updated = await ragApi.updateParseResult(source.id, {
          parsed_status: "failed",
          parse_error: msg,
          parsed_at: nowIso,
        });
        if (reqId !== requestIdRef.current) return;
        setSources((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s)),
        );
      } catch {
        if (reqId !== requestIdRef.current) return;
        setSources((prev) =>
          prev.map((s) =>
            s.id === source.id
              ? { ...s, parsed_status: "failed", parse_error: msg }
              : s,
          ),
        );
      }
      // 不支持类型（图片 / Word）= 预期内，靠 failed 徽章 + parse_error 提示即可，
      // 不再额外 setError 弹横幅，避免红字吓人。其余真错误才暴露到页面 error。
      if (reqId === requestIdRef.current && !(e instanceof UnsupportedDocError)) {
        setError(msg);
      }
    }
  }, []);

  // 已解析且有正文 —— 喂 AI 顾问用（personalDocContext 再按预算截断）。
  const parsedDocs = useMemo(
    () =>
      sources.filter(
        (s) => s.parsed_status === "parsed" && !!s.parsed_text?.trim(),
      ),
    [sources],
  );

  return {
    sources,
    loading,
    error,
    uploading,
    upload,
    remove,
    parseSource,
    parsedDocs,
    refresh,
  };
}
