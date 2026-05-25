/**
 * AI 数据契约（zod schema）。
 *
 * 给 provider 输出 / 跨页 chat / RAG 答复定固定 shape，避免 7 处 caller 自由发明。
 * Schema 与 DATA_MODEL.md 对应表对齐 —— 未来 chat_message 表接入 / rag_answer
 * 缓存表都用同一份。
 *
 * 公共 API：
 *  - GoalModeSchema             八模式 enum，复用 profileApi 的 GOAL_MODES
 *  - RecommendationSchema       goal_mode 推荐结果（AI 给一个 mode + 理由）
 *  - ChatMessageSchema          单条对话消息，shape 对齐 DATA_MODEL § 3.6
 *  - RagAnswerSchema            检索增强答复（带 citations）
 *  - PathSuggestionSchema       排队 13：单条毕业路径推荐（含 shortcut[] 12.5 占位）
 *  - OptionRankingSchema        排队 13：候选 option 排序 + rationale
 *  - RequirementGapSchema       排队 13：requirement 还差多少学分 / 课
 *  - GradPathAdvisorResponseSchema  排队 13：advisor 顶层响应
 */

import { z } from "zod";
import { GOAL_MODES } from "@/api/profileApi";

/* ───────────────────────── Goal mode 推荐 ───────────────────────── */

export const GoalModeSchema = z.enum(GOAL_MODES);

export const RecommendationSchema = z.object({
  mode: GoalModeSchema,
  rationale: z.string().min(1, "理由不能为空"),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

/* ───────────────────────── Chat message（chat_message 表） ───────────────────────── */
// 与 DATA_MODEL § 3.6 字段对齐；conversation_id 是分组键（决策 D9 = 不要 parent 表）

export const ChatRoleSchema = z.enum(["user", "assistant", "system"]);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  role: ChatRoleSchema,
  content: z.string(),
  created_at: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/* ───────────────────────── RAG answer（带 citations） ───────────────────────── */

export const RagCitationSchema = z.object({
  source_id: z.string().uuid(),
  excerpt: z.string().min(1),
  page: z.number().int().positive().optional(),
});
export type RagCitation = z.infer<typeof RagCitationSchema>;

export const RagAnswerSchema = z.object({
  answer: z.string().min(1),
  citations: z.array(RagCitationSchema),
});
export type RagAnswer = z.infer<typeof RagAnswerSchema>;

/* ───────────────────────── Grad Path Advisor（排队 13） ───────────────────────── */
//
// 形态约定：
//  - paths[]    每个 milestone（course / second / thesis）至多 1 条
//  - rankings[] 对候选 option 排序，13 mock 阶段可空
//  - gaps[]     requirement 还差多少；13 mock 阶段从启发式 calcRequirementProgress 派生
//  - shortcut[] PathSuggestion 内字段，**12.5 启用**，13 阶段强制空数组占位（schema 对齐
//    后真 provider 接入时无需二次返工）

/** Milestone 三档，与 trackUserView.UserMilestoneCode 对齐（不 import 防循环依赖） */
export const AdvisorMilestoneSchema = z.enum(["course", "second", "thesis"]);
export type AdvisorMilestone = z.infer<typeof AdvisorMilestoneSchema>;

/**
 * Shortcut —— 排队 12.5 「捷径策略卡」一条。
 * 13 阶段 mock 输出空数组占位；12.5 真接入时填 oneLiner + goalFit + candidates。
 */
export const ShortcutSchema = z.object({
  id: z.string(),
  oneLiner: z.string(),
  /** GoalMode → 适配度，12.5 接 AI 后真填 */
  goalFit: z.record(z.string(), z.enum(["best", "ok", "bad"])).optional(),
  /** 兴趣触发后 AI 列的具体课程 chips；mock 阶段空 */
  candidates: z
    .array(
      z.object({
        code: z.string(),
        name: z.string().optional(),
        reason: z.string().optional(),
      }),
    )
    .optional(),
});
export type Shortcut = z.infer<typeof ShortcutSchema>;

/**
 * 单条毕业路径推荐 —— root → milestone → bucket → category → requirement → option。
 * 与 trackRecommendation.RecommendedPath 字段同构，便于落地替换。
 */
export const PathSuggestionSchema = z.object({
  milestone: AdvisorMilestoneSchema,
  /** "上课"下 5 个 bucket 之一；其他 milestone 为 null */
  bucket: z.string().nullable().optional(),
  categoryId: z.string(),
  requirementId: z.string(),
  /** option seed 缺时为 null，13 阶段大多 null */
  optionId: z.string().nullable().optional(),
  /** AI rationale —— 一句话解释为什么推这条 */
  reason: z.string().min(1),
  /** 排队 12.5 预留，13 阶段强制 [] */
  shortcuts: z.array(ShortcutSchema).default([]),
});
export type PathSuggestion = z.infer<typeof PathSuggestionSchema>;

/**
 * 候选 option 排序结果 —— ImpactPanel take/delay/switch 用。
 * 13 mock 阶段 option seed 空，本数组通常 []。
 */
export const OptionRankingSchema = z.object({
  optionId: z.string(),
  /** 0 = 首推，1 = 次推，依此类推 */
  rank: z.number().int().nonnegative(),
  rationale: z.string().min(1),
  goalFit: z.record(z.string(), z.enum(["best", "ok", "bad"])).optional(),
});
export type OptionRanking = z.infer<typeof OptionRankingSchema>;

/**
 * Requirement 学分缺口 —— "还差 N 学分 / M 门课"。
 * mock 阶段从 calcRequirementProgress 派生，AI 真接入后由 LLM 算。
 */
export const RequirementGapSchema = z.object({
  requirementId: z.string(),
  creditsGap: z.number().nullable().optional(),
  countGap: z.number().int().nullable().optional(),
  note: z.string().optional(),
});
export type RequirementGap = z.infer<typeof RequirementGapSchema>;

/** Advisor 顶层响应 —— mock provider 输出 JSON 字符串后 zod.parse 验证 */
export const GradPathAdvisorResponseSchema = z.object({
  paths: z.array(PathSuggestionSchema),
  rankings: z.array(OptionRankingSchema).default([]),
  gaps: z.array(RequirementGapSchema).default([]),
});
export type GradPathAdvisorResponse = z.infer<typeof GradPathAdvisorResponseSchema>;
