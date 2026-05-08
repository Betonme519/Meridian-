import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { MENU_ITEMS } from "@/config/menu";

/**
 * 功能页面外壳。
 *  - 左侧固定一条 icon-only rail（仅 lg+ 显示），高亮当前所在功能。
 *  - 顶部 sticky 栏带 hamburger，点击展开 drawer，drawer 风格与首页 Navbar 一致。
 *
 * 菜单数据来自 src/config/menu.ts，与首页 Navbar 共用同一份。
 */

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);

  // Body scroll lock while drawer is open
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

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [currentPath]);

  const currentItem = MENU_ITEMS.find((i) => i.to === currentPath);
  const CurrentIcon = currentItem?.icon;

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      {/* Icon-only left rail. Highlights active feature.
          Hamburger sits at the bottom of the rail (desktop). */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center border-r border-slate-200 bg-white py-3 lg:flex">
        <Link
          to="/"
          aria-label="Meridian 首页"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white"
        >
          M
        </Link>
        <nav className="mt-6 flex flex-col gap-1.5">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                  active
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </Link>
            );
          })}
        </nav>

        {/* Hamburger pinned to the bottom of the rail */}
        <button
          type="button"
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          title="菜单"
          className="mt-auto inline-flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            background: open ? "rgba(15,23,42,0.06)" : "transparent",
            transition: "background 0.25s ease",
          }}
          onMouseEnter={(e) => {
            if (!open) e.currentTarget.style.background = "rgba(15,23,42,0.05)";
          }}
          onMouseLeave={(e) => {
            if (!open) e.currentTarget.style.background = "transparent";
          }}
        >
          <span className="relative block" style={{ width: 18, height: 12 }}>
            <span
              className="absolute left-0 right-0 origin-center"
              style={{
                height: 2,
                background: "#111827",
                top: open ? "calc(50% - 1px)" : 0,
                transform: open ? "rotate(45deg)" : "rotate(0deg)",
                transition:
                  "transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.35s cubic-bezier(0.22, 0.61, 0.36, 1)",
              }}
            />
            <span
              className="absolute left-0 right-0 origin-center"
              style={{
                height: 2,
                background: "#111827",
                top: open ? "calc(50% - 1px)" : "auto",
                bottom: open ? "auto" : 0,
                transform: open ? "rotate(-45deg)" : "rotate(0deg)",
                transition:
                  "transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), bottom 0.35s cubic-bezier(0.22, 0.61, 0.36, 1)",
              }}
            />
          </span>
        </button>
      </aside>

      {/* Top header — borderless, transparent so it doesn't read as a
          separate framed box intersecting with the icon rail. */}
      <header className="sticky top-0 z-30 bg-transparent px-4 py-3 lg:ml-16">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={open ? "关闭菜单" : "打开菜单"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
              style={{
                background: open ? "rgba(0,0,0,0.06)" : "transparent",
                transition: "background 0.25s ease",
              }}
              onMouseEnter={(e) => {
                if (!open)
                  e.currentTarget.style.background = "rgba(0,0,0,0.05)";
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
                    background: "#111827",
                    top: open ? "calc(50% - 1px)" : 0,
                    transform: open ? "rotate(45deg)" : "rotate(0deg)",
                    transition:
                      "transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.35s cubic-bezier(0.22, 0.61, 0.36, 1)",
                  }}
                />
                <span
                  className="absolute left-0 right-0 origin-center"
                  style={{
                    height: 2,
                    background: "#111827",
                    top: open ? "calc(50% - 1px)" : "auto",
                    bottom: open ? "auto" : 0,
                    transform: open ? "rotate(-45deg)" : "rotate(0deg)",
                    transition:
                      "transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), bottom 0.35s cubic-bezier(0.22, 0.61, 0.36, 1)",
                  }}
                />
              </span>
            </button>

            {/* Mobile-only logo (icon rail is hidden on small screens) */}
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-xs font-bold text-white">
                M
              </span>
              <span className="text-sm font-semibold tracking-tight text-slate-900">
                Meridian
              </span>
            </Link>

            {currentItem && CurrentIcon && (
              <div className="hidden items-center gap-2 text-sm font-medium text-slate-700 lg:flex">
                <CurrentIcon className="h-4 w-4 text-slate-400" strokeWidth={1.6} />
                {currentItem.label}
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              2026 春季学期
            </span>
            <Link
              to="/login"
              aria-label="登录或个人中心"
              title="登录"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white transition-opacity hover:opacity-85"
            >
              J
            </Link>
          </div>
        </div>
      </header>

      <main className="lg:ml-16">{children}</main>

      {/* Drawer overlay — same look as homepage Navbar drawer */}
      <div
        className="fixed inset-0 z-[70]"
        style={{ pointerEvents: open ? "auto" : "none" }}
        aria-hidden={!open}
      >
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
                const active = currentPath === item.to;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
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
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                          active
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 text-gray-700 group-hover:border-gray-900 group-hover:text-gray-900"
                        }`}
                      >
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
    </div>
  );
}
