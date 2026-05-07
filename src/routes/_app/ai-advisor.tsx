import { createFileRoute } from "@tanstack/react-router";
import AIAdvisorPage from "@/pages/AIAdvisor";

export const Route = createFileRoute("/_app/ai-advisor")({
  component: AIAdvisorPage,
});
