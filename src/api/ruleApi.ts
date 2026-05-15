/**
 * Rule API — Supabase 实现（`rule` 表）。
 *
 * 数据模型见 docs/DATA_MODEL.md § 3.4。
 *
 * 设计要点：
 *  - 用户私有（D7=a），RLS owner-only；切账号必须重拉
 *  - branch 是分组名（"GPA 计算规则" / "学分结构" / "替代规则" 等），前端用来折叠树
 *  - trust 三档：'high'（官方）/ 'med'（AI 推测）/ 'low'（学生评价）
 *  - `rag_source_id` 可空：手动录入的没有 RAG 来源
 *
 * 公共 API：
 *  - listRules(userId)            该用户所有 rule，按 (branch, created_at desc) 排
 *  - createRule({...})            写入
 *  - updateRule(id, patch)        部分字段更新
 *  - deleteRule(id)               硬删（rule_conflict 走 ON DELETE CASCADE 跟删）
 *
 * 切后端只动本文件。
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Database } from "@/types/db";

// trust 三档 —— 与 DB CHECK 约束对齐
export const TRUST_LEVELS = ["high", "med", "low"] as const;
export type TrustLevel = (typeof TRUST_LEVELS)[number];

type RuleRow = Database["public"]["Tables"]["rule"]["Row"];
type RuleInsert = Database["public"]["Tables"]["rule"]["Insert"];
type RuleUpdate = Database["public"]["Tables"]["rule"]["Update"];

/**
 * Rule shape —— DB 行类型派生 + 业务层 narrowing。
 *   - `trust`: DB 是宽口 `string`，业务层窄到 `TrustLevel` 枚举
 * 列集合自动跟随 db.ts。
 */
export type Rule = Omit<RuleRow, "trust"> & {
  trust: TrustLevel;
};

const NOT_CONFIGURED_MSG =
  "Supabase 未配置：请在 .env.local 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重启 dev server。";

/**
 * 拉用户所有规则。
 *
 * 命中索引：idx_rule_user_branch (user_id, branch)。
 * 排序：先按 branch（字典序，让同分组聚拢），同 branch 内按 created_at desc。
 * 分组 / trust 过滤都在 hook / UI 层做（DB 一次拉全，简化逻辑）。
 */
export async function listRules(userId: string): Promise<Rule[]> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("rule")
    .select("*")
    .eq("user_id", userId)
    .order("branch", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Rule[];
}

export interface CreateRuleInput {
  userId: string;
  branch: string;
  title: string;
  body?: string | null;
  trust?: TrustLevel;
  source?: string | null;
  source_page?: string | null;
  rag_source_id?: string | null;
}

/**
 * 新建一条 rule。trust 缺省走表默认 'med'。
 */
export async function createRule(input: CreateRuleInput): Promise<Rule> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);

  const row: RuleInsert = {
    user_id: input.userId,
    branch: input.branch,
    title: input.title,
  };
  if (input.body !== undefined) row.body = input.body;
  if (input.trust !== undefined) row.trust = input.trust;
  if (input.source !== undefined) row.source = input.source;
  if (input.source_page !== undefined) row.source_page = input.source_page;
  if (input.rag_source_id !== undefined) row.rag_source_id = input.rag_source_id;

  const { data, error } = await supabase
    .from("rule")
    .insert(row)
    .select()
    .single();
  if (error || !data) {
    throw new Error(`新建规则失败：${error?.message ?? "未知错误"}`);
  }
  return data as Rule;
}

export type RulePatch = Partial<
  Omit<Rule, "id" | "user_id" | "created_at" | "updated_at">
>;

/**
 * 部分字段更新。`updated_at` 由 trigger 维护，前端不要 set。
 */
export async function updateRule(id: string, patch: RulePatch): Promise<Rule> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);

  const update: RuleUpdate = { ...patch };
  const { data, error } = await supabase
    .from("rule")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error || !data) {
    throw new Error(`更新规则失败：${error?.message ?? "未知错误"}`);
  }
  return data as Rule;
}

/**
 * 硬删一条 rule。
 * rule_conflict 通过 ON DELETE CASCADE 跟删（DATA_MODEL § 3.5）。
 * RLS 限定 user_id = auth.uid()，跨账号删不到。
 */
export async function deleteRule(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { error } = await supabase.from("rule").delete().eq("id", id);
  if (error) throw new Error(`删除规则失败：${error.message}`);
}
