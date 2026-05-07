import { createFileRoute } from "@tanstack/react-router";
import GPASimulatorPage from "@/pages/GPASimulator";

export const Route = createFileRoute("/gpa-simulator")({
  component: GPASimulatorPage,
});
