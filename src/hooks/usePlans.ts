import { useCallback, useEffect, useRef, useState } from "react";
import type { Edge, Node, Viewport } from "@xyflow/react";
import * as planApi from "@/api/planApi";
import type { Plan } from "@/api/planApi";
import { useAuth } from "@/hooks/useAuth";
import {
  SEED_EDGES,
  SEED_MERIDIAN_NODES,
} from "@/pages/Planner/seedGraph";

/**
 * usePlans —— /course-planner 页本地态。
 *
 * 跟 useRagSources 同款"requestIdRef + loadedUserIdRef + auth-loading 短路"三件套，
 * 多加两件事：
 *   1. 当前 plan 概念：`selectPlan(id)` → 拉详情进 `current`；切换时 flush debounce
 *   2. Debounce 自动保存：`saveGraph(graph)` 不立刻发请求，800ms 内的连续编辑
 *      会合并成一次 UPDATE；切 plan / 卸载 / 登出 时立即 flush。
 *
 * 空态自动建：拉完列表如果用户一张 plan 都没有，自动 INSERT 一张
 * 「我的第一张规划」并 seed 进示例 nodes/edges，避免首次进入看到空画布。
 *
 * 公共 API：
 *   plans, current, loading, loadingCurrent, saving, error
 *   selectPlan(id)              切换当前 plan（id 不存在则 current 置 null）
 *   createPlan(opts?)           新建 plan；返回新行，由调用方负责 select + 同步 URL
 *   rename(id, name)            重命名（先打 API 再合并到本地）
 *   saveGraph({nodes,edges,viewport})  乐观更新本地 + 触发 debounce save
 */

const DEBOUNCE_MS = 800;

export type GraphPatch = {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport | null;
};

interface UsePlansValue {
  plans: Plan[];
  current: Plan | null;
  loading: boolean;
  loadingCurrent: boolean;
  saving: boolean;
  error: string | null;
  selectPlan: (id: string | null) => void;
  createPlan: (opts?: {
    name?: string;
    nodes?: Node[];
    edges?: Edge[];
  }) => Promise<Plan | null>;
  rename: (id: string, name: string) => Promise<void>;
  /**
   * 硬删一行。返回删完后**应当显示**的 currentId：
   *  - 删非当前 plan：返回原 currentId 不变
   *  - 删当前 plan：返回下一张（按 updated_at 序）；列表空了返回 null，
   *    并触发空态自动建（hook 内部跑），但不等它，让调用方先 navigate 让 URL 解耦
   *
   * 调用方负责 navigate 更新 URL（hook 不耦合路由）。
   */
  remove: (id: string) => Promise<{ nextCurrentId: string | null }>;
  saveGraph: (patch: GraphPatch) => void;
}

export function usePlans(): UsePlansValue {
  const { user, loading: authLoading } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  // loading 初值 true：避免首次渲染时 plans=[] + 自动建逻辑判 0 误触发。
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [current, setCurrent] = useState<Plan | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [saving, setSaving] = useState(false);

  // race 守卫：list / current 各自一份，互不干扰
  const listReqIdRef = useRef(0);
  const currentReqIdRef = useRef(0);
  // 防 AuthContext re-emit（token refresh）触发同 user.id 重拉
  const loadedUserIdRef = useRef<string | null>(null);

  // debounce save：timer + 最新 patch（flush 时用）+ 目标 planId
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<GraphPatch | null>(null);
  const pendingPlanIdRef = useRef<string | null>(null);

  /**
   * 「画布上现在挂着哪张 plan」—— 镜像 current?.id，给 saveGraph 用。
   *
   * 为啥不直接用 selectedId：selectedId 在 selectPlan 开头就被 set 成新 id，
   * 但 current（实际数据）要等 getPlan 异步回来。两者之间有几十 ms 的窗口，
   * 此时 nodes/edges 还是旧 plan 的内容；如果 saveGraph 用 selectedId 给 patch
   * 盖戳，就会把"旧数据 + 新 id"丢给 flushSave，**最终把新 plan 写成旧 plan 内容**。
   *
   * 解法：用 ref 锁住「current 已经落地的那张 plan 的 id」。saveGraph 不再依赖
   * selectedId，回调引用稳定，save-watcher effect 也不会因为 selectedId 变化被
   * 触发重跑（那一拍跑的话也会用 stale 数据写错）。
   */
  const activePlanIdRef = useRef<string | null>(null);
  useEffect(() => {
    activePlanIdRef.current = current?.id ?? null;
  }, [current?.id]);

  /**
   * 把 pending patch 立刻发出去；timer 清理。
   * 调用时机：切 plan 前、卸载、登出、明确 flush。
   */
  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const patch = pendingPatchRef.current;
    const planId = pendingPlanIdRef.current;
    pendingPatchRef.current = null;
    pendingPlanIdRef.current = null;
    if (!patch || !planId) return;

    setSaving(true);
    try {
      await planApi.updatePlanGraph(planId, patch);
      // 把列表里那一行的 updated_at 往前挪一下（重排序列表）；轻量近似不抓新值
      setPlans((prev) => {
        const idx = prev.findIndex((p) => p.id === planId);
        if (idx < 0) return prev;
        const row = { ...prev[idx], updated_at: new Date().toISOString() };
        return [row, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "保存失败";
      setError(msg);
      // 不 revert —— 用户在 debounce 窗口内可能已经又改了 N 次，
      // revert 会把后续编辑擦掉。错误提示给用户看就行。
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * 拉列表 + 空态自动建。reqId 守 race（快速切账号时旧响应不要覆盖新结果）。
   */
  const loadList = useCallback(async (userId: string) => {
    const reqId = ++listReqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      let rows = await planApi.listPlans(userId);
      if (reqId !== listReqIdRef.current) return;

      // 空态：自动建一张默认 plan（用 seed 数据，避免首次见到空画布）
      if (rows.length === 0) {
        const seeded = await planApi.createPlan({
          userId,
          name: "我的第一张规划",
          nodes: SEED_MERIDIAN_NODES,
          edges: SEED_EDGES,
        });
        if (reqId !== listReqIdRef.current) return;
        rows = [seeded];
      }
      setPlans(rows);
    } catch (e) {
      if (reqId !== listReqIdRef.current) return;
      const msg = e instanceof Error ? e.message : "加载规划列表失败";
      setError(msg);
      setPlans([]);
    } finally {
      if (reqId === listReqIdRef.current) setLoading(false);
    }
  }, []);

  // 登入 → 拉列表；登出 → 全清。user 对象引用变化但 id 未变时不重拉。
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // 登出：flush pending save 避免漏写
      void flushSave();
      listReqIdRef.current++;
      currentReqIdRef.current++;
      loadedUserIdRef.current = null;
      setPlans([]);
      setCurrent(null);
      setSelectedId(null);
      setLoading(false);
      setError(null);
      return;
    }
    if (loadedUserIdRef.current === user.id) return;
    loadedUserIdRef.current = user.id;
    void loadList(user.id);
  }, [user, authLoading, loadList, flushSave]);

  /**
   * 切换当前 plan。
   *  - 同一 id 不重拉
   *  - 切换前 flush 上一张的 pending save
   *  - id = null 时清 current
   */
  const selectPlan = useCallback(
    (id: string | null) => {
      if (id === selectedId) return;
      // 切走前确保上一张保存完
      void flushSave();
      setSelectedId(id);
      if (!id) {
        setCurrent(null);
        return;
      }
      const reqId = ++currentReqIdRef.current;
      setLoadingCurrent(true);
      void (async () => {
        try {
          const plan = await planApi.getPlan(id);
          if (reqId !== currentReqIdRef.current) return;
          setCurrent(plan);
          if (!plan) {
            setError("规划不存在或无权限访问");
          }
        } catch (e) {
          if (reqId !== currentReqIdRef.current) return;
          const msg = e instanceof Error ? e.message : "加载规划失败";
          setError(msg);
          setCurrent(null);
        } finally {
          if (reqId === currentReqIdRef.current) setLoadingCurrent(false);
        }
      })();
    },
    [selectedId, flushSave],
  );

  const createPlan = useCallback(
    async (opts?: {
      name?: string;
      nodes?: Node[];
      edges?: Edge[];
    }): Promise<Plan | null> => {
      if (!user) {
        setError("请先登录后再新建规划");
        return null;
      }
      setError(null);
      try {
        const created = await planApi.createPlan({
          userId: user.id,
          ...opts,
        });
        // 乐观插入：新行排最前
        setPlans((prev) => [created, ...prev]);
        return created;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "新建失败";
        setError(msg);
        return null;
      }
    },
    [user],
  );

  const remove = useCallback(
    async (id: string): Promise<{ nextCurrentId: string | null }> => {
      setError(null);
      const wasCurrent = selectedId === id;
      const prevPlans = plans;

      // 取消指向这张 plan 的 pending save —— 不然 DELETE 后 timer 还会 UPDATE
      // 死行（虽然 RLS + 0 rows affected 不会爆，但 saving 指示器会假飘"保存中"）。
      if (pendingPlanIdRef.current === id) {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        pendingPatchRef.current = null;
        pendingPlanIdRef.current = null;
      }

      // 乐观删本地（失败再回滚）
      const nextPlans = prevPlans.filter((p) => p.id !== id);
      setPlans(nextPlans);

      try {
        await planApi.deletePlan(id);
      } catch (e) {
        // 失败回滚
        setPlans(prevPlans);
        const msg = e instanceof Error ? e.message : "删除失败";
        setError(msg);
        throw e;
      }

      // 删的是当前 plan：决定下一张
      if (wasCurrent) {
        if (nextPlans.length > 0) {
          const next = nextPlans[0];
          // 把内部 selectedId / current 也切过去；调用方 navigate URL
          // 这里直接置位，不走 selectPlan（避免重新 fetch — 列表里就是新鲜的）
          setSelectedId(next.id);
          // 拉详情。复用同一个 reqId 通道防 race。
          const reqId = ++currentReqIdRef.current;
          setLoadingCurrent(true);
          void (async () => {
            try {
              const plan = await planApi.getPlan(next.id);
              if (reqId !== currentReqIdRef.current) return;
              setCurrent(plan);
            } catch {
              if (reqId !== currentReqIdRef.current) return;
              setCurrent(null);
            } finally {
              if (reqId === currentReqIdRef.current) setLoadingCurrent(false);
            }
          })();
          return { nextCurrentId: next.id };
        }
        // 删空了：清当前 + 触发空态自动建（异步，不等）
        setSelectedId(null);
        setCurrent(null);
        if (user) {
          void (async () => {
            const seeded = await planApi.createPlan({
              userId: user.id,
              name: "我的第一张规划",
              nodes: SEED_MERIDIAN_NODES,
              edges: SEED_EDGES,
            });
            setPlans([seeded]);
            setSelectedId(seeded.id);
            setCurrent(seeded);
            // 注意：调用方此时已 navigate 到 undefined id；
            // page 的 fallback 逻辑会侦测到 plans.length > 0 + urlId=undefined
            // 然后自动 navigate 到这张新建的 id。
          })();
        }
        return { nextCurrentId: null };
      }

      // 删的不是当前：current 不变
      return { nextCurrentId: selectedId };
    },
    [selectedId, plans, user],
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      setError(null);
      const trimmed = name.trim();
      if (!trimmed) {
        setError("规划名不能为空");
        return;
      }
      try {
        await planApi.renamePlan(id, trimmed);
        setPlans((prev) =>
          prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
        );
        setCurrent((prev) =>
          prev && prev.id === id ? { ...prev, name: trimmed } : prev,
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "重命名失败";
        setError(msg);
        throw e;
      }
    },
    [],
  );

  /**
   * 乐观本地写 + debounce 远端写。
   * - 立刻把 current.nodes/edges/viewport 替换成新值（UI 即时响应）
   * - 800ms 内的连续 saveGraph 合并成最后一次 UPDATE
   * - 切 plan / 卸载 时 flush（见 selectPlan / cleanup effect）
   * - 用 activePlanIdRef 而非 selectedId 给 patch 盖戳（见 ref 注释），
   *   回调依赖只剩 flushSave（稳定），save-watcher 不会被切 plan 误触发
   */
  const saveGraph = useCallback(
    (patch: GraphPatch) => {
      const id = activePlanIdRef.current;
      if (!id) return;

      // 本地乐观更新（只更"画布对得上"的那一张）
      setCurrent((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              nodes: patch.nodes,
              edges: patch.edges,
              viewport: patch.viewport,
            }
          : prev,
      );

      pendingPatchRef.current = patch;
      pendingPlanIdRef.current = id;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void flushSave();
      }, DEBOUNCE_MS);
    },
    [flushSave],
  );

  // 卸载时 flush，避免最后一次编辑漏写
  useEffect(() => {
    return () => {
      void flushSave();
    };
  }, [flushSave]);

  return {
    plans,
    current,
    loading,
    loadingCurrent,
    saving,
    error,
    selectPlan,
    createPlan,
    rename,
    remove,
    saveGraph,
  };
}
