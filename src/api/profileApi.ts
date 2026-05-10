/**
 * Profile API — Supabase 实现。
 *
 * profiles 表 1:1 扩展 auth.users（schema 见 docs/DATA_MODEL.md § 3.1）。
 * 后端有 handle_new_user trigger 在注册时自动建 profiles 行；本文件兜底处理
 * 历史账号或异常缺失情况：fetch 拿 null 时前端 upsert 一条空白行。
 *
 * 公共 API 三件套：
 *   - getProfile(userId)              拉单条；不存在返回 null
 *   - upsertProfile(userId, patch?)   存在更新，缺失就插入；用于"兜底创建"
 *   - updateProfile(userId, patch)    存在才更新；不会创建，缺失返回 null
 *
 * 切后端只动本文件，ProfileContext 公共 API 不变。
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type GoalMode =
  | "高 GPA"
  | "最轻松毕业"
  | "保研路线"
  | "留学路线"
  | "实习优先"
  | "时间自由"
  | "低压力模式"
  | "个性化定制";

export const GOAL_MODES: GoalMode[] = [
  "高 GPA",
  "最轻松毕业",
  "保研路线",
  "留学路线",
  "实习优先",
  "时间自由",
  "低压力模式",
  "个性化定制",
];

/**
 * Profile shape — 与 docs/DATA_MODEL.md § 3.1 字段表 1:1 对齐。
 * Postgres 的 NULL → TS 的 null（不用 undefined）。
 */
export interface Profile {
  id: string;
  name: string | null;
  school: string | null;
  major: string | null;
  grade: number | null;
  target_gpa: number | null;
  goal_mode: GoalMode;
  goal_weights: Record<string, number>;
  created_at: string;
  updated_at: string;
}

/**
 * 可写字段子集 —— 排除 id / timestamps（DB 维护）。
 * 给 updateProfile / upsertProfile 用。
 */
export type ProfilePatch = Partial<
  Omit<Profile, "id" | "created_at" | "updated_at">
>;

const NOT_CONFIGURED_MSG =
  "Supabase 未配置：请在 .env.local 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重启 dev server。";

/**
 * 拉指定用户的 profile。不存在返回 null（不抛错）。
 * 调用方一般是 ProfileContext，拿到 null 后走兜底 upsert。
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Profile | null;
}

/**
 * 兜底创建 / 部分更新。
 * - 行不存在 → 用 patch 插入新行（id 必填，由调用方传）
 * - 行存在 → 用 patch 更新
 *
 * 行为依赖 Postgres ON CONFLICT (id) DO UPDATE，由 supabase-js 的 .upsert
 * 自动生成。`onConflict: "id"` 显式声明冲突列。
 */
export async function upsertProfile(
  userId: string,
  patch: ProfilePatch = {},
): Promise<Profile> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...patch }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Profile;
}

/**
 * 仅更新存在的行。行不存在时返回 null（不抛错），由调用方决定是否 upsert。
 * 与 upsertProfile 的区别：本函数不会创建新行，更适合 ProfileContext 在
 * 已经确认 profile 存在后做的字段级 patch。
 */
export async function updateProfile(
  userId: string,
  patch: ProfilePatch,
): Promise<Profile | null> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Profile | null;
}
