/**
 * Schedule 页静态种子数据。
 *
 * 作用：
 *  - 访客模式（未登录）下喂只读预览，保 4b 之前的视觉感（同 [[seedGraph]] 设计）
 *  - 登录用户**第一次进入**时也用作占位（DB 空空一片时的空态可视示例 —— 不入库）
 *  - 学校特殊政策（policies）**全程**走 SEED：本轮 7 不入库，未来归入 track_*
 *    或独立 special_policy 表后再接，所以登录用户 + 访客共用同一份 policies
 *
 * SEED rule 用合成 id（`seed-rule-*`）；访客模式下 conflicts.ruleAId / ruleBId
 * 指这些合成 id 即可，不入 DB 不会触发 CHECK / UNIQUE。
 */

import type { LucideIcon } from "lucide-react";
import { ScrollText, Sparkles, Users } from "lucide-react";
import type { Rule, TrustLevel } from "@/api/ruleApi";
import type { RuleConflict } from "@/api/ruleConflictApi";

/** UUID 合成不到，给 SEED 用的简单字符串 id —— 不会写入 DB，所以不冲突。 */
const seedRuleId = (n: number) => `seed-rule-${n}`;

const SEED_USER_ID = "seed-user";
const SEED_TS = "2026-05-15T00:00:00.000Z";

/** 一份与 DB Rule shape 对齐的 SEED 列表 —— 同一组 UI 渲染逻辑同时支持登录/访客。 */
export const SEED_RULES: Rule[] = [
  // GPA 计算规则
  {
    id: seedRuleId(1),
    user_id: SEED_USER_ID,
    branch: "GPA 计算规则",
    title: "必修课全部计入 GPA",
    body: "GPA = Σ(学分 × 绩点) / 总学分，所有必修课均参与。",
    trust: "high",
    source: "培养方案 v2024",
    source_page: "第 6 页 §3.1",
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  {
    id: seedRuleId(2),
    user_id: SEED_USER_ID,
    branch: "GPA 计算规则",
    title: "体育课不计入 GPA",
    body: null,
    trust: "high",
    source: "教务处官网",
    source_page: "学籍 §2",
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  {
    id: seedRuleId(3),
    user_id: SEED_USER_ID,
    branch: "GPA 计算规则",
    title: "P/F 课程不计入 GPA",
    body: null,
    trust: "high",
    source: "培养方案 v2024",
    source_page: "第 7 页 §3.4",
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  // 学分结构
  {
    id: seedRuleId(4),
    user_id: SEED_USER_ID,
    branch: "学分结构",
    title: "毕业总学分 ≥ 158",
    body: "包含专业课 60 + 公选 8 + 通识 90。",
    trust: "high",
    source: "教务系统学籍模块",
    source_page: null,
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  {
    id: seedRuleId(5),
    user_id: SEED_USER_ID,
    branch: "学分结构",
    title: "专业必修 60 学分",
    body: null,
    trust: "high",
    source: "培养方案 v2024",
    source_page: "第 12 页",
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  {
    id: seedRuleId(6),
    user_id: SEED_USER_ID,
    branch: "学分结构",
    title: "公选 8 学分",
    body: null,
    trust: "high",
    source: "培养方案 v2024",
    source_page: "第 13 页",
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  {
    id: seedRuleId(7),
    user_id: SEED_USER_ID,
    branch: "学分结构",
    title: "第二课堂 6 分（非学分）",
    body: null,
    trust: "med",
    source: "学校教务处",
    source_page: "二课实施细则",
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  // 替代规则
  {
    id: seedRuleId(8),
    user_id: SEED_USER_ID,
    branch: "替代规则",
    title: "数模国赛可抵 2 分二课",
    body: "学校尚未在 v2024 明文写入，但同等比赛历史上批准过。",
    trust: "med",
    source: "AI 规则分析（基于 v2023 案例）",
    source_page: null,
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  {
    id: seedRuleId(9),
    user_id: SEED_USER_ID,
    branch: "替代规则",
    title: "艺术导论 可改 P/F",
    body: "公选课通常允许 P/F，但需在第 4 周前申请。",
    trust: "med",
    source: "AI 规则分析",
    source_page: null,
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  {
    id: seedRuleId(10),
    user_id: SEED_USER_ID,
    branch: "替代规则",
    title: "省级志愿者证书 8h 可计入劳动教育",
    body: null,
    trust: "low",
    source: "匿名社区",
    source_page: null,
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  // 示例规则 —— 仅用于撑起下方「冲突规则」的模板示例卡片，可随时删除
  {
    id: seedRuleId(13),
    user_id: SEED_USER_ID,
    branch: "替代规则",
    title: "示例规则 A（如官方培养方案口径）",
    body: "演示用占位规则，展示冲突卡片长什么样。",
    trust: "high",
    source: "示例来源 · 官方",
    source_page: null,
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  {
    id: seedRuleId(14),
    user_id: SEED_USER_ID,
    branch: "替代规则",
    title: "示例规则 B（如学长经验 / 其他专业）",
    body: "演示用占位规则，与 A 说法不同，用来演示冲突。",
    trust: "low",
    source: "示例来源 · 社区",
    source_page: null,
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  // 学生口碑
  {
    id: seedRuleId(11),
    user_id: SEED_USER_ID,
    branch: "学生口碑",
    title: "数据结构 压分严重",
    body: "学生反映均分 B-，建议同修不超过 2 门难课。",
    trust: "low",
    source: "匿名社区 / 课评网",
    source_page: null,
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
  {
    id: seedRuleId(12),
    user_id: SEED_USER_ID,
    branch: "学生口碑",
    title: "大学英语 给分宽松",
    body: "近 3 年 A 段比例超 40%。",
    trust: "low",
    source: "匿名社区",
    source_page: null,
    rag_source_id: null,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
];

/**
 * SEED 冲突：引用 SEED rule 的合成 id；登录用户走 DB conflicts 不会用这一份。
 *
 * 满足 CHECK (a < b)：按字典序写。
 */
export const SEED_CONFLICTS: RuleConflict[] = [
  {
    id: "seed-conflict-template",
    user_id: SEED_USER_ID,
    rule_a_id: seedRuleId(13), // 示例规则 A（官方口径）
    rule_b_id: seedRuleId(14), // 示例规则 B（社区 / 其他专业）
    title: "示例 · 冲突会这样显示",
    judgement:
      "这是一个模板示例。当两条规则对同一问题说法不一致（来源不同 / 专业不同 / 文件版本不同）时，系统会并列两方并给出倾向判断。点右上角「新建冲突」，挑两条自己存疑的规则配成一对，就能生成你自己的冲突卡片。",
    confidence: "low",
    resolved_by: "unresolved",
    created_at: SEED_TS,
    updated_at: SEED_TS,
  },
];

/* ───────────────────────── Trust 列展示元数据 ───────────────────────── */

export interface TrustMeta {
  level: TrustLevel;
  label: string;
  /** 容器边框 + 浅底色 */
  head: string;
  /** 标题 / 图标色（深） */
  body: string;
  /** 角标圆形 chip 配色 */
  cls: string;
  icon: LucideIcon;
  /** 中文简称，给「可信度 X」chip 用 */
  short: string;
}

export const TRUST_META: Record<TrustLevel, TrustMeta> = {
  high: {
    level: "high",
    label: "官方规则",
    head: "border-maya/50 bg-white",
    body: "text-slate-700",
    cls: "bg-maya/15 text-slate-700",
    icon: ScrollText,
    short: "高",
  },
  med: {
    level: "med",
    label: "AI 推测",
    head: "border-gold/50 bg-white",
    body: "text-slate-700",
    cls: "bg-gold/15 text-slate-700",
    icon: Sparkles,
    short: "中",
  },
  low: {
    level: "low",
    label: "学生评价",
    head: "border-slate-200 bg-white",
    body: "text-slate-700",
    cls: "bg-slate-100 text-slate-700",
    icon: Users,
    short: "低",
  },
};

/* ───────────────────────── 学校特殊政策（不入库） ───────────────────────── */

/**
 * 学校特殊政策 —— 不归入 rule 表（属于 track_* 体系，本轮 7 不做）。
 * 登录用户 + 访客共用同一份；未来 schema pivot 后再迁。
 */
export interface Policy {
  scope: string;
  title: string;
  body: string;
}

export const SEED_POLICIES: Policy[] = [
  {
    scope: "港校申请",
    title: "避免过多 P/F",
    body: "港校录取常 case-by-case 看转录里 P/F 比例，超过 15% 会被质疑学业严肃性。",
  },
  {
    scope: "MIT 暑研",
    title: "线上实验不替代",
    body: "MIT 不接受 fully online 的实验课替代实地实验学分。",
  },
  {
    scope: "保研 985",
    title: "排名 + 论文双门槛",
    body: "多数 985 要求年级前 10% 且至少一作核心期刊或国奖。",
  },
  {
    scope: "出国 GRE",
    title: "GRE 有效期 5 年",
    body: "提前一年内考完最稳，避免赶申请季。",
  },
];
