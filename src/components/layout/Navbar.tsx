import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MENU_ITEMS } from "@/config/menu";

/**
 * Adaptive top navigation bar.
 *  - Over the dark Hero/laptop screen (top of page): transparent + white text.
 *  - After the user has scrolled past ~30% of the viewport: white frosted bg
 *    + dark text + subtle separator. Smooth color transition between states.
 *  - Left-side hamburger opens a drawer with feature routes.
 *
 * 菜单数据来自 src/config/menu.ts，与 DashboardLayout 共用同一份。
 */

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.3);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Navbar appearance follows scroll only — opening the drawer does NOT
  // force opaque mode, so on the dark Hero it stays transparent / white.
  const navOpaque = scrolled;
  const lineColor = navOpaque ? "#111827" : "#fff";

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[60]"
        style={{
          background: navOpaque ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0)",
          backdropFilter: navOpaque ? "blur(20px)" : "blur(0px)",
          WebkitBackdropFilter: navOpaque ? "blur(20px)" : "blur(0px)",
          borderBottom: navOpaque
            ? "1px solid rgba(0,0,0,0.06)"
            : "1px solid transparent",
          transition:
            "background 0.3s ease, border-bottom-color 0.3s ease, backdrop-filter 0.3s ease",
        }}
      >
        <nav className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Hamburger — left side. Both lines use the same integer pixel
                height so they render with identical thickness on every DPI
                (1.5px sub-pixel rendering caused visible asymmetry). */}
            <button
              type="button"
              aria-label={open ? "关闭菜单" : "打开菜单"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background: open ? "rgba(0,0,0,0.06)" : "transparent",
                transition: "background 0.25s ease",
              }}
              onMouseEnter={(e) => {
                if (!open)
                  e.currentTarget.style.background = navOpaque
                    ? "rgba(0,0,0,0.05)"
                    : "rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                if (!open) e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                className="relative block"
                style={{ width: 18, height: 12 }}
              >
                <span
                  className="absolute left-0 right-0 origin-center"
                  style={{
                    height: 2,
                    background: lineColor,
                    top: open ? "calc(50% - 1px)" : 0,
                    transform: open ? "rotate(45deg)" : "rotate(0deg)",
                    transition:
                      "transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), background 0.3s ease",
                  }}
                />
                <span
                  className="absolute left-0 right-0 origin-center"
                  style={{
                    height: 2,
                    background: lineColor,
                    top: open ? "calc(50% - 1px)" : "auto",
                    bottom: open ? "auto" : 0,
                    transform: open ? "rotate(-45deg)" : "rotate(0deg)",
                    transition:
                      "transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), bottom 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), background 0.3s ease",
                  }}
                />
              </span>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{
                  background: navOpaque ? "#000" : "#fff",
                  transition: "background 0.3s ease",
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{
                    color: navOpaque ? "#fff" : "#000",
                    transition: "color 0.3s ease",
                  }}
                >
                  M
                </span>
              </div>
              <span
                className="text-base font-semibold tracking-tight"
                style={{
                  color: navOpaque ? "#111827" : "#fff",
                  transition: "color 0.3s ease",
                }}
              >
                Meridian
              </span>
            </div>
          </div>

          <div
            className="hidden md:flex items-center gap-12 text-sm"
            style={{
              color: navOpaque ? "#4b5563" : "rgba(255,255,255,0.75)",
              transition: "color 0.3s ease",
            }}
          >
            <a
              href="#flow"
              className="transition-colors"
              style={{ color: "inherit" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = navOpaque ? "#111827" : "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "inherit";
              }}
            >
              首页概览
            </a>
            <a
              href="#explain"
              style={{ color: "inherit" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = navOpaque ? "#111827" : "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "inherit";
              }}
            >
              我的计划
            </a>
            <a
              href="#honesty"
              style={{ color: "inherit" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = navOpaque ? "#111827" : "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "inherit";
              }}
            >
              课程库
            </a>
            <a
              href="#feedback"
              style={{ color: "inherit" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = navOpaque ? "#111827" : "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "inherit";
              }}
            >
              评价社区
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-full text-sm font-medium"
              style={{
                color: navOpaque ? "#111827" : "rgba(255,255,255,0.9)",
                background: "transparent",
                transition: "color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = navOpaque
                  ? "rgba(0,0,0,0.05)"
                  : "rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              登录
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-full text-sm font-medium"
              style={{
                background: navOpaque ? "#000" : "rgba(255,255,255,0.95)",
                color: navOpaque ? "#fff" : "#000",
                transition: "background 0.3s ease, color 0.3s ease",
              }}
            >
              注册
            </Link>
          </div>
        </nav>
      </div>

      {/* Drawer overlay */}
      <div
        className="fixed inset-0 z-[70]"
        style={{ pointerEvents: open ? "auto" : "none" }}
        aria-hidden={!open}
      >
        {/* Backdrop — click to close */}
        <button
          type="button"
          aria-label="关闭菜单"
          onClick={() => setOpen(false)}
          className="absolute inset-0 cursor-default"
          style={{
            background: open ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0)",
            border: 0,
            transition: "background 0.4s ease",
            pointerEvents: open ? "auto" : "none",
          }}
          tabIndex={open ? 0 : -1}
        />

        {/* Drawer panel — slides from the left */}
        <aside
          className="absolute top-0 left-0 h-full w-full sm:w-[400px] flex flex-col"
          style={{
            background: "#ffffff",
            borderRight: "1px solid rgba(0,0,0,0.06)",
            transform: open ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1)",
          }}
        >
          <div className="px-8 pt-24 pb-10 flex-1 flex flex-col">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-8">
              功能导航
            </div>
            <ul className="flex flex-col">
              {MENU_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-4 py-4 border-b border-gray-100"
                      style={{
                        opacity: open ? 1 : 0,
                        transform: open ? "translateY(0)" : "translateY(8px)",
                        transition: `opacity 0.5s ease ${
                          open ? 200 + i * 60 : 0
                        }ms, transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) ${
                          open ? 200 + i * 60 : 0
                        }ms`,
                      }}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition-colors group-hover:border-gray-900 group-hover:text-gray-900">
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-base font-semibold tracking-tight text-gray-900">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-gray-500 truncate">
                          {item.desc}
                        </span>
                      </span>
                      <span
                        className="text-gray-300 transition-all group-hover:text-gray-900 group-hover:translate-x-1"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-auto pt-10 text-xs text-gray-400">
              Meridian · Academic Decision Engine
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
