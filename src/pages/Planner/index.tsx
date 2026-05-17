import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Loader2,
  MinusCircle,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTrack } from "@/hooks/useTrack";
import { useUserProgress } from "@/hooks/useUserProgress";
import type { TrackCategory, TrackOption, TrackRequirement } from "@/api/trackApi";
import type { UserProgress } from "@/api/userProgressApi";
import { REQUIREMENT_KIND_META, USER_PROGRESS_META } from "@/types/trackEnums";
import {
  calcCategoryCredits,
  calcRequirementProgress,
  pickRecommendedOption,
  simulatePick,
  type SimulationResult,
} from "@/lib/trackSimulation";
import {
  classifyCategory,
  COURSE_BUCKETS,
  isUserVisibleRequirement,
  USER_MILESTONES,
  type CourseBucket,
  type UserMilestoneCode,
} from "@/lib/trackUserView";
import { computeRecommendation } from "@/lib/trackRecommendation";

/**
 * /course-planner — Track Workspace（排队 12 v3：学生友好思维导图版）。
 *
 * 用户视图（**不展示管理规则**）：
 *   root → milestone(3) → bucket(5)/category(N) → requirement → option
 *
 * 3 个 milestone：上课 / 第二课堂 / 论文项目
 *   - 上课 下展开 5 bucket：公共必修 / 通识必修 / 专业必修 / 专业选修 / 任选
 *     bucket → 该 bucket 下所有 category 的 course-kind requirements → options
 *   - 第二课堂 / 论文项目 直接展开 category → requirements → options
 *
 * 隐藏（AI 后台仍可用，画布不显示）：
 *   - 退课 / 休学 / 学籍 / 警示 / 收费 / 学位授予 等管理规则
 *   - 转专业 / 强基 / 辅修 / 微专业 / 推免 等特殊计划
 *   - rule-kind requirement（time_limit / gpa_threshold / status_gate / ...）
 *
 * 过滤逻辑见 `src/lib/trackUserView.ts`。
 */

/* ───────────────────────── option 状态视觉映射 ───────────────────────── */

type VisualState = "default" | "done" | "enrolled" | "planned" | "dropped";

function getVisualState(p: UserProgress | undefined): VisualState {
  if (!p) return "default";
  if (p.status === "done" || p.status === "waived") return "done";
  if (p.status === "enrolled") return "enrolled";
  if (p.status === "dropped") return "dropped";
  return "planned";
}

const DOT_CLS: Record<VisualState, string> = {
  default: "bg-slate-200",
  planned: "bg-slate-400",
  enrolled: "bg-amber-400",
  done: "bg-emerald-500",
  dropped: "bg-slate-300 ring-1 ring-rose-200",
};

const CARD_TONE_CLS: Record<VisualState, string> = {
  default: "border-slate-200 bg-white",
  planned: "border-slate-300 bg-white",
  enrolled: "border-amber-300 bg-amber-50/40",
  done: "border-emerald-300 bg-emerald-50/40",
  dropped: "border-slate-200 bg-slate-50 text-slate-400",
};

const MILESTONE_ICON: Record<UserMilestoneCode, typeof BookOpen> = {
  course: BookOpen,
  second: Target,
  thesis: ClipboardList,
};

/* ───────────────────────── 自定义 node 数据类型 ───────────────────────── */

type NodeDataRoot = {
  kind: "root";
  label: string;
  sublabel: string;
  pathCount: number;
} & Record<string, unknown>;

type NodeDataMilestone = {
  kind: "milestone";
  code: UserMilestoneCode;
  label: string;
  isExpanded: boolean;
  childCount: number;
  badgeCount: number;
  onPath: boolean;
} & Record<string, unknown>;

type NodeDataBucket = {
  kind: "bucket";
  bucket: CourseBucket;
  isExpanded: boolean;
  earnedCredits: number;
  targetCredits: number | null;
  catCount: number;
  badgeCount: number;
  onPath: boolean;
} & Record<string, unknown>;

type NodeDataCategory = {
  kind: "category";
  category: TrackCategory;
  isExpanded: boolean;
  earned: number;
  hasRecommendedReq: boolean;
  badgeCount: number;
  onPath: boolean;
} & Record<string, unknown>;

type NodeDataRequirement = {
  kind: "requirement";
  requirement: TrackRequirement;
  isExpanded: boolean;
  progress: ReturnType<typeof calcRequirementProgress>;
  optionCount: number;
  hasRecommendedOption: boolean;
  badgeCount: number;
  onPath: boolean;
} & Record<string, unknown>;

type NodeDataOption = {
  kind: "option";
  option: TrackOption;
  visualState: VisualState;
  isRecommended: boolean;
  onPath: boolean;
} & Record<string, unknown>;

type FlowNodeData =
  | NodeDataRoot
  | NodeDataMilestone
  | NodeDataBucket
  | NodeDataCategory
  | NodeDataRequirement
  | NodeDataOption;

/* ════════════════════════════════════════════════════════ */
/* Page                                                      */
/* ════════════════════════════════════════════════════════ */

export default function PlannerPage() {
  const { user, loading: authLoading } = useAuth();
  const isGuest = !authLoading && !user;

  const {
    track,
    categories,
    requirementsByCategoryId,
    optionsByRequirementId,
    allOptionsByCategoryId,
    loading: trackLoading,
    error: trackError,
  } = useTrack();

  const {
    progressByOptionId,
    upsertProgress,
    removeProgress,
    error: progressError,
  } = useUserProgress(track?.id ?? null);

  const { profile } = useProfile();
  const goalMode = profile?.goal_mode ?? null;

  // 展开状态
  const [expandedMilestones, setExpandedMilestones] = useState<Set<UserMilestoneCode>>(new Set());
  const [expandedBuckets, setExpandedBuckets] = useState<Set<CourseBucket>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedRequirements, setExpandedRequirements] = useState<Set<string>>(new Set());
  const [drawerOptionId, setDrawerOptionId] = useState<string | null>(null);

  /* ────────── 分类：把 30 个 category 翻译成 user view ────────── */
  const userViewMap = useMemo(() => {
    // 上课 milestone：5 个 bucket → category[]
    const courseBuckets = new Map<CourseBucket, TrackCategory[]>();
    for (const b of COURSE_BUCKETS) courseBuckets.set(b, []);
    // 第二课堂 / 论文项目：milestone → category[]
    const secondCats: TrackCategory[] = [];
    const thesisCats: TrackCategory[] = [];

    for (const c of categories) {
      const cls = classifyCategory(c.code, c.title);
      if (!cls) continue;
      if (cls.milestone === "course" && cls.bucket) {
        courseBuckets.get(cls.bucket)?.push(c);
      } else if (cls.milestone === "second") {
        secondCats.push(c);
      } else if (cls.milestone === "thesis") {
        thesisCats.push(c);
      }
    }

    return { courseBuckets, secondCats, thesisCats };
  }, [categories]);

  /* ────────── 过滤可见 requirements ────────── */
  const visibleReqsByCategoryId = useMemo(() => {
    const m = new Map<string, TrackRequirement[]>();
    for (const [catId, reqs] of requirementsByCategoryId.entries()) {
      const filtered = reqs.filter(isUserVisibleRequirement);
      if (filtered.length > 0) m.set(catId, filtered);
    }
    return m;
  }, [requirementsByCategoryId]);

  /* ────────── AI 推荐：goal-aware 整链路 + 数字徽章 ────────── */
  const recommendation = useMemo(
    () =>
      computeRecommendation({
        categories,
        requirementsByCategoryId: visibleReqsByCategoryId,
        optionsByRequirementId,
        progressByOptionId,
        goalMode,
      }),
    [categories, visibleReqsByCategoryId, optionsByRequirementId, progressByOptionId, goalMode],
  );

  /* ────────── 头卡：累计学分（仅用户可见 category 部分） ────────── */
  const headerProgress = useMemo(() => {
    if (!track) return null;
    let earned = 0;
    // 累加所有 user-visible bucket / category 下的 done credits
    for (const cats of userViewMap.courseBuckets.values()) {
      for (const c of cats) {
        const opts = allOptionsByCategoryId.get(c.id) ?? [];
        earned += calcCategoryCredits(opts, progressByOptionId);
      }
    }
    for (const c of userViewMap.secondCats) {
      const opts = allOptionsByCategoryId.get(c.id) ?? [];
      earned += calcCategoryCredits(opts, progressByOptionId);
    }
    for (const c of userViewMap.thesisCats) {
      const opts = allOptionsByCategoryId.get(c.id) ?? [];
      earned += calcCategoryCredits(opts, progressByOptionId);
    }
    return { earned, target: track.total_credits ?? null };
  }, [track, userViewMap, allOptionsByCategoryId, progressByOptionId]);

  /* ────────── 计算节点 + 边 ────────── */

  const { computedNodes, computedEdges } = useMemo(() => {
    if (!track) return { computedNodes: [] as Node[], computedEdges: [] as Edge[] };

    const ns: Node[] = [];
    const es: Edge[] = [];

    // X 轴 layered（root → milestone → bucket → category → req → opt）
    const X = { root: 0, ms: 260, bucket: 540, cat: 820, req: 1100, opt: 1400 };
    const SPACING = { ms: 160, bucket: 90, cat: 80, req: 70, opt: 56 };

    // 工具：判定节点是否在推荐路径上 + 计算边样式
    const onPath = (id: string) => recommendation.pathNodeIds.has(id);
    const edgeStyleFor = (id: string) =>
      recommendation.pathEdgeIds.has(id)
        ? { stroke: "rgb(245 158 11)", strokeWidth: 2 } // amber-500
        : undefined;

    // root
    ns.push({
      id: "root",
      type: "meridian-root",
      position: { x: X.root, y: 0 },
      data: {
        kind: "root",
        label: `${track.school} · ${track.year} 级`,
        sublabel: "毕业路径",
        pathCount: recommendation.paths.length,
      } satisfies NodeDataRoot,
    });

    // 3 个 milestone 垂直均匀
    const msY = (i: number) => (i - (USER_MILESTONES.length - 1) / 2) * SPACING.ms;

    USER_MILESTONES.forEach((ms, i) => {
      const y = msY(i);
      const expanded = expandedMilestones.has(ms.code);
      let childCount = 0;
      if (ms.code === "course") childCount = COURSE_BUCKETS.length;
      else if (ms.code === "second") childCount = userViewMap.secondCats.length;
      else if (ms.code === "thesis") childCount = userViewMap.thesisCats.length;

      const msNodeId = `milestone-${ms.code}`;
      ns.push({
        id: msNodeId,
        type: "meridian-milestone",
        position: { x: X.ms, y },
        data: {
          kind: "milestone",
          code: ms.code,
          label: ms.label,
          isExpanded: expanded,
          childCount,
          badgeCount: recommendation.badges.byMilestone.get(ms.code) ?? 0,
          onPath: onPath(msNodeId),
        } satisfies NodeDataMilestone,
      });
      const msEdgeId = `e-root-${ms.code}`;
      es.push({
        id: msEdgeId,
        source: "root",
        target: msNodeId,
        type: "smoothstep",
        style: edgeStyleFor(msEdgeId) ?? {
          stroke: "rgb(148 163 184)",
          strokeWidth: 1.5,
        },
      });

      if (!expanded) return;

      if (ms.code === "course") {
        // 5 个 bucket 节点
        COURSE_BUCKETS.forEach((bucket, j) => {
          const by = y + (j - (COURSE_BUCKETS.length - 1) / 2) * SPACING.bucket;
          const cats = userViewMap.courseBuckets.get(bucket) ?? [];
          const bucketExpanded = expandedBuckets.has(bucket);
          let earned = 0;
          let target: number | null = null;
          for (const c of cats) {
            const opts = allOptionsByCategoryId.get(c.id) ?? [];
            earned += calcCategoryCredits(opts, progressByOptionId);
            if (c.credit_target != null) target = (target ?? 0) + c.credit_target;
          }
          const bucketNodeId = `bucket-${bucket}`;
          ns.push({
            id: bucketNodeId,
            type: "meridian-bucket",
            position: { x: X.bucket, y: by },
            data: {
              kind: "bucket",
              bucket,
              isExpanded: bucketExpanded,
              earnedCredits: earned,
              targetCredits: target,
              catCount: cats.length,
              badgeCount: recommendation.badges.byBucket.get(bucket) ?? 0,
              onPath: onPath(bucketNodeId),
            } satisfies NodeDataBucket,
          });
          const bucketEdgeId = `e-ms-course-bucket-${bucket}`;
          es.push({
            id: bucketEdgeId,
            source: `milestone-course`,
            target: bucketNodeId,
            type: "smoothstep",
            style: edgeStyleFor(bucketEdgeId) ?? {
              stroke: "rgb(148 163 184)",
              strokeWidth: 1.2,
            },
          });

          if (!bucketExpanded || cats.length === 0) return;

          // 该 bucket 下的 categories
          cats.forEach((c, k) => {
            const cy = by + (k - (cats.length - 1) / 2) * SPACING.cat;
            renderCategoryAndDescendants(c, X.cat, cy, `bucket-${bucket}`);
          });
        });
      } else {
        // 第二课堂 / 论文项目 直接展开 categories
        const cats = ms.code === "second" ? userViewMap.secondCats : userViewMap.thesisCats;
        cats.forEach((c, j) => {
          const cy = y + (j - (cats.length - 1) / 2) * SPACING.cat;
          renderCategoryAndDescendants(c, X.cat, cy, `milestone-${ms.code}`);
        });
      }
    });

    function renderCategoryAndDescendants(
      c: TrackCategory,
      cx: number,
      cy: number,
      parentId: string,
    ) {
      const reqs = visibleReqsByCategoryId.get(c.id) ?? [];
      // 检查推荐
      const hasRec = reqs.some((r) => {
        const opts = optionsByRequirementId.get(r.id) ?? [];
        return pickRecommendedOption(r, opts, progressByOptionId) !== null;
      });
      const opts = allOptionsByCategoryId.get(c.id) ?? [];
      const earned = calcCategoryCredits(opts, progressByOptionId);
      const isCatExpanded = expandedCategories.has(c.id);

      const catNodeId = `category-${c.id}`;
      ns.push({
        id: catNodeId,
        type: "meridian-category",
        position: { x: cx, y: cy },
        data: {
          kind: "category",
          category: c,
          isExpanded: isCatExpanded,
          earned,
          hasRecommendedReq: hasRec,
          badgeCount: recommendation.badges.byCategoryId.get(c.id) ?? 0,
          onPath: onPath(catNodeId),
        } satisfies NodeDataCategory,
      });
      const catEdgeId = `e-${parentId}-cat-${c.id}`;
      es.push({
        id: catEdgeId,
        source: parentId,
        target: catNodeId,
        type: "smoothstep",
        style: edgeStyleFor(catEdgeId) ?? {
          stroke: "rgb(203 213 225)",
          strokeWidth: 1.2,
        },
      });

      if (!isCatExpanded) return;

      reqs.forEach((r, k) => {
        const ry = cy + (k - (reqs.length - 1) / 2) * SPACING.req;
        const opts2 = optionsByRequirementId.get(r.id) ?? [];
        const rec = pickRecommendedOption(r, opts2, progressByOptionId);
        const isReqExpanded = expandedRequirements.has(r.id);
        const reqNodeId = `requirement-${r.id}`;
        ns.push({
          id: reqNodeId,
          type: "meridian-requirement",
          position: { x: X.req, y: ry },
          data: {
            kind: "requirement",
            requirement: r,
            isExpanded: isReqExpanded,
            progress: calcRequirementProgress(r, opts2, progressByOptionId),
            optionCount: opts2.length,
            hasRecommendedOption: rec !== null,
            badgeCount: recommendation.badges.byRequirementId.get(r.id) ?? 0,
            onPath: onPath(reqNodeId),
          } satisfies NodeDataRequirement,
        });
        const reqEdgeId = `e-cat-${c.id}-req-${r.id}`;
        es.push({
          id: reqEdgeId,
          source: `category-${c.id}`,
          target: reqNodeId,
          type: "smoothstep",
          style: edgeStyleFor(reqEdgeId) ?? {
            stroke: "rgb(226 232 240)",
            strokeWidth: 1,
          },
        });

        if (!isReqExpanded) return;

        opts2.forEach((o, l) => {
          const oy = ry + (l - (opts2.length - 1) / 2) * SPACING.opt;
          const p = progressByOptionId.get(o.id);
          const optNodeId = `option-${o.id}`;
          ns.push({
            id: optNodeId,
            type: "meridian-option",
            position: { x: X.opt, y: oy },
            data: {
              kind: "option",
              option: o,
              visualState: getVisualState(p),
              isRecommended: rec?.id === o.id,
              onPath: onPath(optNodeId),
            } satisfies NodeDataOption,
          });
          const optEdgeId = `e-req-${r.id}-opt-${o.id}`;
          es.push({
            id: optEdgeId,
            source: `requirement-${r.id}`,
            target: optNodeId,
            type: "smoothstep",
            style: edgeStyleFor(optEdgeId) ?? {
              stroke: "rgb(241 245 249)",
              strokeWidth: 1,
            },
          });
        });
      });
    }

    return { computedNodes: ns, computedEdges: es };
  }, [
    track,
    expandedMilestones,
    expandedBuckets,
    expandedCategories,
    expandedRequirements,
    userViewMap,
    visibleReqsByCategoryId,
    optionsByRequirementId,
    allOptionsByCategoryId,
    progressByOptionId,
    recommendation,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  useEffect(() => {
    setNodes(computedNodes);
  }, [computedNodes, setNodes]);
  useEffect(() => {
    setEdges(computedEdges);
  }, [computedEdges, setEdges]);

  /* ────────── 点击交互 ────────── */

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const id = node.id;
    if (id === "root") {
      setExpandedMilestones((curr) => {
        if (curr.size === USER_MILESTONES.length) return new Set();
        return new Set(USER_MILESTONES.map((m) => m.code));
      });
      return;
    }
    if (id.startsWith("milestone-")) {
      const code = id.slice("milestone-".length) as UserMilestoneCode;
      setExpandedMilestones((curr) => {
        const next = new Set(curr);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        return next;
      });
      return;
    }
    if (id.startsWith("bucket-")) {
      const bucket = id.slice("bucket-".length) as CourseBucket;
      setExpandedBuckets((curr) => {
        const next = new Set(curr);
        if (next.has(bucket)) next.delete(bucket);
        else next.add(bucket);
        return next;
      });
      return;
    }
    if (id.startsWith("category-")) {
      const catId = id.slice("category-".length);
      setExpandedCategories((curr) => {
        const next = new Set(curr);
        if (next.has(catId)) next.delete(catId);
        else next.add(catId);
        return next;
      });
      return;
    }
    if (id.startsWith("requirement-")) {
      const reqId = id.slice("requirement-".length);
      setExpandedRequirements((curr) => {
        const next = new Set(curr);
        if (next.has(reqId)) next.delete(reqId);
        else next.add(reqId);
        return next;
      });
      return;
    }
    if (id.startsWith("option-")) {
      const optId = id.slice("option-".length);
      setDrawerOptionId(optId);
      return;
    }
  }, []);

  /* ────────── Drawer ────────── */

  const drawerOption = useMemo<TrackOption | null>(() => {
    if (!drawerOptionId) return null;
    for (const opts of optionsByRequirementId.values()) {
      const o = opts.find((x) => x.id === drawerOptionId);
      if (o) return o;
    }
    return null;
  }, [drawerOptionId, optionsByRequirementId]);

  const drawerReq = useMemo<TrackRequirement | null>(() => {
    if (!drawerOption) return null;
    for (const reqs of requirementsByCategoryId.values()) {
      const r = reqs.find((x) => x.id === drawerOption.requirement_id);
      if (r) return r;
    }
    return null;
  }, [drawerOption, requirementsByCategoryId]);

  const drawerCategory = useMemo<TrackCategory | null>(() => {
    if (!drawerReq) return null;
    return categories.find((c) => c.id === drawerReq.category_id) ?? null;
  }, [drawerReq, categories]);

  /* ─────────────────────── 渲染 ─────────────────────── */

  if (trackLoading) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="flex items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          加载培养方案…
        </div>
      </section>
    );
  }

  if (trackError) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {trackError}
        </p>
      </section>
    );
  }

  if (!track) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-900">还没有可用的培养方案</p>
          <p className="mt-2 text-xs text-slate-500">
            请联系管理员录入学校培养方案，或访问{" "}
            <a href="/import" className="underline">
              导入页
            </a>{" "}
            完善个人资料。
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* 头卡 */}
      <div className="mx-auto w-full max-w-7xl px-5 pt-6 sm:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <GraduationCap className="h-5 w-5 text-slate-700" strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                毕业路径
              </p>
              <h1 className="mt-1 text-base font-semibold tracking-tight text-slate-900">
                {track.school} · {track.year} 级
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                点击节点逐层展开 · 上课 → 类别 → 选项；AI 推荐的项目醒目高亮
              </p>
            </div>
            <div className="text-right">
              {headerProgress && (
                <>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    累计学分
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
                    {fmtCredits(headerProgress.earned)}
                    {headerProgress.target != null && (
                      <span className="text-sm font-normal text-slate-400">
                        {" "}
                        / {fmtCredits(headerProgress.target)}
                      </span>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
          {isGuest && (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              访客模式：可浏览毕业路径，登录后才能标注进度与备注。
            </p>
          )}
        </div>
      </div>

      {/* ReactFlow 画布 */}
      <div className="mt-4 h-[calc(100vh-16rem)] min-h-[600px] border-t border-slate-200">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
          <Controls className="!shadow-none" />
          <MiniMap
            pannable
            zoomable
            className="!bg-white"
            nodeColor={(n) => miniMapColor(n.data as FlowNodeData)}
          />
        </ReactFlow>
      </div>

      <OptionDrawer
        open={drawerOptionId !== null}
        option={drawerOption}
        requirement={drawerReq}
        category={drawerCategory}
        allOptionsInReq={drawerReq ? (optionsByRequirementId.get(drawerReq.id) ?? []) : []}
        allOptionsInCategory={
          drawerCategory ? (allOptionsByCategoryId.get(drawerCategory.id) ?? []) : []
        }
        progressByOptionId={progressByOptionId}
        recommendedId={
          drawerReq
            ? (pickRecommendedOption(
                drawerReq,
                optionsByRequirementId.get(drawerReq.id) ?? [],
                progressByOptionId,
              )?.id ?? null)
            : null
        }
        isGuest={isGuest}
        error={progressError}
        onClose={() => setDrawerOptionId(null)}
        onUpsert={upsertProgress}
        onRemove={removeProgress}
      />
    </section>
  );
}

/* ════════════════════════════════════════════════════════ */
/* Custom Node                                               */
/* ════════════════════════════════════════════════════════ */

function RootNode({ data }: NodeProps<Node<NodeDataRoot>>) {
  return (
    <div className="relative rounded-2xl border-2 border-slate-950 bg-slate-950 px-4 py-3 text-white shadow-sm">
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
        {data.sublabel}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{data.label}</p>
      {data.pathCount > 0 && (
        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
          <Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300" />
          AI 已规划 {data.pathCount} 条主路径
        </p>
      )}
    </div>
  );
}

function MilestoneNode({ data }: NodeProps<Node<NodeDataMilestone>>) {
  const Icon = MILESTONE_ICON[data.code];
  return (
    <div
      className={`relative flex items-center gap-2 rounded-full border-2 px-4 py-2 shadow-sm transition-colors ${
        data.isExpanded
          ? "border-slate-950 bg-slate-950 text-white"
          : data.onPath
            ? "border-amber-400 bg-amber-50 text-slate-900 hover:border-amber-500"
            : "border-slate-300 bg-white text-slate-900 hover:border-slate-500"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
      <Icon className="h-4 w-4" />
      <span className="text-sm font-semibold">{data.label}</span>
      <span className="text-[10px] opacity-70">{data.childCount}</span>
      {data.isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      {data.badgeCount > 0 && <Badge count={data.badgeCount} />}
    </div>
  );
}

function BucketNode({ data }: NodeProps<Node<NodeDataBucket>>) {
  const empty = data.catCount === 0;
  return (
    <div
      className={`relative rounded-xl border px-3 py-2 shadow-sm transition-colors ${
        empty
          ? "border-dashed border-slate-200 bg-slate-50 text-slate-400"
          : data.isExpanded
            ? "border-slate-700 bg-white"
            : data.onPath
              ? "border-amber-400 bg-amber-50/60"
              : "border-slate-200 bg-white hover:border-slate-400"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
      <p className="text-xs font-semibold leading-tight">{data.bucket}</p>
      <p className="mt-0.5 text-[10px] tabular-nums">
        {empty ? (
          "暂无数据"
        ) : (
          <>
            {fmtCredits(data.earnedCredits)}
            {data.targetCredits != null && ` / ${fmtCredits(data.targetCredits)}`} 学分
          </>
        )}
      </p>
      {data.badgeCount > 0 && <Badge count={data.badgeCount} />}
    </div>
  );
}

function CategoryNode({ data }: NodeProps<Node<NodeDataCategory>>) {
  const target = data.category.credit_target;
  return (
    <div
      className={`relative rounded-xl border bg-white px-3 py-2 shadow-sm transition-colors ${
        data.isExpanded
          ? "border-slate-700"
          : data.onPath
            ? "border-amber-400 bg-amber-50/60"
            : "border-slate-200 hover:border-slate-400"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-slate-400">{data.category.code}</span>
        <span className="text-xs font-semibold leading-tight text-slate-900">
          {data.category.title}
        </span>
        {data.hasRecommendedReq && <Star className="h-3 w-3 fill-amber-400 text-amber-500" />}
      </div>
      {(target != null || data.earned > 0) && (
        <p className="mt-1 text-[10px] tabular-nums text-slate-500">
          {fmtCredits(data.earned)}
          {target != null && ` / ${fmtCredits(target)} 学分`}
        </p>
      )}
      {data.badgeCount > 0 && <Badge count={data.badgeCount} small />}
    </div>
  );
}

function RequirementNode({ data }: NodeProps<Node<NodeDataRequirement>>) {
  const kindMeta = REQUIREMENT_KIND_META[data.requirement.kind];
  return (
    <div
      className={`relative max-w-[240px] rounded-lg border bg-white px-3 py-2 shadow-sm transition-colors ${
        data.isExpanded
          ? "border-slate-600"
          : data.onPath
            ? "border-amber-400 bg-amber-50/60"
            : "border-slate-200 hover:border-slate-400"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
      <div className="flex items-start gap-1.5">
        <span className="font-mono text-[10px] text-slate-400">{data.requirement.code}</span>
        {data.hasRecommendedOption && (
          <Star className="ml-auto h-3 w-3 flex-shrink-0 fill-amber-400 text-amber-500" />
        )}
      </div>
      <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-slate-900">
        {data.requirement.title}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-700">
          {kindMeta.label}
        </span>
        {data.progress && (
          <span className="text-[10px] tabular-nums text-slate-500">
            {fmtNum(data.progress.current)}
            {data.progress.target != null && ` / ${fmtNum(data.progress.target)}`}
          </span>
        )}
        <span className="ml-auto text-[10px] text-slate-400">
          {data.optionCount > 0 ? `${data.optionCount} 项` : "待补"}
        </span>
      </div>
      {data.badgeCount > 0 && <Badge count={data.badgeCount} small />}
    </div>
  );
}

function OptionNode({ data }: NodeProps<Node<NodeDataOption>>) {
  const o = data.option;
  const highlight = data.isRecommended || data.onPath;
  return (
    <div
      className={`flex max-w-[220px] items-center gap-2 rounded-lg border px-2.5 py-1.5 shadow-sm transition-colors hover:border-slate-500 ${
        CARD_TONE_CLS[data.visualState]
      } ${highlight ? "ring-2 ring-amber-300" : ""}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${DOT_CLS[data.visualState]}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-slate-900">
          <span className="font-mono text-[10px] text-slate-500">{o.code}</span>
          <span className="ml-1">{o.name}</span>
        </p>
        <p className="text-[9px] text-slate-500">
          {o.credits != null ? `${fmtCredits(o.credits)} 学分` : "—"}
        </p>
      </div>
      {highlight && <Star className="h-3 w-3 flex-shrink-0 fill-amber-400 text-amber-500" />}
    </div>
  );
}

const NODE_TYPES = {
  "meridian-root": RootNode,
  "meridian-milestone": MilestoneNode,
  "meridian-bucket": BucketNode,
  "meridian-category": CategoryNode,
  "meridian-requirement": RequirementNode,
  "meridian-option": OptionNode,
};

/** 数字徽章（节点右上小红 / amber 圆点 + 数字），App 通知 style */
function Badge({ count, small = false }: { count: number; small?: boolean }) {
  const size = small ? "h-4 min-w-4 px-1 text-[9px]" : "h-5 min-w-5 px-1.5 text-[10px]";
  return (
    <span
      className={`absolute -right-1.5 -top-1.5 inline-flex items-center justify-center rounded-full bg-amber-500 font-bold tabular-nums text-white shadow-sm ring-2 ring-white ${size}`}
      aria-label={`${count} 项待办`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function miniMapColor(d: FlowNodeData): string {
  switch (d.kind) {
    case "root":
      return "#020617";
    case "milestone":
      return d.isExpanded ? "#0f172a" : "#94a3b8";
    case "bucket":
      return d.isExpanded ? "#475569" : "#cbd5e1";
    case "category":
      return d.isExpanded ? "#475569" : "#cbd5e1";
    case "requirement":
      return "#cbd5e1";
    case "option":
      if (d.visualState === "done") return "#10b981";
      if (d.visualState === "enrolled") return "#f59e0b";
      return "#e2e8f0";
    default:
      return "#e2e8f0";
  }
}

/* ════════════════════════════════════════════════════════ */
/* Drawer                                                    */
/* ════════════════════════════════════════════════════════ */

function OptionDrawer({
  open,
  option,
  requirement,
  category,
  allOptionsInReq,
  allOptionsInCategory,
  progressByOptionId,
  recommendedId,
  isGuest,
  error,
  onClose,
  onUpsert,
  onRemove,
}: {
  open: boolean;
  option: TrackOption | null;
  requirement: TrackRequirement | null;
  category: TrackCategory | null;
  allOptionsInReq: TrackOption[];
  allOptionsInCategory: TrackOption[];
  progressByOptionId: Map<string, UserProgress>;
  recommendedId: string | null;
  isGuest: boolean;
  error: string | null;
  onClose: () => void;
  onUpsert: (
    optionId: string,
    patch: { status?: UserProgress["status"]; note?: string | null },
  ) => Promise<UserProgress | null>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [simOpen, setSimOpen] = useState(false);

  useEffect(() => {
    if (!open) setSimOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open || !option || !requirement || !category) return null;

  const p = progressByOptionId.get(option.id);
  const state = getVisualState(p);
  const isDropped = state === "dropped";
  const isRecommended = recommendedId === option.id;

  return (
    <>
      <div
        className="animate-fade-in-overlay fixed inset-0 z-40 bg-slate-900/30"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl sm:w-[480px] md:w-[520px]">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] text-slate-400">
                {category.code} · {requirement.code} · {option.code}
              </p>
              <h2 className="mt-1 text-base font-semibold leading-6 text-slate-900">
                {option.name}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {requirement.title} · {category.title}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {isRecommended && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    AI 推荐
                  </span>
                )}
                <span className="text-[11px] text-slate-700">
                  {option.kind === "course" ? "课程" : option.kind === "alt" ? "替代" : "项目"}
                </span>
                {option.credits != null && (
                  <span className="text-[11px] tabular-nums text-slate-700">
                    {fmtCredits(option.credits)} 学分
                  </span>
                )}
                {option.semester_hint && (
                  <span className="text-[11px] text-slate-700">{option.semester_hint}</span>
                )}
                {p && (
                  <span className="text-[11px] font-medium text-slate-900">
                    {USER_PROGRESS_META[p.status].label}
                  </span>
                )}
              </div>
              {option.description && (
                <p className="mt-2 text-xs leading-5 text-slate-500">{option.description}</p>
              )}
              {option.source_ref && (
                <p className="mt-2 text-[10px] text-slate-400">来源: {option.source_ref}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <p className="mx-5 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        )}

        <DrawerActions
          option={option}
          requirement={requirement}
          category={category}
          allOptionsInReq={allOptionsInReq}
          allOptionsInCategory={allOptionsInCategory}
          progressByOptionId={progressByOptionId}
          progressRow={p}
          state={state}
          isDropped={isDropped}
          isGuest={isGuest}
          simOpen={simOpen}
          onToggleSim={() => setSimOpen((v) => !v)}
          onUpsert={onUpsert}
          onRemove={onRemove}
        />
      </aside>
    </>
  );
}

function DrawerActions({
  option,
  requirement,
  category,
  allOptionsInReq,
  allOptionsInCategory,
  progressByOptionId,
  progressRow,
  state,
  isDropped,
  isGuest,
  simOpen,
  onToggleSim,
  onUpsert,
  onRemove,
}: {
  option: TrackOption;
  requirement: TrackRequirement;
  category: TrackCategory;
  allOptionsInReq: TrackOption[];
  allOptionsInCategory: TrackOption[];
  progressByOptionId: Map<string, UserProgress>;
  progressRow: UserProgress | undefined;
  state: VisualState;
  isDropped: boolean;
  isGuest: boolean;
  simOpen: boolean;
  onToggleSim: () => void;
  onUpsert: (
    optionId: string,
    patch: { status?: UserProgress["status"]; note?: string | null },
  ) => Promise<UserProgress | null>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [noteDraft, setNoteDraft] = useState(progressRow?.note ?? "");
  useEffect(() => {
    setNoteDraft(progressRow?.note ?? "");
  }, [progressRow?.note]);

  const [busy, setBusy] = useState(false);

  const handleChoose = async () => {
    if (isGuest) return;
    setBusy(true);
    try {
      await onUpsert(option.id, { status: "done" });
    } finally {
      setBusy(false);
    }
  };
  const handleDrop = async () => {
    if (isGuest) return;
    setBusy(true);
    try {
      await onUpsert(option.id, { status: "dropped", note: "已移出候选" });
    } finally {
      setBusy(false);
    }
  };
  const handleRestore = async () => {
    if (isGuest || !progressRow) return;
    setBusy(true);
    try {
      await onRemove(progressRow.id);
    } finally {
      setBusy(false);
    }
  };
  const handleNoteBlur = () => {
    if (isGuest) return;
    const trimmed = noteDraft.trim();
    const cur = progressRow?.note ?? "";
    if (trimmed === cur) return;
    void onUpsert(option.id, { note: trimmed === "" ? null : trimmed });
  };

  const sim: SimulationResult | null = useMemo(
    () =>
      simOpen
        ? simulatePick(
            option,
            requirement,
            category,
            allOptionsInReq,
            allOptionsInCategory,
            progressByOptionId,
          )
        : null,
    [
      simOpen,
      option,
      requirement,
      category,
      allOptionsInReq,
      allOptionsInCategory,
      progressByOptionId,
    ],
  );

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      {isDropped ? (
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs text-slate-400">已移出候选</span>
          {!isGuest && progressRow && (
            <button
              type="button"
              onClick={() => void handleRestore()}
              disabled={busy}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              恢复
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleChoose()}
            disabled={busy || isGuest}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              state === "done"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-slate-950 text-white hover:bg-slate-800"
            }`}
            title={isGuest ? "登录后才能标注进度" : "标为已完成"}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {state === "done" ? "已选择" : "选择此路径"}
          </button>
          <button
            type="button"
            onClick={onToggleSim}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            {simOpen ? "收起模拟" : "模拟"}
          </button>
          <button
            type="button"
            onClick={() => void handleDrop()}
            disabled={busy || isGuest}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 transition-colors hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            title={isGuest ? "登录后才能操作" : "从候选移除"}
          >
            <MinusCircle className="h-3.5 w-3.5" />
            移出
          </button>
        </div>
      )}

      {sim && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
            选了这个会怎样
          </p>
          <ul className="mt-1.5 space-y-1 text-[11px] text-slate-700">
            <li className="flex items-baseline gap-1">
              <Sparkles className="h-3 w-3 text-slate-400" />
              <span>
                学分: +{fmtCredits(sim.creditsDelta)} → 本 category{" "}
                <span className="font-medium tabular-nums">
                  {fmtCredits(sim.categoryProgress.afterCredits)}
                </span>
                {sim.categoryProgress.target != null && (
                  <span className="text-slate-400">
                    {" "}
                    / {fmtCredits(sim.categoryProgress.target)}
                  </span>
                )}
              </span>
            </li>
            {sim.reqProgress && (
              <li className="flex items-baseline gap-1">
                <Sparkles className="h-3 w-3 text-slate-400" />
                <span>
                  本要求: {fmtNum(sim.reqProgress.before)} →{" "}
                  <span className="font-medium tabular-nums">{fmtNum(sim.reqProgress.after)}</span>
                  {sim.reqProgress.target != null && (
                    <span className="text-slate-400"> / {fmtNum(sim.reqProgress.target)}</span>
                  )}
                  {sim.reqProgress.unit && (
                    <span className="text-slate-400">{sim.reqProgress.unit}</span>
                  )}
                </span>
              </li>
            )}
            {sim.categoryProgress.target != null && (
              <li className="flex items-baseline gap-1">
                <Sparkles className="h-3 w-3 text-slate-400" />
                <span>
                  本分类完成度:{" "}
                  {pct(sim.categoryProgress.beforeCredits, sim.categoryProgress.target)} →{" "}
                  <span className="font-medium tabular-nums">
                    {pct(sim.categoryProgress.afterCredits, sim.categoryProgress.target)}
                  </span>
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

      {!isDropped && (
        <div className="mt-4">
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
              我的备注
            </span>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={handleNoteBlur}
              disabled={isGuest}
              placeholder={isGuest ? "登录后可写备注" : "为什么选 / 为什么犹豫 …"}
              rows={3}
              className="mt-1.5 block w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs leading-5 text-slate-900 transition-colors hover:border-slate-400 focus:border-slate-950 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
          </label>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════ */
/* utils                                                     */
/* ════════════════════════════════════════════════════════ */

function fmtCredits(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}

function fmtNum(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}

function pct(num: number, denom: number): string {
  if (!denom) return "—";
  return `${Math.round((num / denom) * 100)}%`;
}
