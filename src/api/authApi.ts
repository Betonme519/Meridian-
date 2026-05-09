/**
 * Auth API — Supabase 实现。
 *
 * 4 个公开函数 + 1 个订阅，是 AuthContext 与 Supabase 之间的薄壳：
 *   - login / register / logout / getCurrentUser
 *   - onAuthChange(cb): 订阅多 tab 同步 / token 静默刷新
 *
 * 把 Supabase 的 `User` 映射到本地 `AuthUser` shape，让 AuthContext / Login /
 * Register / 任何 useAuth 调用方都不需要知道具体后端。后端要换（CF Workers BFF
 * 等）只动这一文件，公共 API 不变。
 *
 * 详见 docs/AI_MEMORY.md → "Supabase 接入（2026-05-09）"
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const NOT_CONFIGURED_MSG =
  "Supabase 未配置：请在 .env.local 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重启 dev server。";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
}

function mapUser(u: SupabaseUser | null): AuthUser | null {
  if (!u || !u.email) return null;
  const meta = (u.user_metadata ?? {}) as { name?: string };
  return {
    id: u.id,
    email: u.email,
    name: (meta.name && meta.name.trim()) || u.email.split("@")[0],
    createdAt: u.created_at,
  };
}

function requireUser(u: AuthUser | null): AuthUser {
  if (!u) throw new Error("Supabase 未返回用户信息（请检查邮箱确认设置）");
  return u;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthSession> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return { user: requireUser(mapUser(data.user)) };
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<AuthSession> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
  // Supabase 项目设置中已关闭 "Confirm email"（D2 = a），data.user 立即可用
  return { user: requireUser(mapUser(data.user)) };
}

export async function logout(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getUser();
  return mapUser(data.user);
}

/**
 * 订阅 Supabase auth 状态变化（SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED 等）。
 * 返回 unsubscribe 函数，必须在 useEffect cleanup 中调用。
 */
export function onAuthChange(
  cb: (user: AuthUser | null) => void,
): () => void {
  if (!isSupabaseConfigured) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(mapUser(session?.user ?? null));
  });
  return () => data.subscription.unsubscribe();
}
