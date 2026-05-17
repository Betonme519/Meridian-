import { useEffect, useState } from "react";
import {
  Cloud,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Settings2,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload as UploadIcon,
  type LucideIcon,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useRagSources } from "@/hooks/useRagSources";
import type { ParsedStatus, RagSourceKind } from "@/api/ragSourceApi";

/* ───────────────────────── Section 2 · File import slots ───────────────────────── */

type ImportSlot = {
  title: string;
  desc: string;
  formats: string;
  /** 写入 rag_source.kind 的枚举值 */
  kind: RagSourceKind;
  /** <input accept>；保持宽松，浏览器只是默认过滤，最终 mime 走表字段记录 */
  accept: string;
  icon: LucideIcon;
};

const fileSlots: ImportSlot[] = [
  {
    title: "培养方案 / 学生手册",
    desc: "AI 自动解析章节、学分结构、替代规则",
    formats: "PDF · Word · Markdown",
    kind: "培养方案",
    accept: ".pdf,.doc,.docx,.md,application/pdf",
    icon: FileText,
  },
  {
    title: "成绩单",
    desc: "教务系统导出，或截图 OCR",
    formats: "PDF · Excel · 图片",
    kind: "成绩单",
    accept: ".pdf,.xls,.xlsx,.csv,image/*,application/pdf",
    icon: FileSpreadsheet,
  },
  {
    title: "课表 / 截图",
    desc: "本学期课程 + 时间冲突自动检测",
    formats: "图片 · iCal · CSV",
    kind: "课表",
    accept: "image/*,.ics,.csv",
    icon: ImageIcon,
  },
];

/* ───────────────────────── Section 3 · Connectors ───────────────────────── */

const schoolOptions = [
  "请选择学校",
  "清华大学",
  "北京大学",
  "复旦大学",
  "上海交大",
  "浙江大学",
  "其他（手动配置）",
];

/* ───────────────────────── Section 4 · Mini apps & community ───────────────────────── */

type MiniApp = {
  title: string;
  desc: string;
  status: "已连接" | "可连接";
  icon: LucideIcon;
};

const miniApps: MiniApp[] = [
  { title: "超级课程表",  desc: "课表 + 课评数据同步",       status: "可连接", icon: Smartphone },
  { title: "小红书课评",  desc: "聚合学生真实评价",           status: "可连接", icon: Smartphone },
  { title: "学校论坛",    desc: "本校匿名社区抓取（按学校）",  status: "可连接", icon: Database },
  { title: "自定义 RSS",  desc: "教务公告 / 通知订阅",        status: "可连接", icon: Cloud },
];

/* ───────────────────────── Section 6 · Imported data list ───────────────────────── */

/**
 * 解析状态 → 中文标签 + 配色。配色保持 low saturation，沿用既有色板。
 * 解析中暂时与待解析同色（视觉上都属于"未完成"），节省色彩负担。
 */
const STATUS_LABEL: Record<ParsedStatus, string> = {
  pending: "待解析",
  parsing: "解析中",
  parsed: "解析完成",
  failed: "失败",
};

const STATUS_CLS: Record<ParsedStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  parsing: "bg-amber-50 text-amber-800",
  parsed: "bg-emerald-50 text-emerald-700",
  failed: "bg-rose-50 text-rose-700",
};

/** ISO timestamptz → YYYY-MM-DD，避开 locale 差异 */
function formatDate(iso: string): string {
  if (!iso) return "—";
  // ISO 头 10 位就是日期；schema 写入用 timestamptz，全段以 'YYYY-MM-DD...' 开头
  return iso.slice(0, 10);
}

/* ───────────────────────── Page ───────────────────────── */

export default function UploadPage() {
  const { profile, updateProfile } = useProfile();
  const {
    sources,
    loading: sourcesLoading,
    error: sourcesError,
    uploading,
    upload,
    remove,
  } = useRagSources();

  // 本地草稿态——profile 加载后由 useEffect 覆盖默认值；guest 态下保持默认
  const [school, setSchool] = useState(schoolOptions[0]);
  const [grade, setGrade] = useState("");
  const [major, setMajor] = useState("");
  const [name, setName] = useState("");
  const [dragHover, setDragHover] = useState<number | null>(null);

  // profile 加载/变化时同步到本地草稿（包括首次加载和多 tab 同步场景）
  useEffect(() => {
    if (!profile) return;
    setSchool(profile.school ?? schoolOptions[0]);
    setGrade(profile.grade != null ? String(profile.grade) : "");
    setMajor(profile.major ?? "");
    setName(profile.name ?? "");
  }, [profile?.school, profile?.grade, profile?.major, profile?.name]);

  // school 是 select，change 即 commit
  const handleSchoolChange = (v: string) => {
    setSchool(v);
    void updateProfile({ school: v === schoolOptions[0] ? null : v }).catch(
      (e) => console.warn("[Upload] 保存学校失败:", e),
    );
  };

  // 文本输入 onBlur 才 commit，避免每键一次写
  const handleGradeBlur = () => {
    const trimmed = grade.trim();
    if (trimmed === "") {
      void updateProfile({ grade: null }).catch((e) =>
        console.warn("[Upload] 保存入学年份失败:", e),
      );
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      // TD-16 修复：无效值不写 DB，但本地 state 也要 reset，否则 UI 仍显示"abc"
      // 让用户以为已保存。reset 回 profile 当前值（null → 空字符串）。
      setGrade(profile?.grade != null ? String(profile.grade) : "");
      return;
    }
    void updateProfile({ grade: n }).catch((e) =>
      console.warn("[Upload] 保存入学年份失败:", e),
    );
  };

  const handleMajorBlur = () => {
    const trimmed = major.trim();
    void updateProfile({ major: trimmed === "" ? null : trimmed }).catch((e) =>
      console.warn("[Upload] 保存专业失败:", e),
    );
  };

  const handleNameBlur = () => {
    const trimmed = name.trim();
    void updateProfile({ name: trimmed === "" ? null : trimmed }).catch((e) =>
      console.warn("[Upload] 保存显示名失败:", e),
    );
  };

  const connected = school !== schoolOptions[0];

  /**
   * 校验 file 是否匹配 slot 的 accept 字符串。
   *
   * TD-15-4 修复：原 drop 路径不校验文件类型（用户拖 .exe 也照传到 Storage）。
   * input click 走 accept 浏览器自然过滤；drop 不过滤，需要手动校验。
   *
   * accept 格式："*.pdf,.doc,image/*,application/pdf" — 三类元素：
   *   - 扩展名（.pdf）
   *   - mime 通配（image/*）
   *   - mime 精确（application/pdf）
   */
  const matchesAccept = (file: File, accept: string): boolean => {
    const tokens = accept.split(",").map((t) => t.trim().toLowerCase());
    const fname = file.name.toLowerCase();
    const fmime = (file.type || "").toLowerCase();
    return tokens.some((tok) => {
      if (!tok) return false;
      if (tok.startsWith(".")) return fname.endsWith(tok);                // 扩展名
      if (tok.endsWith("/*")) return fmime.startsWith(tok.slice(0, -1));  // image/* → image/
      return fmime === tok;                                                // 精确 mime
    });
  };

  /**
   * 拖入或选中文件 → 顺序上传。允许多文件，每个独立调用 API。
   * 单个文件失败 try/catch 包住不中断后续（错误已经经过 errorBus toast 暴露）。
   */
  const handleFiles = async (slotIdx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slot = fileSlots[slotIdx];
    // 顺序处理：浏览器并行上传多文件容易撞 Storage rate limit，串行更稳
    for (const file of Array.from(files)) {
      // TD-15-4：drop 路径手动校验文件类型（input click 已经走浏览器 accept 过滤）
      if (!matchesAccept(file, slot.accept)) {
        console.warn(
          `[Upload] 跳过 "${file.name}"：类型不匹配 slot 的 accept（${slot.accept}）`,
        );
        continue;
      }
      try {
        await upload(file, slot.kind);
      } catch {
        // 错误已 toast + setError，单个失败不中断后续文件
      }
    }
  };

  const handleRemove = async (id: string) => {
    const target = sources.find((s) => s.id === id);
    if (!target) return;
    try {
      await remove(target);
    } catch (e) {
      console.warn("[Upload] 删除失败:", e);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Hero */}

      {/* Section 2 · File slots */}
      <div className="mt-10">
        <div className="flex items-center gap-2">
          <UploadIcon className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">文件导入</h2>
          {uploading > 0 && (
            <span className="ml-3 inline-flex items-center gap-1 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              上传中 {uploading}
            </span>
          )}
          <span className="ml-auto text-xs text-slate-400">PDF · Excel · 图片</span>
        </div>

        {sourcesError && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {sourcesError}
          </p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {fileSlots.map((s, i) => {
            const Icon = s.icon;
            const isHover = dragHover === i;
            // 用 <label> 包 <input>：点击 label 自动触发 input 文件选择，
            // 无需 ref + stopPropagation；符合 HTML 规范、a11y 友好。
            return (
              <label
                key={s.title}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragHover(i);
                }}
                onDragLeave={() => setDragHover((curr) => (curr === i ? null : curr))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragHover(null);
                  void handleFiles(i, e.dataTransfer.files);
                }}
                className={`animate-fade-in-up-soft flex cursor-pointer flex-col items-start rounded-2xl border-2 border-dashed p-5 text-left transition-colors ${
                  isHover
                    ? "border-slate-950 bg-slate-50"
                    : "border-slate-300 bg-white hover:border-slate-500"
                }`}
                style={{ animationDelay: `${60 + i * 60}ms` }}
              >
                <input
                  type="file"
                  multiple
                  accept={s.accept}
                  className="hidden"
                  onChange={(e) => {
                    void handleFiles(i, e.target.files);
                    // 重置 value：下次再选同一个文件名也能触发 onChange
                    e.target.value = "";
                  }}
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-700" strokeWidth={1.7} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{s.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{s.desc}</p>
                <p className="mt-3 text-[11px] text-slate-400">{s.formats}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                  拖拽文件到此 / 点击上传
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 3 · Connectors */}
      <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold tracking-tight">教务系统连接器</h2>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            授权登录后会按周自动同步成绩、课表、培养方案变更。
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                所在学校
              </span>
              <select
                value={school}
                onChange={(e) => handleSchoolChange(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors hover:border-slate-400 focus:border-slate-950 focus:outline-none"
              >
                {schoolOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!connected}
              className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors ${
                connected
                  ? "bg-slate-950 text-white hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-200 text-slate-400"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {connected ? "授权登录" : "先选学校"}
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              当前连接状态
            </p>
            <p className="mt-1.5 text-sm text-slate-800">
              {connected ? `${school} · 等待授权` : "尚未连接任何教务系统"}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              所有 OAuth token 加密保存在你本地，不会上传到服务端。
            </p>
          </div>
        </div>

        {/* Personal settings */}
        <aside
          className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-6"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold tracking-tight">个人设置</h2>
          </div>
          <div className="mt-5 space-y-3">
            <Field label="显示名">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="留空则用邮箱前缀"
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-400 focus:border-slate-950 focus:outline-none"
              />
            </Field>
            <Field label="入学年份">
              <input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                onBlur={handleGradeBlur}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-400 focus:border-slate-950 focus:outline-none"
              />
            </Field>
            <Field label="专业">
              <input
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                onBlur={handleMajorBlur}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-400 focus:border-slate-950 focus:outline-none"
              />
            </Field>
          </div>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950"
          >
            <Download className="h-3.5 w-3.5" />
            导出我的所有数据
          </button>
        </aside>
      </div>

      {/* Section 4 · Mini apps */}
      <div className="mt-12">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">小程序 / 社区接入</h2>
          <span className="ml-auto text-xs text-slate-400">{miniApps.length} 个数据源</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {miniApps.map((m, i) => {
            const Icon = m.icon;
            return (
              <article
                key={m.title}
                className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-5"
                style={{ animationDelay: `${60 + i * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <Icon className="h-5 w-5 text-slate-700" strokeWidth={1.7} />
                  </div>
                  <span
                    className={`ml-auto inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold ${
                      m.status === "已连接"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{m.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{m.desc}</p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-700 transition-colors hover:text-slate-950"
                >
                  连接
                  <ExternalLink className="h-3 w-3" />
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* Section 6 · Imported data list */}
      <div className="mt-12">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">已导入的数据</h2>
          <span className="ml-auto text-xs text-slate-400 tabular-nums">
            {sourcesLoading ? "加载中…" : `${sources.length} 条记录`}
          </span>
        </div>
        <div
          className="animate-fade-in-up-soft mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          style={{ animationDelay: "60ms" }}
        >
          <div className="grid grid-cols-[1.4fr_120px_140px_120px_120px] gap-4 border-b border-slate-100 bg-slate-50/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 max-md:hidden">
            <span>文件</span>
            <span>类型</span>
            <span>导入日期</span>
            <span>状态</span>
            <span />
          </div>

          {sources.length === 0 && !sourcesLoading && (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              还没有导入任何文件 —— 点击上方任一卡片开始
            </p>
          )}

          {sources.map((r) => (
            <article
              key={r.id}
              className="grid gap-2 border-b border-slate-100 px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50/60 md:grid-cols-[1.4fr_120px_140px_120px_120px] md:items-center md:gap-4"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{r.name}</p>
                <p className="text-[11px] text-slate-400 md:hidden">
                  {r.kind} · {formatDate(r.created_at)}
                </p>
              </div>
              <span className="text-xs text-slate-700 max-md:hidden">{r.kind}</span>
              <span className="text-xs tabular-nums text-slate-500 max-md:hidden">
                {formatDate(r.created_at)}
              </span>
              <span
                className={`inline-flex h-5 w-fit items-center rounded-full px-2 text-[11px] font-semibold ${STATUS_CLS[r.parsed_status]}`}
              >
                {STATUS_LABEL[r.parsed_status]}
              </span>
              <button
                type="button"
                onClick={() => void handleRemove(r.id)}
                className="inline-flex h-8 w-fit items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 transition-colors hover:border-rose-300 hover:text-rose-700"
              >
                <Trash2 className="h-3 w-3" />
                删除
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
