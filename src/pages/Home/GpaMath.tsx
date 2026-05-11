import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from "@/components/effects/SplitText";
import CardSwap, { Card } from "@/components/effects/CardSwap";
import video1 from "@/assets/video/Meridian-01-AI-Understanding.mp4";
import video2 from "@/assets/video/Meridian-02-Dynamic-Simulation.mp4";
import video3 from "@/assets/video/Meridian-03-Real-Execution.mp4";

const VIDEOS = [video1, video2, video3];

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

  // Front-of-stack index (driven by CardSwap's onFrontChange callback) and
  // currently hovered card (null = no hover). Active card = hovered if any,
  // otherwise the topmost. Only the active card plays; the rest are paused.
  const [frontIdx, setFrontIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [inView, setInView] = useState(true);
  const activeIdx = inView ? (hoveredIdx ?? frontIdx) : -1;

  // Pause all videos when the stack scrolls out of view to save resources.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
      id="value"
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
              pauseOnHover
              onFrontChange={setFrontIdx}
            >
              {VIDEOS.map((src, i) => (
                <Card
                  key={src}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(245,247,250,0.78) 0%, rgba(228,233,242,0.55) 100%)",
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.7)",
                    borderRadius: "24px",
                    boxShadow:
                      "0 30px 80px -24px rgba(15,23,42,0.22), 0 12px 30px -16px rgba(15,23,42,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}
                >
                  <VideoSlot src={src} isActive={activeIdx === i} />
                </Card>
              ))}
            </CardSwap>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Per-card video. Plays only while `isActive` is true; otherwise paused at
 * its current frame. Each Card gets width/height via CardSwap's
 * cloneElement, so the <video> just fills 100% h/w.
 */
function VideoSlot({ src, isActive }: { src: string; isActive: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (isActive) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [isActive]);

  return (
    <div className="absolute inset-5 overflow-hidden rounded-2xl">
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
