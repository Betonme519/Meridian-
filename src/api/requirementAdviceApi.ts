/**
 * Requirement Advice / Link API —— 排队 13.5 静态路径库读取层
 *
 * 数据模型见 supabase/migrations/0007_add_requirement_advice.sql / 0008_add_requirement_link.sql。
 *
 * 设计要点：
 *  - 两张公共表（无 user_id），RLS = 所有人 SELECT；INSERT/UPDATE/DELETE 仅 service_role
 *  - advice：(goal_mode, requirement_id) 唯一；按 goal + req batch 查
 *  - link：(from_req, to_req, kind) 唯一；bidirectional=true 时 (to, from) 视同 (from, to)
 *  - 调用方约定批量查询（避免 N+1）：传 req id 数组进来，一次 IN 拉全
 *
 * 公共 API：
 *  - listAdvice(goalMode, requirementIds[])     按 (goal × reqs) 拉文案 + goal_fit + priority
 *  - listLinksForRequirements(requirementIds[]) 拉这些 req 涉及的所有 link（双向 IN）
 *  - GOAL_FITS / LINK_KINDS / SHORTCUT 类型与 SQL CHECK 同源
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { failApiCall } from "@/lib/errorBus";
import type { Database } from "@/types/db";
import { GOAL_MODES } from "./profileApi";
import type { GoalMode } from "./profileApi";

/* ───────────────────────── 枚举常量（与 SQL CHECK 同源） ───────────────────────── */

export const GOAL_FITS = ["best", "ok", "bad"] as const;
export type GoalFit = (typeof GOAL_FITS)[number];

export const LINK_KINDS = [
  "substitute",
  "prerequisite",
  "excludes",
  "cross_ref",
  "triggers",
] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

/** Shortcut 占位类型，12.5 启用时填实质字段 */
export interface AdviceShortcut {
  id?: string;
  oneLiner?: string;
  goalFit?: Partial<Record<GoalMode, GoalFit>>;
  candidates?: { code: string; name?: string; reason?: string }[];
}

/* ───────────────────────── 行类型派生 + 业务 narrowing ───────────────────────── */

type AdviceRow = Database["public"]["Tables"]["requirement_advice"]["Row"];
type LinkRow = Database["public"]["Tables"]["requirement_link"]["Row"];

/**
 * RequirementAdvice shape —— DB 行类型派生 + 业务 narrowing。
 *   - `goal_mode`: DB 宽口 string → 8 档 GoalMode
 *   - `goal_fit`: DB 宽口 string → 3 档 GoalFit
 *   - `shortcut_oneliners`: DB jsonb 是 unknown → AdviceShortcut[]（12.5 启用）
 */
export type RequirementAdvice = Omit<AdviceRow, "goal_mode" | "goal_fit" | "shortcut_oneliners"> & {
  goal_mode: GoalMode;
  goal_fit: GoalFit;
  shortcut_oneliners: AdviceShortcut[];
};

/** RequirementLink shape —— `kind` 窄到 5 档；`metadata` 保留 jsonb 宽口供调用方按 kind narrow */
export type RequirementLink = Omit<LinkRow, "kind"> & {
  kind: LinkKind;
};

const NOT_CONFIGURED_MSG =
  "Supabase 未配置：请在 .env.local 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重启 dev server。";

/* ───────────────────────── advice 查询 ───────────────────────── */

/**
 * 按 (goal_mode, requirement_ids) 批量拉 advice。
 *
 * 命中索引：idx_req_advice_goal_priority (goal_mode, priority)
 * 排序：priority asc（小→先），同 priority 按 source_ref 字典序兜底。
 * 空 reqIds 直接返 []（省一次空 IN 查询）。
 */
export async function listAdvice(
  goalMode: GoalMode,
  requirementIds: string[],
): Promise<RequirementAdvice[]> {
  if (requirementIds.length === 0) return [];
  if (!isSupabaseConfigured) failApiCall("requirementAdvice.list", NOT_CONFIGURED_MSG);
  if (!GOAL_MODES.includes(goalMode)) {
    failApiCall("requirementAdvice.list", `Unknown goal_mode: ${goalMode}`);
  }
  const { data, error } = await supabase
    .from("requirement_advice")
    .select("*")
    .eq("goal_mode", goalMode)
    .in("requirement_id", requirementIds)
    .order("priority", { ascending: true })
    .order("source_ref", { ascending: true, nullsFirst: false });
  if (error) failApiCall("requirementAdvice.list", error.message);
  return (data ?? []) as RequirementAdvice[];
}

/* ───────────────────────── link 查询 ───────────────────────── */

/**
 * 拉这些 requirement 涉及的所有 link（from / to 任一命中）。
 *
 * 命中索引：idx_req_link_from (from_req, kind) + idx_req_link_to (to_req, kind)
 * Postgres or 不会走单索引，两次 IN UNION：分两次查再合并去重，避免 OR 退化全表扫。
 * 双向 link（bidirectional=true）在调用方做对称展开（不在 DB 层做，省一次扫）。
 */
export async function listLinksForRequirements(
  requirementIds: string[],
): Promise<RequirementLink[]> {
  if (requirementIds.length === 0) return [];
  if (!isSupabaseConfigured) failApiCall("requirementLink.list", NOT_CONFIGURED_MSG);

  const [fromResp, toResp] = await Promise.all([
    supabase.from("requirement_link").select("*").in("from_req", requirementIds),
    supabase.from("requirement_link").select("*").in("to_req", requirementIds),
  ]);
  if (fromResp.error) failApiCall("requirementLink.list.from", fromResp.error.message);
  if (toResp.error) failApiCall("requirementLink.list.to", toResp.error.message);

  // 按 id 去重（同一行可能两次都命中）
  const merged = new Map<string, LinkRow>();
  for (const r of fromResp.data ?? []) merged.set(r.id, r);
  for (const r of toResp.data ?? []) merged.set(r.id, r);
  return Array.from(merged.values()) as RequirementLink[];
}
