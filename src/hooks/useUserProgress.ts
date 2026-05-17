import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as progressApi from "@/api/userProgressApi";
import type { UserProgress, UpsertUserProgressInput } from "@/api/userProgressApi";
import { useAuth } from "@/hooks/useAuth";

/**
 * useUserProgress —— 用户在当前 track 上的进度本地态。
 *
 * 三件套 race 守卫沿用 [[useCourses]] / [[useTrack]]：
 *   - requestIdRef：递增序号；切账号 / 切 track 时旧响应作废
 *   - loadedKeyRef：记已加载的 `${user.id}|${trackId}`；同 key 不重拉
 *   - authLoading 期短路；trackId=null 期也短路（等 useTrack 出值）
 *
 * 乐观 CRUD：upsert / remove 先改本地，再调 API；失败回滚 + setError。
 *
 * 派生 view：
 *   - progressByOptionId       option_id → UserProgress
 *   - doneOptionIds            status IN ('done','waived') 的 option_id 集合
 *   - enrolledOptionIds        status='enrolled'
 *   - droppedOptionIds         status='dropped'（"已移出候选"也走这档）
 */

interface UseUserProgressValue {
  progress: UserProgress[];
  progressByOptionId: Map<string, UserProgress>;
  doneOptionIds: Set<string>;
  enrolledOptionIds: Set<string>;
  droppedOptionIds: Set<string>;
  loading: boolean;
  error: string | null;
  /**
   * 单条 upsert。`patch` 只需要传想改的字段；其余字段从现行 row 派生避免被
   * PostgREST upsert 整行覆盖（参见 [[userProgressApi]] upsertUserProgress 的设计说明）。
   */
  upsertProgress: (
    optionId: string,
    patch: Omit<Partial<UpsertUserProgressInput>, "userId" | "trackId" | "optionId">,
  ) => Promise<UserProgress | null>;
  removeProgress: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUserProgress(trackId: string | null): UseUserProgressValue {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const loadedKeyRef = useRef<string | null>(null);

  const load = useCallback(async (userId: string, tid: string) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const rows = await progressApi.listUserProgress(userId, tid);
      if (reqId !== requestIdRef.current) return;
      setProgress(rows);
    } catch (e) {
      if (reqId !== requestIdRef.current) return;
      const msg = e instanceof Error ? e.message : "加载进度失败";
      setError(msg);
      setProgress([]);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    // 没登录 或 没选 track → 空数组，不发请求
    if (!user || !trackId) {
      requestIdRef.current++;
      loadedKeyRef.current = null;
      setProgress([]);
      setLoading(false);
      setError(null);
      return;
    }
    const key = `${user.id}|${trackId}`;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    void load(user.id, trackId);
  }, [user, authLoading, trackId, load]);

  const refresh = useCallback(async () => {
    if (!user || !trackId) return;
    await load(user.id, trackId);
  }, [user, trackId, load]);

  /* ───────────────────────── CRUD ───────────────────────── */

  const upsertProgress = useCallback(
    async (
      optionId: string,
      patch: Omit<Partial<UpsertUserProgressInput>, "userId" | "trackId" | "optionId">,
    ): Promise<UserProgress | null> => {
      if (!user || !trackId) {
        setError("请先登录后再标注进度");
        return null;
      }

      // merge: 拿现行 row 补齐"不想清空"的字段
      const existing = progress.find((p) => p.option_id === optionId);
      const merged: UpsertUserProgressInput = {
        userId: user.id,
        trackId,
        optionId,
        status: patch.status ?? existing?.status ?? "planned",
        grade: patch.grade !== undefined ? patch.grade : (existing?.grade ?? null),
        semester: patch.semester !== undefined ? patch.semester : (existing?.semester ?? null),
        note: patch.note !== undefined ? patch.note : (existing?.note ?? null),
      };

      // 乐观本地写：existing 在 → replace；不在 → 头插临时行（id 用 'optimistic-{optionId}'）
      const prev = progress;
      const tempRow: UserProgress = {
        id: existing?.id ?? `optimistic-${optionId}`,
        user_id: user.id,
        track_id: trackId,
        option_id: optionId,
        status: merged.status ?? "planned",
        grade: merged.grade ?? null,
        semester: merged.semester ?? null,
        note: merged.note ?? null,
        created_at: existing?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProgress((curr) => {
        if (existing) return curr.map((p) => (p.id === existing.id ? tempRow : p));
        return [tempRow, ...curr];
      });
      setError(null);

      try {
        const saved = await progressApi.upsertUserProgress(merged);
        // 真值回填，把 optimistic id 替换成 DB id
        setProgress((curr) => {
          const idx = curr.findIndex((p) => p.option_id === optionId);
          if (idx < 0) return [saved, ...curr];
          const next = curr.slice();
          next[idx] = saved;
          return next;
        });
        return saved;
      } catch (e) {
        setProgress(prev);
        const msg = e instanceof Error ? e.message : "保存进度失败";
        setError(msg);
        return null;
      }
    },
    [user, trackId, progress],
  );

  const removeProgress = useCallback(
    async (id: string) => {
      const prev = progress;
      setProgress((curr) => curr.filter((p) => p.id !== id));
      setError(null);
      try {
        await progressApi.deleteUserProgress(id);
      } catch (e) {
        setProgress(prev);
        const msg = e instanceof Error ? e.message : "删除进度失败";
        setError(msg);
        throw e;
      }
    },
    [progress],
  );

  /* ───────────────────────── 派生 view ───────────────────────── */

  const progressByOptionId = useMemo<Map<string, UserProgress>>(() => {
    const m = new Map<string, UserProgress>();
    for (const p of progress) m.set(p.option_id, p);
    return m;
  }, [progress]);

  const doneOptionIds = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    for (const p of progress) if (p.status === "done" || p.status === "waived") s.add(p.option_id);
    return s;
  }, [progress]);

  const enrolledOptionIds = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    for (const p of progress) if (p.status === "enrolled") s.add(p.option_id);
    return s;
  }, [progress]);

  const droppedOptionIds = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    for (const p of progress) if (p.status === "dropped") s.add(p.option_id);
    return s;
  }, [progress]);

  return {
    progress,
    progressByOptionId,
    doneOptionIds,
    enrolledOptionIds,
    droppedOptionIds,
    loading,
    error,
    upsertProgress,
    removeProgress,
    refresh,
  };
}
