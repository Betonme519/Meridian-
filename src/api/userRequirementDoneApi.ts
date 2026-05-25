/**
 * UserRequirementDone API —— 反向勾选式进度收集（排队 12.5 sub-task 0）
 *
 * 数据模型见 supabase/migrations/0009_add_user_requirement_done.sql。
 *
 * 设计语义（**反向勾选**）：
 *  - 默认所有 requirement 视为"已完成"
 *  - 一行 user_requirement_done = 用户标该 req **未完成**
 *  - 取消标记 / 完成时勾回 → 删除该行
 *
 *  → 空表 = 该用户全部 requirement 已完成
 *  → 高频场景：高年级学生只标 1-2 条未完成，表体量永远小
 *
 * RLS：owner-only 全 CRUD；切账号必须重拉。
 *
 * 公共 API：
 *  - listIncomplete(userId)              拉用户所有"未完成"标记
 *  - markIncomplete(userId, reqId, note?) 标该 req 未完成（upsert）
 *  - unmarkIncomplete(userId, reqId)     标完成 → 删该行
 *  - batchSetIncomplete(userId, reqIds[]) 批量同步：传"还未完成的 req id 集合"
 *                                          → DB 与之对齐（增删差异）
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { failApiCall } from "@/lib/errorBus";
import type { Database } from "@/types/db";

type UserRequirementDoneRow = Database["public"]["Tables"]["user_requirement_done"]["Row"];

export type UserRequirementDone = UserRequirementDoneRow;

const NOT_CONFIGURED_MSG =
  "Supabase 未配置：请在 .env.local 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重启 dev server。";

/**
 * 拉用户所有"未完成"标记。空表 = 全部完成。
 *
 * 命中索引：idx_urd_user (user_id)
 * 排序：created_at desc（最近标的在前；UI 列表很少用，hook 只取 reqId Set）
 */
export async function listIncomplete(userId: string): Promise<UserRequirementDone[]> {
  if (!isSupabaseConfigured) failApiCall("userRequirementDone.list", NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("user_requirement_done")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) failApiCall("userRequirementDone.list", error.message);
  return (data ?? []) as UserRequirementDone[];
}

/**
 * 标记一条 requirement 为"未完成"。
 *
 * upsert ON CONFLICT (user_id, requirement_id) DO NOTHING —— 重复标不报错，幂等。
 * 用户填 note 时走 UPDATE 路径；不填走 INSERT。
 */
export async function markIncomplete(
  userId: string,
  requirementId: string,
  note?: string,
): Promise<UserRequirementDone | null> {
  if (!isSupabaseConfigured) failApiCall("userRequirementDone.mark", NOT_CONFIGURED_MSG);
  const payload: Database["public"]["Tables"]["user_requirement_done"]["Insert"] = {
    user_id: userId,
    requirement_id: requirementId,
    note: note ?? null,
  };
  const { data, error } = await supabase
    .from("user_requirement_done")
    .upsert(payload, { onConflict: "user_id,requirement_id" })
    .select()
    .single();
  if (error) failApiCall("userRequirementDone.mark", error.message);
  return (data as UserRequirementDone) ?? null;
}

/**
 * 取消标记 = 标该 req 为已完成 → 删行。
 *
 * DELETE WHERE (user_id, requirement_id)；没行可删时静默（幂等）。
 */
export async function unmarkIncomplete(userId: string, requirementId: string): Promise<void> {
  if (!isSupabaseConfigured) failApiCall("userRequirementDone.unmark", NOT_CONFIGURED_MSG);
  const { error } = await supabase
    .from("user_requirement_done")
    .delete()
    .eq("user_id", userId)
    .eq("requirement_id", requirementId);
  if (error) failApiCall("userRequirementDone.unmark", error.message);
}

/**
 * 批量同步：传入"还未完成的 req id 集合"，DB 与之对齐。
 *
 * 算法：
 *   1. 拉当前 DB 所有未完成 reqIds → currentSet
 *   2. 计算 toAdd = targetSet - currentSet, toRemove = currentSet - targetSet
 *   3. 一次 upsert toAdd + 一次 delete toRemove
 *
 * 比一次性 DELETE ALL + 再 INSERT 安全（保留旧行的 note / created_at）。
 *
 * 用于 Import 页 "保存全部勾选" 按钮。
 */
export async function batchSetIncomplete(
  userId: string,
  targetReqIds: string[],
): Promise<void> {
  if (!isSupabaseConfigured) failApiCall("userRequirementDone.batch", NOT_CONFIGURED_MSG);
  const current = await listIncomplete(userId);
  const currentSet = new Set(current.map((r) => r.requirement_id));
  const targetSet = new Set(targetReqIds);
  const toAdd = Array.from(targetSet).filter((id) => !currentSet.has(id));
  const toRemove = Array.from(currentSet).filter((id) => !targetSet.has(id));

  if (toAdd.length > 0) {
    const rows = toAdd.map((requirement_id) => ({
      user_id: userId,
      requirement_id,
    }));
    const { error } = await supabase
      .from("user_requirement_done")
      .upsert(rows, { onConflict: "user_id,requirement_id" });
    if (error) failApiCall("userRequirementDone.batch.add", error.message);
  }
  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("user_requirement_done")
      .delete()
      .eq("user_id", userId)
      .in("requirement_id", toRemove);
    if (error) failApiCall("userRequirementDone.batch.remove", error.message);
  }
}
