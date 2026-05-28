import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

/**
 * LogoFace — Logo 呼吸 + 变脸循环动画。
 *
 * 设计目标：
 *   - 几何严格对齐 logo（同 src/assets/logos/logo黑.png + PathLoader 几何）
 *   - 单组件可用作首页/对话框装饰，也可单独当 hero mark
 *   - 节奏：呼吸 ×2（三线收短伸长 + dot 弹跳）→ 变脸（非对称 smirk）→
 *     表情（挑眉 + 眨眼 + smirk 加深）→ 还原 → 循环
 *
 * 风格延续 PathLoader：
 *   - SVG 颜色用 currentColor，父级 text-* 控制
 *   - useGSAP({ scope }) 自动清理，避免 React StrictMode 双 mount 残留
 *   - prefers-reduced-motion 直接 return，显示静态初态 logo
 *
 * 实现要点：
 *   - line / circle 几何用 state + onUpdate setAttribute 渲染（与 PathLoader 一致，
 *     attr plugin 也行但 setAttribute 更直观）
 *   - CSS 用 inline style 显式声明 transform-box: fill-box + transform-origin:
 *     center，避免 GSAP 缓存初始 cx/cy 后 dot 移动到新位置时 transform pivot
 *     错位引起的闪烁
 *   - bounce.out 结束到 toFace 中间留 0.15s 缓冲 + 显式 reset dot transform，
 *     兜底防呼吸残留状态渗到 face 第一帧
 */

export interface LogoFaceProps {
  /** SVG 直径 (px)。默认 56，与 PathLoader 同。 */
  size?: number;
  /** 容器 className（颜色用 text-*，组件内部用 currentColor）。 */
  className?: string;
  /** 仅播放呼吸段，不做变脸（适合纯 loading/装饰场景）。默认 false。 */
  breathingOnly?: boolean;
}

const FULL = {
  hx1: 42, hx2: 218,
  vy1: 42, vy2: 218,
  sx1: 76, sy1: 184, sx2: 182, sy2: 78,
  cx: 204, cy: 56, r: 15,
} as const;

const INHALE = {
  hx1: 56, hx2: 204,
  vy1: 56, vy2: 204,
  sx1: 90, sy1: 170, sx2: 170, sy2: 90,
  r: 13,
} as const;

const EXHALE = { ...FULL, r: 15 } as const;

export default function LogoFace({
  size = 56,
  className,
  breathingOnly = false,
}: LogoFaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<SVGGElement>(null);
  const barHRef = useRef<SVGLineElement>(null);
  const barVRef = useRef<SVGLineElement>(null);
  const slashRef = useRef<SVGLineElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const eyeArcRef = useRef<SVGPathElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      const barH = barHRef.current;
      const barV = barVRef.current;
      const slash = slashRef.current;
      const dot = dotRef.current;
      const eyeArc = eyeArcRef.current;
      const mouth = mouthRef.current;
      const mark = markRef.current;
      if (!barH || !barV || !slash || !dot || !eyeArc || !mouth || !mark) return;

      const state = { ...FULL };

      const render = () => {
        barH.setAttribute("x1", String(state.hx1));
        barH.setAttribute("x2", String(state.hx2));
        barV.setAttribute("y1", String(state.vy1));
        barV.setAttribute("y2", String(state.vy2));
        slash.setAttribute("x1", String(state.sx1));
        slash.setAttribute("y1", String(state.sy1));
        slash.setAttribute("x2", String(state.sx2));
        slash.setAttribute("y2", String(state.sy2));
        dot.setAttribute("cx", String(state.cx));
        dot.setAttribute("cy", String(state.cy));
        dot.setAttribute("r", String(state.r));
      };

      // 初始可见性
      gsap.set([mouth, eyeArc], { opacity: 0 });
      gsap.set([barH, barV, slash], { opacity: 1 });
      gsap.set(mark, { rotation: 0, scale: 1, transformOrigin: "50% 50%" });
      gsap.set(dot, { scaleY: 1, opacity: 1, x: 0, y: 0 });
      render();

      const tl = gsap.timeline({
        repeat: -1,
        defaults: { ease: "sine.inOut", onUpdate: render },
      });

      // ---------- A. 呼吸 ×2：三线收短伸长 + dot 弹跳 ----------
      tl.addLabel("breath1")
        .to(state, { ...INHALE, duration: 1.0, ease: "sine.inOut" }, "breath1")
        .to(dot, { y: -14, x: 4, duration: 1.0, ease: "sine.out" }, "breath1")
        .to(state, { ...EXHALE, duration: 1.0, ease: "sine.inOut" })
        .to(dot, { y: 0, x: 0, duration: 1.0, ease: "bounce.out" }, "<");

      tl.addLabel("breath2")
        .to(state, { ...INHALE, duration: 1.0, ease: "sine.inOut" }, "breath2")
        .to(dot, { y: -18, x: -3, duration: 1.0, ease: "sine.out" }, "breath2")
        .to(state, { ...EXHALE, duration: 1.0, ease: "sine.inOut" })
        .to(dot, { y: 0, x: 0, duration: 1.0, ease: "bounce.out" }, "<");

      if (breathingOnly) {
        tl.to(state, { duration: 0.4 });
        return;
      }

      // ---------- B. Logo → 个性脸 ----------
      // 0.15s 缓冲 + 显式 reset dot transform，防 bounce 残留渗到下一帧
      tl.addLabel("toFace", "+=0.15");
      tl.set(dot, { x: 0, y: 0, scaleY: 1 }, "toFace");

      // 横竖线淡出
      tl.to([barH, barV], { opacity: 0, duration: 0.3, onUpdate: undefined }, "toFace");

      // slash → 右上挑眉（短一截、上移）
      tl.to(state, {
        sx1: 142, sy1: 92, sx2: 192, sy2: 76,
        duration: 0.55, ease: "power2.inOut",
      }, "toFace");

      // dot → 右眼位 + 变大
      tl.to(state, {
        cx: 162, cy: 132, r: 19,
        duration: 0.55, ease: "power2.inOut",
      }, "toFace");

      // 左眼弧淡入
      tl.fromTo(eyeArc, { opacity: 0 }, { opacity: 1, duration: 0.3 }, "toFace+=0.25");

      // 嘴 smirk 淡入
      tl.fromTo(mouth, { opacity: 0 }, { opacity: 1, duration: 0.3 }, "toFace+=0.35");

      // 整脸轻微歪 6°
      tl.to(mark, { rotation: 6, duration: 0.6, ease: "power2.out" }, "toFace+=0.1");

      // ---------- C. 表情：smirk 加深 + 挑眉 + 眨眼 ----------
      tl.addLabel("expr", "+=0.15");

      tl.to(mouth, {
        attr: { d: "M 54 196 Q 124 226 210 152" },
        duration: 0.35, ease: "back.out(2)",
      }, "expr");

      // 眉毛挑一下
      tl.to(state, {
        sx1: 142, sy1: 84, sx2: 192, sy2: 64,
        duration: 0.3, ease: "back.out(2)",
      }, "expr")
        .to(state, {
          sx1: 142, sy1: 92, sx2: 192, sy2: 76,
          duration: 0.3,
        });

      // 整脸轻微一弹
      tl.to(mark, { scale: 1.05, duration: 0.3, ease: "back.out(2)" }, "expr+=0.2")
        .to(mark, { scale: 1.0, duration: 0.3 });

      // 眨右眼
      tl.to(dot, { scaleY: 0.12, duration: 0.12, ease: "power2.in" }, "expr+=0.7")
        .to(dot, { scaleY: 1, duration: 0.18, ease: "power2.out" });

      // 嘴稍收
      tl.to(mouth, {
        attr: { d: "M 56 192 Q 124 220 204 168" },
        duration: 0.3,
      }, "-=0.1");

      // ---------- D. Face → Logo 还原 ----------
      tl.addLabel("toLogo", "+=0.5");

      tl.to([mouth, eyeArc], { opacity: 0, duration: 0.2 }, "toLogo");
      tl.to(mark, { rotation: 0, duration: 0.5, ease: "power2.inOut" }, "toLogo");
      // dot 回 NE 顶点
      tl.to(state, {
        cx: 204, cy: 56, r: 15,
        duration: 0.55, ease: "power2.inOut",
      }, "toLogo");
      // slash 几何归位
      tl.to(state, {
        sx1: 76, sy1: 184, sx2: 182, sy2: 78,
        duration: 0.55, ease: "power2.inOut",
      }, "toLogo");
      // 横竖线显回
      tl.to([barH, barV], { opacity: 1, duration: 0.35, onUpdate: undefined }, "toLogo+=0.25");

      // 给循环间一点点喘息
      tl.to(state, { duration: 0.4 });
    },
    { scope: rootRef, dependencies: [breathingOnly] },
  );

  // 让 transform-origin 永远以元素自身 bbox 中心为基准，避免 GSAP 缓存
  // 旧 cx/cy 后 transform pivot 错位导致变脸时的"闪烁"。inline style 直接挂
  // 到每个会被 transform 的元件上。
  const tbStyle = {
    transformBox: "fill-box" as const,
    transformOrigin: "center" as const,
  };

  return (
    <div
      ref={rootRef}
      className={`inline-flex shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 260 260"
        width={size}
        height={size}
        role="img"
        aria-label="Meridian"
        className="shrink-0 overflow-visible"
      >
        <g ref={markRef}>
          {/* Logo 原 4 件，几何完全对齐 PathLoader / logo黑.png */}
          <line
            ref={barVRef}
            x1={130} y1={42} x2={130} y2={218}
            stroke="currentColor" strokeWidth={15} strokeLinecap="round" fill="none"
            style={tbStyle}
          />
          <line
            ref={barHRef}
            x1={42} y1={130} x2={218} y2={130}
            stroke="currentColor" strokeWidth={15} strokeLinecap="round" fill="none"
            style={tbStyle}
          />
          <line
            ref={slashRef}
            x1={76} y1={184} x2={182} y2={78}
            stroke="currentColor" strokeWidth={15} strokeLinecap="round" fill="none"
            style={tbStyle}
          />
          <circle
            ref={dotRef}
            cx={204} cy={56} r={15}
            fill="currentColor"
            style={tbStyle}
          />

          {/* Face 专用：左眼弧 + 不对称 smirk 嘴。初始 opacity 0 */}
          <path
            ref={eyeArcRef}
            d="M 60 128 Q 78 112 104 134"
            stroke="currentColor" strokeWidth={13} strokeLinecap="round" fill="none"
            style={{ ...tbStyle, opacity: 0 }}
          />
          <path
            ref={mouthRef}
            d="M 56 192 Q 124 220 204 168"
            stroke="currentColor" strokeWidth={13} strokeLinecap="round" fill="none"
            style={{ ...tbStyle, opacity: 0 }}
          />
        </g>
      </svg>
    </div>
  );
}
