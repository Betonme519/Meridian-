import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Clock,
  Gauge,
  ShieldAlert,
  Star,
} from "lucide-react";

type CourseRow = [string, string, string[], string, string, string];

const courses: CourseRow[] = [
  ["HIST 118", "中国近现代史专题", ["高分推荐", "低压力"], "A-", "3h/周", "可 P/F"],
  ["CS 241", "系统编程", ["高风险", "不建议同修"], "B", "9h/周", "计入 GPA"],
  ["MATH 233", "线性代数", ["requirement 价值高"], "B+", "6h/周", "可替代专业基础"],
  ["MUS 102", "音乐与社会", ["水课", "低压力"], "A", "2h/周", "不计入 GPA"],
];

// Tag → semantic color. Keeps to design-system palette (slate / emerald / amber).
function tagTone(tag: string) {
  if (/高分|价值高|推荐/.test(tag)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (/风险|不建议|压分/.test(tag)) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

// Grade letter → faint color tint
function gradeTone(grade: string) {
  if (grade.startsWith("A")) return "text-emerald-700";
  if (grade.startsWith("C")) return "text-amber-700";
  return "text-slate-900";
}

export default function InsightsPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Hero */}
      <header className="animate-fade-in-up-soft">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          课程价值分析系统
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          每门课都从 GPA 收益、workload、压分风险、requirement 价值与时间成本一起判断。
        </p>
      </header>

      {/* Course table */}
      <div
        className="animate-fade-in-up-soft mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white"
        style={{ animationDelay: "60ms" }}
      >
        <div className="grid grid-cols-[1.2fr_1fr_120px_120px_150px_24px] gap-4 border-b border-slate-100 bg-slate-50/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 max-lg:hidden">
          <span>课程</span>
          <span>AI 标签</span>
          <span>GPA 收益</span>
          <span>Workload</span>
          <span>规则属性</span>
          <span />
        </div>
        {courses.map(([code, name, tags, grade, workload, rule]) => (
          <article
            key={code}
            className="group grid gap-4 border-b border-slate-100 px-5 py-5 transition-colors last:border-b-0 hover:bg-slate-50/60 lg:grid-cols-[1.2fr_1fr_120px_120px_150px_24px] lg:items-center"
          >
            <div>
              <h2 className="font-semibold tracking-tight">{code}</h2>
              <p className="mt-1 text-sm text-slate-500">{name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tagTone(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div
              className={`flex items-center gap-2 text-sm font-semibold tabular-nums ${gradeTone(grade)}`}
            >
              <Star className="h-4 w-4 text-slate-300" />
              {grade}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700 tabular-nums">
              <Clock className="h-4 w-4 text-slate-400" />
              {workload}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <BadgeCheck className="h-4 w-4 text-slate-400" />
              {rule}
            </div>
            <ArrowRight
              className="hidden h-4 w-4 text-slate-300 transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:text-slate-900 lg:block"
              aria-hidden
            />
          </article>
        ))}
      </div>

      {/* Three rule cards */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {[
          ["GPA 收益", "高分课优先进入推荐池", Gauge, "emerald"],
          ["压分风险", "历史给分低于同类课 18% 会标记", ShieldAlert, "amber"],
          ["Requirement 价值", "能同时补多个要求的课权重更高", BookOpenCheck, "slate"],
        ].map(([title, body, Icon, tone], i) => {
          const I = Icon as React.ComponentType<{ className?: string; strokeWidth?: number }>;
          const ringClass =
            tone === "emerald"
              ? "bg-emerald-50 text-emerald-700"
              : tone === "amber"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-700";
          return (
            <div
              key={title as string}
              className="animate-fade-in-up-soft group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-400"
              style={{ animationDelay: `${120 + i * 60}ms` }}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${ringClass}`}
              >
                <I className="h-5 w-5" strokeWidth={1.7} />
              </div>
              <h2 className="mt-4 font-semibold tracking-tight">{title as string}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body as string}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
