/**
 * Rule Conflict API — Supabase 实现（`rule_conflict` 表）。
 *
 * 数据模型见 docs/DATA_MODEL.md § 3.5。
 *
 * 设计要点：
 *  - 单独表存冲突（D8=b），不在 rule 表里塞 conflicts_with 数组
 *  - 强制约束 CHECK (rule_a_id < rule_b_id)：插入前必须排序，否则 DB 拒收
 *  - UNIQUE (rule_a_id, rule_b_id)：同一对规则不能录两次
 *  - check_rule_conflict_owner trigger：rule_a / rule_b 必须同属本人
 *  - `judgement` / `confidence` / `resolved_by` 三个可空字段，留给 AI / 用户填
 *
 * 公共 API：
 *  - listConflicts(userId)        该用户所有冲突
 *  - createConflict({...})        写入；自动 sort (a,b)
 *  - updateConflict(id, patch)    部分更新；如改 a/b 也会重新 sort
 *  - deleteConflict(id)           硬删
 *
 * 切后端只动本文件。
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Database } from "@/types/db";

// 与 DB CHECK 约束对齐
export const CONFIDENCE_LEVELS = ["high", "med", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const RESOLVED_BY_VALUES = ["a", "b", "unresolved"] as const;
export type ResolvedBy = (typeof RESOLVED_BY_VALUES)[number];

type RuleConflictRow = Database["public"]["Tables"]["rule_conflict"]["Row"];
type RuleConflictInsert = Database["public"]["Tables"]["rule_conflict"]["Insert"];
type RuleConflictUpdate = Database["public"]["Tables"]["rule_conflict"]["Update"];

/**
 * RuleConflict shape —— DB 行派生 + 业务窄化两个枚举字段。
 *   - `confidence`: 'high' | 'med' | 'low' | null
 *   - `resolved_by`: 'a' | 'b' | 'unresolved' | null
 */
export type RuleConflict = Omit<RuleConflictRow, "confidence" | "resolved_by"> & {
  confidence: ConfidenceLevel | null;
  resolved_by: ResolvedBy | null;
};

const NOT_CONFIGURED_MSG =
  "Supabase 未配置：请在 .env.local 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重启 dev server。";

/**
 * 字典序排序一对 rule id —— 让 (rule_a, rule_b) 满足 CHECK (a < b)。
 * 调用方应当在 insert / update 前对参数走这个函数。
 */
function sortRulePair(aId: string, bId: string): [string, string] {
  return aId < bId ? [aId, bId] : [bId, aId];
}

/**
 * 拉用户所有冲突，按 created_at desc。
 * 命中索引：idx_rule_conflict_user (user_id)。
 */
export async function listConflicts(userId: string): Promise<RuleConflict[]> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("rule_conflict")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RuleConflict[];
}

export interface CreateConflictInput {
  userId: string;
  /** 原始 rule A id；本函数会自动与 B 排序，调用方不用关心顺序 */
  ruleAId: string;
  ruleBId: string;
  title: string;
  judgement?: string | null;
  confidence?: ConfidenceLevel | null;
  resolved_by?: ResolvedBy | null;
}

/**
 * 新建冲突。
 * - 自动 sort (a, b) 满足 CHECK
 * - 同一对（无序）已存在会触发 UNIQUE 报错（向上抛）
 * - rule_a / rule_b 不属于本人会触发 trigger 报错（向上抛）
 */
export async function createConflict(
  input: CreateConflictInput,
): Promise<RuleConflict> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);

  if (input.ruleAId === input.ruleBId) {
    throw new Error("不能把同一条规则与自己设为冲突。");
  }
  const [aId, bId] = sortRulePair(input.ruleAId, input.ruleBId);

  const row: RuleConflictInsert = {
    user_id: input.userId,
    rule_a_id: aId,
    rule_b_id: bId,
    title: input.title,
  };
  if (input.judgement !== undefined) row.judgement = input.judgement;
  if (input.confidence !== undefined) row.confidence = input.confidence;
  if (input.resolved_by !== undefined) row.resolved_by = input.resolved_by;

  const { data, error } = await supabase
    .from("rule_conflict")
    .insert(row)
    .select()
    .single();
  if (error || !data) {
    throw new Error(`新建冲突失败：${error?.message ?? "未知错误"}`);
  }
  return data as RuleConflict;
}

export interface ConflictPatch {
  title?: string;
  judgement?: string | null;
  confidence?: ConfidenceLevel | null;
  resolved_by?: ResolvedBy | null;
  /** 改 a/b 的话两个一起传；本函数会重新 sort */
  ruleAId?: string;
  ruleBId?: string;
}

/**
 * 部分更新。如改 a/b 一对，会自动 sort 后写入。
 */
export async function updateConflict(
  id: string,
  patch: ConflictPatch,
): Promise<RuleConflict> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);

  const update: RuleConflictUpdate = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.judgement !== undefined) update.judgement = patch.judgement;
  if (patch.confidence !== undefined) update.confidence = patch.confidence;
  if (patch.resolved_by !== undefined) update.resolved_by = patch.resolved_by;
  if (patch.ruleAId !== undefined && patch.ruleBId !== undefined) {
    if (patch.ruleAId === patch.ruleBId) {
      throw new Error("不能把同一条规则与自己设为冲突。");
    }
    const [aId, bId] = sortRulePair(patch.ruleAId, patch.ruleBId);
    update.rule_a_id = aId;
    update.rule_b_id = bId;
  }

  const { data, error } = await supabase
    .from("rule_conflict")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error || !data) {
    throw new Error(`更新冲突失败：${error?.message ?? "未知错误"}`);
  }
  return data as RuleConflict;
}

/**
 * 硬删。RLS owner-only。
 */
export async function deleteConflict(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { error } = await supabase.from("rule_conflict").delete().eq("id", id);
  if (error) throw new Error(`删除冲突失败：${error.message}`);
}
