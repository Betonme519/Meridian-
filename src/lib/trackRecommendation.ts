/**
 * Track 推荐路径计算 —— 用户没导入个人数据时，**预计算**出"对这个目标最值得做"的一
 * 条整链路（root → milestone → bucket → category → requirement → option），整路上色 +
 * 节点徽章数字。
 *
 * 设计动机（2026-05-17 用户拍板）：
 *   "多数情况都不需要用户导入，我们本身就已经把路径都计算好了，只不过根据用户不同的目标，
 *    把合适他的路径标注出来。"
 *
 * 当前是 **启发式占位**（按 goal_mode 重排 milestone / bucket 优先级 + 取首个 unmet req）。
 * 排队 13 接 AI 后替换为 `gradPathAdvisorPrompt` 返的 zod `PathSuggestion[]`。
 *
 * 主要产出：
 *  - `paths`            每个 milestone 一条主推荐路径（最多 3 条）
 *  - `pathNodeIds`      路径上所有节点 id 集合（含 root / ms / bucket / cat / req / opt）
 *  - `pathEdgeIds`      路径上所有边 id（命名需对齐 Planner 页 edge 生成规则）
 *  - `badges`           每层 unmet count，用于节点数字徽章
 */

import type { TrackCategory, TrackRequirement, TrackOption } from "@/api/trackApi";
import type { UserProgress } from "@/api/userProgressApi";
import type { GoalMode } from "@/api/profileApi";
import { classifyCategory, type UserMilestoneCode, type CourseBucket } from "./trackUserView";
import { calcRequirementProgress, pickRecommendedOption } from "./trackSimulation";

export interface RecommendedPath {
  milestone: UserMilestoneCode;
  bucket?: CourseBucket;
  categoryId: string;
  requirementId: string;
  /** 当前 option seed 为空，此字段经常 undefined */
  optionId?: string;
  /** 一句话解释为什么推荐这条 */
  reason: string;
}

export interface RecommendationBadges {
  byMilestone: Map<UserMilestoneCode, number>;
  byBucket: Map<CourseBucket, number>;
  byCategoryId: Map<string, number>;
  byRequirementId: Map<string, number>;
}

export interface RecommendationResult {
  paths: RecommendedPath[];
  pathNodeIds: Set<string>;
  pathEdgeIds: Set<string>;
  badges: RecommendationBadges;
}

interface Candidate {
  milestone: UserMilestoneCode;
  bucket?: CourseBucket;
  categoryId: string;
  category: TrackCategory;
  requirement: TrackRequirement;
  opts: TrackOption[];
}

/* ───────────────────────── goal_mode 启发式 ───────────────────────── */

/**
 * 不同目标下 milestone（上课/二课/论文）的推荐顺序。
 * 排队 13 AI 接入后改为 prompt 输出。
 */
function getMilestonePriority(goalMode: GoalMode | null): UserMilestoneCode[] {
  switch (goalMode) {
    case "实习优先":
      return ["thesis", "course", "second"];
    case "保研路线":
    case "高 GPA":
    case "留学路线":
    case "最轻松毕业":
    case "时间自由":
    case "低压力模式":
    case "个性化定制":
    default:
      return ["course", "second", "thesis"];
  }
}

/**
 * 不同目标下"上课"内 5 个 bucket 的优先级。
 * 数字小 = 优先。
 */
function getBucketPriority(goalMode: GoalMode | null): Record<CourseBucket, number> {
  switch (goalMode) {
    case "保研路线":
    case "高 GPA":
      // 专必/通识 是 GPA 主战场
      return { 专业必修: 0, 通识必修: 1, 公共必修: 2, 专业选修: 3, 任选: 4 };
    case "留学路线":
      // 英语 / GPA 基础 + 专业
      return { 公共必修: 0, 专业必修: 1, 通识必修: 2, 专业选修: 3, 任选: 4 };
    case "实习优先":
      return { 专业必修: 0, 专业选修: 1, 公共必修: 2, 通识必修: 3, 任选: 4 };
    case "最轻松毕业":
    case "时间自由":
    case "低压力模式":
      // 先把必修扫清
      return { 公共必修: 0, 通识必修: 1, 专业必修: 2, 专业选修: 3, 任选: 4 };
    case "个性化定制":
    default:
      return { 公共必修: 0, 通识必修: 1, 专业必修: 2, 专业选修: 3, 任选: 4 };
  }
}

/**
 * requirement 是否"未完成"。
 * - 有 target：current < target
 * - 无 target 但仍是 course-kind：视作未完成（兜底）
 * - rule-kind requirement：calcRequirementProgress 返 null → false（不算）
 */
function isReqUnmet(
  req: TrackRequirement,
  opts: TrackOption[],
  progress: Map<string, UserProgress>,
): boolean {
  const p = calcRequirementProgress(req, opts, progress);
  if (!p) return false;
  if (p.target == null) return true;
  return p.current < p.target;
}

/* ───────────────────────── 主入口 ───────────────────────── */

export function computeRecommendation(args: {
  categories: TrackCategory[];
  requirementsByCategoryId: Map<string, TrackRequirement[]>;
  optionsByRequirementId: Map<string, TrackOption[]>;
  progressByOptionId: Map<string, UserProgress>;
  goalMode?: GoalMode | null;
}): RecommendationResult {
  const { categories, requirementsByCategoryId, optionsByRequirementId, progressByOptionId } = args;
  const goalMode = args.goalMode ?? null;

  const msPriority = getMilestonePriority(goalMode);
  const bucketPriority = getBucketPriority(goalMode);

  /* ──── 1. 累计 unmet 徽章 + 收集候选 ──── */

  const byMilestone = new Map<UserMilestoneCode, number>();
  const byBucket = new Map<CourseBucket, number>();
  const byCategoryId = new Map<string, number>();
  const byRequirementId = new Map<string, number>();

  const candidates: Candidate[] = [];

  for (const c of categories) {
    const cls = classifyCategory(c.code, c.title);
    if (!cls) continue;
    const reqs = requirementsByCategoryId.get(c.id) ?? [];
    for (const r of reqs) {
      const opts = optionsByRequirementId.get(r.id) ?? [];
      if (!isReqUnmet(r, opts, progressByOptionId)) continue;
      candidates.push({
        milestone: cls.milestone,
        bucket: cls.bucket,
        categoryId: c.id,
        category: c,
        requirement: r,
        opts,
      });
      byMilestone.set(cls.milestone, (byMilestone.get(cls.milestone) ?? 0) + 1);
      if (cls.bucket) {
        byBucket.set(cls.bucket, (byBucket.get(cls.bucket) ?? 0) + 1);
      }
      byCategoryId.set(c.id, (byCategoryId.get(c.id) ?? 0) + 1);
      byRequirementId.set(r.id, 1);
    }
  }

  /* ──── 2. 每个 milestone 选 1 条主路径 ──── */

  const paths: RecommendedPath[] = [];
  for (const ms of msPriority) {
    const inMs = candidates.filter((c) => c.milestone === ms);
    if (inMs.length === 0) continue;
    inMs.sort((a, b) => {
      const ap = a.bucket ? (bucketPriority[a.bucket] ?? 99) : 99;
      const bp = b.bucket ? (bucketPriority[b.bucket] ?? 99) : 99;
      if (ap !== bp) return ap - bp;
      if (a.category.order_index !== b.category.order_index) {
        return a.category.order_index - b.category.order_index;
      }
      return a.requirement.order_index - b.requirement.order_index;
    });
    const pick = inMs[0];
    const rec = pickRecommendedOption(pick.requirement, pick.opts, progressByOptionId);
    paths.push({
      milestone: pick.milestone,
      bucket: pick.bucket,
      categoryId: pick.categoryId,
      requirementId: pick.requirement.id,
      optionId: rec?.id,
      reason: buildReason(goalMode, pick),
    });
  }

  /* ──── 3. 累计 path 上的 node / edge id（命名对齐 Planner 边生成规则）──── */

  const pathNodeIds = new Set<string>();
  const pathEdgeIds = new Set<string>();
  if (paths.length > 0) pathNodeIds.add("root");

  for (const p of paths) {
    const msNode = `milestone-${p.milestone}`;
    pathNodeIds.add(msNode);
    pathEdgeIds.add(`e-root-${p.milestone}`);

    let parentForCat: string;
    if (p.bucket) {
      const bNode = `bucket-${p.bucket}`;
      pathNodeIds.add(bNode);
      pathEdgeIds.add(`e-ms-${p.milestone}-bucket-${p.bucket}`);
      parentForCat = bNode;
    } else {
      parentForCat = msNode;
    }

    const catNode = `category-${p.categoryId}`;
    pathNodeIds.add(catNode);
    pathEdgeIds.add(`e-${parentForCat}-cat-${p.categoryId}`);

    const reqNode = `requirement-${p.requirementId}`;
    pathNodeIds.add(reqNode);
    pathEdgeIds.add(`e-cat-${p.categoryId}-req-${p.requirementId}`);

    if (p.optionId) {
      pathNodeIds.add(`option-${p.optionId}`);
      pathEdgeIds.add(`e-req-${p.requirementId}-opt-${p.optionId}`);
    }
  }

  return {
    paths,
    pathNodeIds,
    pathEdgeIds,
    badges: { byMilestone, byBucket, byCategoryId, byRequirementId },
  };
}

function buildReason(goalMode: GoalMode | null, c: Candidate): string {
  const t = c.category.title;
  if (goalMode === "高 GPA" || goalMode === "保研路线") {
    return `${t} · GPA 主战场，先攻这里`;
  }
  if (goalMode === "留学路线") {
    return `${t} · 留学申请基础`;
  }
  if (goalMode === "实习优先") {
    return `${t} · 项目实践类，优先`;
  }
  if (goalMode === "最轻松毕业" || goalMode === "时间自由" || goalMode === "低压力模式") {
    return `${t} · 必修先扫清`;
  }
  return `${t} · 推荐优先完成`;
}
