import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ruleApi from "@/api/ruleApi";
import * as conflictApi from "@/api/ruleConflictApi";
import type { Rule, TrustLevel, CreateRuleInput, RulePatch } from "@/api/ruleApi";
import type {
  RuleConflict,
  CreateConflictInput,
  ConflictPatch,
} from "@/api/ruleConflictApi";
import { useAuth } from "@/hooks/useAuth";

/**
 * useRules —— `/schedule` 页本地态。
 *
 * 同时管 `rule` + `rule_conflict` 两张表：一处消费、一次性拉、一起重置。不挂
 * Provider 的原因同 [[useRagSources]] —— 只 /schedule 一处消费，挂 __root 会
 * 把全站绑死在登入即拉的副作用上，也违反 CLAUDE.md "不修改 routing"。
 *
 * race / re-emit 守卫沿用 [[useRagSources]] / [[useChatMessages]] 三件套：
 *   - requestIdRef：递增序号，回调比对；切账号 / 重复触发时旧响应不能覆盖新结果
 *   - loadedUserIdRef：记已经加载过的 user.id；AuthContext re-emit（token refresh）
 *     不会触发同 id 重拉
 *   - authLoading 期短路：等 auth 决定状态再拉
 *
 * 派生 view（rulesByBranch / rulesByTrust）走 useMemo，避免渲染时重算。
 *
 * 公共 API：
 *   rules / conflicts            当前用户原始数据
 *   rulesByBranch                按 branch 分组的派生 view（for 树形 UI）
 *   rulesByTrust                 按 trust 分组的派生 view（for 三列布局）
 *   ruleMap                      id → Rule 索引（冲突卡片 join 用）
 *   loading / error              IO 状态
 *   createRule / updateRule / removeRule          rule CRUD
 *   createConflict / updateConflict / removeConflict  rule_conflict CRUD
 *   refresh                      强制重拉
 */

export interface RulesByBranch {
  branch: string;
  items: Rule[];
}

interface UseRulesValue {
  rules: Rule[];
  conflicts: RuleConflict[];
  rulesByBranch: RulesByBranch[];
  rulesByTrust: Record<TrustLevel, Rule[]>;
  ruleMap: Map<string, Rule>;
  loading: boolean;
  error: string | null;
  createRule: (input: Omit<CreateRuleInput, "userId">) => Promise<Rule | null>;
  updateRule: (id: string, patch: RulePatch) => Promise<Rule | null>;
  removeRule: (id: string) => Promise<void>;
  createConflict: (
    input: Omit<CreateConflictInput, "userId">,
  ) => Promise<RuleConflict | null>;
  updateConflict: (
    id: string,
    patch: ConflictPatch,
  ) => Promise<RuleConflict | null>;
  removeConflict: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRules(): UseRulesValue {
  const { user, loading: authLoading } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [conflicts, setConflicts] = useState<RuleConflict[]>([]);
  // loading 初值 true：避免首次渲染时空列表 + "0 条规则" 闪一下，等 useEffect
  // 决定要不要拉再切回 false。
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const loadedUserIdRef = useRef<string | null>(null);

  const load = useCallback(async (userId: string) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      // 并发拉两表，加快首屏
      const [rs, cs] = await Promise.all([
        ruleApi.listRules(userId),
        conflictApi.listConflicts(userId),
      ]);
      if (reqId !== requestIdRef.current) return;
      setRules(rs);
      setConflicts(cs);
    } catch (e) {
      if (reqId !== requestIdRef.current) return;
      const msg = e instanceof Error ? e.message : "加载规则失败";
      setError(msg);
      setRules([]);
      setConflicts([]);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      requestIdRef.current++;
      loadedUserIdRef.current = null;
      setRules([]);
      setConflicts([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (loadedUserIdRef.current === user.id) return;
    loadedUserIdRef.current = user.id;
    void load(user.id);
  }, [user, authLoading, load]);

  const refresh = useCallback(async () => {
    if (!user) return;
    await load(user.id);
  }, [user, load]);

  /* ───────────────────────── rule CRUD ───────────────────────── */

  const createRule = useCallback(
    async (input: Omit<CreateRuleInput, "userId">): Promise<Rule | null> => {
      if (!user) {
        setError("请先登录后再录入规则");
        return null;
      }
      setError(null);
      try {
        const saved = await ruleApi.createRule({ userId: user.id, ...input });
        // 乐观插入；list 排序是 (branch asc, created_at desc)，新建项放对应 branch 最前
        setRules((prev) => [saved, ...prev]);
        return saved;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "新建规则失败";
        setError(msg);
        return null;
      }
    },
    [user],
  );

  const updateRule = useCallback(
    async (id: string, patch: RulePatch): Promise<Rule | null> => {
      const prev = rules;
      // 乐观本地 patch
      setRules((curr) => curr.map((r) => (r.id === id ? { ...r, ...patch } as Rule : r)));
      setError(null);
      try {
        const updated = await ruleApi.updateRule(id, patch);
        setRules((curr) => curr.map((r) => (r.id === id ? updated : r)));
        return updated;
      } catch (e) {
        setRules(prev);
        const msg = e instanceof Error ? e.message : "更新规则失败";
        setError(msg);
        return null;
      }
    },
    [rules],
  );

  const removeRule = useCallback(
    async (id: string) => {
      const prevRules = rules;
      const prevConflicts = conflicts;
      // 乐观删除：DB 上 rule_conflict 走 ON DELETE CASCADE 跟删，所以本地也要清掉
      // 引用这条 rule 的冲突
      setRules((curr) => curr.filter((r) => r.id !== id));
      setConflicts((curr) =>
        curr.filter((c) => c.rule_a_id !== id && c.rule_b_id !== id),
      );
      setError(null);
      try {
        await ruleApi.deleteRule(id);
      } catch (e) {
        setRules(prevRules);
        setConflicts(prevConflicts);
        const msg = e instanceof Error ? e.message : "删除规则失败";
        setError(msg);
        throw e;
      }
    },
    [rules, conflicts],
  );

  /* ───────────────────────── conflict CRUD ───────────────────────── */

  const createConflict = useCallback(
    async (
      input: Omit<CreateConflictInput, "userId">,
    ): Promise<RuleConflict | null> => {
      if (!user) {
        setError("请先登录后再录入冲突");
        return null;
      }
      setError(null);
      try {
        const saved = await conflictApi.createConflict({
          userId: user.id,
          ...input,
        });
        setConflicts((prev) => [saved, ...prev]);
        return saved;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "新建冲突失败";
        setError(msg);
        return null;
      }
    },
    [user],
  );

  const updateConflict = useCallback(
    async (id: string, patch: ConflictPatch): Promise<RuleConflict | null> => {
      const prev = conflicts;
      // 乐观 patch：a/b 改了的话也立刻反映（注意要 sort）
      setConflicts((curr) =>
        curr.map((c) => {
          if (c.id !== id) return c;
          const next: RuleConflict = { ...c };
          if (patch.title !== undefined) next.title = patch.title;
          if (patch.judgement !== undefined) next.judgement = patch.judgement;
          if (patch.confidence !== undefined) next.confidence = patch.confidence;
          if (patch.resolved_by !== undefined) next.resolved_by = patch.resolved_by;
          if (patch.ruleAId !== undefined && patch.ruleBId !== undefined) {
            const [aId, bId] =
              patch.ruleAId < patch.ruleBId
                ? [patch.ruleAId, patch.ruleBId]
                : [patch.ruleBId, patch.ruleAId];
            next.rule_a_id = aId;
            next.rule_b_id = bId;
          }
          return next;
        }),
      );
      setError(null);
      try {
        const updated = await conflictApi.updateConflict(id, patch);
        setConflicts((curr) => curr.map((c) => (c.id === id ? updated : c)));
        return updated;
      } catch (e) {
        setConflicts(prev);
        const msg = e instanceof Error ? e.message : "更新冲突失败";
        setError(msg);
        return null;
      }
    },
    [conflicts],
  );

  const removeConflict = useCallback(
    async (id: string) => {
      const prev = conflicts;
      setConflicts((curr) => curr.filter((c) => c.id !== id));
      setError(null);
      try {
        await conflictApi.deleteConflict(id);
      } catch (e) {
        setConflicts(prev);
        const msg = e instanceof Error ? e.message : "删除冲突失败";
        setError(msg);
        throw e;
      }
    },
    [conflicts],
  );

  /* ───────────────────────── 派生 view ───────────────────────── */

  // 按 branch 分组保序：rules 已经按 (branch asc, created_at desc) 来，
  // 这里只要顺序遍历压成 [{ branch, items }]。
  const rulesByBranch = useMemo<RulesByBranch[]>(() => {
    const map = new Map<string, Rule[]>();
    for (const r of rules) {
      const list = map.get(r.branch);
      if (list) list.push(r);
      else map.set(r.branch, [r]);
    }
    return Array.from(map, ([branch, items]) => ({ branch, items }));
  }, [rules]);

  const rulesByTrust = useMemo<Record<TrustLevel, Rule[]>>(() => {
    const out: Record<TrustLevel, Rule[]> = { high: [], med: [], low: [] };
    for (const r of rules) out[r.trust].push(r);
    return out;
  }, [rules]);

  const ruleMap = useMemo<Map<string, Rule>>(() => {
    const m = new Map<string, Rule>();
    for (const r of rules) m.set(r.id, r);
    return m;
  }, [rules]);

  return {
    rules,
    conflicts,
    rulesByBranch,
    rulesByTrust,
    ruleMap,
    loading,
    error,
    createRule,
    updateRule,
    removeRule,
    createConflict,
    updateConflict,
    removeConflict,
    refresh,
  };
}
