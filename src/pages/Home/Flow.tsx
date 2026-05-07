import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Upload,
  Sparkles,
  Network,
  Route,
  ChevronDown,
} from "lucide-react";

/**
 * "规则解析过程可视化" — 4-step pipeline. The page is NOT pinned. Each
 * step card is driven by its own scrub trigger, scaling up + brightening
 * as it enters the lower half of the viewport, peaking when its center
 * crosses the viewport mid-line, and shrinking back as it leaves
 * upward — so as the user scrolls naturally, focus rolls one card at a
 * time, like a scroll-wheel.
 */
export default function Flow() {
  const sectionRef = useRef<HTMLElement>(null);

  const steps = [
    {
      Icon: Upload,
      title: "上传培养方案 PDF",
      tag: "Step 01",
    },
    {
      Icon: Sparkles,
      title: "AI 提取",
      tag: "Step 02",
      bullets: [
        "GPA 规则",
        "补考规则",
        "重修覆盖",
        "奖学金算法",
        "替换方案",
        "……",
      ],
    },
    {
      Icon: Network,
      title: "建立学校规则图谱",
      tag: "Step 03",
    },
    {
      Icon: Route,
      title: "生成路径建议",
      tag: "Step 04",
    },
  ];

  useEffect(() => {
    if (!sectionRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const stepEls = gsap.utils.toArray<HTMLElement>(".flow-step");

      stepEls.forEach((el) => {
        // Resting (small + dim) state for every card.
        gsap.set(el, {
          scale: 0.86,
          opacity: 0.38,
          transformOrigin: "50% 50%",
          force3D: true,
        });

        // Single continuous timeline across the whole card-pass. Two
        // tweens share one ScrollTrigger so there is no hand-off seam at
        // the peak — sine.inOut on each half lands the velocity at zero
        // exactly when scale reaches 1.06, then accelerates back down.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "bottom 15%",
              scrub: 0.8,
            },
            defaults: { ease: "sine.inOut", duration: 0.5 },
          })
          .to(el, { scale: 1.06, opacity: 1 })
          .to(el, { scale: 0.86, opacity: 0.38 });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="flow"
      className="relative z-10 px-6 pt-0 pb-32 max-w-2xl mx-auto -mt-[35vh]"
    >
      <div className="text-center mb-14">
        <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
          规则解析过程可视化
        </p>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
          这不是黑箱，这是流程
        </h2>
      </div>

      <div className="flex flex-col items-center">
        {steps.map(({ Icon, title, tag, bullets }, i) => (
          <div key={title} className="w-full flex flex-col items-center">
            <div className="flow-step group w-full bg-white border border-gray-200 rounded-2xl p-6 transition-[box-shadow,border-color] duration-300 ease-out hover:border-black hover:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold transition-colors duration-300 group-hover:text-black">
                    {title}
                  </h3>
                  <span className="text-xs font-mono text-gray-400 transition-colors duration-300 group-hover:text-gray-700">
                    {tag}
                  </span>
                </div>
              </div>
              {bullets && (
                <ul className="mt-4 ml-[60px] grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-gray-600">
                  {bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 transition-colors duration-300 group-hover:text-gray-800"
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0 transition-colors duration-300 group-hover:bg-black" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className="flex flex-col items-center py-2">
                <span className="block w-px h-3 bg-gray-300" />
                <ChevronDown
                  className="w-4 h-4 text-gray-400 -mt-1"
                  strokeWidth={2.5}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
