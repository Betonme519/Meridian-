import { useCallback, useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Drawer state + 3 standard side effects.
 *
 * 抽自 Navbar.tsx 与 DashboardLayout.tsx 共有的 drawer 三件套
 * （open state + body scroll-lock + Escape 关闭）。
 *
 * 两处行为差异通过 options 表达：
 *  - DashboardLayout：路由切换自动关（用户点 menu item 跳页 → drawer 关）
 *    设 `closeOnRouteChange: true`
 *  - Navbar：路由切换不自动关（落地页 hash 跳锚点不算"路由切换"）。
 *    实际关闭由 menu item onClick 显式调用 close() 完成。
 *    设 `closeOnRouteChange: false`（默认）
 *
 * SSR：document / window 调用全部 typeof 守卫，server 端无副作用。
 */
export interface UseDrawerOptions {
  /** true 时监听路由 pathname 变化，变化即关 drawer。默认 false。 */
  closeOnRouteChange?: boolean;
}

export interface UseDrawerReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  close: () => void;
}

export function useDrawer(options: UseDrawerOptions = {}): UseDrawerReturn {
  const { closeOnRouteChange = false } = options;
  const [open, setOpen] = useState(false);

  // 路由 pathname 订阅 —— 不勾选 closeOnRouteChange 时也订阅但不使用，
  // 让 hook 不依赖 options 改变 dependency 形态。代价仅是多一次 select。
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Body scroll lock
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close on route change
  useEffect(() => {
    if (!closeOnRouteChange) return;
    setOpen(false);
  }, [pathname, closeOnRouteChange]);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return { open, setOpen, toggle, close };
}
