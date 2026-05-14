import { createFileRoute } from "@tanstack/react-router";
import PlannerPage from "@/pages/Planner";

// validateSearch 暴露 `?id=<plan uuid>` 查询参数；让 PlannerPage 走 URL
// 决定加载哪张 plan，刷新 / 直链都能复原。
// 不动 routes 目录其它部分（CLAUDE.md 铁律）；只在此处声明 schema。
export const Route = createFileRoute("/_app/course-planner")({
  component: PlannerPage,
  // 空串（`?id=` 没值）也归为 undefined —— 不然下游会拿空串当 plan id 去查
  validateSearch: (search: Record<string, unknown>) => ({
    id:
      typeof search.id === "string" && search.id.length > 0
        ? search.id
        : undefined,
  }),
});
