import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Play } from "lucide-react";
import SplitText from "@/components/effects/SplitText";
import CardSwap, { Card } from "@/components/effects/CardSwap";

gsap.registerPlugin(ScrollTrigger);

/**
 * "Meridian 的本质" — 替代了原 "绩点不是玄学，是公式" 公式卡片。
 * 左侧文字陈述价值主张：不只是推荐好课，而是在目标下算最低代价的路径。
 * 右侧 CardSwap 三张视频卡轮播。
 *
 * 入场动效：
 *  - 大标题 h2 用 SplitText 字符级 fade-up（与首页 Hero 完全同源）
 *  - kicker / 副文 / 视频堆叠 各自在 ScrollTrigger 触发时 fade-up
 *  - items-start 让左栏文字在更高的位置启动
 */
const POINTS = [
  "目标变化，推荐逻辑实时变化",
  "规则之间的影响关系被重新展开",
  "每一次选择，都会被提前推演",
];

export default function GpaMath() {
  const sectionRef = useRef<HTMLElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const bulletsRef = useRef<(HTMLLIElement | null)[]>([]);

  useGSAP(
    () => {
      const trigger = sectionRef.current;

      gsap.to(kickerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger, start: "top 80%", once: true },
      });

      // Sub-text fades in slightly behind the h2 SplitText so it doesn't
      // crowd the title's character stagger.
      gsap.to(subRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.55,
        ease: "power3.out",
        scrollTrigger: { trigger, start: "top 80%", once: true },
      });

      gsap.to(videoRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        delay: 0.35,
        ease: "power3.out",
        scrollTrigger: { trigger, start: "top 78%", once: true },
      });

      // Bullet list staggers in after sub-text settles.
      gsap.to(bulletsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        delay: 1.05,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger, start: "top 80%", once: true },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="px-6 py-48 md:py-56 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-start">
          {/* LEFT — value statement */}
          <div>
            <p
              ref={kickerRef}
              className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-6"
              style={{ opacity: 0, transform: "translateY(14px)" }}
            >
              产品价值
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900 leading-[1.15] mb-8">
              <div>
                <SplitText
                  text="Meridian"
                  splitType="chars"
                  delay={40}
                  duration={0.9}
                  from={{ opacity: 0, y: 50 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.05}
                  rootMargin="0px"
                  textAlign="left"
                />
              </div>
              <div>
                <SplitText
                  text="不只是推荐好课"
                  splitType="chars"
                  delay={40}
                  duration={0.9}
                  from={{ opacity: 0, y: 50 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.05}
                  rootMargin="0px"
                  textAlign="left"
                />
              </div>
            </h2>

            <div
              ref={subRef}
              style={{ opacity: 0, transform: "translateY(24px)" }}
            >
              <p className="text-lg md:text-2xl font-medium text-gray-700 leading-relaxed">
                而是在你的目标下
                <br />
                计算代价最低的路径。
              </p>
            </div>

            <ul className="mt-10 space-y-3">
              {POINTS.map((p, i) => (
                <li
                  key={p}
                  ref={(el) => {
                    bulletsRef.current[i] = el;
                  }}
                  className="flex items-start gap-3 text-base text-gray-600 leading-7"
                  style={{ opacity: 0, transform: "translateY(16px)" }}
                >
                  <span
                    aria-hidden="true"
                    className="mt-[11px] h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0"
                  />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — three-video stack with fade-up entrance. CardSwap
              anchors at column right vertical-middle (see CardSwap.css). */}
          <div
            ref={videoRef}
            className="relative h-[500px] md:h-[580px] lg:h-[640px]"
            style={{ opacity: 0, transform: "translateY(48px)" }}
          >
            <CardSwap
              width={720}
              height={480}
              cardDistance={84}
              verticalDistance={96}
              delay={3000}
              easing="linear"
            >
              <Card>
                <VideoSlot label="视频 1" />
              </Card>
              <Card>
                <VideoSlot label="视频 2" />
              </Card>
              <Card>
                <VideoSlot label="视频 3" />
              </Card>
            </CardSwap>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Per-card placeholder. Replace the inner div with a real <video> or
 * <iframe> when ready. Each Card already gets width/height via
 * CardSwap's cloneElement, so children should fill 100% h/w.
 */
function VideoSlot({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
      {/*
        Replace this whole block with the actual video, e.g.
          <video src="/demo-1.mp4" autoPlay loop muted playsInline
                 className="absolute inset-0 h-full w-full object-cover" />
      */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25">
        <Play className="h-4 w-4 ml-0.5" fill="currentColor" strokeWidth={1.6} />
      </div>
      <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-white/45">
        {label}
      </p>
    </div>
  );
}
