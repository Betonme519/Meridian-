import { useCallback, useEffect, useRef, useState } from "react";
import * as ragApi from "@/api/ragSourceApi";
import type { RagSource, RagSourceKind } from "@/api/ragSourceApi";
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

interface UseRagSourcesValue {
  sources: RagSource[];
  loading: boolean;
  error: string | null;
  uploading: number;
  upload: (file: File, kind: RagSourceKind) => Promise<RagSource | null>;
  remove: (source: RagSource) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRagSources(): UseRagSourcesValue {
  const { user, loading: authLoading } = useAuth();
  const [sources, setSources] = useState<RagSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);

  const requestIdRef = useRef(0);

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

  // 登入 → 拉列表；登出 → 清空
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      requestIdRef.current++;
      setSources([]);
      setLoading(false);
      setError(null);
      return;
    }
    void load(user.id);
  }, [user, authLoading, load]);

  const refresh = useCallback(async () => {
    if (!user) return;
    await load(user.id);
  }, [user, load]);

  const upload = useCallback(
    async (file: File, kind: RagSourceKind): Promise<RagSource | null> => {
      if (!user) {
        setError("请先登录后再上传文件");
        return null;
      }
      setUploading((n) => n + 1);
      setError(null);
      try {
        const saved = await ragApi.uploadRagSource({
          userId: user.id,
          file,
          kind,
        });
        // 乐观插入：新行排最前（与 listRagSources 的 desc 排序一致）
        setSources((prev) => [saved, ...prev]);
        return saved;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "上传失败";
        setError(msg);
        return null;
      } finally {
        setUploading((n) => n - 1);
      }
    },
    [user],
  );

  const remove = useCallback(
    async (source: RagSource) => {
      // 乐观删除：UI 立刻消失；失败再 revert
      const prev = sources;
      setSources((curr) => curr.filter((s) => s.id !== source.id));
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
    [sources],
  );

  return { sources, loading, error, uploading, upload, remove, refresh };
}
