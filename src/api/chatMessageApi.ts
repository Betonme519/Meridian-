/**
 * Chat Message API — Supabase 实现（`chat_message` 表）。
 *
 * 数据模型见 docs/DATA_MODEL.md § 3.6。
 *
 * 设计要点：
 *  - 一条对话 = 一行；同一会话所有消息共用 `conversation_id`（D9=a，不开 parent 表）
 *  - `chat_message` 不可变（DATA_MODEL 已声明 UPDATE = false），只能 INSERT / DELETE
 *  - 没有 `updated_at`（历史不可变 → 没有"更新"的概念）
 *  - `mode`：触发该轮的 goal_mode 快照；`metadata.aborted`：流式是否被中途取消
 *  - 会话列表用客户端 group by `conversation_id`（PostgREST 没原生 group by；
 *    用 `idx_chat_user_created` 索引拉最近 N 行 → 在 JS 里压平）
 *
 * 公共 API：
 *  - listConversations(userId, limit?)        最近 N 个会话摘要（按 last_at desc）
 *  - listConversationMessages(conversationId) 一个会话内所有消息（按 created_at asc）
 *  - insertChatMessage({...})                 写一条
 *  - deleteConversation(userId, conversationId) 删该会话所有消息
 *
 * 切后端只动本文件。
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { failApiCall } from "@/lib/errorBus";
import type { Database, Json } from "@/types/db";
import type { GoalMode } from "@/api/profileApi";

type ChatMessageRow = Database["public"]["Tables"]["chat_message"]["Row"];
type ChatMessageInsert = Database["public"]["Tables"]["chat_message"]["Insert"];

export type ChatRole = "user" | "assistant" | "system";

/**
 * metadata jsonb 的业务 shape。
 * - `aborted`：true 表示这条 assistant 消息是流式被中途取消时落库的（content 可能不完整）
 * - 其它字段（model / token_usage / cited_rule_ids）随真 provider 接入再加，
 *   保持 metadata 形状开放 —— 老消息读出仍兼容。
 */
export interface ChatMessageMetadata {
  aborted?: boolean;
  [key: string]: unknown;
}

/**
 * ChatMessage shape —— DB 行类型派生 + 业务层 narrowing。
 *   - `role`: DB 是宽口 `string`，业务层窄到 `ChatRole`
 *   - `mode`: DB 是宽口 `string | null`，业务层窄到 `GoalMode | null`
 *   - `metadata`: DB 是宽口 `Json`，业务层窄到 `ChatMessageMetadata`
 * 列集合自动跟随 db.ts。
 */
export type ChatMessage = Omit<ChatMessageRow, "role" | "mode" | "metadata"> & {
  role: ChatRole;
  mode: GoalMode | null;
  metadata: ChatMessageMetadata;
};

/**
 * 会话摘要 —— 给历史列表卡片用。
 * 不是表里的字段，而是客户端按 conversation_id group 出来的派生 view。
 */
export interface ConversationSummary {
  conversation_id: string;
  /** 该会话第一条 user message 的 content（前 60 字），作为列表项预览 */
  preview: string;
  /** 该会话识别出来的 goal_mode（取最近一条 assistant msg 的 mode） */
  mode: GoalMode | null;
  /** 流式是否被中途取消（assistant.metadata.aborted） */
  aborted: boolean;
  /** 该会话最后一条消息时间，作为排序键 */
  last_at: string;
  /** 该会话消息总数（一轮 = 2 条：user + assistant） */
  message_count: number;
}

const NOT_CONFIGURED_MSG =
  "Supabase 未配置：请在 .env.local 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重启 dev server。";

const PREVIEW_MAX = 60;

/**
 * 拉用户最近的 N 条 chat_message，在 JS 里 group 成会话摘要列表。
 *
 * 为啥不让 DB group：PostgREST 不原生支持 group by，要走 RPC 才能。MVP 直接
 * 拉行 + 客户端 group，简单；当行数大到性能瓶颈时再加 RPC（或 view + RLS）。
 *
 * `messageRowLimit` 控制从表里拉多少条原始 message（不是会话数）。默认 100 条
 * 够覆盖最近 ~50 次推荐（一轮两条）。
 */
export async function listConversations(
  userId: string,
  messageRowLimit: number = 100,
): Promise<ConversationSummary[]> {
  if (!isSupabaseConfigured) failApiCall("chat.listConversations", NOT_CONFIGURED_MSG);

  const { data, error } = await supabase
    .from("chat_message")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(messageRowLimit);
  if (error) failApiCall("chat.listConversations", error.message);

  const rows = (data ?? []) as ChatMessageRow[];
  if (rows.length === 0) return [];

  // group by conversation_id —— 因为 rows 是 desc 序，每个 conv 第一次见到的行 = 最新
  const map = new Map<string, ConversationSummary>();
  // 同时记录每个 conv 看到的 user message（取最早的作为 preview），
  // 但因为是 desc 序，需要在遍历中持续覆盖（最后留下的就是最早 = 最先输入的）
  const userMsgByConv = new Map<string, string>();

  for (const r of rows) {
    const role = r.role as ChatRole;
    const mode = (r.mode ?? null) as GoalMode | null;
    const meta = (r.metadata ?? {}) as ChatMessageMetadata;

    const summary = map.get(r.conversation_id);
    if (!summary) {
      // 第一次见到这个 conv（= 最新一条 msg）
      map.set(r.conversation_id, {
        conversation_id: r.conversation_id,
        preview: role === "user" ? r.content : "",
        mode: role === "assistant" ? mode : null,
        aborted: role === "assistant" ? meta.aborted === true : false,
        last_at: r.created_at,
        message_count: 1,
      });
    } else {
      summary.message_count += 1;
      // 后续遇到的 row 时间更早；如果它是 user，更新 preview 到这个（最早的 user）
      if (role === "user") userMsgByConv.set(r.conversation_id, r.content);
      // 如果遇到 assistant 且当前 summary 还没识别 mode，补一下
      if (role === "assistant" && summary.mode === null) summary.mode = mode;
      if (role === "assistant" && !summary.aborted) summary.aborted = meta.aborted === true;
    }
  }

  // 把 user msg 的最早一条作为 preview
  for (const [convId, content] of userMsgByConv) {
    const s = map.get(convId);
    if (s) s.preview = content;
  }

  // 排序：按 last_at desc
  const list = Array.from(map.values()).sort((a, b) =>
    a.last_at < b.last_at ? 1 : a.last_at > b.last_at ? -1 : 0,
  );

  // 截 preview
  for (const s of list) {
    if (s.preview.length > PREVIEW_MAX) s.preview = s.preview.slice(0, PREVIEW_MAX) + "…";
  }

  return list;
}

/**
 * 拉某个会话内所有消息，按 created_at 升序（时间正序）。
 * 命中索引：idx_chat_user_conv_created (user_id, conversation_id, created_at)
 */
export async function listConversationMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured) failApiCall("chat.listMessages", NOT_CONFIGURED_MSG);

  const { data, error } = await supabase
    .from("chat_message")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) failApiCall("chat.listMessages", error.message);

  return (data ?? []) as unknown as ChatMessage[];
}

export interface InsertChatMessageInput {
  userId: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  mode?: GoalMode | null;
  metadata?: ChatMessageMetadata;
}

/**
 * 插入一条消息。返回插入后的行（含 DB 生成的 id / created_at）。
 *
 * 调用方负责生成 `conversationId`（用 crypto.randomUUID）—— 一轮对话的两条
 * message 共用一个 conv id；新对话生成新 id。
 */
export async function insertChatMessage(
  input: InsertChatMessageInput,
): Promise<ChatMessage> {
  if (!isSupabaseConfigured) failApiCall("chat.insert", NOT_CONFIGURED_MSG);

  const row: ChatMessageInsert = {
    user_id: input.userId,
    conversation_id: input.conversationId,
    role: input.role,
    content: input.content,
    mode: input.mode ?? null,
    metadata: (input.metadata ?? {}) as unknown as Json,
  };

  const { data, error } = await supabase
    .from("chat_message")
    .insert(row)
    .select()
    .single();
  if (error || !data) {
    failApiCall("chat.insert", `保存对话消息失败：${error?.message ?? "未知错误"}`);
  }
  return data as unknown as ChatMessage;
}

/**
 * 删除一个会话的所有消息。RLS 限定 user_id；显式 .eq("user_id") 做双保险。
 */
export async function deleteConversation(
  userId: string,
  conversationId: string,
): Promise<void> {
  if (!isSupabaseConfigured) failApiCall("chat.deleteConversation", NOT_CONFIGURED_MSG);

  const { error } = await supabase
    .from("chat_message")
    .delete()
    .eq("user_id", userId)
    .eq("conversation_id", conversationId);
  if (error) failApiCall("chat.deleteConversation", `删除对话失败：${error.message}`);
}
