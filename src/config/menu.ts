import { Compass, Network, ScrollText, Target, Upload, type LucideIcon } from "lucide-react";

/**
 * 全站功能导航单一真理源。
 * Navbar (首页顶栏 drawer) 与 DashboardLayout (功能页左侧 rail + drawer) 共用此数组。
 * `title` / `intro` 是悬停顶部 breadcrumb 时弹出的完整介绍。
 * 改一处，多处同步。
 */

export type MenuItem = {
  label: string;
  desc: string;
  title: string;
  intro: string;
  to: string;
  icon: LucideIcon;
};

export const MENU_ITEMS: MenuItem[] = [
  {
    label: "Home",
    desc: "决策状态与建议",
    title: "系统正在帮你做什么",
    intro: "先把数据接入 → 再看系统当前判断 → 最后用模拟动作验证选择。",
    to: "/dashboard",
    icon: Compass,
  },
  {
    label: "Workspace",
    desc: "毕业路径 track 浏览",
    title: "Track Workspace",
    intro:
      "按培养方案 track 横向浏览毕业要求。点开 requirement 看候选 options，标进度、加备注、模拟「选这个会怎样」。AI 推荐的项目醒目高亮。",
    to: "/course-planner",
    icon: Network,
  },
  {
    label: "Goal Mode",
    desc: "目标与权重定制",
    title: "目标与价值权重",
    intro: "目标决定整个系统的推荐逻辑。选一个固定模式，或在右侧用自然语言口述，AI 自动匹配。",
    to: "/ai-advisor",
    icon: Target,
  },
  {
    label: "Rule Graph",
    desc: "规则透明与来源",
    title: "规则透明与来源",
    intro: "告诉你 AI 为什么这么判断。每条规则都有来源、可信度等级，冲突会显式标记。",
    to: "/schedule",
    icon: ScrollText,
  },
  {
    label: "Import",
    desc: "导入数据与设置",
    title: "把所有数据接入 Meridian",
    intro: "文件、教务、社区、个人偏好。所有规则的可信度来源都从这里建立。",
    to: "/import",
    icon: Upload,
  },
];
