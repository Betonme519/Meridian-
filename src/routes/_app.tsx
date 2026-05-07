import { Outlet, createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/layouts/DashboardLayout";

/**
 * Pathless layout route. 所有挂在 _app 下的子路由（dashboard / ai-advisor / ...）
 * 自动套上 DashboardLayout，不需在 page 内手动 import。
 */
export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
