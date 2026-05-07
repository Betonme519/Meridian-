import type { ReactNode } from "react";
import {
  BarChart3,
  BookOpenCheck,
  Compass,
  GitBranch,
  GraduationCap,
  Route,
  Sparkles,
  Target,
} from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

const navItems = [
  { href: "/dashboard", label: "策略中心", desc: "AI 当前建议与状态", icon: Compass },
  {
    href: "/ai-advisor",
    label: "目标模式",
    desc: "决定整个系统推荐逻辑",
    icon: Target,
  },
  {
    href: "/course-planner",
    label: "学校规则",
    desc: "学校规则结构树",
    icon: GitBranch,
  },
  {
    href: "/schedule",
    label: "毕业路径",
    desc: "毕业 requirement 追踪",
    icon: GraduationCap,
  },
  { href: "/insights", label: "课程策略", desc: "课程价值分析", icon: BookOpenCheck },
  { href: "/gpa-simulator", label: "方案模拟", desc: "不同路径实时推演", icon: Route },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const currentPath = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white/90 px-4 py-5 backdrop-blur-xl lg:block">
        <a href="/" className="flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
            M
          </span>
          <span>
            <span className="block text-sm font-semibold">Meridian</span>
            <span className="block text-xs text-slate-500">Academic Decision Engine</span>
          </span>
        </a>

        <nav className="mt-8 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-start gap-3 rounded-lg px-3 py-3 transition-colors ${
                  active
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span
                    className={`mt-0.5 block text-xs leading-5 ${active ? "text-slate-300" : "text-slate-500"}`}
                  >
                    {item.desc}
                  </span>
                </span>
              </a>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
            <Sparkles className="h-4 w-4" />
            AI 当前状态
          </div>
          <p className="mt-2 text-xs leading-5 text-emerald-800">
            正在基于目标模式、学校规则与毕业要求更新推荐。
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/82 px-4 py-3 backdrop-blur-xl lg:ml-72">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex">
            <BarChart3 className="h-4 w-4" />
            Meridian 学业策略模型
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">2026 春季学期</span>
            <div className="h-9 w-9 rounded-full bg-slate-950 text-center text-sm font-semibold leading-9 text-white">
              J
            </div>
          </div>
        </div>
      </header>

      <main className="lg:ml-72">{children}</main>
    </div>
  );
}
