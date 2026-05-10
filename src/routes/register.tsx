import { createFileRoute } from "@tanstack/react-router";
import RegisterPage from "@/pages/Register";

interface RegisterSearch {
  redirect?: string;
}

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
    redirect:
      typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: RegisterPage,
});
