import {
  ArrowRight,
  BookOpenCheck,
  GitBranch,
  Layers3,
  Repeat2,
  ShieldAlert,
} from "lucide-react";

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

const chain = ["学校规则", "毕业要求", "课程属性", "学生目标", "推荐逻辑"];

export default function PlannerPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Hero */}
      <header className="animate-fade-in-up-soft">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          AI 动态生成的学校结构树
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          这里不是规则解析器，也不是文字列表。它把学校规则拆成可组合模块；某学校没有第二课堂，对应模块会自动消失。
        </p>
      </header>

      <div className="mt-8 grid gap-5 xl:grid-cols-[360px_1fr]">
        {/* Rule chain — vertical timeline w/ connector */}
        <aside
          className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-6"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold">规则关系图</h2>
          </div>
          <ol className="relative mt-6 space-y-5 pl-2">
            <span
              className="absolute left-[15px] top-3 bottom-3 w-px bg-slate-200"
              aria-hidden
            />
            {chain.map((node, index) => {
              const isLast = index === chain.length - 1;
              return (
                <li key={node} className="relative flex items-center gap-4">
                  <span
                    className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                      isLast
                        ? "bg-slate-950 text-white ring-4 ring-slate-100"
                        : "bg-white text-slate-700 ring-1 ring-slate-300"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isLast ? "text-slate-950" : "text-slate-700"
                    }`}
                  >
                    {node}
                  </span>
                  {isLast && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      输出
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Module cards */}
        <main className="grid gap-4 md:grid-cols-2">
          {modules.map((module, i) => {
            const Icon = module.icon;
            return (
              <article
                key={module.title}
                className="animate-fade-in-up-soft group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-400"
                style={{ animationDelay: `${120 + i * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <h2 className="font-semibold tracking-tight">{module.title}</h2>
                  <ArrowRight
                    className="ml-auto h-4 w-4 text-slate-300 transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:text-slate-900"
                    aria-hidden
                  />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {module.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-white"
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
  );
}
