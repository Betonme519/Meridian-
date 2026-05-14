/**
 * Plan API — Supabase 实现（`plan` 表，整图 JSONB 存）。
 *
 * 数据模型见 docs/DATA_MODEL.md § 3.3。
 *
 * 设计要点：
 *  - 整张图存一行：`nodes` / `edges` 都是 JSONB，view-time 直接喂 ReactFlow
 *    （决策 D6 = (a) JSONB 整存，不拆 plan_node/plan_edge）
 *  - lane 骨架（render-only）**不**走这里，调用方传入前要先过滤
 *  - `updated_at` 由 trigger `trg_plan_updated_at` 在 UPDATE 时自动维护
 *  - RLS 限制 `user_id = auth.uid()`；表层 .eq("user_id", userId) 显式写出更清楚
 *
 * 公共 API：
 *  - listPlans(userId)               拉用户的所有未归档 plan，按 updated_at desc
 *  - getPlan(planId)                 拉一整张 plan（切换 plan 时用）
 *  - createPlan({...})               INSERT 一行；name 默认 "未命名规划"
 *  - updatePlanGraph(planId, patch)  UPDATE nodes / edges / viewport 三字段
 *  - renamePlan(planId, name)        UPDATE name 字段
 *  - deletePlan(planId)              DELETE 一行（决策 D 软删不做 / 真删；用户决策本期硬删）
 *
 * 切后端只动本文件。
 */

import type { Edge, Node, Viewport } from "@xyflow/react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Plan shape —— 与 docs/DATA_MODEL.md § 3.3 字段表 1:1 对齐。
 * Postgres NULL → TS null。
 *
 * `nodes` JSONB 的元素 shape 见 seedGraph.ts 的 MeridianFlowNode；
 * 这里用宽口 `Node[]` / `Edge[]` 让本层与具体业务节点 schema 解耦。
 * 业务层（Planner 页面）自行 narrow 类型。
 */
export interface Plan {
  id: string;
  user_id: string;
  name: string;
  goal_mode: string | null;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

const NOT_CONFIGURED_MSG =
  "Supabase 未配置：请在 .env.local 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重启 dev server。";

/**
 * 列出某用户的所有活跃（未归档）plan，按最近编辑倒序。
 * 命中索引：idx_plan_user_active (user_id, is_archived) +
 *           idx_plan_user_updated (user_id, updated_at DESC)
 */
export async function listPlans(userId: string): Promise<Plan[]> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("plan")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`加载规划列表失败：${error.message}`);
  return (data ?? []) as Plan[];
}

/**
 * 拉单张 plan。找不到（或 RLS 拒绝）返回 null，让调用方决定 fallback。
 * 不抛错——切换 plan 时 URL 可能是过期 / 不存在的 id，应当优雅降级。
 */
export async function getPlan(planId: string): Promise<Plan | null> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("plan")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  if (error) throw new Error(`加载规划失败：${error.message}`);
  return (data ?? null) as Plan | null;
}

/**
 * 新建一张 plan。
 *  - name 缺省走表默认 "未命名规划"
 *  - nodes / edges 缺省走表默认 []（数据库层）
 *  - viewport / goal_mode 不在创建时设，等用户操作后自然走 updatePlanGraph 写入
 */
export async function createPlan(opts: {
  userId: string;
  name?: string;
  nodes?: Node[];
  edges?: Edge[];
}): Promise<Plan> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);

  const row: Record<string, unknown> = {
    user_id: opts.userId,
  };
  if (opts.name !== undefined) row.name = opts.name;
  if (opts.nodes !== undefined) row.nodes = opts.nodes;
  if (opts.edges !== undefined) row.edges = opts.edges;

  const { data, error } = await supabase
    .from("plan")
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`新建规划失败：${error?.message ?? "未知错误"}`);
  }
  return data as Plan;
}

/**
 * 更新画布内容。只动 nodes / edges / viewport 三字段；
 * `updated_at` 由 trigger 维护，前端不要 set（手动 set 会赢 trigger 顺序，反而错）。
 *
 * 注意：传入的 nodes 应当**已过滤 lane 骨架**（lane 是 render-only）。
 * 过滤逻辑放在调用方（usePlans / Planner 页），让 API 层保持纯净。
 */
export async function updatePlanGraph(
  planId: string,
  patch: {
    nodes: Node[];
    edges: Edge[];
    viewport: Viewport | null;
  },
): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);

  const { error } = await supabase
    .from("plan")
    .update({
      nodes: patch.nodes,
      edges: patch.edges,
      viewport: patch.viewport,
    })
    .eq("id", planId);

  if (error) throw new Error(`保存规划失败：${error.message}`);
}

/**
 * 重命名。空白 / 纯空格的名字拒收（业务层应当先 trim）。
 */
export async function renamePlan(planId: string, name: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("规划名不能为空");

  const { error } = await supabase
    .from("plan")
    .update({ name: trimmed })
    .eq("id", planId);

  if (error) throw new Error(`重命名失败：${error.message}`);
}

/**
 * 删除一行 plan。决策 D「软删不做」，硬删 — 业务层应当先弹 confirm。
 * RLS 限制 user_id = auth.uid()，跨账号删不到。
 */
export async function deletePlan(planId: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);

  const { error } = await supabase.from("plan").delete().eq("id", planId);
  if (error) throw new Error(`删除规划失败：${error.message}`);
}
