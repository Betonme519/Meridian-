import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BookOpen, ScrollText, Gauge, Sigma } from "lucide-react";
import TiltedCard from "@/components/effects/TiltedCard";

/**
 * "透明性" — hub-and-spoke。
 *
 *   Row 1 :  [P0]    eyebrow / 标题 / sub    [P1]
 *   Row 2 :   ·          推荐示例卡            ·
 *   Row 3 :  [P2]            ·                 [P3]
 *
 * 连线用真实 DOM 测量驱动：每个 pillar 测它内边中点，卡测它左右边中点。
 * 4 条 bezier 写到 SVG 的真实像素 viewBox，所以线头永远落在卡片边缘中点上，
 * 不再因为 grid 列宽变化而错位。
 */
type Rect = { x: number; y: number; w: number; h: number };

export default function Transparency() {
  const sectionRef = useRef<HTMLElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pillarRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  const [visible, setVisible] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [paths, setPaths] = useState<string[]>(["", "", "", ""]);

  // intersection-driven entrance
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // measure DOM and rebuild SVG paths whenever the layout changes
  useLayoutEffect(() => {
    const compute = () => {
      const hub = hubRef.current;
      const card = cardRef.current;
      if (!hub || !card) return;
      const hubRect = hub.getBoundingClientRect();
      const toLocal = (r: DOMRect): Rect => ({
        x: r.left - hubRect.left,
        y: r.top - hubRect.top,
        w: r.width,
        h: r.height,
      });
      const c = toLocal(card.getBoundingClientRect());
      const ps = pillarRefs.map((ref) =>
        ref.current ? toLocal(ref.current.getBoundingClientRect()) : null,
      );
      if (ps.some((p) => !p)) return;

      // card anchors: left-edge mid and right-edge mid (only two points)
      const cardLeft = { x: c.x, y: c.y + c.h / 2 };
      const cardRight = { x: c.x + c.w, y: c.y + c.h / 2 };

      // pillar exit points: inner edge mid
      // 0=TL,1=TR,2=BL,3=BR
      const exits = [
        { x: ps[0]!.x + ps[0]!.w, y: ps[0]!.y + ps[0]!.h / 2 }, // P0 right-mid
        { x: ps[1]!.x, y: ps[1]!.y + ps[1]!.h / 2 }, // P1 left-mid
        { x: ps[2]!.x + ps[2]!.w, y: ps[2]!.y + ps[2]!.h / 2 }, // P2 right-mid
        { x: ps[3]!.x, y: ps[3]!.y + ps[3]!.h / 2 }, // P3 left-mid
      ];
      const targets = [cardLeft, cardRight, cardLeft, cardRight];

      // smooth horizontal-S bezier: control points placed at midpoint X
      const buildPath = (
        s: { x: number; y: number },
        e: { x: number; y: number },
      ) => {
        const mx = (s.x + e.x) / 2;
        return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} C ${mx.toFixed(1)} ${s.y.toFixed(1)}, ${mx.toFixed(1)} ${e.y.toFixed(1)}, ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
      };

      setSize({ w: hubRect.width, h: hubRect.height });
      setPaths(exits.map((s, i) => buildPath(s, targets[i])));
    };

    compute();

    const ro = new ResizeObserver(compute);
    if (hubRef.current) ro.observe(hubRef.current);
    if (cardRef.current) ro.observe(cardRef.current);
    pillarRefs.forEach((r) => r.current && ro.observe(r.current));
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const PILLARS: {
    Icon: typeof BookOpen;
    label: string;
    desc: string;
    accent: string;
  }[] = [
    {
      Icon: BookOpen,
      label: "来源",
      desc: "每条建议都标出来源——学校官方手册、注册系统或教授大纲。点开即可回到原始段落。",
      accent: "#2563eb",
    },
    {
      Icon: ScrollText,
      label: "规则依据",
      desc: "推理过程公开：用了哪条学分规则、哪条 GPA 公式、哪条选课冲突，逐项列出。",
      accent: "#7c3aed",
    },
    {
      Icon: Gauge,
      label: "风险等级",
      desc: "低 / 中 / 高 三档明示，颜色独立编码。不会用模糊措辞掩盖不确定性。",
      accent: "#d97706",
    },
    {
      Icon: Sigma,
      label: "是否估算",
      desc: "区分「确定」与「估算」：基于历史数据的概率，会标出置信度，不假装是定论。",
      accent: "#475569",
    },
  ];

  const CHIPS = [
    { tag: "来源", value: "学校手册 §4.2", tone: "border-blue-200/70 text-blue-700 bg-blue-50/60" },
    { tag: "规则", value: "学分 ≥ 12", tone: "border-violet-200/70 text-violet-700 bg-violet-50/60" },
    { tag: "风险", value: "中", tone: "border-amber-200/70 text-amber-800 bg-amber-50/60" },
    { tag: "估算", value: "30% 置信", tone: "border-slate-200 text-slate-700 bg-slate-50" },
  ];

  const fadeUp = (delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.22,0.61,0.36,1) ${delay}s`,
  });

  // NOTE: this is a plain function returning JSX, NOT a sub-component.
  // Defining a React component inside another component re-creates its
  // function reference on every parent render, which makes React tear the
  // pillar DOM down and remount it on every hover — killing all CSS
  // transitions (the new node mounts already in the active state with no
  // "from" value to interpolate from). Calling it as `renderPillar(...)`
  // inlines the JSX so React reconciles it in place and transitions run.
  const renderPillar = (idx: number, align: "left" | "right", delay: number) => {
    const { Icon, label, desc } = PILLARS[idx];
    const active = activeIdx === idx;
    const drift = active ? (align === "left" ? 5 : -5) : 0;
    return (
      <div
        ref={pillarRefs[idx]}
        onMouseEnter={() => setActiveIdx(idx)}
        onMouseLeave={() => setActiveIdx(null)}
        className={`group relative rounded-2xl border bg-white p-6 cursor-default
          ${align === "left" ? "lg:text-right" : "lg:text-left"}
          ${active ? "border-gray-900 shadow-[0_22px_50px_rgba(15,23,42,0.10)]" : "border-gray-200"}`}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? `translate(${drift}px, 0) scale(${active ? 1.025 : 1})`
            : "translateY(18px) scale(1)",
          transition: [
            `opacity 0.6s ease ${delay}s`,
            `transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)`,
            `border-color 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.06s`,
            `box-shadow 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s`,
          ].join(", "),
        }}
      >
        <div
          className={`flex items-center gap-3 mb-3 ${
            align === "left" ? "lg:flex-row-reverse" : "flex-row"
          }`}
        >
          <span
            className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border
              ${active ? "border-gray-900 bg-gray-950 text-white" : "border-gray-200 text-gray-700"}`}
            style={{
              transition: [
                "background-color 0.95s cubic-bezier(0.16, 1, 0.3, 1) 0.18s",
                "border-color 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.12s",
                "color 0.95s cubic-bezier(0.16, 1, 0.3, 1) 0.22s",
              ].join(", "),
            }}
          >
            <Icon className="h-[19px] w-[19px]" strokeWidth={1.6} />
          </span>
          <h4 className="text-base font-semibold tracking-tight text-gray-950">
            {label}
          </h4>
        </div>
        <p className="text-[14px] leading-relaxed text-gray-600">{desc}</p>
        <span className="absolute right-4 top-4 text-[10px] tabular-nums text-gray-300 font-medium tracking-wider lg:hidden">
          0{idx + 1}
        </span>
      </div>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="transparency"
      className="relative px-6 py-28 border-y border-gray-100 bg-gradient-to-b from-white via-[#fafafa] to-white overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(15,23,42,0.04), transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        <div ref={hubRef} className="relative lg:min-h-[680px]">
          {/* SVG dashed connectors — pixel-coord viewBox so endpoints sit exactly on edges */}
          {size.w > 0 && size.h > 0 && (
            <svg
              aria-hidden
              viewBox={`0 0 ${size.w} ${size.h}`}
              className="absolute inset-0 hidden h-full w-full lg:block pointer-events-none"
            >
              {paths.map((d, i) =>
                d ? (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={
                      activeIdx === i ? PILLARS[i].accent : "rgba(15,23,42,0.32)"
                    }
                    strokeWidth={activeIdx === i ? 1.8 : 1.25}
                    strokeLinecap="round"
                    strokeDasharray="6 6"
                    className="transparency-ants"
                    style={{
                      opacity: visible ? 1 : 0,
                      transition: `opacity 0.8s ease ${0.7 + i * 0.12}s, stroke 0.25s ease, stroke-width 0.25s ease`,
                    }}
                  />
                ) : null,
              )}
            </svg>
          )}

          {/* 3 cols × 3 rows on lg; single column on mobile via order utilities */}
          <div className="grid grid-cols-1 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)_minmax(0,1fr)] lg:grid-rows-[auto_1fr_auto] lg:gap-x-12 lg:gap-y-10">
            {/* Row 1 */}
            <div className="order-3 lg:order-none lg:col-start-1 lg:row-start-1 lg:flex lg:items-center lg:justify-end">
              <div className="lg:w-full lg:max-w-[360px]">
                {renderPillar(0, "left", 0.5)}
              </div>
            </div>

            <div
              className="order-1 lg:order-none lg:col-start-2 lg:row-start-1 text-center lg:flex lg:flex-col lg:items-center lg:justify-center lg:py-2"
              style={fadeUp(0)}
            >
              <p className="text-[11px] font-medium tracking-[0.28em] uppercase text-gray-500 mb-3">
                透明性 · Transparency
              </p>
              <h2 className="text-3xl md:text-[2.6rem] font-semibold tracking-tight mb-3 leading-[1.15] text-gray-950">
                Meridian 不会假装
                <br className="hidden md:block" />
                什么都知道
              </h2>
              <p className="text-[15px] md:text-base text-gray-600 leading-relaxed">
                每一条建议都附上：
                <span className="text-gray-950 font-medium">
                  来源 · 规则 · 风险 · 估算
                </span>
                。
              </p>
            </div>

            <div className="order-4 lg:order-none lg:col-start-3 lg:row-start-1 lg:flex lg:items-center lg:justify-start">
              <div className="lg:w-full lg:max-w-[360px]">
                {renderPillar(1, "right", 0.6)}
              </div>
            </div>

            {/* Row 2: only center cell holds the card */}
            <div
              className="order-2 lg:order-none lg:col-start-2 lg:row-start-2 relative lg:flex lg:items-center lg:justify-center"
              style={fadeUp(0.2)}
            >
              <div ref={cardRef} className="w-full">
                <TiltedCard rotateAmplitude={6} scaleOnHover={1.015} perspective={1200}>
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
                    <div className="flex items-baseline justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                        推荐示例
                      </p>
                      <p className="text-xs text-gray-400">CS 245 · 4 学分</p>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-950 mb-5 tracking-tight">
                      数据结构与算法
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {CHIPS.map((c, i) => {
                        const lit = activeIdx === i;
                        return (
                          <span
                            key={c.tag}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium cursor-default ${c.tone}`}
                            style={{
                              opacity: visible ? 1 : 0,
                              transform: visible
                                ? lit
                                  ? "translateY(-2px) scale(1.04)"
                                  : "translateY(0)"
                                : "translateY(8px)",
                              boxShadow: lit
                                ? `0 6px 14px ${PILLARS[i].accent}22`
                                : "none",
                              borderColor: lit ? PILLARS[i].accent : undefined,
                              transition: `opacity 0.5s ease ${0.5 + i * 0.08}s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease`,
                            }}
                          >
                            <span className="opacity-60">{c.tag}</span>
                            <span className="font-semibold">{c.value}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </TiltedCard>
              </div>
            </div>

            {/* Row 3 */}
            <div className="order-5 lg:order-none lg:col-start-1 lg:row-start-3 lg:flex lg:items-center lg:justify-end">
              <div className="lg:w-full lg:max-w-[360px]">
                {renderPillar(2, "left", 0.7)}
              </div>
            </div>

            <div className="order-6 lg:order-none lg:col-start-3 lg:row-start-3 lg:flex lg:items-center lg:justify-start">
              <div className="lg:w-full lg:max-w-[360px]">
                {renderPillar(3, "right", 0.8)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
