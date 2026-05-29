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
import CourseManager from "@/pages/Upload/CourseManager";
import RequirementProgress from "@/pages/Upload/RequirementProgress";

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
    desc: "系统自动解析章节、学分结构、替代规则",
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

/**
 * file slot 三色循环 —— 默认 dashed slate-300 不动,hover/拖拽时透出对应 brand 色边。
 * 顺序对应 fileSlots:培养方案=gold / 成绩单=sapphire / 课表=maya。
 */
const SLOT_TONES = [
  { hoverBorder: "hover:border-gold", activeBorder: "border-gold" },
  { hoverBorder: "hover:border-sapphire", activeBorder: "border-sapphire" },
  { hoverBorder: "hover:border-maya", activeBorder: "border-maya" },
] as const;

const schoolOptions = [
  "请选择学校",
  "华东师范大学",
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
  { title: "超级课程表", desc: "课表 + 课评数据同步", status: "可连接", icon: Smartphone },
  { title: "小红书课评", desc: "聚合学生真实评价", status: "可连接", icon: Smartphone },
  { title: "学校论坛", desc: "本校匿名社区抓取（按学校）", status: "可连接", icon: Database },
  { title: "自定义 RSS", desc: "教务公告 / 通知订阅", status: "可连接", icon: Cloud },
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
  pending: "bg-gold/10 text-slate-700",
  parsing: "bg-gold/10 text-slate-700",
  parsed: "bg-maya/15 text-slate-700",
  failed: "bg-flame/10 text-flame",
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
  // target_gpa 默认 3.0（DB 可为 null，未设置时滑块显示中位）
  const [targetGpa, setTargetGpa] = useState<number>(3.0);
  const [dragHover, setDragHover] = useState<number | null>(null);

  // profile 加载/变化时同步到本地草稿（包括首次加载和多 tab 同步场景）
  useEffect(() => {
    if (!profile) return;
    setSchool(profile.school ?? schoolOptions[0]);
    setGrade(profile.grade != null ? String(profile.grade) : "");
    setMajor(profile.major ?? "");
    setTargetGpa(profile.target_gpa != null ? Number(profile.target_gpa) : 3.0);
  }, [profile?.school, profile?.grade, profile?.major, profile?.target_gpa]);

  // school 是 select，change 即 commit
  const handleSchoolChange = (v: string) => {
    setSchool(v);
    void updateProfile({ school: v === schoolOptions[0] ? null : v }).catch((e) =>
      console.warn("[Upload] 保存学校失败:", e),
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
    void updateProfile({ grade: n }).catch((e) => console.warn("[Upload] 保存入学年份失败:", e));
  };

  const handleMajorBlur = () => {
    const trimmed = major.trim();
    void updateProfile({ major: trimmed === "" ? null : trimmed }).catch((e) =>
      console.warn("[Upload] 保存专业失败:", e),
    );
  };

  // target_gpa slider 拖动期间仅本地 state 跟随；松手 / 失焦才写 DB，避免狂触
  // updateProfile。保留 2 位小数精度（DB numeric(3,2)），与 toFixed(1) 显示一致。
  const handleGpaCommit = () => {
    const rounded = Math.round(targetGpa * 10) / 10;
    void updateProfile({ target_gpa: rounded }).catch((e) =>
      console.warn("[Upload] 保存目标 GPA 失败:", e),
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
      if (tok.startsWith(".")) return fname.endsWith(tok); // 扩展名
      if (tok.endsWith("/*")) return fmime.startsWith(tok.slice(0, -1)); // image/* → image/
      return fmime === tok; // 精确 mime
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
        console.warn(`[Upload] 跳过 "${file.name}"：类型不匹配 slot 的 accept（${slot.accept}）`);
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
    <section className="mx-auto max-w-7xl space-y-8 px-5 py-5 sm:px-8 sm:py-6">
      {/* 1 · 毕业要求完成情况（排队 12.5 sub-task 0） */}
      <RequirementProgress />

      {/* 2 · 个人设置（左） + 教务系统连接（右） */}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Personal settings */}
        <aside
          className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-5"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold tracking-tight">个人设置</h2>
          </div>
          <div className="mt-4 space-y-3">
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

            {/* TD-10 第一刀 · 目标 GPA */}
            <Field
              label="目标 GPA"
              hint="影响 advisor 推荐课程的难度倾向"
            >
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={4}
                  step={0.1}
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(parseFloat(e.target.value))}
                  onPointerUp={handleGpaCommit}
                  onKeyUp={(e) => {
                    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                      handleGpaCommit();
                    }
                  }}
                  className="flex-1 accent-sapphire"
                  aria-label="目标 GPA"
                />
                <span className="w-12 text-right text-sm font-semibold tabular-nums text-slate-900">
                  {targetGpa.toFixed(1)}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                <span>0.0</span>
                <span>2.0</span>
                <span>4.0</span>
              </div>
            </Field>
          </div>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950"
          >
            <Download className="h-3.5 w-3.5" />
            导出我的所有数据
          </button>
        </aside>

        {/* Connector */}
        <div className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold tracking-tight">教务系统连接器</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            授权登录后会按周自动同步成绩、课表、培养方案变更。
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                所在学校
              </span>
              <select
                value={school}
                onChange={(e) => handleSchoolChange(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors hover:border-slate-400 focus:border-slate-950 focus:outline-none"
              >
                {schoolOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            {/* 渐变按钮:连接 → bg-brand-gradient;未选学校 → disabled 走灰底
                + bg-none 清渐变 image,跟首页发送按钮 / Goal 按钮配色一致。 */}
            <button
              type="button"
              disabled={!connected}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:bg-none disabled:text-slate-400 disabled:shadow-none"
            >
              <ShieldCheck className="h-4 w-4" />
              {connected ? "授权登录" : "先选学校"}
            </button>
          </div>

          {/* 当前连接状态 · 用细线分隔，不嵌套框 */}
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              当前连接状态
            </p>
            <p className="mt-1 text-sm text-slate-800">
              {connected ? `${school} · 等待授权` : "尚未连接任何教务系统"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              所有 OAuth token 加密保存在你本地，不会上传到服务端。
            </p>
          </div>
        </div>
      </div>

      {/* 3 · 文件导入 */}
      <div>
        <div className="flex items-center gap-2 px-1">
          <UploadIcon className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">文件导入</h2>
          {uploading > 0 && (
            <span className="ml-3 inline-flex items-center gap-1 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              上传中 {uploading}
            </span>
          )}
        </div>

        {sourcesError && (
          <p className="mt-3 rounded-lg border border-flame/40 bg-white px-3 py-2 text-xs text-flame">
            {sourcesError}
          </p>
        )}

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {fileSlots.map((s, i) => {
            const Icon = s.icon;
            const isHover = dragHover === i;
            // 3 张 file slot 用 brand 色循环点缀:默认 dashed slate-300 不变,
            // hover / 拖拽悬停时透出对应 brand 色边框,克制不抢。
            const tone = SLOT_TONES[i % SLOT_TONES.length];
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
                className={`animate-fade-in-up-soft flex cursor-pointer flex-col items-start rounded-2xl border-2 border-dashed p-4 text-left transition-colors ${
                  isHover
                    ? `${tone.activeBorder} bg-slate-50`
                    : `border-slate-300 bg-white ${tone.hoverBorder}`
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
                    e.target.value = "";
                  }}
                />
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-700" strokeWidth={1.7} />
                </div>
                <p className="mt-2.5 text-sm font-semibold text-slate-900">{s.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{s.desc}</p>
                <p className="mt-2 text-[11px] text-slate-400">{s.formats}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                  拖拽文件到此 / 点击上传
                </span>
              </label>
            );
          })}
        </div>

        {/* 已导入数据 —— 文件导入下方紧跟，单层 card + divide 行 */}
        <div className="mt-4">
          <div className="flex items-center gap-2 px-1">
            <Database className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">已导入的数据</h3>
            <span className="ml-auto text-[11px] text-slate-400 tabular-nums">
              {sourcesLoading ? "加载中…" : `${sources.length} 条记录`}
            </span>
          </div>
          <div
            className="animate-fade-in-up-soft mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white"
            style={{ animationDelay: "60ms" }}
          >
            <div className="grid grid-cols-[1.4fr_120px_140px_120px_120px] gap-4 border-b border-slate-100 bg-slate-50/40 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 max-md:hidden">
              <span>文件</span>
              <span>类型</span>
              <span>导入日期</span>
              <span>状态</span>
              <span />
            </div>

            {sources.length === 0 && !sourcesLoading && (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                还没有导入任何文件 —— 点击上方任一卡片开始
              </p>
            )}

            {sources.map((r) => (
              <article
                key={r.id}
                className="grid gap-2 border-b border-slate-100 px-5 py-3 transition-colors last:border-b-0 hover:bg-slate-50/60 md:grid-cols-[1.4fr_120px_140px_120px_120px] md:items-center md:gap-4"
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
                  className="inline-flex h-8 w-fit items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 transition-colors hover:border-flame/50 hover:text-flame"
                >
                  <Trash2 className="h-3 w-3" />
                  删除
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* 4 · 小程序 / 社区接入 */}
      <div>
        <div className="flex items-center gap-2 px-1">
          <Smartphone className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">小程序 / 社区接入</h2>
          <span className="ml-auto text-xs text-slate-400">{miniApps.length} 个数据源</span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {miniApps.map((m, i) => {
            const Icon = m.icon;
            return (
              <article
                key={m.title}
                className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-4"
                style={{ animationDelay: `${60 + i * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                    <Icon className="h-4 w-4 text-slate-700" strokeWidth={1.7} />
                  </div>
                  <span
                    className={`ml-auto inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold ${
                      m.status === "已连接"
                        ? "bg-maya/15 text-slate-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <p className="mt-2.5 text-sm font-semibold text-slate-900">{m.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{m.desc}</p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-700 transition-colors hover:text-slate-950"
                >
                  连接
                  <ExternalLink className="h-3 w-3" />
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* 5 · 我已修的课（排队 11） */}
      <CourseManager />
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
          {label}
        </span>
        {hint && (
          <span className="text-[10px] text-slate-400">{hint}</span>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </label>
  );
}
