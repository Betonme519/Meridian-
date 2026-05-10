import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import DashboardLayout from "@/layouts/DashboardLayout";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isGuestMode } from "@/lib/guestMode";

/**
 * Pathless layout route. 所有挂在 _app 下的子路由（dashboard / ai-advisor / ...）
 * 自动套上 DashboardLayout，不需在 page 内手动 import。
 *
 * beforeLoad 鉴权门禁：未登录访问 _app/* 任一子路由 → 跳 /login?redirect=<原路径>
 *  - SSR 守卫：D3 = 浏览器 auth，token 在 localStorage，server 端 getSession() 必为 null。
 *    若不守卫，SSR 会把已登录用户也重定向到 /login。client 端 hydration 会再跑一次 beforeLoad
 *    并拿到真实 session。
 *  - isSupabaseConfigured 守卫：fail-soft 与 src/lib/supabase.ts 一致，本地缺 env 时不拦路。
 *  - 访客模式守卫：用户从 Login 页点「暂时跳过」即置位 guest flag，放行进入功能页。
 *  - getSession() 读 localStorage 缓存，无网络 IO。
 */
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    if (!isSupabaseConfigured) return;
    if (isGuestMode()) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
