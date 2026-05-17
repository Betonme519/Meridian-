import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as trackApi from "@/api/trackApi";
import type { Track, TrackCategory, TrackRequirement, TrackOption } from "@/api/trackApi";
import { useAuth } from "@/hooks/useAuth";

/**
 * useTrack —— `/course-planner` 页的核心数据 hook。
 *
 * 加载流程（首次或 user 切换时）：
 *   1. `listTracks()` 取全部公共 track（数量 ≤ 几十）
 *   2. 选第一条作为「当前 track」（硬编码策略，多 track 选择器留后续）
 *   3. 并发拉该 track 的 categories + requirements + options（3 个请求并发）
 *   4. 本地 group：`requirementsByCategoryId` / `optionsByRequirementId`
 *
 * 三件套 race 守卫沿用 [[useCourses]]：
 *   - requestIdRef：递增序号，切账号 / 重复触发时旧响应不能覆盖新结果
 *   - loadedUserKeyRef：记已加载的 user.id；AuthContext re-emit 不重拉
 *   - authLoading 期短路
 *
 * 访客 / 未登录：依然能读（track_* 公共表 SELECT FOR ALL），但 useUserProgress
 * 拿不到进度 → Drawer 染色全 default。访客流先放行，UI 层判断 hide CRUD。
 */

interface UseTrackValue {
  track: Track | null;
  /** 当前 track 全部 categories（按 order_index asc） */
  categories: TrackCategory[];
  /** category_id → requirements[]（按 order_index asc） */
  requirementsByCategoryId: Map<string, TrackRequirement[]>;
  /** requirement_id → options[]（按 code asc） */
  optionsByRequirementId: Map<string, TrackOption[]>;
  /** 整 track 全部 options，给 lib/trackSimulation 计算 category 进度用 */
  allOptionsByCategoryId: Map<string, TrackOption[]>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTrack(): UseTrackValue {
  const { user: _user, loading: authLoading } = useAuth();

  const [track, setTrack] = useState<Track | null>(null);
  const [categories, setCategories] = useState<TrackCategory[]>([]);
  const [requirements, setRequirements] = useState<TrackRequirement[]>([]);
  const [options, setOptions] = useState<TrackOption[]>([]);
  // 初值 true：首屏避免空白 "找不到培养方案" 闪一下
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  // 用 user.id || 'guest' 作为 key；guest 也算一次加载，切到登录态再重拉
  const loadedKeyRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const tracks = await trackApi.listTracks();
      if (reqId !== requestIdRef.current) return;

      // 优先取 scope_level='school' 的"全校通用" track（最中性，不区分专业/学院），
      // 兜底退到 tracks[0]。多 track 选择器留排队 14 UI 重设计。
      const first = tracks.find((tr) => tr.scope_level === "school") ?? tracks[0] ?? null;
      if (!first) {
        // 公共表空 → 引导文案在 UI 层判断 track==null
        setTrack(null);
        setCategories([]);
        setRequirements([]);
        setOptions([]);
        return;
      }

      // 并发拉三表，加快首屏
      const [cats, reqs, opts] = await Promise.all([
        trackApi.listCategoriesByTrack(first.id),
        trackApi.listRequirementsByTrack(first.id),
        trackApi.listOptionsByTrack(first.id),
      ]);
      if (reqId !== requestIdRef.current) return;

      setTrack(first);
      setCategories(cats);
      setRequirements(reqs);
      setOptions(opts);
    } catch (e) {
      if (reqId !== requestIdRef.current) return;
      const msg = e instanceof Error ? e.message : "加载培养方案失败";
      setError(msg);
      setTrack(null);
      setCategories([]);
      setRequirements([]);
      setOptions([]);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const key = _user?.id ?? "guest";
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    void load();
  }, [_user, authLoading, load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  /* ───────────────────────── 派生 view ───────────────────────── */

  const requirementsByCategoryId = useMemo<Map<string, TrackRequirement[]>>(() => {
    const m = new Map<string, TrackRequirement[]>();
    for (const r of requirements) {
      const list = m.get(r.category_id);
      if (list) list.push(r);
      else m.set(r.category_id, [r]);
    }
    return m;
  }, [requirements]);

  const optionsByRequirementId = useMemo<Map<string, TrackOption[]>>(() => {
    const m = new Map<string, TrackOption[]>();
    for (const o of options) {
      const list = m.get(o.requirement_id);
      if (list) list.push(o);
      else m.set(o.requirement_id, [o]);
    }
    return m;
  }, [options]);

  // category_id → 该 category 下全部 option（不区分 requirement，跨 req 合并）
  // simulatePick 计算 category 进度时用。
  const allOptionsByCategoryId = useMemo<Map<string, TrackOption[]>>(() => {
    // 先建 requirement_id → category_id 索引，避免 O(n*m)
    const reqToCat = new Map<string, string>();
    for (const r of requirements) reqToCat.set(r.id, r.category_id);

    const m = new Map<string, TrackOption[]>();
    for (const o of options) {
      const catId = reqToCat.get(o.requirement_id);
      if (!catId) continue;
      const list = m.get(catId);
      if (list) list.push(o);
      else m.set(catId, [o]);
    }
    return m;
  }, [options, requirements]);

  return {
    track,
    categories,
    requirementsByCategoryId,
    optionsByRequirementId,
    allOptionsByCategoryId,
    loading,
    error,
    refresh,
  };
}
