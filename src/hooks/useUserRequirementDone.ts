import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as api from "@/api/userRequirementDoneApi";
import type { UserRequirementDone } from "@/api/userRequirementDoneApi";
import { useAuth } from "@/hooks/useAuth";

/**
 * useUserRequirementDone —— 反向勾选式进度收集 hook（排队 12.5 sub-task 0）
 *
 * 语义：表里存的是用户**未完成**的 requirement 行。
 *   - `incompleteReqIds` Set —— 「这个 req 还没做」
 *   - 空 Set = 全部完成
 *
 * 派生 view：
 *   - `isReqIncomplete(reqId)`  → boolean，给画布 / Import 单 req 判定
 *   - `incompleteReqIds`        → Set<reqId>，给 Planner isUnmet 整合
 *
 * 三件套 race 守卫（沿用 useCourses）：
 *   - requestIdRef + loadedUserIdRef + authLoading 短路
 *
 * 公共 API：
 *   - mark / unmark / toggle           乐观更新本地，DB 失败回滚
 *   - batchSet(reqIds)                 一次性把"未完成集合"对齐到 reqIds（保存按钮用）
 *   - refresh                          强拉
 *   - loading / error                  IO 状态
 */

interface UseUserRequirementDoneValue {
  incompleteRows: UserRequirementDone[];
  incompleteReqIds: Set<string>;
  isReqIncomplete: (reqId: string) => boolean;
  loading: boolean;
  error: string | null;
  mark: (reqId: string, note?: string) => Promise<void>;
  unmark: (reqId: string) => Promise<void>;
  toggle: (reqId: string) => Promise<void>;
  batchSet: (reqIds: string[]) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUserRequirementDone(): UseUserRequirementDoneValue {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<UserRequirementDone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const loadedUserIdRef = useRef<string | null>(null);

  const load = useCallback(async (userId: string) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listIncomplete(userId);
      if (reqId !== requestIdRef.current) return;
      setRows(data);
    } catch (e) {
      if (reqId !== requestIdRef.current) return;
      const msg = e instanceof Error ? e.message : "加载未完成 requirement 失败";
      setError(msg);
      setRows([]);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      requestIdRef.current++;
      loadedUserIdRef.current = null;
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (loadedUserIdRef.current === user.id) return;
    loadedUserIdRef.current = user.id;
    void load(user.id);
  }, [user, authLoading, load]);

  const incompleteReqIds = useMemo(
    () => new Set(rows.map((r) => r.requirement_id)),
    [rows],
  );

  const isReqIncomplete = useCallback(
    (rid: string) => incompleteReqIds.has(rid),
    [incompleteReqIds],
  );

  // 乐观更新：本地立刻反应，DB 失败回滚
  const mark = useCallback(
    async (rid: string, note?: string) => {
      if (!user) return;
      const prev = rows;
      // 乐观插入一行假数据，DB 回填后用真实 created_at 替换
      const optimistic: UserRequirementDone = {
        id: `optimistic-${rid}`,
        user_id: user.id,
        requirement_id: rid,
        note: note ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setRows((rs) => (rs.some((r) => r.requirement_id === rid) ? rs : [optimistic, ...rs]));
      try {
        const created = await api.markIncomplete(user.id, rid, note);
        if (created) {
          setRows((rs) =>
            rs.map((r) => (r.requirement_id === rid ? created : r)),
          );
        }
      } catch (e) {
        setRows(prev);
        setError(e instanceof Error ? e.message : "标记失败");
      }
    },
    [user, rows],
  );

  const unmark = useCallback(
    async (rid: string) => {
      if (!user) return;
      const prev = rows;
      setRows((rs) => rs.filter((r) => r.requirement_id !== rid));
      try {
        await api.unmarkIncomplete(user.id, rid);
      } catch (e) {
        setRows(prev);
        setError(e instanceof Error ? e.message : "取消标记失败");
      }
    },
    [user, rows],
  );

  const toggle = useCallback(
    async (rid: string) => {
      if (incompleteReqIds.has(rid)) await unmark(rid);
      else await mark(rid);
    },
    [incompleteReqIds, mark, unmark],
  );

  const batchSet = useCallback(
    async (targetReqIds: string[]) => {
      if (!user) return;
      const prev = rows;
      // 乐观：把本地状态对齐到 target
      const targetSet = new Set(targetReqIds);
      const merged = prev.filter((r) => targetSet.has(r.requirement_id));
      const existingIds = new Set(merged.map((r) => r.requirement_id));
      const now = new Date().toISOString();
      for (const rid of targetReqIds) {
        if (!existingIds.has(rid)) {
          merged.push({
            id: `optimistic-${rid}`,
            user_id: user.id,
            requirement_id: rid,
            note: null,
            created_at: now,
            updated_at: now,
          });
        }
      }
      setRows(merged);
      try {
        await api.batchSetIncomplete(user.id, targetReqIds);
        // 同步成功后重拉确保 created_at / id 真实
        await load(user.id);
      } catch (e) {
        setRows(prev);
        setError(e instanceof Error ? e.message : "批量保存失败");
      }
    },
    [user, rows, load],
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    await load(user.id);
  }, [user, load]);

  return {
    incompleteRows: rows,
    incompleteReqIds,
    isReqIncomplete,
    loading,
    error,
    mark,
    unmark,
    toggle,
    batchSet,
    refresh,
  };
}
