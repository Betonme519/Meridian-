import { createFileRoute } from "@tanstack/react-router";
import GPASimulatorPage from "@/pages/GPASimulator";

export const Route = createFileRoute("/_app/gpa-simulator")({
  component: GPASimulatorPage,
});
