/**
 * Planner 画布的类型 / 坐标常量 / seed 数据。
 *
 * 关注点分离：
 *  - 这里：纯数据（types + layout 常量 + 默认 nodes/edges 内容）
 *  - Planner/index.tsx：视觉组件 + 交互逻辑（MeridianNode / LaneHeader / NodeDrawer）
 *
 * 拆出来的两个目的：
 *  1. `usePlans` 在用户首次进入 `/course-planner`（无任何 plan）时，调
 *     `createPlan({ nodes: SEED_MERIDIAN_NODES, edges: SEED_EDGES })`
 *     自动建一张默认 plan，不让用户看见空画布。
 *  2. `laneNodes` 是渲染时的**骨架**（5 条横向分层标签），不入 DB。
 *     Planner 加载 plan 时拼 `[...laneNodes, ...plan.nodes]`。
 *
 * 与 docs/DATA_MODEL.md § 3.3 JSONB shape 对齐：DB 只存 meridian 类节点。
 */

import { MarkerType, type Edge } from "@xyflow/react";
import type { Node } from "@xyflow/react";

/* ───────────────────────── Types ───────────────────────── */

export type NodeKind =
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

export type NodeData = {
  label: string;
  kind: NodeKind;
  value?: string;
  source?: string;
  trust?: "high" | "med" | "low";
};

export type LaneData = {
  label: string; // L0、L1...
  title: string; // 中文小标题
  hint?: string; // 一句解释
};

export type MeridianFlowNode = Node<NodeData, "meridian">;
export type LaneFlowNode = Node<LaneData, "lane">;
export type FlowNode = MeridianFlowNode | LaneFlowNode;

/* ───────────────────────── Layout coords ───────────────────────── */

export const ROW = { L0: 100, L1: 280, L2: 460, L3: 640, L4: 820 };
export const NODE_W = 220;
export const cx = (center: number) => center - NODE_W / 2;

// 4 列网格中心点（gap 240）
export const COL = { c1: 230, c2: 470, c3: 710, c4: 950 };
// 3 / 2 / 1 节点居中分布
export const COL3 = { a: 350, b: 590, c: 830 };
export const COL2 = { a: 470, b: 710 };
export const COL1 = 590;
export const LANE_X = -200;

/* ───────────────────────── Lane scaffold (render-only, not persisted) ───────────────────────── */

export const laneNodes: LaneFlowNode[] = [
  { id: "lane-0", type: "lane", position: { x: LANE_X, y: ROW.L0 + 10 }, draggable: false, selectable: false, focusable: false, data: { label: "L0", title: "长期目标",    hint: "整张图的起点" } },
  { id: "lane-1", type: "lane", position: { x: LANE_X, y: ROW.L1 + 10 }, draggable: false, selectable: false, focusable: false, data: { label: "L1", title: "关注指标",    hint: "由目标驱动" } },
  { id: "lane-2", type: "lane", position: { x: LANE_X, y: ROW.L2 + 10 }, draggable: false, selectable: false, focusable: false, data: { label: "L2", title: "Requirement", hint: "硬约束" } },
  { id: "lane-3", type: "lane", position: { x: LANE_X, y: ROW.L3 + 10 }, draggable: false, selectable: false, focusable: false, data: { label: "L3", title: "课程选择",    hint: "同级 · 不同选择" } },
  { id: "lane-4", type: "lane", position: { x: LANE_X, y: ROW.L4 + 10 }, draggable: false, selectable: false, focusable: false, data: { label: "L4", title: "外部资源",    hint: "平行可叠加" } },
];

/* ───────────────────────── Edge style helpers ───────────────────────── */

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
const ROSE = "#e11d48";
const SKY = "#0ea5e9";
const VIOLET = "#a855f7";
const EMERALD = "#10b981";

/* ───────────────────────── SEED data (用于首次空态自动建 plan) ───────────────────────── */

export const SEED_MERIDIAN_NODES: MeridianFlowNode[] = [
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

export const SEED_EDGES: Edge[] = [
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
