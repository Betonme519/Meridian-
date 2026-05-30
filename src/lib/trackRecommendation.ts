/**
 * Track 推荐路径计算 —— 用户没导入个人数据时，**预计算**出"对这个目标最值得做"的一
 * 条整链路（root → milestone → bucket → category → requirement → option），整路上色 +
 * 节点徽章数字。
 *
 * 设计动机（2026-05-17 用户拍板）：
 *   "多数情况都不需要用户导入，我们本身就已经把路径都计算好了，只不过根据用户不同的目标，
 *    把合适他的路径标注出来。"
 *
 * **两层 API**（排队 13 完成后）：
 *  - `computeRecommendation(args)` 同步启发式占位 —— 即刻产出，画布首帧用
 *  - `fetchAdvisorRecommendation(args, signal?)` async AI 加强版 —— Planner useEffect
 *    调用，回来后 setState 覆盖启发式 reason。失败 / abort 时回退 computeRecommendation
 *    结果（caller 责任：useEffect 内 try/catch 后 setState fallback）。
 *
 * 13 mock 阶段：AI 只升级 paths[].reason 字段（模板化 rationale），骨架仍走启发式。
 * 13.2 真 LLM：本函数体不变，prompt 已包含全量 schema + 用户进度，LLM 可重排 paths。
 *
 * 主要产出（两层 API 一致）：
 *  - `paths`            每个 milestone 一条主推荐路径（最多 3 条）
 *  - `pathNodeIds`      路径上所有节点 id 集合（含 root / ms / bucket / cat / req / opt）
 *  - `pathEdgeIds`      路径上所有边 id（命名需对齐 Planner 页 edge 生成规则）
 *  - `badges`           每层 unmet count，用于节点数字徽章
 */

import type { TrackCategory, TrackRequirement, TrackOption } from "@/api/trackApi";
import type { UserProgress } from "@/api/userProgressApi";
import type { GoalMode } from "@/api/profileApi";
import type { AdviceShortcut } from "@/api/requirementAdviceApi";
import { classifyCategory, type UserMilestoneCode, type CourseBucket } from "./trackUserView";
import { calcRequirementProgress, pickRecommendedOption } from "./trackSimulation";
import { chat, collect } from "@/ai";
import { gradPathAdvisorPrompt, type GradPathAdvisorInput } from "@/ai/prompts";
import { GradPathAdvisorResponseSchema } from "@/ai/schema";

export interface RecommendedPath {
  milestone: UserMilestoneCode;
  bucket?: CourseBucket;
  categoryId: string;
  requirementId: string;
  /** 当前 option seed 为空，此字段经常 undefined */
  optionId?: string;
  /** 一句话解释为什么推荐这条 */
  reason: string;
  /** 排队 12.5：路径建议变体，来自 advice.shortcut_oneliners；Planner merge 时注入 */
  shortcuts?: AdviceShortcut[];
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

/* ───────────────────────── AI 加强版（排队 13） ───────────────────────── */

/**
 * 异步 advisor —— 先跑同步 computeRecommendation 拿骨架，再调 AI 升级 reason。
 *
 * 流程：
 *   1. computeRecommendation 启发式产 RecommendationResult（含 paths 骨架）
 *   2. 组装 GradPathAdvisorInput（categories / requirements / completedCodes / skeleton）
 *   3. gradPathAdvisorPrompt → chat → collect → JSON.parse → zod.parse
 *   4. AI 返 PathSuggestion[]，按 requirementId 匹配回骨架，覆盖 reason 字段
 *   5. 重建 pathNodeIds / pathEdgeIds（path 集合可能被 AI 重排）
 *
 * Caller（Planner useEffect）负责：
 *   - 失败 / abort 时显示同步骨架（不阻塞渲染）
 *   - signal 通过 chat({ signal }) 透传，组件卸载 abort 不抛 AbortError
 *
 * **不在本函数处理的事**：
 *   - 缓存（13.2 接 server route 时统一加 IndexedDB / sessionStorage）
 *   - 重试（13.2 fetch wrapper 统一处理）
 *   - rankings / gaps 字段（13 mock 阶段返 []）
 */
export async function fetchAdvisorRecommendation(args: {
  categories: TrackCategory[];
  requirementsByCategoryId: Map<string, TrackRequirement[]>;
  optionsByRequirementId: Map<string, TrackOption[]>;
  progressByOptionId: Map<string, UserProgress>;
  goalMode?: GoalMode | null;
  completedCodes?: Set<string>;
  /** 13.8-A：已解析个人文档（成绩单 / 培养方案），见 personalDocsForAdvisor */
  personalDocs?: { kind: string; name: string; text: string }[];
  signal?: AbortSignal;
}): Promise<RecommendationResult> {
  const skeleton = computeRecommendation(args);

  // 没有候选路径时直接返启发式，省一次 AI 调用
  if (skeleton.paths.length === 0) return skeleton;

  const input: GradPathAdvisorInput = {
    goalMode: args.goalMode ?? null,
    categories: args.categories.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      order_index: c.order_index,
    })),
    requirements: collectAdvisorRequirements(args.categories, args.requirementsByCategoryId),
    completedCodes: args.completedCodes ? Array.from(args.completedCodes) : [],
    skeleton: skeleton.paths.map((p) => ({
      milestone: p.milestone,
      bucket: p.bucket ?? null,
      categoryId: p.categoryId,
      requirementId: p.requirementId,
      optionId: p.optionId ?? null,
      reason: p.reason,
    })),
    ...(args.personalDocs?.length ? { personalDocs: args.personalDocs } : {}),
  };

  let raw: string;
  try {
    raw = await collect(chat({ messages: gradPathAdvisorPrompt(input), signal: args.signal }));
  } catch {
    // chat 失败 / abort → 返启发式骨架，画布不闪屏
    return skeleton;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return skeleton;
  }
  const safe = GradPathAdvisorResponseSchema.safeParse(parsedJson);
  if (!safe.success) return skeleton;

  // 按 requirementId 索引 AI 返的 path，覆盖骨架 reason 字段
  const aiByReqId = new Map(safe.data.paths.map((p) => [p.requirementId, p]));
  const enhancedPaths: RecommendedPath[] = skeleton.paths.map((p) => {
    const ai = aiByReqId.get(p.requirementId);
    if (!ai) return p;
    return { ...p, reason: ai.reason };
  });

  // path 节点集合本身不变（AI 在 13 mock 阶段不重排），直接复用骨架的 nodeIds / edgeIds
  return {
    paths: enhancedPaths,
    pathNodeIds: skeleton.pathNodeIds,
    pathEdgeIds: skeleton.pathEdgeIds,
    badges: skeleton.badges,
  };
}

/**
 * 把按 categoryId 分组的 requirements flatten 成 AdvisorRequirementInput[]，
 * 只保留 prompt 需要的字段，避免把整 DB 行（含 metadata jsonb）喂 LLM。
 */
function collectAdvisorRequirements(
  categories: TrackCategory[],
  requirementsByCategoryId: Map<string, TrackRequirement[]>,
): GradPathAdvisorInput["requirements"] {
  const out: GradPathAdvisorInput["requirements"] = [];
  for (const c of categories) {
    const reqs = requirementsByCategoryId.get(c.id) ?? [];
    for (const r of reqs) {
      out.push({
        id: r.id,
        category_id: r.category_id,
        code: r.code,
        title: r.title,
        kind: r.kind,
        threshold: r.threshold,
        source_ref: r.source_ref,
      });
    }
  }
  return out;
}
