import { useEffect, useState } from "react";

/**
 * Adaptive top navigation bar.
 *  - Over the dark Hero/laptop screen (top of page): transparent + white text.
 *  - After the user has scrolled past ~30% of the viewport: white frosted bg
 *    + dark text + subtle separator. Smooth color transition between states.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Switch to opaque mode once scrolled ~30vh — at this point the laptop
      // showcase has shrunk enough that the white sticky stage dominates the
      // viewport behind the nav.
      setScrolled(window.scrollY > window.innerHeight * 0.3);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60]"
      style={{
        background: scrolled ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0)",
        backdropFilter: scrolled ? "blur(20px)" : "blur(0px)",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "blur(0px)",
        borderBottom: scrolled
          ? "1px solid rgba(0,0,0,0.06)"
          : "1px solid transparent",
        transition:
          "background 0.3s ease, border-bottom-color 0.3s ease, backdrop-filter 0.3s ease",
      }}
    >
      <nav className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{
              background: scrolled ? "#000" : "#fff",
              transition: "background 0.3s ease",
            }}
          >
            <span
              className="text-xs font-bold"
              style={{
                color: scrolled ? "#fff" : "#000",
                transition: "color 0.3s ease",
              }}
            >
              M
            </span>
          </div>
          <span
            className="text-base font-semibold tracking-tight"
            style={{
              color: scrolled ? "#111827" : "#fff",
              transition: "color 0.3s ease",
            }}
          >
            Meridian
          </span>
        </div>
        <div
          className="hidden md:flex items-center gap-12 text-sm"
          style={{
            color: scrolled ? "#4b5563" : "rgba(255,255,255,0.75)",
            transition: "color 0.3s ease",
          }}
        >
          <a
            href="#flow"
            className="transition-colors"
            style={{ color: "inherit" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = scrolled ? "#111827" : "#fff";
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
              e.currentTarget.style.color = scrolled ? "#111827" : "#fff";
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
              e.currentTarget.style.color = scrolled ? "#111827" : "#fff";
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
              e.currentTarget.style.color = scrolled ? "#111827" : "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "inherit";
            }}
          >
            评价社区
          </a>
        </div>
        <a
          href="#cta"
          className="px-5 py-2.5 rounded-full text-sm font-medium"
          style={{
            background: scrolled ? "#000" : "rgba(255,255,255,0.95)",
            color: scrolled ? "#fff" : "#000",
            transition: "background 0.3s ease, color 0.3s ease",
          }}
        >
          开始分析
        </a>
      </nav>
    </div>
  );
}
