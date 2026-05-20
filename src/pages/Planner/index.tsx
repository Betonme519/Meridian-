import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Clock3,
  Compass,
  GitBranchPlus,
  GraduationCap,
  Layers3,
  Lightbulb,
  Loader2,
  MousePointer2,
  PanelRightOpen,
  Search,
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

type ActionMode = "take" | "delay" | "switch";
type FocusMode = "all" | "recommended";
type GraphNodeKind = "root" | "milestone" | "bucket" | "requirement";

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

const GOAL_COPY: Record<GoalMode, string> = {
  "高 GPA": "优先标出收益高、但需要控制风险的路径。",
  最轻松毕业: "优先标出成本最低、最容易补齐的路径。",
  保研路线: "优先标出排名、核心课与科研时间之间的取舍。",
  留学路线: "优先标出 GPA、课程含金量与推荐信价值。",
  实习优先: "优先标出不挤压连续实习时间的安排。",
  时间自由: "优先标出能保留大块个人时间的安排。",
  低压力模式: "优先标出考试重负少、后果更轻的安排。",
  个性化定制: "按你的权重组合高亮多目标折中路径。",
};

const ACTION_LABEL: Record<ActionMode, string> = {
  take: "选择它",
  delay: "推迟它",
  switch: "换目标",
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

  const visibleReqsByCategoryId = useMemo(() => {
    const m = new Map<string, TrackRequirement[]>();
    for (const [catId, reqs] of requirementsByCategoryId.entries()) {
      const filtered = reqs.filter(isUserVisibleRequirement);
      if (filtered.length > 0) m.set(catId, filtered);
    }
    return m;
  }, [requirementsByCategoryId]);

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
        const isUnmet =
          progress == null || progress.target == null || progress.current < progress.target;
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
  ]);

  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>("take");
  const [focusMode, setFocusMode] = useState<FocusMode>("all");

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
      <section className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在计算你的毕业路径
        </div>
      </section>
    );
  }

  if (trackError || !track) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <h1 className="text-xl font-semibold">没有读到培养方案</h1>
          <p className="mt-2 text-sm leading-6">
            {trackError ?? "公共 track 数据为空。请先确认学校规则 seed 已经落库。"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
        <main className="min-w-0 space-y-4">
          <WorkbenchHeader
            school={track.school}
            year={track.year}
            goalMode={goalMode}
            summary={progressSummary}
            focusMode={focusMode}
            onFocusModeChange={setFocusMode}
          />

          <PathGraph
            goalMode={goalMode}
            items={visibleRequirements}
            selectedId={selected?.requirement.id ?? null}
            focusMode={focusMode}
            onSelect={setSelectedReqId}
          />
        </main>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <ImpactPanel
            selected={selected}
            actionMode={actionMode}
            impact={impact}
            isGuest={isGuest}
            error={progressError}
            onActionChange={setActionMode}
            onMarkDone={() => void handleMarkDone()}
          />
          <EvidencePanel selected={selected} />
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
  const progress =
    summary?.target && summary.target > 0
      ? Math.min(100, Math.round((summary.earned / summary.target) * 100))
      : 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              {goalMode}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              {school} · {year} 级
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{GOAL_COPY[goalMode]}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MetricChip icon={Sparkles} label="推荐" value={`${summary?.paths ?? 0} 条`} />
          <MetricChip icon={GitBranchPlus} label="可见节点" value={`${summary?.visible ?? 0}`} />
          <MetricChip icon={Search} label="待处理" value={`${summary?.unmet ?? 0}`} />
          <div className="flex h-9 items-center rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => onFocusModeChange("all")}
              className={`h-7 rounded-full px-3 text-xs font-medium transition-colors ${
                focusMode === "all" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
              }`}
            >
              全部路径
            </button>
            <button
              type="button"
              onClick={() => onFocusModeChange("recommended")}
              className={`h-7 rounded-full px-3 text-xs font-medium transition-colors ${
                focusMode === "recommended" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
              }`}
            >
              只看推荐
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[240px_1fr] lg:items-center">
        <div className="text-xs text-slate-500">
          已匹配 {summary?.completedMatches ?? 0} 个已修课程，当前学分{" "}
          <span className="font-semibold text-slate-900">{fmtCredits(summary?.earned ?? 0)}</span>
          {summary?.target != null && ` / ${fmtCredits(summary.target)}`}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function MetricChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-600">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      {label}
      <strong className="font-semibold text-slate-950">{value}</strong>
    </span>
  );
}

function PathGraph({
  goalMode,
  items,
  selectedId,
  focusMode,
  onSelect,
}: {
  goalMode: GoalMode;
  items: VisibleRequirement[];
  selectedId: string | null;
  focusMode: FocusMode;
  onSelect: (id: string) => void;
}) {
  const defaultMilestones = useMemo(
    () => new Set<UserMilestoneCode>(USER_MILESTONES.map((m) => m.code)),
    [],
  );
  const [expandedMilestones, setExpandedMilestones] =
    useState<Set<UserMilestoneCode>>(defaultMilestones);
  const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(new Set(["course:专业必修"]));

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
        expandedMilestones,
        expandedBuckets,
      }),
    [filteredItems, selectedId, expandedMilestones, expandedBuckets],
  );

  function toggleMilestone(code: UserMilestoneCode) {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleBucket(key: string) {
    setExpandedBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <GitBranchPlus className="h-4 w-4 text-slate-600" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-950">路径画布</h2>
            <p className="truncate text-xs text-slate-500">
              点击节点展开下一层；金色线表示当前 {goalMode} 下最值得先看的路径。
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <LegendDot className="bg-amber-500" label="推荐路径" />
          <LegendDot className="bg-emerald-500" label="已满足" />
          <LegendDot className="bg-slate-300" label="其他路径" />
          <span className="inline-flex items-center gap-1">
            <MousePointer2 className="h-3.5 w-3.5" />
            点选后看右侧影响
          </span>
        </div>
      </div>

      <div className="relative h-[680px] overflow-auto bg-[linear-gradient(#f8fafc_1px,transparent_1px),linear-gradient(90deg,#f8fafc_1px,transparent_1px)] bg-[size:28px_28px]">
        <div className="relative" style={{ width: graph.width, height: graph.height }}>
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            {graph.edges.map((edge) => (
              <path
                key={edge.id}
                d={edgePath(edge.from, edge.to)}
                fill="none"
                stroke={edge.isRecommended ? "#d97706" : "#cbd5e1"}
                strokeWidth={edge.isRecommended ? 2.4 : 1.4}
                strokeDasharray={edge.isRecommended ? undefined : "5 7"}
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
                if (node.item) onSelect(node.item.requirement.id);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function GraphNodeButton({ node, onClick }: { node: GraphNode; onClick: () => void }) {
  const isStructure = node.kind === "root" || node.kind === "milestone" || node.kind === "bucket";
  const tone = node.isRecommended
    ? "border-amber-300 bg-amber-50 text-amber-950 shadow-[0_0_0_1px_rgba(217,119,6,0.12)]"
    : node.isComplete
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-slate-200 bg-white text-slate-900";
  const active = node.isActive ? "ring-2 ring-slate-950 ring-offset-2" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute rounded-lg border px-3 py-2 text-left transition hover:border-slate-400 hover:shadow-sm ${tone} ${active}`}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
    >
      <div className="flex items-center gap-2">
        {isStructure ? (
          node.isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5 flex-none text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 flex-none text-slate-400" />
          )
        ) : (
          <CircleDot className="h-3.5 w-3.5 flex-none text-slate-400" />
        )}
        <span
          className={`min-w-0 text-xs font-semibold ${
            node.kind === "requirement" ? "line-clamp-2 leading-4" : "truncate"
          }`}
        >
          {node.title}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="min-w-0 truncate">{node.meta}</span>
        {node.count != null && (
          <span className="rounded-full bg-white/70 px-1.5 py-0.5 font-medium text-slate-700">
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
  expandedMilestones,
  expandedBuckets,
}: {
  items: VisibleRequirement[];
  selectedId: string | null;
  expandedMilestones: Set<UserMilestoneCode>;
  expandedBuckets: Set<string>;
}) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const reqRows = Math.max(1, items.length);
  const height = Math.max(620, reqRows * 74 + 170);
  const width = 1080;

  const root: GraphNode = {
    id: "root",
    kind: "root",
    x: 24,
    y: Math.round(height / 2 - 35),
    w: 132,
    h: 70,
    title: "我的目标",
    meta: "规则已匹配",
    count: items.filter((item) => item.isOnPath).length,
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
      count: milestoneItems.length,
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
        count: bucketItems.length,
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
          const strategy = strategyForItem(item);
          const node: GraphNode = {
            id: `requirement:${item.requirement.id}`,
            kind: "requirement",
            x: 650,
            y: requirementY,
            w: 360,
            h: 74,
            title: strategy.title,
            meta: strategy.meta,
            item,
            isRecommended: item.isOnPath,
            isActive: item.requirement.id === selectedId,
            isComplete: !item.isUnmet,
          };
          nodes.push(node);
          edges.push({
            id: `${bucketNode.id}-${node.id}`,
            from: bucketNode,
            to: node,
            isRecommended: item.isOnPath,
          });
          requirementY += 88;
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

function strategyForItem(item: VisibleRequirement): { title: string; meta: string } {
  const missing = formatMissing(item);
  const title = `${item.category.title} ${item.requirement.title}`;
  const hasConcreteCandidate = item.recommendedOption != null;
  const candidateHint = hasConcreteCandidate ? "已有可执行候选" : "待补充具体候选";

  if (item.bucket === "公共必修") {
    if (/体育|体质/.test(title)) {
      return {
        title: "把体育与体测放进低冲突学期",
        meta: `${missing} · 不和核心课、实习周抢精力`,
      };
    }
    if (/英语|外语/.test(title)) {
      return {
        title: "用通过成本低的公共课先清掉硬性缺口",
        meta: `${missing} · 公共课权重低，适合先稳定推进`,
      };
    }
    return {
      title: "公共必修按低负担组合完成",
      meta: `${missing} · 优先选不额外占用整天的安排`,
    };
  }

  if (item.bucket === "通识必修") {
    return {
      title: "用通识模块补齐学分，同时控制绩点风险",
      meta: `${missing} · 先补模块缺口，再看课程负担`,
    };
  }

  if (item.bucket === "专业必修") {
    return {
      title: "先锁定会卡后续学期的专业必修",
      meta: `${missing} · 避免先修链断掉影响毕业节奏`,
    };
  }

  if (item.bucket === "专业选修") {
    return {
      title: "把专业选修对齐当前目标方向",
      meta: `${missing} · GPA、保研、实习按收益排序`,
    };
  }

  if (item.bucket === "任选") {
    return {
      title: "用任选学分填平剩余缺口",
      meta: `${missing} · ${candidateHint}`,
    };
  }

  if (item.milestone === "second") {
    return {
      title: "用项目型经历一次覆盖第二课堂要求",
      meta: `${missing} · 竞赛、实践、训练优先选可复用经历`,
    };
  }

  if (item.milestone === "thesis") {
    return {
      title: "把论文和实习排进课业压力较低的窗口",
      meta: `${missing} · 提前预留连续时间`,
    };
  }

  return {
    title: "把这条要求转成可执行安排",
    meta: `${missing} · ${candidateHint}`,
  };
}

function ImpactPanel({
  selected,
  actionMode,
  impact,
  isGuest,
  error,
  onActionChange,
  onMarkDone,
}: {
  selected: VisibleRequirement | null;
  actionMode: ActionMode;
  impact: ImpactData | null;
  isGuest: boolean;
  error: string | null;
  onActionChange: (mode: ActionMode) => void;
  onMarkDone: () => void;
}) {
  if (!selected || !impact) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">选择左侧一个节点后，这里会显示后果分析。</p>
      </section>
    );
  }

  const strategy = strategyForItem(selected);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PanelRightOpen className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-slate-950">选择模拟器</h2>
        </div>
        {selected.isOnPath && (
          <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
            推荐路径
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold leading-6 text-slate-950">{strategy.title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{strategy.meta}</p>

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

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-500">判断</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-900">
            {impact.status}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
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
        {impact.target != null && (
          <p className="mt-3 text-xs text-slate-500">
            目标：{fmtNum(impact.target)}
            {impact.unit ?? ""}。分类目标：
            {impact.categoryTarget != null ? `${fmtCredits(impact.categoryTarget)} 学分` : "未设定"}
            。
          </p>
        )}
      </div>

      {impact.option && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
            可执行选项
          </p>
          <h3 className="mt-2 text-sm font-semibold text-emerald-950">
            {impact.option.code} · {impact.option.name}
          </h3>
          <p className="mt-1 text-xs text-emerald-800">
            {impact.option.credits != null
              ? `${fmtCredits(impact.option.credits)} 学分`
              : "学分待定"}
          </p>
          <button
            type="button"
            onClick={onMarkDone}
            disabled={isGuest}
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-700 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            标为已完成
          </button>
        </div>
      )}

      {!impact.option && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          这条目前只有规则级判断，还缺课程或项目清单。补充 option seed 后，模拟器会给出具体选择。
        </p>
      )}

      {isGuest && (
        <p className="mt-3 text-xs text-slate-400">访客模式可看模拟，登录后才能保存进度。</p>
      )}
      {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
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
    <div className="rounded-lg bg-white p-3">
      <Icon className="h-4 w-4 text-slate-400" />
      <p className="mt-2 text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-950">{value}</p>
    </div>
  );
}

function EvidencePanel({ selected }: { selected: VisibleRequirement | null }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-slate-500" />
        <h2 className="font-semibold text-slate-950">规则证据</h2>
      </div>
      {selected ? (
        <div className="mt-4 space-y-3 text-sm">
          <EvidenceLine icon={Target} label="策略" value={strategyForItem(selected).title} />
          <EvidenceLine icon={BookOpen} label="规则" value={selected.requirement.title} />
          <EvidenceLine icon={Compass} label="分类" value={selected.category.title} />
          <EvidenceLine
            icon={Lightbulb}
            label="AI 理由"
            value={selected.pathReason ?? "这项会影响当前目标下的毕业路径。"}
          />
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              来源
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              {selected.requirement.source_ref ?? "暂无 source_ref"}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">选择一个节点后查看引用来源。</p>
      )}
    </section>
  );
}

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
    <div className="flex gap-3 rounded-xl border border-slate-100 p-3">
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
