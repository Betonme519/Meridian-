import { createFileRoute } from "@tanstack/react-router";
import InsightsPage from "@/pages/Insights";

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
});
