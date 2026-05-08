import {
  Compass,
  Network,
  ScrollText,
  Target,
  Upload,
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
  { label: "AI Feed", desc: "决策状态与建议", to: "/dashboard", icon: Compass },
  { label: "Workspace", desc: "决策图谱可视化", to: "/course-planner", icon: Network },
  { label: "Goal Mode", desc: "目标与权重定制", to: "/ai-advisor", icon: Target },
  { label: "Rule Graph", desc: "规则透明与来源", to: "/schedule", icon: ScrollText },
  { label: "Import", desc: "导入数据与设置", to: "/import", icon: Upload },
];
