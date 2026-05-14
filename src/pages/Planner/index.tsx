import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
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
  useReactFlow,
  type Edge,
  type NodeMouseHandler,
  type NodeProps,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Briefcase,
  Check,
  ChevronDown,
  Gauge,
  HeartHandshake,
  ListChecks,
  Medal,
  MousePointerClick,
  Pencil,
  Plane,
  Plus,
  Target as TargetIcon,
  Trash2,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlans } from "@/hooks/usePlans";
import {
  laneNodes,
  SEED_EDGES,
  SEED_MERIDIAN_NODES,
  type FlowNode,
  type LaneFlowNode,
  type MeridianFlowNode,
  type NodeData,
  type NodeKind,
} from "./seedGraph";

/* ───────────────────────── Visual taxonomy（视觉层，本文件独享） ───────────────────────── */

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

/* ───────────────────────── Course Intelligence (展示用静态) ───────────────────────── */

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
  // URL 读 `?id=` —— 通过 course-planner route 的 validateSearch 暴露
  const search = useSearch({ from: "/_app/course-planner" });
  const navigate = useNavigate();
  const urlId = search.id;

  // 访客模式（_app.tsx 已放行未登录用户进入）：本页拿 SEED 当只读预览，
  // 编辑不入 DB；登录后 hook 接管真实 plan 加载。
  const { user, loading: authLoading } = useAuth();
  const isGuest = !authLoading && !user;

  const {
    plans,
    current,
    loading: plansLoading,
    loadingCurrent,
    saving,
    error: plansError,
    selectPlan,
    createPlan,
    rename,
    remove,
    saveGraph,
  } = usePlans();

  // ReactFlow 局部状态：用空数组起手，等 plan 加载后 setNodes/setEdges 注入。
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 默认锁定 — 滚轮穿透到页面，避免画布吃掉滚动事件
  const [interactive, setInteractive] = useState(false);

  const { fitView, setViewport, getViewport } = useReactFlow();

  // —— URL ↔ usePlans 同步 ——————————————————————————————————————————————————————
  // 1) URL 有 id → 走那个 plan（仅登录态）
  // 2) URL 无 id 但列表已加载 → fallback 最近编辑的 plan + 同步 URL（replace 不留 history）
  // 访客态：跳过整段，由下方"访客 SEED 加载" effect 接管
  useEffect(() => {
    if (isGuest) return;
    if (plansLoading) return;
    if (urlId) {
      selectPlan(urlId);
      return;
    }
    if (plans.length > 0) {
      const fallback = plans[0];
      selectPlan(fallback.id);
      void navigate({
        to: "/course-planner",
        search: { id: fallback.id },
        replace: true,
      });
    }
  }, [isGuest, urlId, plans, plansLoading, selectPlan, navigate]);

  // —— 加载 plan 到画布 ——————————————————————————————————————————————————————
  // loadedPlanIdRef 记录"当前画布上是谁"。current.id 变化才重灌；同一张的乐观更新
  // 不触发重灌（saveGraph 已经更新过 current.nodes/edges，不能反过来覆盖本地 React Flow
  // 的拖拽中间态）。
  const loadedPlanIdRef = useRef<string | null>(null);
  // skipNextChangeSaveRef：刚 setNodes/setEdges 注入新 plan 时，紧跟着的
  // useEffect([nodes, edges]) 不能触发 saveGraph（那是加载产生的同值变化，不是用户编辑）。
  const skipNextChangeSaveRef = useRef(false);

  useEffect(() => {
    // 访客模式 → 走另一个 effect 喂 SEED，跳过这里
    if (isGuest) return;
    if (!current) {
      // current=null（loadingCurrent / 切到不存在 id）— 不清画布，避免闪烁
      return;
    }
    if (loadedPlanIdRef.current === current.id) return;
    loadedPlanIdRef.current = current.id;
    skipNextChangeSaveRef.current = true;

    setNodes([...laneNodes, ...(current.nodes as MeridianFlowNode[])]);
    setEdges(current.edges as Edge[]);

    if (current.viewport) {
      setViewport(current.viewport, { duration: 0 });
    } else {
      // 给 fitView 让出一个 frame 等 setNodes 落地
      requestAnimationFrame(() => fitView({ padding: 0.06, duration: 0 }));
    }
    // 切 plan 关闭 drawer
    setSelectedId(null);
  }, [isGuest, current, setNodes, setEdges, setViewport, fitView]);

  // —— 访客 SEED 加载（一次性） ——————————————————————————————————————————————
  // user=null 且 auth 已 ready → 喂 SEED 当只读预览；编辑不入 DB（saveGraph 那 effect 会
  // 因 loadedPlanIdRef === "__GUEST__" 但 user=null 跳过）。
  useEffect(() => {
    if (!isGuest) return;
    if (loadedPlanIdRef.current === "__GUEST__") return;
    loadedPlanIdRef.current = "__GUEST__";
    skipNextChangeSaveRef.current = true;
    setNodes([...laneNodes, ...SEED_MERIDIAN_NODES]);
    setEdges(SEED_EDGES);
    setSelectedId(null);
    requestAnimationFrame(() => fitView({ padding: 0.06, duration: 0 }));
  }, [isGuest, setNodes, setEdges, fitView]);

  // —— 用户编辑 → debounce 保存 ——————————————————————————————————————————————
  // 监听 nodes / edges 变化；过滤掉 lane（render-only），喂给 saveGraph。
  // 第一次注入时跳过（loadedPlanIdRef 设置那一拍）。
  // 访客态不存盘。
  useEffect(() => {
    if (skipNextChangeSaveRef.current) {
      skipNextChangeSaveRef.current = false;
      return;
    }
    if (isGuest) return;
    if (!loadedPlanIdRef.current || loadedPlanIdRef.current === "__GUEST__")
      return;

    const meridianOnly = nodes.filter(
      (n): n is MeridianFlowNode => n.type === "meridian",
    );
    saveGraph({
      nodes: meridianOnly,
      edges,
      viewport: getViewport(),
    });
  }, [isGuest, nodes, edges, saveGraph, getViewport]);

  // —— Viewport 持久化 ——————————————————————————————————————————————————————
  // 只在用户主动 pan/zoom 时存（interactive=true）；锁定态的 fitView 不写。
  // 访客态不存盘。
  const onMoveEnd = useCallback(
    (_: unknown, viewport: Viewport) => {
      if (!interactive) return;
      if (isGuest) return;
      if (!loadedPlanIdRef.current || loadedPlanIdRef.current === "__GUEST__")
        return;
      const meridianOnly = nodes.filter(
        (n): n is MeridianFlowNode => n.type === "meridian",
      );
      saveGraph({ nodes: meridianOnly, edges, viewport });
    },
    [interactive, isGuest, nodes, edges, saveGraph],
  );

  // —— Drawer & 选中 ——————————————————————————————————————————————————————
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

  // —— Header bar handlers ——————————————————————————————————————————————————
  const handleCreate = useCallback(async () => {
    const created = await createPlan({ name: "未命名规划" });
    if (!created) return;
    selectPlan(created.id);
    void navigate({
      to: "/course-planner",
      search: { id: created.id },
    });
  }, [createPlan, selectPlan, navigate]);

  const handleSwitch = useCallback(
    (id: string) => {
      if (id === current?.id) return;
      selectPlan(id);
      void navigate({
        to: "/course-planner",
        search: { id },
      });
    },
    [current?.id, selectPlan, navigate],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const target = plans.find((p) => p.id === id);
      if (!target) return;
      const ok = window.confirm(
        `确定删除「${target.name}」？\n此操作不可恢复，画布上的节点会一起删掉。`,
      );
      if (!ok) return;
      try {
        const { nextCurrentId } = await remove(id);
        // 删的是当前 plan → 同步 URL；删别的不动 URL
        if (id === current?.id) {
          // hook 内部已置位 selectedId/current；URL 跟着切
          // 删光后 nextCurrentId=null，URL 暂时挂 undefined，hook 的自动建会补上一张，
          // page 的 fallback effect 侦测到 plans.length>0 + 无 urlId 会再 navigate。
          void navigate({
            to: "/course-planner",
            search: { id: nextCurrentId ?? undefined },
            replace: true,
          });
          // 切走 → 重置 loadedPlanIdRef，让 current effect 重新注入
          loadedPlanIdRef.current = null;
        }
      } catch {
        /* 错误已 set 到 plansError，UI 走 header 那条提示 */
      }
    },
    [plans, current?.id, remove, navigate],
  );

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Header bar — plan 切换 / 重命名 / 新建 / 删除 / 保存状态 / 画布锁 */}
      <PlannerHeader
        plans={plans}
        current={current}
        loading={plansLoading || loadingCurrent}
        saving={saving}
        error={plansError}
        isGuest={isGuest}
        interactive={interactive}
        onToggleInteractive={() => setInteractive((v) => !v)}
        onSwitch={handleSwitch}
        onCreate={handleCreate}
        onRename={(name) => {
          if (!current) return;
          void rename(current.id, name).catch(() => {});
        }}
        onDelete={handleDelete}
      />

      {/* Canvas — 主舞台，至少撑满 5 层内容；视口大时往下扩展 */}
      <div
        className="animate-fade-in-up-soft relative mt-6 h-[calc(100vh-260px)] min-h-[840px] overflow-hidden rounded-2xl border border-slate-200 bg-[#fafbfc]"
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
          onMoveEnd={onMoveEnd}
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

        {/* 选中节点 → 浮动 drawer（锁定态也可弹，便于只读查看） */}
        {selectedNode && (
          <aside
            key={selectedNode.id}
            className="animate-fade-in-up-soft absolute right-4 top-4 z-10 w-[320px] max-h-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:w-[340px]"
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

/* ───────────────────────── Header bar ───────────────────────── */

function PlannerHeader({
  plans,
  current,
  loading,
  saving,
  error,
  isGuest,
  interactive,
  onToggleInteractive,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
}: {
  plans: { id: string; name: string; updated_at: string }[];
  current: { id: string; name: string } | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  isGuest: boolean;
  interactive: boolean;
  onToggleInteractive: () => void;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onRename: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部 / ESC 关下拉
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 进入编辑态自动聚焦 + 选中
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    if (!current) return;
    setDraft(current.name);
    setEditing(true);
  };

  const commitEdit = () => {
    if (!current) {
      setEditing(false);
      return;
    }
    const next = draft.trim();
    if (next && next !== current.name) {
      onRename(next);
    }
    setEditing(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Plan 名 + inline 编辑 */}
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
          Plan
        </span>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") {
                setDraft(current?.name ?? "");
                setEditing(false);
              }
            }}
            maxLength={60}
            className="h-8 min-w-[180px] rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            disabled={isGuest || !current || loading}
            className="group inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold tracking-tight text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            title={isGuest ? "登录后可重命名" : "点击重命名"}
          >
            <span className="max-w-[260px] truncate">
              {isGuest
                ? "示例规划"
                : loading && !current
                  ? "加载中…"
                  : current?.name ?? "（无规划）"}
            </span>
            {!isGuest && (
              <Pencil className="h-3 w-3 text-slate-400 transition-colors group-hover:text-slate-700" />
            )}
          </button>
        )}
      </div>

      {/* 切换下拉（访客态隐藏，没东西可切） */}
      {!isGuest && (
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={plans.length === 0}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            切换
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {open && (
            <div className="absolute left-0 top-9 z-30 w-[280px] max-h-[320px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
              {plans.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-500">暂无规划</p>
              ) : (
                plans.map((p) => {
                  const isActive = p.id === current?.id;
                  const isLast = plans.length === 1;
                  return (
                    <div
                      key={p.id}
                      className={`group flex items-center gap-1 rounded-lg px-1 transition-colors ${
                        isActive ? "bg-slate-100" : "hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSwitch(p.id);
                          setOpen(false);
                        }}
                        className={`flex flex-1 items-center gap-2 px-1.5 py-1.5 text-left text-xs ${
                          isActive ? "text-slate-900" : "text-slate-700"
                        }`}
                      >
                        <span className="flex-1 truncate font-medium">{p.name}</span>
                        {isActive && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(p.id);
                        }}
                        disabled={isLast}
                        title={isLast ? "至少保留一张规划" : "删除"}
                        aria-label="删除"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* 新建（访客态禁用） */}
      <button
        type="button"
        onClick={onCreate}
        disabled={isGuest}
        title={isGuest ? "登录后可新建" : undefined}
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
      >
        <Plus className="h-3.5 w-3.5" />
        新建
      </button>

      {/* 保存状态 / 错误 / 访客提示 — 中段 */}
      <div className="text-xs tabular-nums text-slate-400">
        {isGuest ? (
          <span>访客预览 · 登录后保存</span>
        ) : error ? (
          <span className="text-rose-600">{error}</span>
        ) : saving ? (
          <span>保存中…</span>
        ) : current ? (
          <span>已保存</span>
        ) : null}
      </div>

      {/* 画布锁 / 解锁 — 右侧 */}
      <button
        type="button"
        onClick={onToggleInteractive}
        className={`ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium shadow-sm transition-colors ${
          interactive
            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
    </div>
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
