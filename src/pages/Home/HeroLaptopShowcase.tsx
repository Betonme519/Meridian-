import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2 } from "lucide-react";
import EmbeddedLaptop from "@/components/effects/EmbeddedLaptop";
import Hero from "./Hero";

/**
 * Scroll-pinned showcase: the Hero is rendered inside an embedded laptop.
 * As the user scrolls, the whole composite shrinks and rotates into a
 * three-quarter side view on the right of page 2; trust copy fades in on
 * the left. Once the showcase has settled (progress > 0.7) the laptop
 * picks up a subtle card-style hover lift.
 */
export default function HeroLaptopShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const compositeRef = useRef<HTMLDivElement>(null);
  const cardLiftRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            // Toggle a class instead of setState so we don't re-render on
            // every scroll tick.
            const el = cardLiftRef.current;
            if (!el) return;
            if (self.progress > 0.7) el.classList.add("card-hover-enabled");
            else el.classList.remove("card-hover-enabled");
          },
        },
      });

      // Composite (laptop frame + Hero on screen) shrinks and rotates as one
      // unit. Fast start, slow tail (power2.out + offset 0.05).
      tl.to(
        compositeRef.current,
        {
          scale: 0.32,
          xPercent: 26,
          rotateY: -14,
          rotateX: -4,
          duration: 1.2,
          ease: "power2.out",
        },
        0.05,
      );

      tl.fromTo(
        trustRef.current,
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" },
        0.6,
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative" style={{ height: "220vh" }}>
      <div
        className="sticky top-0 h-screen w-full overflow-hidden bg-white"
        style={{ perspective: "1800px" }}
      >
        <div
          ref={compositeRef}
          className="absolute inset-0 z-10"
          style={{
            transformOrigin: "center center",
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          <div
            ref={cardLiftRef}
            className="card-lift w-full h-full"
            style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          >
            <EmbeddedLaptop>
              <Hero />
            </EmbeddedLaptop>
          </div>
        </div>

        {/* Trust copy on the left half, fades in */}
        <div
          ref={trustRef}
          className="absolute left-0 top-0 w-1/2 h-full flex items-center justify-end pr-8 lg:pr-16 z-30"
          style={{ opacity: 0 }}
        >
          <div className="max-w-md">
            <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
              建立信任
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-5 text-gray-900 leading-tight">
              "一个 AI 凭什么帮我选课？"
            </h2>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">
              这个系统不要求你相信它，
              <br className="hidden md:block" />
              而是让你看清每一步是如何得出的。
            </p>
            <div className="space-y-2.5">
              {[
                "每个推荐来自哪条规则",
                "哪些数据来自学校官方政策",
                "哪些是估算",
                "错误可能出现在哪里",
              ].map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
                  <span className="text-sm text-gray-800">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
