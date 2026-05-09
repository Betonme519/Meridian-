import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Briefcase,
  Gauge,
  HeartHandshake,
  ListChecks,
  Medal,
  MousePointerClick,
  Plane,
  Target as TargetIcon,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";

/* ───────────────────────── Node taxonomy ───────────────────────── */

type NodeKind =
  | "course"
  | "requirement"
  | "gpa"
  | "risk"
  | "goal"
  | "workload"
  | "abroad"
  | "internship"
  | "second-class"
  | "volunteer"
  | "alternative";

type NodeData = {
  label: string;
  kind: NodeKind;
  value?: string;
  source?: string;
  trust?: "high" | "med" | "low";
};

type LaneData = {
  label: string;     // L0、L1...
  title: string;     // 中文小标题
  hint?: string;     // 一句解释
};

type MeridianFlowNode = Node<NodeData, "meridian">;
type LaneFlowNode = Node<LaneData, "lane">;
type FlowNode = MeridianFlowNode | LaneFlowNode;

type KindMeta = { label: string; hex: string; icon: LucideIcon };

const kindMeta: Record<NodeKind, KindMeta> = {
  course:         { label: "课程",        hex: "#475569", icon: BookOpen },         // slate
  requirement:    { label: "Requirement", hex: "#059669", icon: ListChecks },        // emerald
  gpa:            { label: "GPA",         hex: "#d97706", icon: TrendingUp },        // amber
  risk:           { label: "风险",        hex: "#e11d48", icon: AlertTriangle },     // rose
  goal:           { label: "目标",        hex: "#4f46e5", icon: TargetIcon },        // indigo
  workload:       { label: "Workload",    hex: "#0284c7", icon: Gauge },             // sky
  abroad:         { label: "留学",        hex: "#7c3aed", icon: Plane },             // violet
  internship:     { label: "实习",        hex: "#0d9488", icon: Briefcase },         // teal
  "second-class": { label: "二课",        hex: "#c026d3", icon: Medal },             // fuchsia
  volunteer:      { label: "志愿",        hex: "#65a30d", icon: HeartHandshake },    // lime
  alternative:    { label: "替代",        hex: "#64748b", icon: ArrowLeftRight },    // slate
};

const rgba = (hex: string, a: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/* ───────────────────────── Custom node ───────────────────────── */

function MeridianNode({ data, selected }: NodeProps<MeridianFlowNode>) {
  const m = kindMeta[data.kind];
  const Icon = m.icon;
  return (
    <div
      className="group relative w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white transition-all"
      style={{
        boxShadow: selected
          ? `0 0 0 1.5px ${m.hex}, 0 8px 24px ${rgba(m.hex, 0.18)}, 0 1px 2px rgba(15, 23, 42, 0.04)`
          : "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 10px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* 顶部 accent strip */}
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: m.hex }} />

      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 9, height: 9, background: "#fff", border: `2px solid ${m.hex}` }}
      />

      <div className="px-4 pb-3.5 pt-4">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: rgba(m.hex, 0.12), color: m.hex }}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: m.hex }}
          >
            {m.label}
          </span>
        </div>
        <p className="mt-3 text-[15px] font-semibold leading-snug tracking-tight text-slate-900">
          {data.label}
        </p>
        {data.value && (
          <p className="mt-1 text-xs tabular-nums text-slate-500">{data.value}</p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 9, height: 9, background: "#fff", border: `2px solid ${m.hex}` }}
      />
    </div>
  );
}

function LaneHeader({ data }: NodeProps<LaneFlowNode>) {
  return (
    <div className="pointer-events-none w-[180px] select-none">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          {data.label}
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <p className="mt-2 text-sm font-semibold tracking-tight text-slate-800">{data.title}</p>
      {data.hint && (
        <p className="mt-0.5 text-xs leading-snug text-slate-500">{data.hint}</p>
      )}
    </div>
  );
}

const nodeTypes = { meridian: MeridianNode, lane: LaneHeader };

/* ───────────────────────── Mock data ───────────────────────── */

/**
 * 5 层分层布局，自顶向下因果传播：
 *   L0 长期目标       — 整张图的源头
 *   L1 关注指标       — 由目标驱动的可量化维度
 *   L2 Requirement   — 必须满足的硬约束
 *   L3 课程选择       — 同一级别的不同动作（4 选 N）
 *   L4 外部资源/替代  — 平行可叠加的资源/替代
 *
 * X 轴对齐到 4 列网格（columns），让同层节点等距排列。
 *   col centers: 250, 500, 750, 1000
 */

const ROW = { L0: 100, L1: 280, L2: 460, L3: 640, L4: 820 };
const NODE_W = 220;
const cx = (center: number) => center - NODE_W / 2; // node x = center - half-width
// 4 列网格中心点（gap 240）
const COL = { c1: 230, c2: 470, c3: 710, c4: 950 };
// 3 / 2 / 1 节点居中分布
const COL3 = { a: 350, b: 590, c: 830 };
const COL2 = { a: 470, b: 710 };
const COL1 = 590;
const LANE_X = -200;

const laneNodes: LaneFlowNode[] = [
  { id: "lane-0", type: "lane", position: { x: LANE_X, y: ROW.L0 + 10 }, draggable: false, selectable: false, focusable: false, data: { label: "L0", title: "长期目标",    hint: "整张图的起点" } },
  { id: "lane-1", type: "lane", position: { x: LANE_X, y: ROW.L1 + 10 }, draggable: false, selectable: false, focusable: false, data: { label: "L1", title: "关注指标",    hint: "由目标驱动" } },
  { id: "lane-2", type: "lane", position: { x: LANE_X, y: ROW.L2 + 10 }, draggable: false, selectable: false, focusable: false, data: { label: "L2", title: "Requirement", hint: "硬约束" } },
  { id: "lane-3", type: "lane", position: { x: LANE_X, y: ROW.L3 + 10 }, draggable: false, selectable: false, focusable: false, data: { label: "L3", title: "课程选择",    hint: "同级 · 不同选择" } },
  { id: "lane-4", type: "lane", position: { x: LANE_X, y: ROW.L4 + 10 }, draggable: false, selectable: false, focusable: false, data: { label: "L4", title: "外部资源",    hint: "平行可叠加" } },
];

const meridianNodes: MeridianFlowNode[] = [
  // L0 — 单节点居中
  { id: "goal-1",   type: "meridian", position: { x: cx(COL1),   y: ROW.L0 }, data: { label: "保研路线",        kind: "goal",        value: "权重 60%", source: "用户设定" } },

  // L1 — 3 个并列指标
  { id: "gpa-1",    type: "meridian", position: { x: cx(COL3.a), y: ROW.L1 }, data: { label: "GPA 3.78",        kind: "gpa",         value: "目标 ≥ 3.8" } },
  { id: "risk-1",   type: "meridian", position: { x: cx(COL3.b), y: ROW.L1 }, data: { label: "压分风险",        kind: "risk",        value: "中-高",   source: "学生评价 / 课评" } },
  { id: "wl-1",     type: "meridian", position: { x: cx(COL3.c), y: ROW.L1 }, data: { label: "Workload 上限",   kind: "workload",    value: "≤ 22h/周" } },

  // L2 — 2 个并列硬约束
  { id: "req-1",    type: "meridian", position: { x: cx(COL2.a), y: ROW.L2 }, data: { label: "专业必修",        kind: "requirement", value: "缺 2 学分", source: "培养方案 v2024 第 6 页" } },
  { id: "req-2",    type: "meridian", position: { x: cx(COL2.b), y: ROW.L2 }, data: { label: "第二课堂",        kind: "second-class",value: "缺 2 分",   source: "学校教务处" } },

  // L3 — 4 个并列课程选择（满 4 列网格）
  { id: "hist-118", type: "meridian", position: { x: cx(COL.c1), y: ROW.L3 }, data: { label: "HIST 118 中国近代史", kind: "course",  value: "A- · 3h/周" } },
  { id: "math-233", type: "meridian", position: { x: cx(COL.c2), y: ROW.L3 }, data: { label: "MATH 233 线代",      kind: "course",  value: "B+ · 6h/周" } },
  { id: "cs-241",   type: "meridian", position: { x: cx(COL.c3), y: ROW.L3 }, data: { label: "CS 241 系统编程",    kind: "course",  value: "B · 9h/周",  source: "教务系统" } },
  { id: "mus-102",  type: "meridian", position: { x: cx(COL.c4), y: ROW.L3 }, data: { label: "MUS 102 音乐与社会",  kind: "course",  value: "A · P/F 可" } },

  // L4 — 3 个并列外部资源
  { id: "abr-1",    type: "meridian", position: { x: cx(COL3.a), y: ROW.L4 }, data: { label: "海外暑研",        kind: "abroad",      value: "可选" } },
  { id: "intern-1", type: "meridian", position: { x: cx(COL3.b), y: ROW.L4 }, data: { label: "本学期实习",      kind: "internship",  value: "8h/周" } },
  { id: "alt-1",    type: "meridian", position: { x: cx(COL3.c), y: ROW.L4 }, data: { label: "比赛抵 2 课分",    kind: "alternative", value: "AI 推测",   source: "AI 规则分析", trust: "med" } },
];

const initialNodes: FlowNode[] = [...laneNodes, ...meridianNodes];

const edgeMarker = (color: string) => ({
  type: MarkerType.ArrowClosed,
  color,
  width: 16,
  height: 16,
});

const styledEdge = (color: string, animated = false) => ({
  type: "smoothstep" as const,
  animated,
  style: { stroke: color, strokeWidth: 1.6 },
  markerEnd: edgeMarker(color),
  labelStyle: { fontSize: 11, fill: color, fontWeight: 600 },
  labelBgStyle: { fill: "#ffffff", fillOpacity: 0.95 },
  labelBgPadding: [6, 3] as [number, number],
  labelBgBorderRadius: 6,
});

const NEUTRAL = "#94a3b8";
const ROSE    = "#e11d48";
const SKY     = "#0ea5e9";
const VIOLET  = "#a855f7";
const EMERALD = "#10b981";

const initialEdges: Edge[] = [
  { id: "e1",  source: "goal-1",   target: "gpa-1",    label: "驱动",         ...styledEdge(NEUTRAL, true) },
  { id: "e2",  source: "gpa-1",    target: "cs-241",   label: "影响",         ...styledEdge(NEUTRAL) },
  { id: "e3",  source: "gpa-1",    target: "math-233", label: "影响",         ...styledEdge(NEUTRAL) },
  { id: "e4",  source: "gpa-1",    target: "hist-118", label: "影响",         ...styledEdge(NEUTRAL) },
  { id: "e5",  source: "cs-241",   target: "risk-1",   label: "贡献风险",     ...styledEdge(ROSE) },
  { id: "e6",  source: "math-233", target: "cs-241",   label: "prerequisite", ...styledEdge(SKY) },
  { id: "e7",  source: "hist-118", target: "wl-1",     label: "占用",         ...styledEdge(NEUTRAL) },
  { id: "e8",  source: "cs-241",   target: "wl-1",     label: "占用",         ...styledEdge(NEUTRAL) },
  { id: "e9",  source: "mus-102",  target: "wl-1",     label: "占用",         ...styledEdge(NEUTRAL) },
  { id: "e10", source: "alt-1",    target: "req-2",    label: "替代",         ...styledEdge(VIOLET) },
  { id: "e11", source: "intern-1", target: "wl-1",     label: "冲突",         ...styledEdge(ROSE) },
  { id: "e12", source: "abr-1",    target: "goal-1",   label: "支持",         ...styledEdge(EMERALD) },
  { id: "e13", source: "math-233", target: "req-1",    label: "满足",         ...styledEdge(EMERALD) },
];

/* ───────────────────────── Course Intelligence ───────────────────────── */

type CourseRow = {
  code: string;
  name: string;
  gpaIncluded: boolean;
  reqValue: "high" | "mid" | "low";
  alternative: string;
  workload: string;
  prereq: string;
  conflict?: string;
};

const courseRows: CourseRow[] = [
  { code: "HIST 118", name: "中国近代史专题",  gpaIncluded: true,  reqValue: "high", alternative: "无",         workload: "3h/周", prereq: "无",            conflict: undefined },
  { code: "CS 241",   name: "系统编程",        gpaIncluded: true,  reqValue: "high", alternative: "无",         workload: "9h/周", prereq: "MATH 233",       conflict: "与实习时间重合 8h" },
  { code: "MATH 233", name: "线性代数",        gpaIncluded: true,  reqValue: "high", alternative: "数学分析 II", workload: "6h/周", prereq: "高数 A",         conflict: undefined },
  { code: "MUS 102",  name: "音乐与社会",      gpaIncluded: false, reqValue: "low",  alternative: "公选任意",    workload: "2h/周", prereq: "无",            conflict: undefined },
];

/* ───────────────────────── Page ───────────────────────── */

export default function PlannerPage() {
  return (
    <ReactFlowProvider>
      <WorkspaceInner />
    </ReactFlowProvider>
  );
}

function WorkspaceInner() {
  const [nodes, , onNodesChange] = useNodesState<FlowNode>(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 默认锁定 — 滚轮穿透到页面，避免画布吃掉滚动事件
  const [interactive, setInteractive] = useState(false);

  const selectedNode = useMemo(() => {
    const n = nodes.find((node) => node.id === selectedId);
    return n && n.type === "meridian" ? (n as MeridianFlowNode) : null;
  }, [nodes, selectedId]);

  // 锁定态也允许点节点看详情；点 lane 不响应；点空白关 drawer
  const onNodeClick = useCallback<NodeMouseHandler<FlowNode>>((_, node) => {
    if (node.type !== "meridian") return;
    setSelectedId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  // ESC 退出画布交互
  useEffect(() => {
    if (!interactive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInteractive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interactive]);

  // 退出画布时自动 fitView 回默认展示比例（带过渡动画）
  const { fitView } = useReactFlow();
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (!interactive) {
      fitView({ padding: 0.06, duration: 500 });
    }
  }, [interactive, fitView]);

  const incoming = useMemo(
    () => edges.filter((e) => e.target === selectedId),
    [edges, selectedId],
  );
  const outgoing = useMemo(
    () => edges.filter((e) => e.source === selectedId),
    [edges, selectedId],
  );

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Hero — 与其他页面一致 */}

      {/* Canvas — 主舞台，至少撑满 5 层内容；视口大时往下扩展 */}
      <div
        className="animate-fade-in-up-soft relative mt-8 h-[calc(100vh-260px)] min-h-[840px] overflow-hidden rounded-2xl border border-slate-200 bg-[#fafbfc]"
        style={{ animationDelay: "60ms" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.06 }}
          proOptions={{ hideAttribution: true }}
          // 锁定态：可点节点看详情，但禁掉拖拽 / 缩放 / 滚轮捕获，让滚轮穿透到页面
          nodesDraggable={interactive}
          nodesConnectable={interactive}
          elementsSelectable
          panOnDrag={interactive}
          zoomOnScroll={interactive}
          zoomOnPinch={interactive}
          zoomOnDoubleClick={interactive}
          preventScrolling={interactive}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
          {interactive && (
            <>
              <Controls
                position="bottom-left"
                showInteractive={false}
                className="!rounded-lg !border !border-slate-200 !bg-white !shadow-sm"
              />
              <MiniMap
                pannable
                zoomable
                className="!rounded-lg !border !border-slate-200 !bg-white"
                nodeColor={(n) => {
                  if (n.type !== "meridian") return "transparent";
                  return rgba(kindMeta[(n.data as NodeData).kind].hex, 0.45);
                }}
                nodeStrokeColor={(n) => {
                  if (n.type !== "meridian") return "transparent";
                  return rgba(kindMeta[(n.data as NodeData).kind].hex, 0.7);
                }}
                nodeStrokeWidth={1.5}
                nodeBorderRadius={4}
              />
            </>
          )}
        </ReactFlow>

        {/* Floating legend — 画布左上，pill 风格 */}
        <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-1.5 max-w-[60%]">
          {(Object.keys(kindMeta) as NodeKind[]).map((k) => {
            const m = kindMeta[k];
            return (
              <span
                key={k}
                className="inline-flex h-5 items-center rounded-full border border-slate-200 bg-white/95 px-2 text-[10px] font-medium text-slate-700 shadow-sm backdrop-blur"
              >
                <span
                  className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: m.hex }}
                />
                {m.label}
              </span>
            );
          })}
        </div>

        {/* 右上角：进入 / 退出画布开关 */}
        <button
          type="button"
          onClick={() => setInteractive((v) => !v)}
          className={`absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-sm transition-colors ${
            interactive
              ? "border-slate-200 bg-white/95 text-slate-700 hover:bg-white"
              : "border-slate-900 bg-slate-950 text-white hover:bg-slate-800"
          }`}
        >
          {interactive ? (
            <>
              <X className="h-3.5 w-3.5" />
              退出画布 · ESC
            </>
          ) : (
            <>
              <MousePointerClick className="h-3.5 w-3.5" />
              点击进入画布
            </>
          )}
        </button>

        {/* 选中节点 → 浮动 drawer（锁定态也可弹，便于只读查看） */}
        {selectedNode && (
          <aside
            key={selectedNode.id}
            className="animate-fade-in-up-soft absolute right-4 top-16 z-10 w-[320px] max-h-[calc(100%-5rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:w-[340px]"
          >
            <NodeDrawer
              node={selectedNode}
              incoming={incoming}
              outgoing={outgoing}
              allNodes={nodes.filter((n): n is MeridianFlowNode => n.type === "meridian")}
              onClose={() => setSelectedId(null)}
            />
          </aside>
        )}

        {/* 底部状态提示 */}
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] text-slate-500 shadow-sm backdrop-blur">
          {interactive
            ? "可拖拽节点 · 滚轮缩放 · 双击重置"
            : "点击节点查看详情"}
        </div>
      </div>

      {/* Course Intelligence */}
      <div className="mt-12">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">Course Intelligence</h2>
          <span className="ml-auto text-xs text-slate-400 tabular-nums">
            {courseRows.length} 门课分析
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          GPA 是否计算 / requirement 价值 / 是否可代 / workload / prerequisite / 与目标冲突
        </p>

        <div
          className="animate-fade-in-up-soft mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          style={{ animationDelay: "60ms" }}
        >
          <div className="grid grid-cols-[1.2fr_120px_120px_140px_120px_140px_minmax(0,1fr)] gap-4 border-b border-slate-100 bg-slate-50/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 max-lg:hidden">
            <span>课程</span>
            <span>GPA</span>
            <span>价值</span>
            <span>可替代</span>
            <span>Workload</span>
            <span>Prerequisite</span>
            <span>与目标冲突</span>
          </div>
          {courseRows.map((c, i) => (
            <article
              key={c.code}
              className="grid gap-2 border-b border-slate-100 px-5 py-5 transition-colors last:border-b-0 hover:bg-slate-50/60 lg:grid-cols-[1.2fr_120px_120px_140px_120px_140px_minmax(0,1fr)] lg:items-center lg:gap-4"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{c.code}</p>
                <p className="text-[11px] text-slate-500">{c.name}</p>
              </div>
              <span
                className={`inline-flex h-5 w-fit items-center rounded-full px-2 text-[11px] font-semibold ${
                  c.gpaIncluded
                    ? "bg-amber-50 text-amber-800"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {c.gpaIncluded ? "计入" : "不计入"}
              </span>
              <span className="text-xs text-slate-700">
                {c.reqValue === "high" ? "高" : c.reqValue === "mid" ? "中" : "低"}
              </span>
              <span className="text-xs text-slate-700">{c.alternative}</span>
              <span className="text-xs text-slate-700 tabular-nums">{c.workload}</span>
              <span className="text-xs text-slate-700">{c.prereq}</span>
              <span className={`text-xs ${c.conflict ? "text-rose-700" : "text-slate-400"}`}>
                {c.conflict ?? "无"}
              </span>
              {/* Mobile fallback meta row */}
              <span className="text-[11px] text-slate-500 lg:hidden">
                {c.gpaIncluded ? "计 GPA" : "不计 GPA"} · 价值 {c.reqValue} · {c.workload}
                {c.conflict ? ` · ${c.conflict}` : ""}
              </span>
              {i === -1 && <span className="hidden">{c.code}</span>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Drawer ───────────────────────── */

function NodeDrawer({
  node,
  incoming,
  outgoing,
  allNodes,
  onClose,
}: {
  node: MeridianFlowNode;
  incoming: Edge[];
  outgoing: Edge[];
  allNodes: MeridianFlowNode[];
  onClose: () => void;
}) {
  const m = kindMeta[node.data.kind];
  const Icon = m.icon;
  const labelOf = (id: string) => allNodes.find((n) => n.id === id)?.data.label ?? id;

  return (
    <div>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-semibold"
          style={{ background: rgba(m.hex, 0.12), color: m.hex }}
        >
          <Icon className="h-3 w-3" strokeWidth={2.2} />
          {m.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <h3 className="mt-3 text-base font-semibold tracking-tight text-slate-950">{node.data.label}</h3>
      {node.data.value && (
        <p className="mt-1 text-xs tabular-nums text-slate-500">{node.data.value}</p>
      )}

      {node.data.source && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">规则来源</p>
          <p className="mt-1 text-xs text-slate-700">{node.data.source}</p>
          {node.data.trust && (
            <span
              className={`mt-2 inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold ${
                node.data.trust === "high"
                  ? "bg-emerald-50 text-emerald-700"
                  : node.data.trust === "med"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              可信度 {node.data.trust === "high" ? "高" : node.data.trust === "med" ? "中" : "低"}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 space-y-3">
        <RelationList title="被它影响" edges={outgoing} resolve={labelOf} dirIn={false} />
        <RelationList title="影响它的" edges={incoming} resolve={labelOf} dirIn={true} />
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Link
          to="/schedule"
          className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950"
        >
          查看规则原文
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/ai-advisor"
          className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950"
        >
          调整目标权重
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function RelationList({
  title,
  edges,
  resolve,
  dirIn,
}: {
  title: string;
  edges: Edge[];
  resolve: (id: string) => string;
  dirIn: boolean;
}) {
  if (edges.length === 0) {
    return (
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{title}</p>
        <p className="mt-1 text-xs text-slate-400">无</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {edges.map((e) => {
          const otherId = dirIn ? e.source : e.target;
          const labelText = typeof e.label === "string" ? e.label : "";
          return (
            <li
              key={e.id}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5"
            >
              {labelText && (
                <span className="inline-flex h-4 items-center rounded-full bg-white px-1.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                  {labelText}
                </span>
              )}
              <span className="text-xs text-slate-800">{resolve(otherId)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
