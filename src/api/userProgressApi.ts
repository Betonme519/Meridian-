/**
 * User Progress API — Supabase 实现（`user_progress` 表）。
 *
 * 数据模型见 docs/TRACK_SCHEMA.md § 5。
 *
 * 设计要点：
 *  - 用户私有（owner-only RLS）
 *  - 一行 = 一个 (user_id, option_id) 组合；DB 有 UNIQUE (user_id, option_id) → upsert 走它
 *  - status 五档（'planned' / 'enrolled' / 'done' / 'waived' / 'dropped'），与 [[trackEnums]] 同源
 *  - `note` 字段：用户对该 option 的个人备注（"为什么选 / 为什么不选"），由 Drawer textarea 写
 *  - `grade` 字段：可选成绩 letter，与 course.grade_letter 是两套（这里是 track-绑定的，course 是自由记录）
 *
 * 公共 API：
 *  - listUserProgress(userId, trackId?)           该用户全部进度（可按 track 过滤）
 *  - upsertUserProgress({...})                     INSERT/UPDATE，单写一条
 *  - deleteUserProgress(id)                        硬删，UI 上"恢复 default 态"用
 *
 * 切后端只动本文件。
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { failApiCall } from "@/lib/errorBus";
import type { Database } from "@/types/db";
import { USER_PROGRESS_STATUSES, type UserProgressStatus } from "@/types/trackEnums";

// re-export 给消费方少走一道 import
export { USER_PROGRESS_STATUSES };
export type { UserProgressStatus };

type UserProgressRow = Database["public"]["Tables"]["user_progress"]["Row"];
type UserProgressInsert = Database["public"]["Tables"]["user_progress"]["Insert"];

/**
 * UserProgress shape —— DB 行类型派生 + status 窄化到 enum。
 */
export type UserProgress = Omit<UserProgressRow, "status"> & {
  status: UserProgressStatus;
};

const NOT_CONFIGURED_MSG =
  "Supabase 未配置：请在 .env.local 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重启 dev server。";

/**
 * 拉用户全部 user_progress。可按 track_id 过滤；不传则全表。
 * 命中：idx_user_progress_user_track (user_id, track_id)。
 */
export async function listUserProgress(userId: string, trackId?: string): Promise<UserProgress[]> {
  if (!isSupabaseConfigured) failApiCall("progress.list", NOT_CONFIGURED_MSG);
  let q = supabase.from("user_progress").select("*").eq("user_id", userId);
  if (trackId) q = q.eq("track_id", trackId);
  const { data, error } = await q.order("updated_at", { ascending: false });
  if (error) failApiCall("progress.list", error.message);
  return (data ?? []) as UserProgress[];
}

export interface UpsertUserProgressInput {
  userId: string;
  trackId: string;
  optionId: string;
  status?: UserProgressStatus;
  grade?: string | null;
  semester?: string | null;
  note?: string | null;
}

/**
 * 单条 INSERT / UPDATE（DB UNIQUE (user_id, option_id) → onConflict 走它）。
 *
 * 行为：
 *  - 该 (user, option) 不存在 → INSERT，status 默认 'planned'
 *  - 已存在 → UPDATE 提供的字段；省略字段不动（PostgREST upsert 默认覆盖整行 — 我们
 *    用 `returning='representation'` 拿回更新后的行）
 *
 * 注意 PostgREST 的 upsert 默认是"整行覆盖"语义，没传的字段会被 DB DEFAULT 覆写
 * 或 NULL 化。所以这里只传调用方显式给的字段 + 必填 userId/trackId/optionId，
 * 让 DB 默认（DEFAULT 'planned' / DEFAULT now()）兜底；其余字段（grade/semester/note）
 * 在 INSERT 时为 null，在 UPDATE 时若调用方没传则也会变 null。
 *
 * → 如果调用方想保留某字段，**必须显式传**。Hook 层 `upsertProgress(optionId, patch)`
 * 责任：先从 progressByOptionId 取现行 row → merge patch → 再 call API，避免无意清空。
 */
export async function upsertUserProgress(input: UpsertUserProgressInput): Promise<UserProgress> {
  if (!isSupabaseConfigured) failApiCall("progress.upsert", NOT_CONFIGURED_MSG);

  const row: UserProgressInsert = {
    user_id: input.userId,
    track_id: input.trackId,
    option_id: input.optionId,
  };
  if (input.status !== undefined) row.status = input.status;
  if (input.grade !== undefined) row.grade = input.grade;
  if (input.semester !== undefined) row.semester = input.semester;
  if (input.note !== undefined) row.note = input.note;

  const { data, error } = await supabase
    .from("user_progress")
    .upsert(row, { onConflict: "user_id,option_id" })
    .select()
    .single();
  if (error || !data) {
    failApiCall("progress.upsert", `保存进度失败：${error?.message ?? "未知错误"}`);
  }
  return data as UserProgress;
}

/**
 * 硬删一行。UI 行为：用户在 option 卡上点"恢复 default"时调用，让该 option
 * 回到"未设进度"态。RLS 限定 user_id = auth.uid()。
 */
export async function deleteUserProgress(id: string): Promise<void> {
  if (!isSupabaseConfigured) failApiCall("progress.delete", NOT_CONFIGURED_MSG);
  const { error } = await supabase.from("user_progress").delete().eq("id", id);
  if (error) failApiCall("progress.delete", `删除进度失败：${error.message}`);
}
