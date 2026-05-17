/**
 * Track 的"学生友好视图"层 —— 把规则手册 schema 翻译成学生关心的毕业事项。
 *
 * 设计动机（2026-05-17 用户拍板）：用户**不想看到**整本规则手册（退课/休学/警示/收费/
 * 学位授予 等管理规则），那是 AI 后台用来计算的。用户想看的是：
 *   主轴一条线：上课 / 第二课堂 / 论文项目
 *   下一级：上课要上哪几类（公必 / 通识 / 专必 / 专选 / 任选）
 *   下一级：具体 option，AI 推荐
 *
 * 实现策略：
 *   1. `classifyCategory(code, title)` —— 启发式按 title 关键词推断分类，返
 *      `{ milestone, bucket? } | null`；返 null 表示"用户不可见"（AI 后台仍可用）
 *   2. `isUserVisibleRequirement(req)` —— 过滤 rule-kind requirement（time_limit /
 *      gpa_threshold / status_gate / ... 8 档），仅留 course-kind 4 档
 *
 * 启发式针对当前 ECNU 2023 seed 优化，但用关键词匹配而非 code hardcoded，
 * 让未来非 ECNU track（清北复浙等）也大致能跑。
 */

import type { TrackRequirement } from "@/api/trackApi";
import { COURSE_REQUIREMENT_KINDS } from "@/types/trackEnums";

/* ───────────────────────── user-facing 主轴 ───────────────────────── */

export const USER_MILESTONES = [
  { code: "course", label: "上课", icon: "📚" },
  { code: "second", label: "第二课堂", icon: "🎯" },
  { code: "thesis", label: "论文项目", icon: "📝" },
] as const;

export type UserMilestoneCode = (typeof USER_MILESTONES)[number]["code"];

/** "上课" milestone 下的 5 个 bucket */
export const COURSE_BUCKETS = ["公共必修", "通识必修", "专业必修", "专业选修", "任选"] as const;

export type CourseBucket = (typeof COURSE_BUCKETS)[number];

/* ───────────────────────── 分类启发式 ───────────────────────── */

export interface CategoryClassification {
  milestone: UserMilestoneCode;
  bucket?: CourseBucket;
}

/**
 * 命中即"用户不可见"的关键词（管理规则 / 流程规则 / 警示规则 等）。
 * AI 后台依然能 SELECT 这些 requirement 做约束计算，仅 UI 隐藏。
 */
const HIDE_KEYWORDS = [
  "学籍",
  "注册",
  "休学",
  "复学",
  "毕业资格",
  "审核",
  "学位授予",
  "成绩管理",
  "学分认定",
  "课程考核",
  "考勤",
  "预警",
  "收费",
  "抽检",
  "推免",
  "辅修",
  "双学士",
  "强基",
  "个性化",
  "转专业",
  "微专业",
  "卓越",
  "教育目标",
  "培养方案", // 元数据类
  "选课退课",
  "免听免修",
];

/**
 * 把 track_category 翻译成 user-facing 分类。
 * 返 null = 用户不可见（AI 后台仍可用）。
 *
 * 关键词扫顺序：先排除 HIDE，再按 bucket / milestone 关键词匹配。
 */
export function classifyCategory(code: string, title: string): CategoryClassification | null {
  // 1. 黑名单：管理规则全 hide
  for (const k of HIDE_KEYWORDS) {
    if (title.includes(k)) return null;
  }

  // 2. "上课" milestone 的 5 个 bucket
  if (/(公共必修|体质|体育)/.test(title)) {
    return { milestone: "course", bucket: "公共必修" };
  }
  if (/通识/.test(title)) {
    return { milestone: "course", bucket: "通识必修" };
  }
  if (/(专业必修|师范生培养|师范生)/.test(title)) {
    return { milestone: "course", bucket: "专业必修" };
  }
  if (/专业选修/.test(title)) {
    return { milestone: "course", bucket: "专业选修" };
  }
  if (/(任选|自由选课)/.test(title)) {
    return { milestone: "course", bucket: "任选" };
  }

  // 3. 第二课堂
  if (/(创新创业|学科竞赛|创新训练|CTP|社会实践)/i.test(title)) {
    return { milestone: "second" };
  }

  // 4. 论文项目
  if (/(实习|毕业论文工作|毕业论文指导|毕业设计)/.test(title)) {
    return { milestone: "thesis" };
  }

  // 5. code 前缀兜底（非 ECNU track 可能有不同 title 但 code 仍约定俗成）
  //    极端 fallback：能想到的最后救命，没匹配上就 hide
  const letter = code.charAt(0).toUpperCase();
  if (letter === "E") {
    // E 段在 ECNU 是"培养方案核心"，没匹配上的 E 类按通识兜底
    return { milestone: "course", bucket: "通识必修" };
  }

  return null;
}

/**
 * requirement 是否对用户可见。
 * 仅 course-kind 4 档（count/credits/one_of/all_of）可见；学校规则类 8 档全隐藏。
 */
export function isUserVisibleRequirement(req: TrackRequirement): boolean {
  return (COURSE_REQUIREMENT_KINDS as readonly string[]).includes(req.kind);
}
