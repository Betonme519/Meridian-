import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, HelpCircle } from "lucide-react";
import SplitText from "@/components/effects/SplitText";

gsap.registerPlugin(ScrollTrigger);

/**
 * "认知落差" — 同一所学校，少数人大二就知道的六件事，多数人直到毕业前才看清。
 *
 * 滚动驱动动效：scrub 1 时间线绑在 cardRef 上。每当用户向下滚一点：
 *  - 左栏第 i 项 — emerald check 弹入 + 文字 #9ca3af → #111827（变清晰）
 *  - 右栏第 i 项 — overlay 横线 scaleX 0→1 划过 + 文字 #374151 → #d1d5db（被划掉）
 * 6 项依次推进，i 之间偏移 0.6 单位，与滚动节奏成线性映射。
 *
 * 替代了原 "每个推荐都有理由" 卡片演示。
 */

const ITEMS = [
  "哪些课压分",
  "哪些课高学分低 workload",
  "哪些规则影响保研",
  "哪些补考不会覆盖 GPA",
  "哪些课可以慢点修",
  "哪些要求可以用其他方式抵",
];

export default function Explain() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const leftChecksRef = useRef<(HTMLSpanElement | null)[]>([]);
  const leftTextsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const rightStrikesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const rightTextsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const tiltX = useRef<gsap.QuickToFunc | null>(null);
  const tiltY = useRef<gsap.QuickToFunc | null>(null);

  useGSAP(
    () => {
      // Trigger window: from "card just appearing at the bottom of the
      // viewport" → "card center hits viewport center". By the time the
      // user has the section roughly centered on screen, all six items
      // are fully checked / struck.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 90%",
          end: "center 62%",
          scrub: 1,
        },
      });

      ITEMS.forEach((_, i) => {
        const at = i * 0.6;
        tl.to(
          leftChecksRef.current[i],
          { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" },
          at,
        );
        tl.to(
          leftTextsRef.current[i],
          { color: "#f8fafc", duration: 0.45 },
          at,
        );
        tl.to(
          rightStrikesRef.current[i],
          { scaleX: 1, duration: 0.5, ease: "power2.out" },
          at,
        );
        tl.to(
          rightTextsRef.current[i],
          { color: "#9ca3af", duration: 0.5 },
          at,
        );
      });

      // Smooth pointer-follow tilt — quickTo so each frame interpolates
      // toward the latest cursor angle without rebuilding tweens.
      if (cardRef.current) {
        tiltX.current = gsap.quickTo(cardRef.current, "rotationY", {
          duration: 0.55,
          ease: "power2.out",
        });
        tiltY.current = gsap.quickTo(cardRef.current, "rotationX", {
          duration: 0.55,
          ease: "power2.out",
        });
      }
    },
    { scope: sectionRef },
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    tiltX.current?.(nx * 5); // ±2.5deg around Y
    tiltY.current?.(-ny * 3.5); // ±1.75deg around X (inverted = natural)
  };

  const handleMouseLeave = () => {
    tiltX.current?.(0);
    tiltY.current?.(0);
  };

  return (
    <section
      ref={sectionRef}
      id="explain"
      className="relative px-6 pt-40 pb-32 bg-black border-y border-white/10 overflow-hidden"
    >
      <div className="relative max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-xs font-medium text-white/45 tracking-widest uppercase mb-4">
            认知落差
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
            <SplitText
              text="为什么大家会焦虑"
              splitType="chars"
              delay={40}
              duration={0.9}
              from={{ opacity: 0, y: 50 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.05}
              rootMargin="0px"
              textAlign="center"
            />
          </h2>
        </div>

        {/* 2-column split, sharing the same list of facts.
            Wrapper holds perspective so the inner card can tilt subtly
            toward the cursor without distorting children. */}
        <div
          className="max-w-5xl mx-auto"
          style={{ perspective: "1200px" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
        <div
          ref={cardRef}
          className="grid md:grid-cols-2 border border-white/15 rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.10] via-white/[0.05] to-white/[0.02] backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10)]"
          style={{
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          {/* LEFT — informed minority */}
          <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-1">
              有人大二就知道
            </h3>
            <p className="text-sm text-white/65 mb-10">六件事，一清二楚</p>
            <ul className="space-y-4">
              {ITEMS.map((item, i) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    ref={(el) => {
                      leftChecksRef.current[i] = el;
                    }}
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/20"
                    style={{ opacity: 0, transform: "scale(0.4)" }}
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" strokeWidth={2.6} />
                  </span>
                  <span
                    ref={(el) => {
                      leftTextsRef.current[i] = el;
                    }}
                    className="text-base leading-6"
                    style={{ color: "#9ca3af" }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — same six things, struck through as you scroll */}
          <div className="p-8 md:p-12 flex flex-col relative">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-1">
              而大多数人
            </h3>
            <p className="text-sm text-white/65 mb-10">同样的六件事</p>
            <ul className="space-y-4">
              {ITEMS.map((item, i) => (
                <li
                  key={item}
                  className="flex items-start gap-3 select-none"
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/45 ring-1 ring-white/10"
                    aria-hidden="true"
                  >
                    <HelpCircle className="h-3 w-3" strokeWidth={2} />
                  </span>
                  <span
                    ref={(el) => {
                      rightTextsRef.current[i] = el;
                    }}
                    className="relative inline-block text-base leading-6"
                    style={{ color: "#e5e7eb" }}
                  >
                    {item}
                    <span
                      ref={(el) => {
                        rightStrikesRef.current[i] = el;
                      }}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-white/75"
                      style={{
                        transform: "scaleX(0)",
                        transformOrigin: "left center",
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>

            {/* The punchline drops below a hairline divider */}
            <div className="mt-10 pt-6 border-t border-white/15">
              <p className="text-2xl md:text-3xl font-semibold tracking-tight text-white leading-tight">
                直到大四，才知道。
              </p>
            </div>
          </div>
        </div>
        </div>

        {/* Bridge — closes the section into the next one */}
        <p className="text-center text-sm text-white/55 mt-12 max-w-xl mx-auto">
          很多人直到毕业前，才第一次看清这些规则之间的关系。
        </p>
      </div>
    </section>
  );
}
