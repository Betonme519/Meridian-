import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowRightLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  Link2,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  TriangleAlert,
  Upload as UploadIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ───────────────────────── Section 1 · Import shortcuts ───────────────────────── */

type ImportShortcut = {
  title: string;
  desc: string;
  to: string;
  icon: LucideIcon;
  status?: string;
};

const importShortcuts: ImportShortcut[] = [
  {
    title: "上传培养方案",
    desc: "PDF / Word，AI 自动解析章节",
    to: "/import",
    icon: FileText,
    status: "已上传",
  },
  {
    title: "导入成绩单",
    desc: "教务导出 / 截图 OCR",
    to: "/import",
    icon: ClipboardList,
    status: "已上传",
  },
  {
    title: "同步教务系统",
    desc: "授权登录抓取最新数据",
    to: "/import",
    icon: Link2,
    status: "未连接",
  },
  {
    title: "导入课表",
    desc: "本学期课程 + 时间冲突检测",
    to: "/import",
    icon: CalendarClock,
    status: "未导入",
  },
  {
    title: "输入目标",
    desc: "保研 / 留学 / 实习…切换推荐逻辑",
    to: "/ai-advisor",
    icon: Target,
    status: "高 GPA",
  },
];

/* ───────────────────────── Section 2 · Decision state ───────────────────────── */

type DecisionCard = {
  title: string;
  body: string;
  meta: string;
  tone: "neutral" | "good" | "warn";
  cta?: { label: string; to: string };
};

const decisionCards: DecisionCard[] = [
  {
    title: "当前目标",
    body: "高 GPA 模式 · 保研路线",
    meta: "上次更新 12h 前",
    tone: "neutral",
    cta: { label: "调整目标权重", to: "/ai-advisor" },
  },
  {
    title: "AI 最近一次推荐",
    body: "建议本学期保留 HIST 118 与 MATH 233，谨慎同修 CS 241。",
    meta: "基于培养方案 v2024 + 你的 workload 上限",
    tone: "good",
  },
  {
    title: "最近风险变化",
    body: "压分风险 ↓ 12%（drop CS 241 模拟）",
    meta: "近 7 天 · 含 3 次模拟",
    tone: "good",
  },
  {
    title: "卡住的 requirement",
    body: "第二课堂 还差 2 分 · 劳动教育 1 学分",
    meta: "毕业进度 86%",
    tone: "warn",
    cta: { label: "前往规则", to: "/schedule" },
  },
  {
    title: "下一步建议",
    body: "在 Workspace 拖动 CS 241 看连锁影响",
    meta: "AI 综合判断置信度 中-高",
    tone: "neutral",
    cta: { label: "打开 Workspace", to: "/course-planner" },
  },
];

const toneClass: Record<DecisionCard["tone"], string> = {
  neutral: "border-slate-200 bg-white",
  good: "border-emerald-200 bg-emerald-50/60",
  warn: "border-amber-200 bg-amber-50/60",
};

const toneText: Record<DecisionCard["tone"], string> = {
  neutral: "text-slate-500",
  good: "text-emerald-700",
  warn: "text-amber-800",
};

/* ───────────────────────── Section 3 · Simulation actions ───────────────────────── */

type ScenarioAction = {
  type: string;
  title: string;
  primary: string;
  secondary: string;
  summary: string;
  metrics: [string, string][];
};

const actions: ScenarioAction[] = [
  {
    type: "Drop 课",
    title: "退掉 CS 241",
    primary: "GPA +0.06",
    secondary: "毕业进度 -3%",
    summary: "短期保护 GPA，但会推迟系统课程的先修链。",
    metrics: [
      ["GPA 变化", "+0.06"],
      ["毕业进度", "83%"],
      ["时间压力", "15h/周"],
      ["风险变化", "-12%"],
    ],
  },
  {
    type: "改 P/F",
    title: "把 MUS 102 改 P/F",
    primary: "GPA +0.00",
    secondary: "时间不变",
    summary: "保留学分但不计入 GPA，对保研无贡献。",
    metrics: [
      ["GPA 变化", "+0.00"],
      ["毕业进度", "86%"],
      ["时间压力", "20h/周"],
      ["风险变化", "0%"],
    ],
  },
  {
    type: "替代",
    title: "用比赛抵第二课堂",
    primary: "Requirement +2 分",
    secondary: "时间成本低",
    summary: "对毕业 requirement 价值高，几乎不增加课业负担。",
    metrics: [
      ["GPA 变化", "+0.00"],
      ["毕业进度", "92%"],
      ["时间压力", "18h/周"],
      ["风险变化", "-10%"],
    ],
  },
];

const metricIcons: LucideIcon[] = [TrendingUp, GraduationCap, Timer, TriangleAlert];

/* ───────────────────────── Page ───────────────────────── */

export default function DashboardPage() {
  const [selectedAction, setSelectedAction] = useState(actions[1].type);
  const activeAction = useMemo(
    () => actions.find((action) => action.type === selectedAction) ?? actions[1],
    [selectedAction],
  );

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Section 1 · Import shortcuts */}
      <div className="mt-10">
        <div className="flex items-center gap-2">
          <UploadIcon className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">信息导入</h2>
          <span className="ml-auto text-xs text-slate-400 tabular-nums">
            5 个入口 · 已接入 2/5
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {importShortcuts.map((s, i) => {
            const Icon = s.icon;
            const isReady = s.status === "已上传" || s.status === "高 GPA";
            return (
              <Link
                key={s.title}
                to={s.to}
                className="animate-fade-in-up-soft group block rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-400"
                style={{ animationDelay: `${60 + i * 40}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  {s.status && (
                    <span
                      className={`ml-auto inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold ${
                        isReady
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.status}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900">{s.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{s.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 transition-colors group-hover:text-slate-900">
                  打开
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Section 2 · Decision state */}
      <div className="mt-12">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">当前决策状态</h2>
          <span className="ml-auto text-xs text-slate-400 tabular-nums">
            {decisionCards.length} 项
          </span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {decisionCards.map((c, i) => (
            <article
              key={c.title}
              className={`animate-fade-in-up-soft rounded-2xl border p-5 ${toneClass[c.tone]}`}
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{c.title}</h3>
                {c.tone === "good" && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
                {c.tone === "warn" && (
                  <TriangleAlert className="h-4 w-4 text-amber-700" />
                )}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-800">{c.body}</p>
              <p className={`mt-2 text-[11px] ${toneText[c.tone]}`}>{c.meta}</p>
              {c.cta && (
                <Link
                  to={c.cta.to}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-700 transition-colors hover:text-slate-950"
                >
                  {c.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>

      {/* Section 3 · Simulation */}
      <div className="mt-12">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">模拟动作</h2>
          <span className="ml-auto text-xs text-slate-400 tabular-nums">
            {actions.length} 个可选 · 实时推演
          </span>
        </div>

        <div className="mt-4 grid gap-5 xl:grid-cols-[1fr_420px]">
          {/* Action list */}
          <div className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-5">
            <div className="space-y-2.5">
              {actions.map((action, i) => {
                const active = action.type === selectedAction;
                return (
                  <button
                    key={action.type}
                    type="button"
                    onClick={() => setSelectedAction(action.type)}
                    aria-pressed={active}
                    className={`animate-fade-in-up-soft grid w-full gap-3 rounded-xl border p-4 text-left transition-colors duration-300 md:grid-cols-[110px_1fr_120px_24px] md:items-center ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white hover:border-slate-400"
                    }`}
                    style={{ animationDelay: `${60 + i * 40}ms` }}
                  >
                    <span
                      className={`inline-flex h-6 w-fit items-center self-start rounded-full px-2.5 text-[11px] font-semibold tracking-wide md:self-center ${
                        active
                          ? "bg-white/10 text-slate-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {action.type}
                    </span>
                    <span className="text-sm font-medium">{action.title}</span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        active ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      {action.primary}
                    </span>
                    <ArrowRight
                      className={`hidden h-4 w-4 transition-transform duration-300 ease-out md:block ${
                        active ? "translate-x-0.5 text-white" : "text-slate-400"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active scenario detail */}
          <aside
            className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-5"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-slate-500" />
              <h3 className="font-semibold tracking-tight">当前模拟判断</h3>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              {activeAction.summary}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {activeAction.metrics.map(([label, value], idx) => {
                const Icon = metricIcons[idx] ?? TrendingUp;
                return (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </div>
                    <p className="mt-2 text-base font-semibold tabular-nums text-slate-950">
                      {value}
                    </p>
                  </div>
                );
              })}
            </div>

            <Link
              to="/course-planner"
              className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-slate-700 transition-colors hover:text-slate-950"
            >
              在 Workspace 看连锁影响
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
