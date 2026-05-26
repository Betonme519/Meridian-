import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

/**
 * PathLoader — 加载占位动画。
 *
 * SVG cross + diagonal + dot 三个图形,GSAP timeline 循环:
 *   1. 当前 arm 收缩到中心 (pull)
 *   2. 展开到下一个 arm 方向,dot 飞到对应端点 (send)
 *
 * 原型来自桌面 index.html (loading-rotation-mark)。
 * 改写要点:
 *   - 用 useGSAP({ scope }) 自动清理,避免 React StrictMode / dev 双 mount 残留 timeline
 *   - SVG 颜色用 currentColor,父级 text-* 控制
 *   - prefers-reduced-motion 直接 return,显示静态初态
 */

export interface PathLoaderProps {
  /** 动画下方说明文字。不传则不渲染。 */
  caption?: string;
  /** 容器 className。 */
  className?: string;
  /** SVG 直径 (px)。默认 56。 */
  size?: number;
}

const FULL = {
  hx1: 42, hx2: 218,
  vy1: 42, vy2: 218,
  sx1: 76, sy1: 184, sx2: 182, sy2: 78,
} as const;

const CENTER_LINES = {
  hx1: 130, hx2: 130,
  vy1: 130, vy2: 130,
  sx1: 130, sy1: 130, sx2: 130, sy2: 130,
} as const;

const CENTER_DOT = { cx: 130, cy: 130, r: 12.5 } as const;

interface Arm {
  pose: Partial<typeof FULL>;
  end: { cx: number; cy: number; r: number };
}

const ARMS: Arm[] = [
  { pose: { sx2: 158, sy2: 102 }, end: { cx: 204, cy: 56,  r: 15 } },
  { pose: { hx2: 180 },           end: { cx: 242, cy: 130, r: 15 } },
  { pose: { vy2: 180 },           end: { cx: 130, cy: 242, r: 15 } },
  { pose: { sx1: 102, sy1: 158 }, end: { cx: 62,  cy: 198, r: 15 } },
  { pose: { hx1: 80 },            end: { cx: 18,  cy: 130, r: 15 } },
  { pose: { vy1: 80 },            end: { cx: 130, cy: 18,  r: 15 } },
];

const poseFor = (arm: Arm) => ({ ...FULL, ...arm.pose });

export default function PathLoader({ caption, className, size = 56 }: PathLoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barHRef = useRef<SVGLineElement>(null);
  const barVRef = useRef<SVGLineElement>(null);
  const slashRef = useRef<SVGLineElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useGSAP(
    () => {
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      const h = barHRef.current;
      const v = barVRef.current;
      const slash = slashRef.current;
      const dot = dotRef.current;
      if (!h || !v || !slash || !dot) return;

      const state = { ...FULL, ...ARMS[0].end };

      // GSAP tweens 改 state 数值,onUpdate 把数值 setAttribute 回 SVG。
      // SVG 几何属性 (x1/x2/cx/r) 用 attr plugin 也行,但 onUpdate setAttribute
      // 更直观,与原型一致。
      const render = () => {
        h.setAttribute("x1", String(state.hx1));
        h.setAttribute("x2", String(state.hx2));
        v.setAttribute("y1", String(state.vy1));
        v.setAttribute("y2", String(state.vy2));
        slash.setAttribute("x1", String(state.sx1));
        slash.setAttribute("y1", String(state.sy1));
        slash.setAttribute("x2", String(state.sx2));
        slash.setAttribute("y2", String(state.sy2));
        dot.setAttribute("cx", String(state.cx));
        dot.setAttribute("cy", String(state.cy));
        dot.setAttribute("r", String(state.r));
      };

      const tl = gsap.timeline({
        repeat: -1,
        defaults: { ease: "sine.inOut", onUpdate: render },
      });

      tl.set(state, { ...poseFor(ARMS[0]), ...ARMS[0].end });
      ARMS.forEach((_, idx) => {
        const next = ARMS[(idx + 1) % ARMS.length];
        // pull: 所有线收到中心 + dot 缩成小圆
        tl.to(state, {
          ...CENTER_LINES,
          ...CENTER_DOT,
          duration: 0.72,
          ease: "power2.inOut",
        });
        // send: 展开为下一个 arm 姿态 + dot 飞到端点
        tl.to(state, {
          ...poseFor(next),
          ...next.end,
          duration: 0.62,
          ease: "power2.inOut",
        });
        // 微停顿
        tl.to(state, { duration: 0.08 });
      });

      render();
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className={`inline-flex items-center gap-3 text-slate-950 ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 260 260"
        width={size}
        height={size}
        role="img"
        aria-label={caption ?? "加载中"}
        className="shrink-0 overflow-visible"
      >
        <g>
          <line
            ref={barVRef}
            x1={130}
            y1={42}
            x2={130}
            y2={218}
            stroke="currentColor"
            strokeWidth={15}
            strokeLinecap="round"
            fill="none"
          />
          <line
            ref={barHRef}
            x1={42}
            y1={130}
            x2={218}
            y2={130}
            stroke="currentColor"
            strokeWidth={15}
            strokeLinecap="round"
            fill="none"
          />
          <line
            ref={slashRef}
            x1={76}
            y1={184}
            x2={182}
            y2={78}
            stroke="currentColor"
            strokeWidth={15}
            strokeLinecap="round"
            fill="none"
          />
          <circle ref={dotRef} cx={204} cy={56} r={15} fill="currentColor" />
        </g>
      </svg>
      {caption && <p className="text-sm text-slate-500">{caption}</p>}
    </div>
  );
}
