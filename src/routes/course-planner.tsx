import { createFileRoute } from "@tanstack/react-router";
import PlannerPage from "@/pages/Planner";

export const Route = createFileRoute("/course-planner")({
  component: PlannerPage,
});
