/**
 * AI 数据契约（zod schema）。
 *
 * 给 provider 输出 / 跨页 chat / RAG 答复定固定 shape，避免 7 处 caller 自由发明。
 * Schema 与 DATA_MODEL.md 对应表对齐 —— 未来 chat_message 表接入 / rag_answer
 * 缓存表都用同一份。
 *
 * 公共 API：
 *  - GoalModeSchema       八模式 enum，复用 profileApi 的 GOAL_MODES
 *  - RecommendationSchema goal_mode 推荐结果（AI 给一个 mode + 理由）
 *  - ChatMessageSchema    单条对话消息，shape 对齐 DATA_MODEL § 3.6
 *  - RagAnswerSchema      检索增强答复（带 citations）
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
