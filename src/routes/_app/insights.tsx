import { createFileRoute } from "@tanstack/react-router";
import InsightsPage from "@/pages/Insights";

export const Route = createFileRoute("/_app/insights")({
  component: InsightsPage,
});
