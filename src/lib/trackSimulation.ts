/**
 * Track 决策模拟工具 —— 纯客户端，无 React / supabase 依赖。
 *
 * 排队 12 提供两个原子：
 *  - `pickRecommendedOption`  启发式占位：选哪个 option "看上去最该先做"
 *  - `simulatePick`           模拟"假设选了这个 option 后"的三项 delta
 *
 * 这两个原子在排队 13 接 AI 后会被替换 / 增强：
 *  - 推荐：改成 AI 输出（`PathSuggestion` zod schema）
 *  - 模拟：扩展 prerequisite 传播 + 多步路径模拟
 *
 * 当前推荐启发式：
 *   1. 未达成（status 不在 done/waived）的 option 优先
 *   2. kind='course' 优先于 alt/project
 *   3. credits 升序（先做学分小的快速积累完成感）
 *   4. tiebreak：option.code 字典序
 */

import type { TrackRequirement, TrackOption, TrackCategory } from "@/api/trackApi";
import type { UserProgress } from "@/api/userProgressApi";

/**
 * 该 requirement 当前完成度（用于排队 12 Drawer 头部 "X/Y 完成" 文案）。
 * - kind='count'/'one_of'/'all_of' → 计 done options 数 vs threshold（all_of 时
 *   threshold 视作 options 总数）
 * - kind='credits'                 → 计 done options credits 之和 vs threshold
 * - 学校规则类（time_limit/gpa_threshold/...）→ 没"完成"概念，返 null
 */
export function calcRequirementProgress(
  req: TrackRequirement,
  optionsInReq: TrackOption[],
  progressByOptionId: Map<string, UserProgress>,
): { current: number; target: number | null; unit: "门" | "学分" | null } | null {
  const doneSet = new Set<string>();
  for (const o of optionsInReq) {
    const p = progressByOptionId.get(o.id);
    if (p && (p.status === "done" || p.status === "waived")) doneSet.add(o.id);
  }

  switch (req.kind) {
    case "count":
    case "one_of": {
      return {
        current: doneSet.size,
        target: req.threshold ?? null,
        unit: "门",
      };
    }
    case "all_of": {
      return {
        current: doneSet.size,
        target: optionsInReq.length,
        unit: "门",
      };
    }
    case "credits": {
      let sum = 0;
      for (const o of optionsInReq) {
        if (doneSet.has(o.id)) sum += o.credits ?? 0;
      }
      return {
        current: sum,
        target: req.threshold ?? null,
        unit: "学分",
      };
    }
    default:
      // 学校规则类无"完成度"概念
      return null;
  }
}

/**
 * 当前 category 累计学分（done + waived 的 options.credits 求和）。
 */
export function calcCategoryCredits(
  optionsInCategory: TrackOption[],
  progressByOptionId: Map<string, UserProgress>,
): number {
  let sum = 0;
  for (const o of optionsInCategory) {
    const p = progressByOptionId.get(o.id);
    if (p && (p.status === "done" || p.status === "waived")) {
      sum += o.credits ?? 0;
    }
  }
  return sum;
}

/**
 * 推荐占位：从 options 中挑一个"看上去最该先做"的。
 *
 * 返回 null 的条件：
 *  - options 空
 *  - requirement 已达成（current ≥ target）→ 不推荐
 *  - 全部 options 都已 done/waived/dropped → 无候选
 *
 * 排队 13 接 AI 后替换为 AI 输出。
 */
export function pickRecommendedOption(
  req: TrackRequirement,
  optionsInReq: TrackOption[],
  progressByOptionId: Map<string, UserProgress>,
): TrackOption | null {
  if (optionsInReq.length === 0) return null;

  // 已达成的 requirement 不再推荐
  const progress = calcRequirementProgress(req, optionsInReq, progressByOptionId);
  if (progress && progress.target != null && progress.current >= progress.target) {
    return null;
  }

  // 过滤掉已 done/waived/dropped 的 option
  const candidates = optionsInReq.filter((o) => {
    const p = progressByOptionId.get(o.id);
    if (!p) return true;
    return p.status === "planned" || p.status === "enrolled";
  });
  if (candidates.length === 0) return null;

  // 排序：course 优先 / credits 升序 / code 字典序
  const sorted = candidates.slice().sort((a, b) => {
    if (a.kind !== b.kind) {
      if (a.kind === "course") return -1;
      if (b.kind === "course") return 1;
    }
    const ac = a.credits ?? Number.POSITIVE_INFINITY;
    const bc = b.credits ?? Number.POSITIVE_INFINITY;
    if (ac !== bc) return ac - bc;
    return a.code.localeCompare(b.code);
  });

  return sorted[0] ?? null;
}

/**
 * 模拟"假设选了这个 option 并 status='done' 后"的三项 delta。
 *
 * 纯函数，不写 DB。返回的"after" 值用于 Drawer "模拟"段展示。
 *
 * 不做：
 *  - prerequisite 传播（依赖图分析属于排队 13 / AI 任务）
 *  - 跨 category 影响（仅算本 req + 本 category）
 *  - GPA 模拟（grade 没填的情况下没法算）
 */
export interface SimulationResult {
  /** 该 option 带来的学分（option.credits ?? 0） */
  creditsDelta: number;
  /** 本 requirement 进度变化 */
  reqProgress: {
    before: number;
    after: number;
    target: number | null;
    unit: "门" | "学分" | null;
  } | null;
  /** 本 category 累计学分变化 */
  categoryProgress: {
    beforeCredits: number;
    afterCredits: number;
    target: number | null;
  };
}

export function simulatePick(
  option: TrackOption,
  req: TrackRequirement,
  category: TrackCategory,
  allOptionsInReq: TrackOption[],
  allOptionsInCategory: TrackOption[],
  progressByOptionId: Map<string, UserProgress>,
): SimulationResult {
  const creditsDelta = option.credits ?? 0;

  // 构造"假设 option done 后"的虚拟 progress map
  const after = new Map(progressByOptionId);
  const fakeRow: UserProgress = {
    id: `sim-${option.id}`,
    user_id: "",
    track_id: option.track_id,
    option_id: option.id,
    status: "done",
    grade: null,
    semester: null,
    note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  after.set(option.id, fakeRow);

  const beforeReq = calcRequirementProgress(req, allOptionsInReq, progressByOptionId);
  const afterReq = calcRequirementProgress(req, allOptionsInReq, after);

  const beforeCat = calcCategoryCredits(allOptionsInCategory, progressByOptionId);
  const afterCat = calcCategoryCredits(allOptionsInCategory, after);

  return {
    creditsDelta,
    reqProgress:
      beforeReq && afterReq
        ? {
            before: beforeReq.current,
            after: afterReq.current,
            target: afterReq.target,
            unit: afterReq.unit,
          }
        : null,
    categoryProgress: {
      beforeCredits: beforeCat,
      afterCredits: afterCat,
      target: category.credit_target ?? null,
    },
  };
}
