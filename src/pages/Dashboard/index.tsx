import DashboardLayout from "@/layouts/DashboardLayout";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import "./Dashboard.css";

const goals = ["保持 GPA 3.7+", "每周学习时间 <= 20h", "2027 前完成毕业要求"];
const suggestions = [
  "建议用竞赛抵扣劳动教育",
  "本学期不建议同时修 CS241 与高数",
  "你有一项未利用 GPA 规则",
];
const risks = [
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
    <DashboardLayout>
      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-500">策略中心</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">AI 当前正在帮你做什么</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                这里是 Meridian 的真正首页。重点不是数据堆叠，而是你现在下一步该做什么。
              </p>
            </div>
            <a
              href="/gpa-simulator"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"
            >
              模拟一个方案 <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
          <main className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h2 className="font-semibold">当前目标</h2>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {goals.map((goal) => (
                  <div key={goal} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-800">{goal}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-slate-500" />
                <h2 className="font-semibold">AI 当前建议</h2>
              </div>
              <div className="mt-5 space-y-3">
                {suggestions.map((item) => (
                  <div key={item} className="flex gap-4 rounded-lg border border-slate-200 p-4">
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </main>

          <aside className="space-y-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 text-amber-950">
                <TriangleAlert className="h-5 w-5" />
                <h2 className="font-semibold">当前风险</h2>
              </div>
              <div className="mt-5 space-y-3">
                {risks.map(([name, value, level]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-lg bg-white/70 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{name}</p>
                      <p className="text-xs text-slate-600">{value}</p>
                    </div>
                    <span className="rounded-full border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-800">
                      {level}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-slate-500" />
                <h2 className="font-semibold">最近关键时间</h2>
              </div>
              <div className="mt-5 space-y-4">
                {dates.map(([date, title]) => (
                  <div key={title} className="flex gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-slate-500">{date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </DashboardLayout>
  );
}
