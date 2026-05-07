import { createFileRoute } from "@tanstack/react-router";
import AIAdvisorPage from "@/pages/AIAdvisor";

export const Route = createFileRoute("/ai-advisor")({
  component: AIAdvisorPage,
});
