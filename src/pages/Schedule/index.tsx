import { CheckCircle2, Clock, GraduationCap, Sparkles } from "lucide-react";

const completed = ["专业必修", "公共必修"];
const missing: Array<[string, string]> = [
  ["劳动教育", "1 学分"],
  ["第二课堂", "2 分"],
  ["志愿", "8h"],
];

const PROGRESS = 86;

export default function SchedulePage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Hero */}
      <header className="animate-fade-in-up-soft">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          你距离毕业还差什么
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          中国大学真正复杂的是毕业 requirement。这个页面会告诉你还缺什么，以及最轻松怎么完成。
        </p>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <main className="space-y-5">
          {/* Completed + Missing */}
          <div className="grid gap-4 md:grid-cols-2">
            <div
              className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-6"
              style={{ animationDelay: "60ms" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold tracking-tight">已完成</h2>
                <span className="inline-flex h-5 items-center rounded-full bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-700 tabular-nums">
                  {completed.length}
                </span>
              </div>
              <div className="mt-5 space-y-2.5">
                {completed.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3.5 text-emerald-800"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="animate-fade-in-up-soft rounded-2xl border border-amber-200 bg-amber-50 p-6"
              style={{ animationDelay: "120ms" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold tracking-tight text-amber-950">未完成</h2>
                <span className="inline-flex h-5 items-center rounded-full bg-amber-200/70 px-2 text-[11px] font-semibold text-amber-900 tabular-nums">
                  {missing.length}
                </span>
              </div>
              <div className="mt-5 space-y-2.5">
                {missing.map(([name, value]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-xl bg-white/75 p-3.5 transition-colors hover:bg-white"
                  >
                    <span className="text-sm font-medium text-slate-800">{name}</span>
                    <span className="text-sm font-semibold text-amber-800 tabular-nums">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI optimal path — emphasized dark card (key insight) */}
          <div
            className="animate-fade-in-up-soft relative overflow-hidden rounded-2xl border border-slate-900 bg-slate-950 p-6 text-white"
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
              <Sparkles className="h-4 w-4" strokeWidth={1.7} />
              AI 最优方案
            </div>
            <p className="mt-4 text-base leading-7 text-slate-100">
              参加&nbsp;<span className="font-semibold text-white">"城市更新志愿项目"</span>
              &nbsp;可同时完成第二课堂、志愿时长与公选 requirement，预计占用 1 个周末。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["第二课堂 +2", "志愿 +8h", "公选 +1"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-200 tabular-nums"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </main>

        <aside className="space-y-5">
          {/* Animated progress bar — fills 0 → 86% on mount */}
          <div
            className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-6"
            style={{ animationDelay: "60ms" }}
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">毕业进度</h2>
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <p className="text-5xl font-semibold tracking-tight tabular-nums">
                {PROGRESS}
              </p>
              <span className="text-2xl font-semibold text-slate-400">%</span>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="animate-bar-fill h-full rounded-full bg-slate-950"
                style={{ width: `${PROGRESS}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500 tabular-nums">
              较上学期 +4% · 距毕业还需 {100 - PROGRESS}%
            </p>
          </div>

          <div
            className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-6"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">最轻松完成时间</h2>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">2026 秋季前</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              不增加核心课程负担，只补齐非课程类 requirement。
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
