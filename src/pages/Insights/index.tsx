import DashboardLayout from "@/layouts/DashboardLayout";
import { BadgeCheck, BookOpenCheck, Clock, Gauge, ShieldAlert, Star } from "lucide-react";

const courses = [
  ["HIST 118", "中国近现代史专题", ["高分推荐", "低压力"], "A-", "3h/周", "可 P/F"],
  ["CS 241", "系统编程", ["高风险", "不建议同修"], "B", "9h/周", "计入 GPA"],
  ["MATH 233", "线性代数", ["requirement 价值高"], "B+", "6h/周", "可替代专业基础"],
  ["MUS 102", "音乐与社会", ["水课", "低压力"], "A", "2h/周", "不计入 GPA"],
];

export default function InsightsPage() {
  return (
    <DashboardLayout>
      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-500">课程策略</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">课程价值分析系统</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            每门课都从 GPA 收益、workload、压分风险、requirement 价值与时间成本一起判断。
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[1.2fr_1fr_120px_120px_150px] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold text-slate-500 max-lg:hidden">
            <span>课程</span>
            <span>AI 标签</span>
            <span>GPA 收益</span>
            <span>Workload</span>
            <span>规则属性</span>
          </div>
          {courses.map(([code, name, tags, grade, workload, rule]) => (
            <article
              key={code as string}
              className="grid gap-4 border-b border-slate-100 px-5 py-5 last:border-b-0 lg:grid-cols-[1.2fr_1fr_120px_120px_150px] lg:items-center"
            >
              <div>
                <h2 className="font-semibold">{code as string}</h2>
                <p className="mt-1 text-sm text-slate-500">{name as string}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(tags as string[]).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Star className="h-4 w-4 text-slate-400" />
                {grade as string}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-slate-400" />
                {workload as string}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <BadgeCheck className="h-4 w-4 text-slate-400" />
                {rule as string}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {[
            ["GPA 收益", "高分课优先进入推荐池", Gauge],
            ["压分风险", "历史给分低于同类课 18% 会标记", ShieldAlert],
            ["Requirement 价值", "能同时补多个要求的课权重更高", BookOpenCheck],
          ].map(([title, body, Icon]) => (
            <div key={title as string} className="rounded-xl border border-slate-200 bg-white p-5">
              <Icon className="h-5 w-5 text-slate-500" />
              <h2 className="mt-4 font-semibold">{title as string}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body as string}</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
