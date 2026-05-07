import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import "./Dashboard.css";

const goals = ["保持 GPA 3.7+", "每周学习时间 ≤ 20h", "2027 前完成毕业要求"];
const suggestions = [
  "建议用竞赛抵扣劳动教育",
  "本学期不建议同时修 CS241 与高数",
  "你有一项未利用 GPA 规则",
];
const risks: Array<[string, string, "高" | "中" | "低"]> = [
  ["第二课堂", "缺 1.5 分", "高"],
  ["志愿时长", "不足 8h", "中"],
  ["Workload", "周四超标 4.5h", "中"],
];
const dates = [
  ["5月14日", "选课开放"],
  ["5月22日", "Drop deadline"],
  ["6月03日", "奖学金审核"],
];

export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Hero — typography-first, no card border. Eyebrow + headline + body + CTA. */}
      <header className="animate-fade-in-up-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              AI 当前正在帮你做什么
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              这里是 Meridian 的真正首页。重点不是数据堆叠，而是你现在下一步该做什么。
            </p>
          </div>
          <a
            href="/gpa-simulator"
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            模拟一个方案
            <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
          </a>
        </div>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <main className="space-y-5">
          {/* Goals */}
          <div
            className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-6"
            style={{ animationDelay: "60ms" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h2 className="font-semibold">当前目标</h2>
              </div>
              <span className="text-xs text-slate-400 tabular-nums">3 / 3 已锁定</span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {goals.map((goal, i) => (
                <div
                  key={goal}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300"
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 tabular-nums">
                    目标 {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{goal}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions — interactive arrow on hover */}
          <div
            className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-6"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">AI 当前建议</h2>
              <span className="ml-auto text-xs text-slate-400">每 24h 更新</span>
            </div>
            <div className="mt-5 space-y-2">
              {suggestions.map((item, i) => (
                <div
                  key={item}
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-900"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 transition-colors group-hover:bg-slate-900 group-hover:text-white tabular-nums">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm leading-6 text-slate-700">{item}</p>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:text-slate-900" />
                </div>
              ))}
            </div>
          </div>
        </main>

        <aside className="space-y-5">
          {/* Risks — pulse halo on the highest-severity dot */}
          <div
            className="animate-fade-in-up-soft rounded-2xl border border-amber-200 bg-amber-50 p-5"
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center gap-2 text-amber-950">
              <TriangleAlert className="h-5 w-5" />
              <h2 className="font-semibold">当前风险</h2>
              <span className="ml-auto inline-flex h-5 items-center rounded-full bg-amber-200/70 px-2 text-[11px] font-semibold text-amber-900 tabular-nums">
                3
              </span>
            </div>
            <div className="mt-5 space-y-2.5">
              {risks.map(([name, value, level]) => {
                const isHigh = level === "高";
                return (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-xl bg-white/75 p-3.5 transition-colors hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`relative flex h-2 w-2 shrink-0 rounded-full ${
                          isHigh ? "bg-amber-500" : "bg-amber-300"
                        }`}
                      >
                        {isHigh && (
                          <span
                            className="animate-pulse-halo absolute inset-0 rounded-full bg-amber-400"
                            aria-hidden
                          />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{name}</p>
                        <p className="text-xs text-slate-600">{value}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isHigh
                          ? "bg-amber-900 text-amber-50"
                          : "border border-amber-300 text-amber-800"
                      }`}
                    >
                      {level}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dates — vertical timeline */}
          <div
            className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-5"
            style={{ animationDelay: "240ms" }}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">最近关键时间</h2>
            </div>
            <div className="relative mt-5 pl-5">
              <span
                className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-slate-200"
                aria-hidden
              />
              <ul className="space-y-4">
                {dates.map(([date, title], i) => (
                  <li key={title} className="relative">
                    <span
                      className={`absolute -left-[18px] top-1 h-3 w-3 rounded-full border-2 border-white ${
                        i === 0 ? "bg-slate-900" : "bg-slate-300"
                      }`}
                      aria-hidden
                    />
                    <p className="text-sm font-medium text-slate-900">{title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 tabular-nums">{date}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
