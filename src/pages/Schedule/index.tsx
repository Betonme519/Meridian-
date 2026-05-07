import DashboardLayout from "@/layouts/DashboardLayout";
import { CheckCircle2, Clock, GraduationCap, Sparkles } from "lucide-react";

const completed = ["专业必修", "公共必修"];
const missing = [
  ["劳动教育", "1 学分"],
  ["第二课堂", "2 分"],
  ["志愿", "8h"],
];

export default function SchedulePage() {
  return (
    <DashboardLayout>
      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-500">毕业路径</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">你距离毕业还差什么</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            中国大学真正复杂的是毕业 requirement。这个页面会告诉你还缺什么，以及最轻松怎么完成。
          </p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
          <main className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-semibold">已完成</h2>
                <div className="mt-5 space-y-3">
                  {completed.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-lg bg-emerald-50 p-4 text-emerald-800"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                <h2 className="font-semibold text-amber-950">未完成</h2>
                <div className="mt-5 space-y-3">
                  {missing.map(([name, value]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between rounded-lg bg-white/75 p-4"
                    >
                      <span className="text-sm font-medium text-slate-800">{name}</span>
                      <span className="text-sm font-semibold text-amber-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-slate-500" />
                <h2 className="font-semibold">AI 最优方案</h2>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                参加 "城市更新志愿项目" 可同时完成第二课堂、志愿时长与公选 requirement，预计占用 1
                个周末。
              </p>
            </div>
          </main>

          <aside className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-slate-500" />
                <h2 className="font-semibold">毕业进度</h2>
              </div>
              <p className="mt-5 text-5xl font-semibold tracking-tight">86%</p>
              <div className="mt-5 h-2 rounded-full bg-slate-100">
                <div className="h-full w-[86%] rounded-full bg-slate-950" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-500" />
                <h2 className="font-semibold">最轻松完成时间</h2>
              </div>
              <p className="mt-4 text-2xl font-semibold">2026 秋季前</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                不增加核心课程负担，只补齐非课程类 requirement。
              </p>
            </div>
          </aside>
        </div>
      </section>
    </DashboardLayout>
  );
}
