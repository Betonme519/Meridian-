import {
  BookOpenCheck,
  Compass,
  GitBranch,
  GraduationCap,
  Route as RouteIcon,
  Target,
  type LucideIcon,
} from "lucide-react";

/**
 * 全站功能导航单一真理源。
 * Navbar (首页顶栏 drawer) 与 DashboardLayout (功能页左侧 rail + drawer) 共用此数组。
 * 改一处，两处同步。
 */

export type MenuItem = {
  label: string;
  desc: string;
  to: string;
  icon: LucideIcon;
};

export const MENU_ITEMS: MenuItem[] = [
  { label: "策略中心", desc: "AI 当前建议与状态", to: "/dashboard", icon: Compass },
  { label: "目标模式", desc: "决定整个系统推荐逻辑", to: "/ai-advisor", icon: Target },
  { label: "学校规则", desc: "学校规则结构树", to: "/course-planner", icon: GitBranch },
  { label: "毕业路径", desc: "毕业 requirement 追踪", to: "/schedule", icon: GraduationCap },
  { label: "课程策略", desc: "课程价值分析", to: "/insights", icon: BookOpenCheck },
  { label: "方案模拟", desc: "不同路径实时推演", to: "/gpa-simulator", icon: RouteIcon },
];
