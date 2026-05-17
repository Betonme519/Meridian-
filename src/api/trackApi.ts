/**
 * Track API — Supabase 实现，4 张公共表的只读薄壳。
 *
 * 数据模型见 docs/TRACK_SCHEMA.md。
 *
 * 五张公共表：
 *  - track            一份培养方案（school × major / college / school 通用 × year）
 *  - track_category   一级分类（A 思政 / B 数学 / C 专业必修 …）
 *  - track_requirement 具体要求（kind=count/credits/one_of/all_of + 学校规则 8 档）
 *  - track_option     可选项（课程 / alt / project）
 *  - user_progress    用户进度，单独走 `src/api/userProgressApi.ts`（owner-only）
 *
 * RLS：track / track_category / track_requirement / track_option 全部 SELECT FOR ALL，
 * 任何已登录或访客都能读；INSERT / UPDATE / DELETE 默认拒（仅 service_role bypass，
 * seed 在 Supabase Dashboard SQL Editor 跑）。
 *
 * 公共 API（全部只读）：
 *  - listTracks()                                按 (year desc, school, scope_level) 排
 *  - listCategoriesByTrack(trackId)              按 order_index asc
 *  - listRequirementsByTrack(trackId)            一次拉全 track 的 requirement
 *  - listOptionsByTrack(trackId)                 一次拉全 track 的 option
 *
 * 设计选择：`useTrack` 一次性拉 track + 全部 requirements + 全部 options，本地按
 * category_id / requirement_id group，避免每展开一个 category 就发一次请求。
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { failApiCall } from "@/lib/errorBus";
import type { Database } from "@/types/db";
import type { TrackScopeLevel, RequirementKind, OptionKind } from "@/types/trackEnums";

type TrackRow = Database["public"]["Tables"]["track"]["Row"];
type TrackCategoryRow = Database["public"]["Tables"]["track_category"]["Row"];
type TrackRequirementRow = Database["public"]["Tables"]["track_requirement"]["Row"];
type TrackOptionRow = Database["public"]["Tables"]["track_option"]["Row"];

/**
 * Track shape —— DB 行类型派生 + 业务层 narrowing。
 *   - `scope_level`: DB 是宽口 `string`，业务层窄到 `TrackScopeLevel`
 */
export type Track = Omit<TrackRow, "scope_level"> & {
  scope_level: TrackScopeLevel;
};

/** track_category —— 公共表，直接用 DB 行类型即可（无 enum 需窄化）。 */
export type TrackCategory = TrackCategoryRow;

/**
 * TrackRequirement shape —— `kind` 窄到 12 档 enum。
 * `metadata` 暂用 `Json`，业务消费方 narrow（kind=time_limit 的 metadata 形状见 track_kind_taxonomy.md）。
 */
export type TrackRequirement = Omit<TrackRequirementRow, "kind"> & {
  kind: RequirementKind;
};

/** TrackOption shape —— `kind` 窄到 3 档。 */
export type TrackOption = Omit<TrackOptionRow, "kind"> & {
  kind: OptionKind;
};

const NOT_CONFIGURED_MSG =
  "Supabase 未配置：请在 .env.local 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重启 dev server。";

/**
 * 拉所有公共 track。当前 seed 只有华师大 2023，但保留多 track 排序逻辑：
 *   year desc → school asc → scope_level asc → college nulls last
 *
 * 命中：`idx_track_school_major` 部分覆盖，全表扫也快（量级 ≤ 几十条）。
 */
export async function listTracks(): Promise<Track[]> {
  if (!isSupabaseConfigured) failApiCall("track.list", NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("track")
    .select("*")
    .order("year", { ascending: false })
    .order("school", { ascending: true })
    .order("scope_level", { ascending: true })
    .order("college", { ascending: true, nullsFirst: false });
  if (error) failApiCall("track.list", error.message);
  return (data ?? []) as Track[];
}

/**
 * 拉指定 track 的全部 category，按 order_index asc。命中 `idx_track_category_track_order`。
 */
export async function listCategoriesByTrack(trackId: string): Promise<TrackCategory[]> {
  if (!isSupabaseConfigured) failApiCall("track.listCategories", NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("track_category")
    .select("*")
    .eq("track_id", trackId)
    .order("order_index", { ascending: true });
  if (error) failApiCall("track.listCategories", error.message);
  return (data ?? []) as TrackCategory[];
}

/**
 * 一次拉整个 track 的全部 requirement，本地按 category_id group。命中 `idx_track_requirement_track`。
 * 排序：order_index asc（同 category 内顺序保稳）。
 */
export async function listRequirementsByTrack(trackId: string): Promise<TrackRequirement[]> {
  if (!isSupabaseConfigured) failApiCall("track.listRequirements", NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("track_requirement")
    .select("*")
    .eq("track_id", trackId)
    .order("order_index", { ascending: true });
  if (error) failApiCall("track.listRequirements", error.message);
  return (data ?? []) as TrackRequirement[];
}

/**
 * 一次拉整个 track 的全部 option，本地按 requirement_id group。命中 `idx_track_option_track`。
 * 排序：code asc（同 requirement 内按代码字典序，便于学生扫视）。
 */
export async function listOptionsByTrack(trackId: string): Promise<TrackOption[]> {
  if (!isSupabaseConfigured) failApiCall("track.listOptions", NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("track_option")
    .select("*")
    .eq("track_id", trackId)
    .order("code", { ascending: true });
  if (error) failApiCall("track.listOptions", error.message);
  return (data ?? []) as TrackOption[];
}
