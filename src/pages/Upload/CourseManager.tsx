import { useState } from "react";
import { BookOpen, Loader2, Trash2 } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import {
  COURSE_STATUSES,
  COURSE_CATEGORIES,
  type CourseStatus,
  type CourseCategory,
} from "@/api/courseApi";

/**
 * Upload 页 · 我已修的课。
 *
 * 用户手动录入修课记录 = 排队 11 的最小可用面：
 * 添加 / 列表 / 删除，覆盖画布判定（排队 12）所需的 code + status 字段。
 * 不做行内编辑、不做学期折叠、不接 AI ——  这些落到排队 14 UI 重设计统一处理。
 *
 * 配色 / 间距 / kicker / 排版 全部复用 Upload 页 Section 6 的既有模式，避免风格漂移。
 */

const STATUS_LABEL: Record<CourseStatus, string> = {
  planned: "计划中",
  enrolled: "在修",
  completed: "已修",
  dropped: "退课",
  failed: "未通过",
};

const STATUS_CLS: Record<CourseStatus, string> = {
  planned: "bg-slate-100 text-slate-600",
  enrolled: "bg-gold/10 text-slate-700",
  completed: "bg-maya/15 text-slate-700",
  dropped: "bg-slate-100 text-slate-500",
  failed: "bg-flame/10 text-flame",
};

interface DraftRow {
  code: string;
  name: string;
  category: CourseCategory | "";
  semester: string;
  credits: string;
  status: CourseStatus;
  grade_letter: string;
}

const EMPTY_DRAFT: DraftRow = {
  code: "",
  name: "",
  category: "",
  semester: "",
  credits: "",
  // 默认 'completed' —— 用户最常录入的是"已修过的课"
  status: "completed",
  grade_letter: "",
};

export default function CourseManager() {
  const { courses, loading, error, createCourse, removeCourse } = useCourses();

  const [draft, setDraft] = useState<DraftRow>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const canSave = draft.code.trim() !== "" && draft.name.trim() !== "" && !saving;

  const handleAdd = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      // numeric 解析；空字符串走 null
      const credits = draft.credits.trim() === "" ? null : Number(draft.credits);
      if (credits !== null && (!Number.isFinite(credits) || credits < 0)) {
        // 无效数字静默忽略 —— 让用户重输；toast 太重
        return;
      }
      const saved = await createCourse({
        code: draft.code.trim(),
        name: draft.name.trim(),
        category: draft.category === "" ? null : draft.category,
        semester: draft.semester.trim() === "" ? null : draft.semester.trim(),
        credits,
        status: draft.status,
        grade_letter: draft.grade_letter.trim() === "" ? null : draft.grade_letter.trim(),
      });
      if (saved) setDraft(EMPTY_DRAFT);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeCourse(id);
    } catch (e) {
      // 错误已 toast，UI 层不补提示
      console.warn("[Upload] 删除课程失败:", e);
    }
  };

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-slate-500" />
        <h2 className="font-semibold tracking-tight">我已修的课</h2>
        <span className="ml-auto text-xs text-slate-400 tabular-nums">
          {loading ? "加载中…" : `${courses.length} 条记录`}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        手动录入你的修课记录。画布判断「哪些 option 已完成」时会按课程代码匹配命中。
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-flame/40 bg-white px-3 py-2 text-xs text-flame">
          {error}
        </p>
      )}

      {/* 添加表单 */}
      <div
        className="animate-fade-in-up-soft mt-4 rounded-2xl border border-slate-200 bg-white p-5"
        style={{ animationDelay: "60ms" }}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
          添加一条
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[110px_1fr_110px_120px_80px_110px_70px_auto] lg:items-end">
          <FieldInput
            label="代码"
            value={draft.code}
            onChange={(v) => setDraft({ ...draft, code: v })}
            placeholder="CS241"
          />
          <FieldInput
            label="名称"
            value={draft.name}
            onChange={(v) => setDraft({ ...draft, name: v })}
            placeholder="数据结构"
          />
          <FieldSelect
            label="类别"
            value={draft.category}
            onChange={(v) => setDraft({ ...draft, category: v as CourseCategory | "" })}
            options={[
              { value: "", label: "未分类" },
              ...COURSE_CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FieldInput
            label="学期"
            value={draft.semester}
            onChange={(v) => setDraft({ ...draft, semester: v })}
            placeholder="2025-fall"
          />
          <FieldInput
            label="学分"
            value={draft.credits}
            onChange={(v) => setDraft({ ...draft, credits: v })}
            placeholder="3.0"
            inputMode="decimal"
          />
          <FieldSelect
            label="状态"
            value={draft.status}
            onChange={(v) => setDraft({ ...draft, status: v as CourseStatus })}
            options={COURSE_STATUSES.map((s) => ({
              value: s,
              label: STATUS_LABEL[s],
            }))}
          />
          <FieldInput
            label="成绩"
            value={draft.grade_letter}
            onChange={(v) => setDraft({ ...draft, grade_letter: v })}
            placeholder="A"
          />
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={!canSave}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors ${
              canSave
                ? "bg-slate-950 text-white hover:bg-slate-800"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            添加
          </button>
        </div>
      </div>

      {/* 列表 */}
      <div
        className="animate-fade-in-up-soft mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
        style={{ animationDelay: "120ms" }}
      >
        <div className="grid grid-cols-[110px_1fr_90px_120px_70px_100px_80px_80px] gap-3 border-b border-slate-100 bg-slate-50/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 max-md:hidden">
          <span>代码</span>
          <span>名称</span>
          <span>类别</span>
          <span>学期</span>
          <span>学分</span>
          <span>状态</span>
          <span>成绩</span>
          <span />
        </div>

        {courses.length === 0 && !loading && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            还没有录入任何课程 —— 用上面的表单添加第一条
          </p>
        )}

        {courses.map((c) => (
          <article
            key={c.id}
            className="grid gap-2 border-b border-slate-100 px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50/60 md:grid-cols-[110px_1fr_90px_120px_70px_100px_80px_80px] md:items-center md:gap-3"
          >
            <span className="font-mono text-sm text-slate-700">{c.code}</span>
            <div>
              <p className="text-sm font-medium text-slate-900">{c.name}</p>
              <p className="text-[11px] text-slate-400 md:hidden">
                {c.category ?? "未分类"} · {c.semester ?? "—"}
              </p>
            </div>
            <span className="text-xs text-slate-700 max-md:hidden">{c.category ?? "—"}</span>
            <span className="text-xs tabular-nums text-slate-500 max-md:hidden">
              {c.semester ?? "—"}
            </span>
            <span className="text-xs tabular-nums text-slate-500 max-md:hidden">
              {c.credits ?? "—"}
            </span>
            <span
              className={`inline-flex h-5 w-fit items-center rounded-full px-2 text-[11px] font-semibold ${STATUS_CLS[c.status]}`}
            >
              {STATUS_LABEL[c.status]}
            </span>
            <span className="text-xs tabular-nums text-slate-700 max-md:hidden">
              {c.grade_letter ?? "—"}
            </span>
            <button
              type="button"
              onClick={() => void handleRemove(c.id)}
              className="inline-flex h-8 w-fit items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 transition-colors hover:border-flame/50 hover:text-flame"
            >
              <Trash2 className="h-3 w-3" />
              删除
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric" | "text";
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-400 focus:border-slate-950 focus:outline-none"
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors hover:border-slate-400 focus:border-slate-950 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
