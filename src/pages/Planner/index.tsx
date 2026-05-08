import { useCallback, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowRight,
  BookOpenCheck,
  GitBranch,
  Layers,
  Network,
  ShieldAlert,
  Sparkles,
  X,
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

type FlowNode = Node<NodeData>;

const kindStyles: Record<NodeKind, { bg: string; border: string; text: string; chip: string; chipText: string; chipLabel: string }> = {
  course:        { bg: "bg-white",       border: "border-slate-300",   text: "text-slate-900", chip: "bg-slate-100",   chipText: "text-slate-700",   chipLabel: "课程" },
  requirement:   { bg: "bg-emerald-50",  border: "border-emerald-300", text: "text-emerald-950", chip: "bg-emerald-100", chipText: "text-emerald-800", chipLabel: "Requirement" },
  gpa:           { bg: "bg-amber-50",    border: "border-amber-300",   text: "text-amber-950", chip: "bg-amber-100",   chipText: "text-amber-800",   chipLabel: "GPA" },
  risk:          { bg: "bg-rose-50",     border: "border-rose-300",    text: "text-rose-950",  chip: "bg-rose-100",    chipText: "text-rose-800",    chipLabel: "风险" },
  goal:          { bg: "bg-indigo-50",   border: "border-indigo-300",  text: "text-indigo-950",chip: "bg-indigo-100",  chipText: "text-indigo-800",  chipLabel: "目标" },
  workload:      { bg: "bg-sky-50",      border: "border-sky-300",     text: "text-sky-950",   chip: "bg-sky-100",     chipText: "text-sky-800",     chipLabel: "Workload" },
  abroad:        { bg: "bg-violet-50",   border: "border-violet-300",  text: "text-violet-950",chip: "bg-violet-100",  chipText: "text-violet-800",  chipLabel: "留学" },
  internship:    { bg: "bg-teal-50",     border: "border-teal-300",    text: "text-teal-950",  chip: "bg-teal-100",    chipText: "text-teal-800",    chipLabel: "实习" },
  "second-class":{ bg: "bg-fuchsia-50",  border: "border-fuchsia-300", text: "text-fuchsia-950", chip: "bg-fuchsia-100", chipText: "text-fuchsia-800", chipLabel: "二课" },
  volunteer:     { bg: "bg-lime-50",     border: "border-lime-300",    text: "text-lime-950",  chip: "bg-lime-100",    chipText: "text-lime-800",    chipLabel: "志愿" },
  alternative:   { bg: "bg-slate-100",   border: "border-slate-400",   text: "text-slate-900", chip: "bg-white",       chipText: "text-slate-700",   chipLabel: "替代" },
};

/* ───────────────────────── Custom node ───────────────────────── */

function MeridianNode({ data, selected }: NodeProps<FlowNode>) {
  const s = kindStyles[data.kind];
  return (
    <div
      className={`min-w-[140px] rounded-xl border ${s.bg} ${s.border} px-3 py-2.5 transition-shadow ${
        selected ? "shadow-lg ring-2 ring-slate-950/80" : "shadow-sm"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-slate-400 !bg-white" />
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex h-4 items-center rounded-full ${s.chip} px-1.5 text-[10px] font-semibold ${s.chipText}`}>
          {s.chipLabel}
        </span>
      </div>
      <p className={`mt-1.5 text-sm font-semibold leading-snug ${s.text}`}>{data.label}</p>
      {data.value && (
        <p className="mt-0.5 text-[11px] tabular-nums text-slate-500">{data.value}</p>
      )}
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-slate-400 !bg-white" />
    </div>
  );
}

const nodeTypes = { meridian: MeridianNode };

/* ───────────────────────── Mock data ───────────────────────── */

const initialNodes: FlowNode[] = [
  { id: "goal-1",  type: "meridian", position: { x:  40, y:  40 }, data: { label: "保研路线",      kind: "goal",        value: "权重 60%", source: "用户设定" } },
  { id: "gpa-1",   type: "meridian", position: { x: 280, y:  40 }, data: { label: "GPA 3.78",      kind: "gpa",         value: "目标 ≥ 3.8" } },
  { id: "risk-1",  type: "meridian", position: { x: 540, y:  40 }, data: { label: "压分风险",      kind: "risk",        value: "中-高",   source: "学生评价 / 课评" } },

  { id: "cs-241",  type: "meridian", position: { x:  40, y: 200 }, data: { label: "CS 241 系统编程", kind: "course",     value: "B · 9h/周", source: "教务系统" } },
  { id: "math-233",type: "meridian", position: { x: 280, y: 200 }, data: { label: "MATH 233 线代",   kind: "course",     value: "B+ · 6h/周" } },
  { id: "hist-118",type: "meridian", position: { x: 540, y: 200 }, data: { label: "HIST 118 中国近代史", kind: "course", value: "A- · 3h/周" } },
  { id: "mus-102", type: "meridian", position: { x: 780, y: 200 }, data: { label: "MUS 102 音乐与社会", kind: "course",  value: "A · P/F 可" } },

  { id: "wl-1",    type: "meridian", position: { x:  40, y: 360 }, data: { label: "Workload 上限",  kind: "workload",    value: "≤ 22h/周" } },
  { id: "req-1",   type: "meridian", position: { x: 280, y: 360 }, data: { label: "专业必修",       kind: "requirement", value: "缺 2 学分", source: "培养方案 v2024 第 6 页" } },
  { id: "req-2",   type: "meridian", position: { x: 540, y: 360 }, data: { label: "第二课堂",       kind: "second-class",value: "缺 2 分",   source: "学校教务处" } },
  { id: "alt-1",   type: "meridian", position: { x: 780, y: 360 }, data: { label: "比赛抵 2 课分",   kind: "alternative", value: "AI 推测",   source: "AI 规则分析", trust: "med" } },

  { id: "intern-1",type: "meridian", position: { x: 280, y: 520 }, data: { label: "本学期实习",     kind: "internship",  value: "8h/周" } },
  { id: "abr-1",   type: "meridian", position: { x: 540, y: 520 }, data: { label: "海外暑研",       kind: "abroad",      value: "可选" } },
];

const initialEdges: Edge[] = [
  { id: "e1",  source: "goal-1",   target: "gpa-1",    label: "驱动",       type: "smoothstep", animated: true },
  { id: "e2",  source: "gpa-1",    target: "cs-241",   label: "影响",       type: "smoothstep" },
  { id: "e3",  source: "gpa-1",    target: "math-233", label: "影响",       type: "smoothstep" },
  { id: "e4",  source: "gpa-1",    target: "hist-118", label: "影响",       type: "smoothstep" },
  { id: "e5",  source: "cs-241",   target: "risk-1",   label: "贡献风险",   type: "smoothstep", style: { stroke: "#e11d48" } },
  { id: "e6",  source: "math-233", target: "cs-241",   label: "prerequisite", type: "smoothstep", style: { stroke: "#0ea5e9" } },
  { id: "e7",  source: "hist-118", target: "wl-1",     label: "占用",       type: "smoothstep" },
  { id: "e8",  source: "cs-241",   target: "wl-1",     label: "占用",       type: "smoothstep" },
  { id: "e9",  source: "mus-102",  target: "wl-1",     label: "占用",       type: "smoothstep" },
  { id: "e10", source: "alt-1",    target: "req-2",    label: "替代",       type: "smoothstep", style: { stroke: "#a855f7" } },
  { id: "e11", source: "intern-1", target: "wl-1",     label: "冲突",       type: "smoothstep", style: { stroke: "#e11d48" } },
  { id: "e12", source: "abr-1",    target: "goal-1",   label: "支持",       type: "smoothstep", style: { stroke: "#10b981" } },
  { id: "e13", source: "math-233", target: "req-1",    label: "满足",       type: "smoothstep", style: { stroke: "#10b981" } },
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

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  const onNodeClick = useCallback<NodeMouseHandler>((_, node) => {
    setSelectedId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedId(null);
  }, []);

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
      {/* Hero */}
      <header className="animate-fade-in-up-soft">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
          Workspace
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          可视化决策空间
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          AI 自动生成节点与关系。拖拽、缩放、点击节点查看影响传播。规则可追溯到培养方案与教务系统。
        </p>
      </header>

      {/* Legend chips */}
      <div
        className="animate-fade-in-up-soft mt-6 flex flex-wrap gap-2"
        style={{ animationDelay: "60ms" }}
      >
        {(Object.keys(kindStyles) as NodeKind[]).map((k) => {
          const s = kindStyles[k];
          return (
            <span
              key={k}
              className={`inline-flex h-6 items-center rounded-full border ${s.border} ${s.bg} px-2.5 text-[11px] font-medium ${s.text}`}
            >
              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${s.chip} ring-1 ring-white`} />
              {s.chipLabel}
            </span>
          );
        })}
      </div>

      {/* Canvas + drawer */}
      <div
        className="animate-fade-in-up-soft mt-6 grid gap-5 xl:grid-cols-[1fr_360px]"
        style={{ animationDelay: "120ms" }}
      >
        <div className="relative h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-[#fafbfc]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              labelStyle: { fontSize: 11, fill: "#475569" },
              labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9 },
              style: { stroke: "#94a3b8", strokeWidth: 1.5 },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
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
                const data = n.data as NodeData | undefined;
                if (!data) return "#cbd5e1";
                const map: Record<NodeKind, string> = {
                  course: "#cbd5e1",
                  requirement: "#6ee7b7",
                  gpa: "#fcd34d",
                  risk: "#fda4af",
                  goal: "#a5b4fc",
                  workload: "#7dd3fc",
                  abroad: "#d8b4fe",
                  internship: "#5eead4",
                  "second-class": "#f0abfc",
                  volunteer: "#bef264",
                  alternative: "#e2e8f0",
                };
                return map[data.kind];
              }}
            />
          </ReactFlow>

          {!selectedNode && (
            <div className="pointer-events-none absolute right-4 top-4 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-[11px] text-slate-500 backdrop-blur">
              点击任一节点查看详情
            </div>
          )}
        </div>

        {/* Drawer */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-5">
          {selectedNode ? (
            <NodeDrawer
              node={selectedNode}
              incoming={incoming}
              outgoing={outgoing}
              allNodes={nodes}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <EmptyDrawer />
          )}
        </aside>
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

/* ───────────────────────── Drawer pieces ───────────────────────── */

function EmptyDrawer() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Network className="h-5 w-5 text-slate-500" />
        <h3 className="font-semibold tracking-tight">节点详情</h3>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        在左侧画布点击任意节点。会显示：类型 / value / 来源 / 影响关系 / 权重调整入口。
      </p>
      <div className="mt-5 space-y-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5" />
          支持 5+ 种节点类型
        </div>
        <div className="flex items-center gap-2">
          <GitBranch className="h-3.5 w-3.5" />
          边类型：影响 / 替代 / 冲突 / prerequisite / 权重
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          所有规则都可追溯到来源
        </div>
      </div>
    </div>
  );
}

function NodeDrawer({
  node,
  incoming,
  outgoing,
  allNodes,
  onClose,
}: {
  node: FlowNode;
  incoming: Edge[];
  outgoing: Edge[];
  allNodes: FlowNode[];
  onClose: () => void;
}) {
  const s = kindStyles[node.data.kind];
  const labelOf = (id: string) => allNodes.find((n) => n.id === id)?.data.label ?? id;

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-5 items-center rounded-full ${s.chip} px-2 text-[11px] font-semibold ${s.chipText}`}>
          {s.chipLabel}
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

/* Touch unused imports to avoid stripping when extending later */
void ShieldAlert;
