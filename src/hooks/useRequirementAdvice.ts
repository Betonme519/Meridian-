import { useEffect, useMemo, useRef, useState } from "react";
import * as adviceApi from "@/api/requirementAdviceApi";
import type {
  RequirementAdvice,
  RequirementLink,
  LinkKind,
} from "@/api/requirementAdviceApi";
import type { GoalMode } from "@/api/profileApi";

/**
 * useRequirementAdvice —— 排队 13.5 静态路径库读取。
 *
 * 输入 (goalMode, requirementIds[]) → 输出 (adviceByReqId, linksByReqId, loading, error)。
 *
 * race 守卫：requestIdRef + key 比对（同 key 不重拉）；切 goal_mode / 切 req 列表
 * 都触发新请求，旧响应丢弃。
 *
 * 派生 view：
 *   - adviceByReqId   Map<reqId, Advice> 索引（O(1) 命中，给单卡 reason 用）
 *   - linksFromReqId  Map<reqId, Link[]>（"这条 req 指向哪些"）
 *   - linksToReqId    Map<reqId, Link[]>（"哪些 req 指向这条"）
 *   - linksByReqId    合并视图："这条 req 涉及的所有 link"（双向 link 两边都现）
 *
 * 调用方：Planner / EvidencePanel / ImpactPanel 直接 import 用，签名稳定。
 */

interface UseRequirementAdviceValue {
  advice: RequirementAdvice[];
  adviceByReqId: Map<string, RequirementAdvice>;
  links: RequirementLink[];
  linksFromReqId: Map<string, RequirementLink[]>;
  linksToReqId: Map<string, RequirementLink[]>;
  linksByReqId: Map<string, RequirementLink[]>;
  loading: boolean;
  error: string | null;
}

const EMPTY: UseRequirementAdviceValue = {
  advice: [],
  adviceByReqId: new Map(),
  links: [],
  linksFromReqId: new Map(),
  linksToReqId: new Map(),
  linksByReqId: new Map(),
  loading: false,
  error: null,
};

export function useRequirementAdvice(
  goalMode: GoalMode | null,
  requirementIds: string[],
): UseRequirementAdviceValue {
  const [advice, setAdvice] = useState<RequirementAdvice[]>([]);
  const [links, setLinks] = useState<RequirementLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  // 稳定 key：goalMode + 排序去重 req ids；同 key 不重拉
  const cacheKey = useMemo(() => {
    if (!goalMode || requirementIds.length === 0) return "";
    const sorted = Array.from(new Set(requirementIds)).sort();
    return `${goalMode}:${sorted.join(",")}`;
  }, [goalMode, requirementIds]);

  useEffect(() => {
    if (!cacheKey || !goalMode) {
      setAdvice([]);
      setLinks([]);
      setLoading(false);
      setError(null);
      return;
    }
    const reqId = ++requestIdRef.current;
    const ids = Array.from(new Set(requirementIds));
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [adviceRows, linkRows] = await Promise.all([
          adviceApi.listAdvice(goalMode, ids),
          adviceApi.listLinksForRequirements(ids),
        ]);
        if (reqId !== requestIdRef.current) return;
        setAdvice(adviceRows);
        setLinks(linkRows);
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        const msg = e instanceof Error ? e.message : "加载 requirement advice 失败";
        setError(msg);
        setAdvice([]);
        setLinks([]);
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    })();
    // requirementIds 通过 cacheKey 间接监听，cacheKey 不变就不重拉
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, goalMode]);

  // 派生 view
  const adviceByReqId = useMemo(() => {
    const m = new Map<string, RequirementAdvice>();
    for (const a of advice) m.set(a.requirement_id, a);
    return m;
  }, [advice]);

  const linksFromReqId = useMemo(() => {
    const m = new Map<string, RequirementLink[]>();
    for (const l of links) {
      const arr = m.get(l.from_req) ?? [];
      arr.push(l);
      m.set(l.from_req, arr);
    }
    return m;
  }, [links]);

  const linksToReqId = useMemo(() => {
    const m = new Map<string, RequirementLink[]>();
    for (const l of links) {
      const arr = m.get(l.to_req) ?? [];
      arr.push(l);
      m.set(l.to_req, arr);
    }
    return m;
  }, [links]);

  // linksByReqId：单条 req 涉及的所有 link（from / to 任一命中 + bidirectional 对称展开）
  const linksByReqId = useMemo(() => {
    const m = new Map<string, RequirementLink[]>();
    for (const l of links) {
      const fromArr = m.get(l.from_req) ?? [];
      fromArr.push(l);
      m.set(l.from_req, fromArr);
      // bidirectional link 在 to 侧也展开（视为 from 侧；UI 渲染时可按方向显示）
      if (l.bidirectional || l.from_req !== l.to_req) {
        const toArr = m.get(l.to_req) ?? [];
        toArr.push(l);
        m.set(l.to_req, toArr);
      }
    }
    return m;
  }, [links]);

  // 空 goalMode 或 空 ids 时短路返常量 EMPTY，避免 caller 每次拿新 Map 触发下游 useMemo
  if (!cacheKey) return EMPTY;

  return {
    advice,
    adviceByReqId,
    links,
    linksFromReqId,
    linksToReqId,
    linksByReqId,
    loading,
    error,
  };
}

/** Link kind 中文标签（UI 显示用） */
export const LINK_KIND_LABELS: Record<LinkKind, string> = {
  substitute: "可替代",
  prerequisite: "前置",
  excludes: "互斥",
  cross_ref: "关联",
  triggers: "触发",
};
