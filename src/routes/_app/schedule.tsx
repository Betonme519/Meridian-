import { createFileRoute } from "@tanstack/react-router";
import SchedulePage from "@/pages/Schedule";

export const Route = createFileRoute("/_app/schedule")({
  component: SchedulePage,
});
