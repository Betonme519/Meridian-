import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  GraduationCap,
  LineChart,
  ShieldAlert,
  Timer,
  TrendingUp,
} from "lucide-react";

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
    summary: "短期可以保护 GPA，但会推迟后续系统课程的先修链。",
    metrics: [
      ["GPA 变化", "+0.06"],
      ["毕业进度", "83%"],
      ["时间压力", "15h/周"],
      ["风险变化", "-12%"],
    ],
  },
  {
    type: "换课",
    title: "HIST 118 换到陈教授班",
    primary: "GPA +0.11",
    secondary: "时间压力不变",
    summary: "收益最高，且不改变毕业路径，是当前最稳的模拟动作。",
    metrics: [
      ["GPA 变化", "+0.11"],
      ["毕业进度", "89%"],
      ["时间压力", "18h/周"],
      ["风险变化", "-24%"],
    ],
  },
  {
    type: "P/F",
    title: "MATH 233 改为 P/F",
    primary: "风险 -18%",
    secondary: "GPA 波动降低",
    summary: "适合低压力或保底策略，但需要确认该课是否仍满足 requirement。",
    metrics: [
      ["GPA 变化", "+0.04"],
      ["毕业进度", "88%"],
      ["时间压力", "18h/周"],
      ["风险变化", "-18%"],
    ],
  },
  {
    type: "暑校",
    title: "暑期补公选 2 学分",
    primary: "毕业进度 +6%",
    secondary: "秋季 workload -3h",
    summary: "会牺牲暑期时间，但能显著降低秋季毕业压力。",
    metrics: [
      ["GPA 变化", "+0.02"],
      ["毕业进度", "95%"],
      ["时间压力", "15h/周"],
      ["风险变化", "-16%"],
    ],
  },
  {
    type: "替代学分",
    title: "竞赛抵扣劳动教育",
    primary: "Requirement +1",
    secondary: "时间成本低",
    summary: "对毕业 requirement 的价值高，几乎不增加课业负担。",
    metrics: [
      ["GPA 变化", "+0.00"],
      ["毕业进度", "92%"],
      ["时间压力", "18h/周"],
      ["风险变化", "-10%"],
    ],
  },
];

const metricIcons = [TrendingUp, GraduationCap, Timer, ShieldAlert];

export default function GPASimulatorPage() {
  const [selectedAction, setSelectedAction] = useState(actions[1].type);
  const activeAction = useMemo(
    () => actions.find((action) => action.type === selectedAction) ?? actions[1],
    [selectedAction],
  );

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Hero */}
      <header className="animate-fade-in-up-soft">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          如果这样选，会发生什么
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          你可以模拟 drop 课、换课、P/F、暑校与替代学分。系统实时计算
          GPA、毕业进度、时间压力与风险变化。
        </p>
      </header>

      {/* Top metrics — large readouts; key positive/negative with subtle accent line */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {activeAction.metrics.map(([label, value], index) => {
          const Icon = metricIcons[index];
          const positive = value.startsWith("+");
          const negative = value.startsWith("-");
          return (
            <div
              key={label}
              className="animate-fade-in-up-soft relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5"
              style={{ animationDelay: `${60 + index * 50}ms` }}
            >
              <span
                className={`absolute inset-x-0 top-0 h-px ${
                  positive
                    ? "bg-emerald-400/70"
                    : negative
                      ? "bg-amber-400/70"
                      : "bg-slate-200"
                }`}
              />
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.7} />
              </div>
              <p
                key={value}
                className="animate-fade-in-up-soft mt-4 text-3xl font-semibold tracking-tight tabular-nums"
              >
                {value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <main className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold">可模拟动作</h2>
            <span className="ml-auto text-xs text-slate-400 tabular-nums">
              {actions.length} 个动作
            </span>
          </div>
          <div className="mt-5 space-y-2.5">
            {actions.map((action, i) => {
              const active = action.type === selectedAction;
              const positive = action.primary.startsWith("GPA +") || action.primary.startsWith("毕业") || action.primary.startsWith("Requirement");
              return (
                <button
                  key={action.type}
                  type="button"
                  onClick={() => setSelectedAction(action.type)}
                  aria-pressed={active}
                  className={`animate-fade-in-up-soft grid w-full gap-3 rounded-xl border p-4 text-left transition-colors duration-300 md:grid-cols-[110px_1fr_120px_160px_24px] md:items-center ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                  style={{ animationDelay: `${80 + i * 40}ms` }}
                >
                  <span
                    className={`inline-flex h-6 items-center self-start rounded-full px-2.5 text-[11px] font-semibold tracking-wide md:self-center ${
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
                      active
                        ? positive
                          ? "text-emerald-300"
                          : "text-amber-200"
                        : positive
                          ? "text-emerald-700"
                          : "text-amber-700"
                    }`}
                  >
                    {action.primary}
                  </span>
                  <span
                    className={`text-sm tabular-nums ${
                      active ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {action.secondary}
                  </span>
                  {active ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  ) : (
                    <span className="hidden md:block" />
                  )}
                </button>
              );
            })}
          </div>
        </main>

        <aside className="space-y-5">
          {/* Animated bar chart — bars rise on mount + on action change */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">实时推演</h2>
              <span className="ml-auto text-[11px] uppercase tracking-[0.18em] text-slate-400">
                未来 6 学期
              </span>
            </div>
            <div
              key={selectedAction}
              className="mt-6 flex h-52 items-end gap-3"
            >
              {[52, 61, 66, 73, 69, 82].map((height, index) => {
                const h = height + (selectedAction.length % 4) * 3;
                const isLast = index === 5;
                return (
                  <div key={index} className="flex flex-1 flex-col items-center gap-3">
                    <div className="relative flex w-full flex-1 items-end">
                      <div
                        className={`animate-bar-rise w-full rounded-t-md ${
                          isLast ? "bg-slate-950" : "bg-slate-300"
                        }`}
                        style={{
                          height: `${h}%`,
                          animationDelay: `${index * 90}ms`,
                        }}
                      >
                        {isLast && (
                          <span className="absolute -top-6 right-0 text-[11px] font-semibold tabular-nums text-slate-900">
                            3.{40 + (selectedAction.length % 9)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums">S{index + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Path judgment */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">当前路径判断</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">{activeAction.summary}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
