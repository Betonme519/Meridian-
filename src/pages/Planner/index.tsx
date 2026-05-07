import DashboardLayout from "@/layouts/DashboardLayout";
import { BookOpenCheck, GitBranch, Layers3, Repeat2, ShieldAlert } from "lucide-react";

const modules = [
  {
    title: "GPA 规则",
    icon: BookOpenCheck,
    items: ["哪些课算 GPA", "哪些课不算", "P/F 机制", "重修覆盖"],
  },
  {
    title: "学分结构",
    icon: Layers3,
    items: ["专业必修", "专业选修", "公选", "第二课堂", "劳动教育"],
  },
  {
    title: "替代规则",
    icon: Repeat2,
    items: ["活动可抵学分", "竞赛可替代课程", "项目能补 requirement"],
  },
  {
    title: "风险规则",
    icon: ShieldAlert,
    items: ["挂科影响", "学分限制", "先修链"],
  },
];

export default function PlannerPage() {
  return (
    <DashboardLayout>
      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-500">学校规则</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">AI 动态生成的学校结构树</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            这里不是规则解析器，也不是文字列表。它把学校规则拆成可组合模块；某学校没有第二课堂，对应模块会自动消失。
          </p>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[360px_1fr]">
          <aside className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">规则关系图</h2>
            </div>
            <div className="mt-6 space-y-4">
              {["学校规则", "毕业要求", "课程属性", "学生目标", "推荐逻辑"].map((node, index) => (
                <div key={node} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="w-24 text-sm font-medium text-slate-700">{node}</span>
                </div>
              ))}
            </div>
          </aside>

          <main className="grid gap-4 md:grid-cols-2">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <article
                  key={module.title}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-700" />
                    </div>
                    <h2 className="font-semibold">{module.title}</h2>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {module.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </main>
        </div>
      </section>
    </DashboardLayout>
  );
}
