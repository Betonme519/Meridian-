import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Clock3,
  Compass,
  GraduationCap,
  Layers3,
  Lightbulb,
  MousePointer2,
  PanelRightOpen,
  Sparkles,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCourses } from "@/hooks/useCourses";
import { useProfile } from "@/hooks/useProfile";
import { useTrack } from "@/hooks/useTrack";
import { useUserProgress } from "@/hooks/useUserProgress";
import type { TrackCategory, TrackOption, TrackRequirement } from "@/api/trackApi";
import type { GoalMode } from "@/api/profileApi";
import {
  calcCategoryCredits,
  calcRequirementProgress,
  pickRecommendedOption,
  simulatePick,
} from "@/lib/trackSimulation";
import {
  classifyCategory,
  COURSE_BUCKETS,
  isUserVisibleRequirement,
  USER_MILESTONES,
  type CourseBucket,
  type UserMilestoneCode,
} from "@/lib/trackUserView";
import { computeRecommendation, type RecommendedPath } from "@/lib/trackRecommendation";
import { useRequirementAdvice, LINK_KIND_LABELS } from "@/hooks/useRequirementAdvice";
import type { RequirementLink, AdviceShortcut, GoalFit } from "@/api/requirementAdviceApi";
import { GOAL_MODES } from "@/api/profileApi";
import { useUserRequirementDone } from "@/hooks/useUserRequirementDone";
import PathLoader from "@/components/effects/PathLoader";

type ActionMode = "take" | "delay" | "switch";
type FocusMode = "all" | "recommended";
type GraphNodeKind = "root" | "milestone" | "bucket" | "requirement" | "shortcut";

interface VisibleRequirement {
  category: TrackCategory;
  requirement: TrackRequirement;
  options: TrackOption[];
  recommendedOption: TrackOption | null;
  milestone: UserMilestoneCode;
  bucket?: CourseBucket;
  progress: ReturnType<typeof calcRequirementProgress>;
  earnedCredits: number;
  isUnmet: boolean;
  isOnPath: boolean;
  pathReason?: string;
  /** 排队 12.5：从 adviceByReqId.get(reqId).shortcut_oneliners 注入，可空数组 */
  shortcuts: AdviceShortcut[];
}

interface ImpactData {
  option: TrackOption | null;
  status: string;
  credits: number;
  before: number;
  after: number;
  target: number | null;
  unit: "门" | "学分" | null | undefined;
  categoryBefore: number;
  categoryAfter: number;
  categoryTarget: number | null;
}

interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  meta: string;
  count?: number;
  item?: VisibleRequirement;
  /** shortcut 节点的路径建议数据 + 父 req id（其他 kind 时 undefined） */
  shortcut?: { reqId: string; index: number; data: AdviceShortcut };
  isRecommended: boolean;
  isActive: boolean;
  isCollapsed?: boolean;
  isComplete?: boolean;
}

interface GraphEdge {
  id: string;
  from: GraphNode;
  to: GraphNode;
  isRecommended: boolean;
}

const MILESTONE_LABEL: Record<UserMilestoneCode, string> = {
  course: "上课",
  second: "第二课堂",
  thesis: "论文项目",
};

/**
 * 论文 / 第二课堂 milestone 下全是后台规则类 req（assessment_rule / status_gate /
 * program_rule），画布隐藏 → 没有可见课程节点当锚点。这里直接在 milestone 级挂
 * 建议捷径（文案据规则 digest：论文 D4 / 第二课堂 C6+D6）。纯展示，点击不进
 * ImpactPanel（无 requirement 可模拟）。
 */
const MILESTONE_SHORTCUTS: Partial<
  Record<UserMilestoneCode, { id: string; oneLiner: string }[]>
> = {
  thesis: [
    { id: "T-1", oneLiner: "第七学期定选题，早开题早跳过抽检批次" },
    { id: "T-2", oneLiner: "竞赛获奖 / 专利成果可替代毕业论文免答辩" },
    { id: "T-3", oneLiner: "重复率盯紧：30% 限期整改 / 50% 直接延期" },
  ],
  second: [
    { id: "S-1", oneLiner: "创新创业学分可顶劳动与创造 ≤ 2 分" },
    { id: "S-2", oneLiner: "竞赛 / 论文 / 专利累加 > 8 分记 A，其余记 P" },
    { id: "S-3", oneLiner: "CTP 创新训练项目结题可换创新创业学分" },
  ],
};

const ACTION_LABEL: Record<ActionMode, string> = {
  take: "选择它",
  delay: "推迟它",
  switch: "换目标",
};

/** 排队 12.5 D：goal_mode → 2-3 字简称，用于 shortcut 卡上 goalFit chip 阵列 */
const GOAL_CHIP_LABEL: Record<(typeof GOAL_MODES)[number], string> = {
  "高 GPA": "GPA",
  最轻松毕业: "轻松",
  保研路线: "保研",
  留学路线: "留学",
  实习优先: "实习",
  时间自由: "时间",
  低压力模式: "低压",
  个性化定制: "自定",
};

const GOAL_FIT_TONE: Record<GoalFit, string> = {
  best: "bg-maya/15 text-maya ring-maya/40",
  ok: "bg-slate-100 text-slate-600 ring-slate-200",
  bad: "bg-flame/15 text-flame ring-flame/40",
};

export default function PlannerPage() {
  const { user, loading: authLoading } = useAuth();
  const isGuest = !authLoading && !user;
  const { profile } = useProfile();
  const goalMode = profile?.goal_mode ?? "高 GPA";

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
    error: progressError,
  } = useUserProgress(track?.id ?? null);

  const { completedCodes } = useCourses();
  const { incompleteReqIds } = useUserRequirementDone();

  const visibleReqsByCategoryId = useMemo(() => {
    const m = new Map<string, TrackRequirement[]>();
    for (const [catId, reqs] of requirementsByCategoryId.entries()) {
      const filtered = reqs.filter(isUserVisibleRequirement);
      if (filtered.length > 0) m.set(catId, filtered);
    }
    return m;
  }, [requirementsByCategoryId]);

  // 全 req 元数据索引（含隐藏的规则 req，link 可能指向它们）—— EvidencePanel 查 link target 标题
  const reqMetaById = useMemo(() => {
    const m = new Map<string, { code: string; title: string }>();
    for (const reqs of requirementsByCategoryId.values()) {
      for (const r of reqs) m.set(r.id, { code: r.code, title: r.title });
    }
    return m;
  }, [requirementsByCategoryId]);

  // 启发式即刻产骨架（首帧），排队 13.5 用 useRequirementAdvice 拿 DB advice merge
  const baselineRecommendation = useMemo(
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

  // 拉 DB advice + link（按可见 req 全集）
  const visibleReqIds = useMemo(() => {
    const out: string[] = [];
    for (const reqs of visibleReqsByCategoryId.values()) {
      for (const r of reqs) out.push(r.id);
    }
    return out;
  }, [visibleReqsByCategoryId]);

  const { adviceByReqId, linksByReqId } = useRequirementAdvice(goalMode, visibleReqIds);

  // DB advice 覆盖启发式骨架 paths[].reason；adviceByReqId 空时退回启发式
  const recommendation = useMemo(() => {
    if (adviceByReqId.size === 0) return baselineRecommendation;
    const enhancedPaths: RecommendedPath[] = baselineRecommendation.paths.map((p) => {
      const a = adviceByReqId.get(p.requirementId);
      if (!a) return p;
      return { ...p, reason: a.one_liner };
    });
    return { ...baselineRecommendation, paths: enhancedPaths };
  }, [baselineRecommendation, adviceByReqId]);

  const visibleRequirements = useMemo<VisibleRequirement[]>(() => {
    const pathByReq = new Map<string, RecommendedPath>();
    for (const p of recommendation.paths) pathByReq.set(p.requirementId, p);

    const out: VisibleRequirement[] = [];
    for (const category of categories) {
      const cls = classifyCategory(category.code, category.title);
      if (!cls) continue;
      const reqs = visibleReqsByCategoryId.get(category.id) ?? [];
      const categoryOptions = allOptionsByCategoryId.get(category.id) ?? [];
      const earnedCredits = calcCategoryCredits(categoryOptions, progressByOptionId);

      for (const requirement of reqs) {
        const options = optionsByRequirementId.get(requirement.id) ?? [];
        const progress = calcRequirementProgress(requirement, options, progressByOptionId);
        const path = pathByReq.get(requirement.id);
        // 反向勾选语义（排队 12.5 sub-task 0）：incompleteReqIds 是单一真相 ——
        // 用户在 Import 页取消勾选才会进 incompleteReqIds。
        // 不在集合 = 默认已完成（不再依赖 calcRequirementProgress 推导）。
        const isUnmet = incompleteReqIds.has(requirement.id);
        const advice = adviceByReqId.get(requirement.id);
        const shortcuts = advice?.shortcut_oneliners ?? [];
        out.push({
          category,
          requirement,
          options,
          recommendedOption: pickRecommendedOption(requirement, options, progressByOptionId),
          milestone: cls.milestone,
          bucket: cls.bucket,
          progress,
          earnedCredits,
          isUnmet,
          isOnPath: Boolean(path),
          pathReason: path?.reason,
          shortcuts,
        });
      }
    }
    return out.sort((a, b) => {
      if (a.isOnPath !== b.isOnPath) return a.isOnPath ? -1 : 1;
      if (a.milestone !== b.milestone) return a.milestone.localeCompare(b.milestone);
      if ((a.bucket ?? "") !== (b.bucket ?? ""))
        return (a.bucket ?? "").localeCompare(b.bucket ?? "");
      if (a.category.order_index !== b.category.order_index) {
        return a.category.order_index - b.category.order_index;
      }
      return a.requirement.order_index - b.requirement.order_index;
    });
  }, [
    categories,
    visibleReqsByCategoryId,
    allOptionsByCategoryId,
    optionsByRequirementId,
    progressByOptionId,
    recommendation.paths,
    incompleteReqIds,
    adviceByReqId,
  ]);

  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>("take");
  const [focusMode, setFocusMode] = useState<FocusMode>("all");
  // 排队 12.5：路径建议选中态 —— { reqId, index } 或 null。selected 切 req 时清掉。
  const [selectedShortcut, setSelectedShortcut] = useState<{ reqId: string; index: number } | null>(
    null,
  );

  const selected = useMemo(
    () =>
      visibleRequirements.find((item) => item.requirement.id === selectedReqId) ??
      visibleRequirements.find((item) => item.isOnPath) ??
      visibleRequirements[0] ??
      null,
    [selectedReqId, visibleRequirements],
  );

  useEffect(() => {
    if (!selected && selectedReqId) setSelectedReqId(null);
  }, [selected, selectedReqId]);

  // selected 变了清掉 shortcut 选中（避免 cross-req 残留）
  useEffect(() => {
    setSelectedShortcut(null);
  }, [selected?.requirement.id]);

  // 解析 selectedShortcut → 真实 AdviceShortcut 对象
  const resolvedShortcut = useMemo<AdviceShortcut | null>(() => {
    if (!selectedShortcut || !selected) return null;
    if (selected.requirement.id !== selectedShortcut.reqId) return null;
    return selected.shortcuts[selectedShortcut.index] ?? null;
  }, [selectedShortcut, selected]);

  const selectedShortcutKey = selectedShortcut
    ? `${selectedShortcut.reqId}:${selectedShortcut.index}`
    : null;

  const progressSummary = useMemo(() => {
    if (!track) return null;
    let earned = 0;
    for (const category of categories) {
      if (!classifyCategory(category.code, category.title)) continue;
      earned += calcCategoryCredits(
        allOptionsByCategoryId.get(category.id) ?? [],
        progressByOptionId,
      );
    }
    const unmet = visibleRequirements.filter((item) => item.isUnmet).length;
    const completedMatches = visibleRequirements.filter((item) =>
      item.options.some((option) => completedCodes.has(option.code)),
    ).length;
    return {
      earned,
      target: track.total_credits ?? null,
      visible: visibleRequirements.length,
      unmet,
      paths: recommendation.paths.length,
      completedMatches,
    };
  }, [
    track,
    categories,
    allOptionsByCategoryId,
    progressByOptionId,
    visibleRequirements,
    recommendation.paths.length,
    completedCodes,
  ]);

  const impact = useMemo(() => {
    if (!selected) return null;
    const option = selected.recommendedOption;
    const categoryOptions = allOptionsByCategoryId.get(selected.category.id) ?? [];
    const simulation = option
      ? simulatePick(
          option,
          selected.requirement,
          selected.category,
          selected.options,
          categoryOptions,
          progressByOptionId,
        )
      : null;

    const before = selected.progress?.current ?? 0;
    const target = selected.progress?.target ?? null;
    const missing = target == null ? 1 : Math.max(0, target - before);
    const after = actionMode === "delay" ? before : target == null ? before + 1 : target;
    const credits =
      simulation?.creditsDelta ??
      (selected.requirement.kind === "credits" ? missing : (option?.credits ?? 0));

    const status =
      actionMode === "delay"
        ? "风险后移"
        : actionMode === "switch"
          ? "目标重算"
          : option
            ? "可落地"
            : "规则级判断";

    return {
      option,
      status,
      credits,
      before,
      after,
      target,
      unit: selected.progress?.unit,
      categoryBefore: simulation?.categoryProgress.beforeCredits ?? selected.earnedCredits,
      categoryAfter:
        actionMode === "delay"
          ? selected.earnedCredits
          : (simulation?.categoryProgress.afterCredits ?? selected.earnedCredits + credits),
      categoryTarget:
        simulation?.categoryProgress.target ?? selected.category.credit_target ?? null,
    };
  }, [actionMode, allOptionsByCategoryId, progressByOptionId, selected]);

  async function handleMarkDone() {
    if (!selected?.recommendedOption || isGuest) return;
    await upsertProgress(selected.recommendedOption.id, { status: "done" });
  }

  if (trackLoading) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-5 pt-[1vh] pr-[3vw]">
        <PathLoader caption="正在计算学业路径" />
      </section>
    );
  }

  if (trackError || !track) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-2xl border border-flame/40 bg-flame/10 p-6 text-slate-700">
          <h1 className="text-xl font-semibold">没有读到培养方案</h1>
          <p className="mt-2 text-sm leading-6">
            {trackError ?? "公共 track 数据为空。请先确认学校规则 seed 已经落库。"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex max-w-[1500px] flex-col px-4 py-4 sm:px-6 lg:px-8 xl:h-[calc(100vh-5rem)]">
      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
        <main className="flex min-w-0 min-h-0 flex-col gap-3">
          <WorkbenchHeader
            school={track.school}
            year={track.year}
            goalMode={goalMode}
            summary={progressSummary}
            focusMode={focusMode}
            onFocusModeChange={setFocusMode}
          />

          <PathGraph
            items={visibleRequirements}
            selectedId={selected?.requirement.id ?? null}
            focusMode={focusMode}
            onSelect={setSelectedReqId}
            onShortcutSelect={(reqId, index) => setSelectedShortcut({ reqId, index })}
            selectedShortcutKey={selectedShortcutKey}
          />
        </main>

        <aside className="scrollbar-thin flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white xl:overflow-y-auto">
          <ImpactPanel
            selected={selected}
            actionMode={actionMode}
            impact={impact}
            isGuest={isGuest}
            error={progressError}
            shortcut={resolvedShortcut}
            onActionChange={setActionMode}
            onMarkDone={() => void handleMarkDone()}
            onClearShortcut={() => setSelectedShortcut(null)}
          />
          <div className="h-px bg-slate-200" />
          <EvidencePanel
            selected={selected}
            links={selected ? (linksByReqId.get(selected.requirement.id) ?? []) : []}
            reqMetaById={reqMetaById}
          />
        </aside>
      </div>
    </section>
  );
}

function WorkbenchHeader({
  school,
  year,
  goalMode,
  summary,
  focusMode,
  onFocusModeChange,
}: {
  school: string;
  year: number;
  goalMode: GoalMode;
  summary: {
    earned: number;
    target: number | null;
    visible: number;
    unmet: number;
    paths: number;
    completedMatches: number;
  } | null;
  focusMode: FocusMode;
  onFocusModeChange: (mode: FocusMode) => void;
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
      {/* 主信息：goal 强调 + 进度 bar 占主轴（视觉主体） */}
      <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gold/60 bg-white px-3 text-sm font-semibold text-slate-900">
        <Target className="h-3.5 w-3.5 text-gold" />
        {goalMode}
      </span>

      {/* 次要信息：学校 + KPI 计数 muted 小号（下沉次级） */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <span>
          {school} · {year} 级
        </span>
        <span className="text-slate-300">·</span>
        <span>
          推荐{" "}
          <strong className="font-semibold text-slate-700 tabular-nums">
            {summary?.paths ?? 0}
          </strong>
        </span>
        <span className="text-slate-300">·</span>
        <span>
          可见{" "}
          <strong className="font-semibold text-slate-700 tabular-nums">
            {summary?.visible ?? 0}
          </strong>
        </span>
        <span className="text-slate-300">·</span>
        <span>
          待处理{" "}
          <strong className="font-semibold text-slate-700 tabular-nums">
            {summary?.unmet ?? 0}
          </strong>
        </span>
      </div>

      {/* 操作:focus toggle —— ml-auto 真把它推到 header 最右端 */}
      <div className="ml-auto flex h-8 items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onFocusModeChange("all")}
          className={`h-6 rounded-full px-3 text-xs font-medium transition-all ${
            focusMode === "all" ? "bg-brand-gradient text-white" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          全部路径
        </button>
        <button
          type="button"
          onClick={() => onFocusModeChange("recommended")}
          className={`h-6 rounded-full px-3 text-xs font-medium transition-all ${
            focusMode === "recommended" ? "bg-brand-gradient text-white" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          只看推荐
        </button>
      </div>
    </header>
  );
}

function PathGraph({
  items,
  selectedId,
  focusMode,
  onSelect,
  onShortcutSelect,
  selectedShortcutKey,
}: {
  items: VisibleRequirement[];
  selectedId: string | null;
  focusMode: FocusMode;
  onSelect: (id: string) => void;
  onShortcutSelect: (reqId: string, index: number) => void;
  selectedShortcutKey: string | null;
}) {
  const defaultMilestones = useMemo(
    () => new Set<UserMilestoneCode>(USER_MILESTONES.map((m) => m.code)),
    [],
  );
  const [expandedMilestones, setExpandedMilestones] =
    useState<Set<UserMilestoneCode>>(defaultMilestones);
  const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(new Set(["course:专业必修"]));
  const [expandedRequirements, setExpandedRequirements] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  // 点击跟踪滚动：存被点节点 id + 可选 revealRight（展开时下一层右边界）
  // useEffect 用新 graph 节点坐标决定双向滚动（左/右/上/下）
  const pendingScrollRef = useRef<{ srcId: string; revealRight?: number } | null>(null);

  useEffect(() => {
    const next = new Set<string>();
    for (const item of items) {
      if (item.isOnPath) next.add(bucketKey(item.milestone, item.bucket));
    }
    if (next.size > 0) setExpandedBuckets((prev) => new Set([...prev, ...next]));
  }, [items]);

  const filteredItems = focusMode === "recommended" ? items.filter((item) => item.isOnPath) : items;
  const graph = useMemo(
    () =>
      buildGraph({
        items: filteredItems,
        selectedId,
        selectedShortcutKey,
        expandedMilestones,
        expandedBuckets,
        expandedRequirements,
      }),
    [
      filteredItems,
      selectedId,
      selectedShortcutKey,
      expandedMilestones,
      expandedBuckets,
      expandedRequirements,
    ],
  );

  function queueScroll(srcId: string, revealRight?: number) {
    pendingScrollRef.current = { srcId, revealRight };
  }

  function toggleMilestone(code: UserMilestoneCode) {
    const willExpand = !expandedMilestones.has(code);
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    // 展开：露出 bucket 层（x=410 w=170 → 右边界 580）；折叠：只保证 milestone 本身可见
    queueScroll(`milestone:${code}`, willExpand ? 580 : undefined);
  }

  function toggleBucket(key: string) {
    const willExpand = !expandedBuckets.has(key);
    setExpandedBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    // 展开：露出 requirement 层（x=650 w=360 → 右边界 1010）
    queueScroll(`bucket:${key}`, willExpand ? 1010 : undefined);
  }

  function toggleRequirement(reqId: string) {
    const willExpand = !expandedRequirements.has(reqId);
    setExpandedRequirements((prev) => {
      const next = new Set(prev);
      if (next.has(reqId)) next.delete(reqId);
      else next.add(reqId);
      return next;
    });
    // 展开：露出 shortcut 层（x=1050 w=320 → 右边界 1370）
    queueScroll(`requirement:${reqId}`, willExpand ? 1370 : undefined);
  }

  // graph 变化（展开/折叠/选中切换）后跟随滚动：
  // - 横向：被点节点若跑出视口左 → 左滚到它；wantRight 若跑出视口右 → 右滚露出
  // - 纵向：节点在视口外 → 滚到视口偏上 1/4
  useEffect(() => {
    const pending = pendingScrollRef.current;
    const container = scrollRef.current;
    if (!pending || !container) return;
    pendingScrollRef.current = null;

    const src = graph.nodes.find((n) => n.id === pending.srcId);
    if (!src) return;

    const srcLeft = src.x;
    const srcRight = src.x + src.w;
    const srcY = src.y;
    const wantRight = pending.revealRight ?? srcRight;
    const margin = 40;

    let targetLeft = container.scrollLeft;
    let targetTop = container.scrollTop;

    const visibleLeft = container.scrollLeft;
    const visibleRight = visibleLeft + container.clientWidth;
    if (srcLeft < visibleLeft + margin) {
      // 被点节点在视口左侧外 → 往左滚显示节点
      targetLeft = Math.max(0, srcLeft - margin);
    } else if (wantRight > visibleRight - margin) {
      // 需要露出右边新层级（或节点自身右边界）
      targetLeft = Math.max(0, wantRight - container.clientWidth + 60);
    }

    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;
    if (srcY < visibleTop + 40 || srcY > visibleBottom - 200) {
      targetTop = Math.max(0, srcY - container.clientHeight / 4);
    }

    if (targetLeft !== container.scrollLeft || targetTop !== container.scrollTop) {
      container.scrollTo({ left: targetLeft, top: targetTop, behavior: "smooth" });
    }
  }, [graph]);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* 悬浮毛玻璃图例 —— 一小块，浮在画布左上，pointer-events-none 不挡画布交互 */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white/55 px-3 py-2 text-xs text-slate-500 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
        <LegendDot className="bg-gold" label="推荐路径" />
        <LegendDot className="bg-maya" label="已满足" />
        <LegendDot className="bg-slate-300" label="其他路径" />
        <span className="inline-flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          可展开看建议
        </span>
        <span className="inline-flex items-center gap-1">
          <MousePointer2 className="h-3.5 w-3.5" />
          点选后看右侧影响
        </span>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin relative min-h-[420px] flex-1 overflow-auto bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] bg-[size:22px_22px]"
      >
        <div className="relative" style={{ width: graph.width, height: graph.height }}>
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              {/* 推荐连线渐变：gold → maya，沿连线左→右流向目标 */}
              <linearGradient id="edge-rec" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FFB62E" />
                <stop offset="100%" stopColor="#7CC3FF" />
              </linearGradient>
            </defs>
            {graph.edges.map((edge) => (
              <path
                key={edge.id}
                d={edgePath(edge.from, edge.to)}
                fill="none"
                stroke={edge.isRecommended ? "url(#edge-rec)" : "#cbd5e1"}
                strokeWidth={edge.isRecommended ? 2.2 : 1.2}
                strokeDasharray={edge.isRecommended ? undefined : "4 8"}
                strokeLinecap="round"
              />
            ))}
          </svg>

          {graph.nodes.map((node) => (
            <GraphNodeButton
              key={node.id}
              node={node}
              onClick={() => {
                if (node.kind === "milestone") {
                  toggleMilestone(node.id.replace("milestone:", "") as UserMilestoneCode);
                  return;
                }
                if (node.kind === "bucket") {
                  toggleBucket(node.id.replace("bucket:", ""));
                  return;
                }
                if (node.kind === "requirement") {
                  if (node.item) {
                    onSelect(node.item.requirement.id);
                    if (node.item.shortcuts.length > 0) {
                      // toggleRequirement 内部已 queueScroll
                      toggleRequirement(node.item.requirement.id);
                    } else {
                      // 仅选中：也跟随到节点，避免视口卡在别处
                      queueScroll(node.id);
                    }
                  }
                  return;
                }
                if (node.kind === "shortcut" && node.shortcut) {
                  onShortcutSelect(node.shortcut.reqId, node.shortcut.index);
                  queueScroll(node.id);
                  return;
                }
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface NodeTone {
  /** 端口圆点底色 */
  dot: string;
  /** active 选中环颜色 */
  ring: string;
  /** 前导图标颜色 */
  iconColor: string;
  /** 前导图标小色块底色 */
  iconBg: string;
}

/**
 * 节点配色统一出口：按 kind / isRecommended / isComplete 决定 accent。
 * 集中管理避免颜色散落（推荐 gold / 已满足 maya / 其他 slate）。
 */
function toneOf(node: GraphNode): NodeTone {
  if (node.kind === "shortcut" || node.isRecommended) {
    return {
      dot: "bg-gold",
      ring: "ring-gold/70",
      iconColor: "text-gold",
      iconBg: "bg-gold/10",
    };
  }
  if (node.isComplete) {
    return {
      dot: "bg-maya",
      ring: "ring-maya/70",
      iconColor: "text-maya",
      iconBg: "bg-maya/10",
    };
  }
  return {
    dot: "bg-slate-300",
    ring: "ring-sapphire/60",
    iconColor: "text-slate-400",
    iconBg: "bg-slate-100",
  };
}

function GraphNodeButton({ node, onClick }: { node: GraphNode; onClick: () => void }) {
  const isStructure = node.kind === "root" || node.kind === "milestone" || node.kind === "bucket";
  const tone = toneOf(node);
  const active = node.isActive ? `ring-2 ${tone.ring} ring-offset-2 ring-offset-white` : "";

  // root 无 input 端口；shortcut 是叶子无 output 端口
  const hasInput = node.kind !== "root";
  const hasOutput = node.kind !== "shortcut";

  // requirement 节点有捷径时（isCollapsed 非 undefined）用箭头示意可展开，
  // 否则 CircleDot。结构节点(root/milestone/bucket)恒用箭头。
  const LeadIcon =
    node.kind === "shortcut"
      ? Lightbulb
      : isStructure
        ? node.isCollapsed
          ? ChevronRight
          : ChevronDown
        : node.kind === "requirement" && node.isCollapsed !== undefined
          ? node.isCollapsed
            ? ChevronRight
            : ChevronDown
          : CircleDot;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute rounded-xl border border-slate-200/80 bg-white py-2 pl-4 pr-3 text-left text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_-6px_rgba(15,23,42,0.10)] transition hover:border-slate-300 hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_12px_26px_-8px_rgba(15,23,42,0.16)] ${active}`}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
    >
      {/* 端口圆点：贴左右边缘中点，白环让它"浮"在卡片边上 */}
      {hasInput && (
        <span
          className={`pointer-events-none absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${tone.dot}`}
          aria-hidden="true"
        />
      )}
      {hasOutput && (
        <span
          className={`pointer-events-none absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full ring-2 ring-white ${tone.dot}`}
          aria-hidden="true"
        />
      )}

      <div className="flex items-center gap-2">
        {node.kind !== "shortcut" && (
          <span
            className={`inline-flex h-5 w-5 flex-none items-center justify-center rounded-md ${tone.iconBg}`}
          >
            <LeadIcon className={`h-3 w-3 ${tone.iconColor}`} />
          </span>
        )}
        <span
          className={`min-w-0 text-xs font-semibold ${
            node.kind === "requirement" || node.kind === "shortcut"
              ? "line-clamp-2 leading-4"
              : "truncate"
          }`}
        >
          {node.title}
        </span>
      </div>
      <div
        className={`mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500 ${
          node.kind === "shortcut" ? "" : "pl-7"
        }`}
      >
        <span className="min-w-0 truncate">{node.meta}</span>
        {node.count != null && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700 ring-1 ring-slate-200">
            {node.count}
          </span>
        )}
      </div>
    </button>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function buildGraph({
  items,
  selectedId,
  selectedShortcutKey,
  expandedMilestones,
  expandedBuckets,
  expandedRequirements,
}: {
  items: VisibleRequirement[];
  selectedId: string | null;
  selectedShortcutKey: string | null;
  expandedMilestones: Set<UserMilestoneCode>;
  expandedBuckets: Set<string>;
  expandedRequirements: Set<string>;
}) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const reqRows = Math.max(1, items.length);
  const height = Math.max(620, reqRows * 74 + 170);
  const width = 1400;

  const root: GraphNode = {
    id: "root",
    kind: "root",
    x: 24,
    y: Math.round(height / 2 - 35),
    w: 132,
    h: 70,
    title: "我的目标",
    meta: "规则已匹配",
    // count 留空:在"路径画布"语境下数字 badge 容易被读成"N 路径",
    // 用户不需要知道有几条规则匹配
    isRecommended: true,
    isActive: false,
  };
  nodes.push(root);

  const milestones = USER_MILESTONES.map((milestone, index) => {
    const milestoneItems = items.filter((item) => item.milestone === milestone.code);
    const y = Math.round(90 + index * Math.max(130, (height - 210) / USER_MILESTONES.length));
    const node: GraphNode = {
      id: `milestone:${milestone.code}`,
      kind: "milestone",
      x: 210,
      y,
      w: 150,
      h: 64,
      title: MILESTONE_LABEL[milestone.code],
      meta: expandedMilestones.has(milestone.code) ? "已展开" : "点击展开",
      // count 同 root:数字 badge 在路径画布语境下会被误读成"N 路径"
      isRecommended: milestoneItems.some((item) => item.isOnPath),
      isActive: false,
      isCollapsed: !expandedMilestones.has(milestone.code),
    };
    nodes.push(node);
    edges.push({
      id: `root-${milestone.code}`,
      from: root,
      to: node,
      isRecommended: node.isRecommended,
    });
    return { code: milestone.code, node };
  });

  let bucketY = 58;
  let requirementY = 40;
  for (const milestone of milestones) {
    if (!expandedMilestones.has(milestone.code)) continue;

    // 论文 / 第二课堂：无可见课程节点，直接在 milestone 右侧挂建议捷径
    if (milestone.code !== "course") {
      const msShortcuts = MILESTONE_SHORTCUTS[milestone.code] ?? [];
      for (let i = 0; i < msShortcuts.length; i += 1) {
        const sc = msShortcuts[i];
        const scNode: GraphNode = {
          id: `mshortcut:${milestone.code}:${i}`,
          kind: "shortcut",
          x: 410,
          y: bucketY + i * 60,
          w: 340,
          h: 52,
          title: sc.oneLiner,
          meta: `建议 · ${sc.id}`,
          isRecommended: false,
          isActive: false,
        };
        nodes.push(scNode);
        edges.push({
          id: `${milestone.node.id}-${scNode.id}`,
          from: milestone.node,
          to: scNode,
          isRecommended: false,
        });
      }
      bucketY += msShortcuts.length * 60 + 24;
      continue;
    }

    const milestoneItems = items.filter((item) => item.milestone === milestone.code);
    const bucketLabels =
      milestone.code === "course"
        ? COURSE_BUCKETS.filter((bucket) => milestoneItems.some((item) => item.bucket === bucket))
        : (["关键事项"] as const);

    for (const bucket of bucketLabels) {
      const key =
        milestone.code === "course"
          ? bucketKey(milestone.code, bucket as CourseBucket)
          : bucketKey(milestone.code);
      const bucketItems =
        milestone.code === "course"
          ? milestoneItems.filter((item) => item.bucket === bucket)
          : milestoneItems;
      if (bucketItems.length === 0) continue;

      const bucketNode: GraphNode = {
        id: `bucket:${key}`,
        kind: "bucket",
        x: 410,
        y: bucketY,
        w: 170,
        h: 58,
        title: String(bucket),
        meta: expandedBuckets.has(key) ? "显示具体机会" : "点击看机会",
        // count 留空,同 root / milestone:避免被读成"N 路径"
        isRecommended: bucketItems.some((item) => item.isOnPath),
        isActive: false,
        isCollapsed: !expandedBuckets.has(key),
      };
      nodes.push(bucketNode);
      edges.push({
        id: `${milestone.node.id}-${bucketNode.id}`,
        from: milestone.node,
        to: bucketNode,
        isRecommended: bucketNode.isRecommended,
      });

      if (expandedBuckets.has(key)) {
        for (const item of bucketItems) {
          const reqNode: GraphNode = {
            id: `requirement:${item.requirement.id}`,
            kind: "requirement",
            x: 650,
            y: requirementY,
            w: 360,
            h: 74,
            title: item.requirement.title,
            meta: `${item.category.title} · ${formatMissing(item)}`,
            item,
            isRecommended: item.isOnPath,
            isActive: item.requirement.id === selectedId,
            isComplete: !item.isUnmet,
            isCollapsed:
              item.shortcuts.length > 0
                ? !expandedRequirements.has(item.requirement.id)
                : undefined,
          };
          nodes.push(reqNode);
          edges.push({
            id: `${bucketNode.id}-${reqNode.id}`,
            from: bucketNode,
            to: reqNode,
            isRecommended: item.isOnPath,
          });
          requirementY += 88;

          // 排队 12.5：requirement 展开后渲染 shortcut 子节点
          if (expandedRequirements.has(item.requirement.id) && item.shortcuts.length > 0) {
            for (let i = 0; i < item.shortcuts.length; i += 1) {
              const sc = item.shortcuts[i];
              const scKey = `${item.requirement.id}:${i}`;
              const scNode: GraphNode = {
                id: `shortcut:${scKey}`,
                kind: "shortcut",
                x: 1050,
                y: requirementY - 88 + i * 60,
                w: 320,
                h: 52,
                title: sc.oneLiner ?? "未命名建议",
                meta: sc.id ? `路径建议 · ${sc.id}` : "路径建议",
                shortcut: { reqId: item.requirement.id, index: i, data: sc },
                isRecommended: item.isOnPath,
                isActive: selectedShortcutKey === scKey,
              };
              nodes.push(scNode);
              edges.push({
                id: `${reqNode.id}-${scNode.id}`,
                from: reqNode,
                to: scNode,
                isRecommended: item.isOnPath,
              });
            }
            // 给后续 requirement 让出空间：每条 shortcut 60px，加 12px 间隔
            const shortcutBlock = item.shortcuts.length * 60 + 12;
            requirementY = Math.max(requirementY, requirementY - 88 + shortcutBlock);
          }
        }
        bucketY = Math.max(bucketY + 82, requirementY - bucketItems.length * 8);
      } else {
        bucketY += 82;
      }
    }
  }

  return { nodes, edges, width, height: Math.max(height, requirementY + 110, bucketY + 110) };
}

function edgePath(from: GraphNode, to: GraphNode): string {
  const x1 = from.x + from.w;
  const y1 = from.y + from.h / 2;
  const x2 = to.x;
  const y2 = to.y + to.h / 2;
  const mid = Math.max(40, (x2 - x1) * 0.52);
  return `M ${x1} ${y1} C ${x1 + mid} ${y1}, ${x2 - mid} ${y2}, ${x2} ${y2}`;
}

function bucketKey(milestone: UserMilestoneCode, bucket?: CourseBucket): string {
  return bucket ? `${milestone}:${bucket}` : milestone;
}

function ImpactPanel({
  selected,
  actionMode,
  impact,
  isGuest,
  error,
  shortcut,
  onActionChange,
  onMarkDone,
  onClearShortcut,
}: {
  selected: VisibleRequirement | null;
  actionMode: ActionMode;
  impact: ImpactData | null;
  isGuest: boolean;
  error: string | null;
  shortcut: AdviceShortcut | null;
  onActionChange: (mode: ActionMode) => void;
  onMarkDone: () => void;
  onClearShortcut: () => void;
}) {
  if (!selected || !impact) {
    return (
      <section className="px-5 py-4">
        <p className="text-sm text-slate-500">选择左侧一个节点后，这里会显示后果分析。</p>
      </section>
    );
  }

  // 排队 12.5：路径建议视图 —— shortcut 非空时切换为路径建议详情卡
  if (shortcut) {
    return <ShortcutDetail selected={selected} shortcut={shortcut} onClear={onClearShortcut} />;
  }

  return (
    <section className="px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PanelRightOpen className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-slate-950">选择模拟器</h2>
        </div>
        {selected.isOnPath && (
          <span className="rounded-full bg-brand-gradient px-2 py-1 text-[11px] font-medium text-white shadow-sm">
            推荐路径
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold leading-6 text-slate-950">
        {selected.requirement.title}
      </h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {selected.category.title} · {formatMissing(selected)}
      </p>

      {selected.pathReason && (
        <div className="mt-4 border-l-2 border-sapphire/50 pl-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sapphire" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sapphire">
              AI 理由
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-slate-700">{selected.pathReason}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-slate-100 p-1">
        {(Object.keys(ACTION_LABEL) as ActionMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onActionChange(mode)}
            className={`rounded-full px-2 py-1.5 text-xs font-medium transition-colors ${
              actionMode === mode ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
            }`}
          >
            {ACTION_LABEL[mode]}
          </button>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <ImpactMetric
            icon={GraduationCap}
            label="学分影响"
            value={actionMode === "delay" ? "0" : `+${fmtCredits(impact.credits)}`}
          />
          <ImpactMetric
            icon={Target}
            label="本要求"
            value={`${fmtNum(impact.before)} → ${fmtNum(impact.after)}`}
          />
          <ImpactMetric
            icon={Layers3}
            label="本分类"
            value={`${fmtCredits(impact.categoryBefore)} → ${fmtCredits(impact.categoryAfter)}`}
          />
          <ImpactMetric
            icon={Clock3}
            label="时间后果"
            value={
              actionMode === "delay" ? "后移" : selected.recommendedOption ? "可执行" : "待拆分"
            }
          />
        </div>
      </div>

      {impact.option && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-maya">可执行选项</p>
          <h3 className="mt-2 text-sm font-semibold text-slate-950">
            {impact.option.code} · {impact.option.name}
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            {impact.option.credits != null
              ? `${fmtCredits(impact.option.credits)} 学分`
              : "学分待定"}
          </p>
          <button
            type="button"
            onClick={onMarkDone}
            disabled={isGuest}
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-950 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            标为已完成
          </button>
        </div>
      )}

      {!impact.option && (
        <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
          想标这条「未完成」？去 <strong className="text-slate-900">Upload 页 Section 8</strong>{" "}
          反向勾选。
        </p>
      )}

      {isGuest && (
        <p className="mt-3 text-xs text-slate-400">访客模式可看模拟，登录后才能保存进度。</p>
      )}
      {error && <p className="mt-3 text-xs text-flame">{error}</p>}
    </section>
  );
}

/** 排队 12.5：路径建议详情视图 —— shortcut 选中时替换 ImpactPanel 主体 */
function ShortcutDetail({
  selected,
  shortcut,
  onClear,
}: {
  selected: VisibleRequirement;
  shortcut: AdviceShortcut;
  onClear: () => void;
}) {
  const candidates = shortcut.candidates ?? [];
  return (
    <section className="px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-gold" />
          <h2 className="font-semibold text-slate-950">路径建议详情</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
        >
          ← 返回 requirement 视图
        </button>
      </div>

      <p className="mt-1 text-[11px] text-slate-500">所属规则：{selected.requirement.title}</p>

      <h3 className="mt-3 border-l-2 border-gold/60 pl-3 text-sm font-semibold leading-6 text-slate-950">
        {shortcut.oneLiner ?? "未命名建议"}
      </h3>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          对各目标的适配
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {GOAL_MODES.map((g) => {
            const fit = shortcut.goalFit?.[g] ?? "ok";
            return (
              <span
                key={g}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${GOAL_FIT_TONE[fit]}`}
                title={`${g} · ${fit}`}
              >
                {GOAL_CHIP_LABEL[g]}
                <span className="text-[10px] opacity-70">
                  {fit === "best" ? "✓" : fit === "bad" ? "✗" : "—"}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          兴趣 → AI 推荐课程（待启用）
        </p>
        <textarea
          disabled
          placeholder="想做什么方向？（接通真 LLM 后启用，会按你的兴趣 + 已修课表 + 学校规则推荐具体课）"
          className="mt-2 h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs leading-5 text-slate-500 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <button
          type="button"
          disabled
          title="排队 13.2 接真 LLM 后启用"
          className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-950 px-3 text-[11px] font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Sparkles className="h-3 w-3" />
          AI 推荐
        </button>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          目前是 mock 占位；接通真 LLM provider（13.2）后会按你的兴趣 + 已修课 +
          学校规则现算具体课程。
        </p>
      </div>

      {candidates.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            候选课程
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {candidates.map((c, i) => (
              <span
                key={`${c.code}-${i}`}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                title={c.reason}
              >
                {c.code}
                {c.name ? ` · ${c.name}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ImpactMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-950">{value}</p>
    </div>
  );
}

function EvidencePanel({
  selected,
  links,
  reqMetaById,
}: {
  selected: VisibleRequirement | null;
  links: RequirementLink[];
  reqMetaById: Map<string, { code: string; title: string }>;
}) {
  return (
    <section className="px-5 py-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-slate-500" />
        <h2 className="font-semibold text-slate-950">规则证据</h2>
      </div>
      {selected ? (
        <div className="mt-4 divide-y divide-slate-200 text-sm">
          <EvidenceLine icon={BookOpen} label="规则" value={selected.requirement.title} />
          <EvidenceLine icon={Compass} label="分类" value={selected.category.title} />
          <EvidenceLine
            icon={Lightbulb}
            label="AI 理由"
            value={selected.pathReason ?? "这项会影响当前目标下的毕业路径。"}
          />
          <div className="pt-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              来源
            </p>
            <p className="mt-1.5 text-xs leading-5 text-slate-600">
              {selected.requirement.source_ref ?? "暂无 source_ref"}
            </p>
          </div>
          {links.length > 0 && (
            <RelatedRulesBlock selected={selected} links={links} reqMetaById={reqMetaById} />
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">选择一个节点后查看引用来源。</p>
      )}
    </section>
  );
}

function RelatedRulesBlock({
  selected,
  links,
  reqMetaById,
}: {
  selected: VisibleRequirement;
  links: RequirementLink[];
  reqMetaById: Map<string, { code: string; title: string }>;
}) {
  const selfId = selected.requirement.id;
  // 把 link 按"我是 from 还是 to"分方向，统一计算 target req
  const items = links.map((l) => {
    const isFrom = l.from_req === selfId;
    const otherId = isFrom ? l.to_req : l.from_req;
    const meta = reqMetaById.get(otherId);
    return {
      key: l.id,
      kind: l.kind,
      label: LINK_KIND_LABELS[l.kind],
      direction: isFrom ? ("out" as const) : ("in" as const),
      bidirectional: l.bidirectional,
      otherCode: meta?.code ?? "—",
      otherTitle: meta?.title ?? "（未知 req）",
      note: l.note,
      metadata: l.metadata as Record<string, unknown>,
    };
  });
  return (
    <div className="pt-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
        相关规则 · {items.length}
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((it) => (
          <li key={it.key} className="text-xs leading-5">
            <div className="flex items-center gap-1.5">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${KIND_PILL_CLASS[it.kind]}`}
              >
                {it.label}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {it.direction === "out" ? "→" : "←"} {it.otherCode}
              </span>
              {it.bidirectional && <span className="text-[10px] text-slate-400">（双向）</span>}
            </div>
            <p className="mt-1 text-slate-600">{it.note ?? it.otherTitle}</p>
            {it.metadata && Object.keys(it.metadata).length > 0 && (
              <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                {JSON.stringify(it.metadata)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const KIND_PILL_CLASS: Record<RequirementLink["kind"], string> = {
  substitute: "bg-maya/15 text-maya",
  prerequisite: "bg-sapphire/15 text-sapphire",
  excludes: "bg-flame/15 text-flame",
  cross_ref: "bg-slate-100 text-slate-700",
  triggers: "bg-gold/15 text-gold",
};

function EvidenceLine({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 pb-3 first:pt-0 [&:not(:first-child)]:pt-3">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
      <div>
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function formatMissing(item: VisibleRequirement): string {
  if (!item.progress) return item.isUnmet ? "待判断" : "已满足";
  if (item.progress.target == null) {
    return `${fmtNum(item.progress.current)} ${item.progress.unit ?? ""}`;
  }
  const missing = Math.max(0, item.progress.target - item.progress.current);
  if (missing <= 0) return "已满足";
  return `还差 ${fmtNum(missing)}${item.progress.unit ?? ""}`;
}

function fmtCredits(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}

function fmtNum(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}
