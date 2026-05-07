import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check } from "lucide-react";
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
  const lidRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);

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

      // Phase 1: composite (laptop frame + Hero on screen) shrinks and
      // rotates to the right as one unit. Fast start, slow tail.
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

      // Sequential check-in: 4 analysis points fill one-by-one as the user
      // scrolls through page 2. Reverses on scroll-up.
      tl.to(
        ".trust-check",
        {
          backgroundColor: "#111827",
          borderColor: "#111827",
          duration: 0.3,
          stagger: 0.14,
          ease: "power2.out",
        },
        0.95,
      );
      tl.to(
        ".trust-check-icon",
        {
          opacity: 1,
          duration: 0.2,
          stagger: 0.14,
          ease: "power2.out",
        },
        1.0,
      );

      // Phase 2: trust copy fades back out, lid closes, composite slides to
      // horizontal center and tilts so the closed laptop is shown from a
      // slight top-down angle right at the page-2 / page-3 boundary.
      tl.to(
        trustRef.current,
        { opacity: 0, x: -40, duration: 0.5, ease: "power2.in" },
        1.5,
      );

      tl.to(
        compositeRef.current,
        {
          xPercent: 0,
          // Math: composite is 100vh tall, scaled around its center. After
          // scale(s) the lid-bottom hinge sits at 50vh + 50vh*s. Camera
          // (perspective-origin) is at 50vh. We need yPercent to translate
          // by exactly -50vh*s so the hinge lands ON the camera line and we
          // see the closed slab edge-on. yPercent is % of unscaled height
          // (=100vh), so yPercent = -50*s. For s=0.28 → yPercent = -14.
          yPercent: -14,
          rotateY: 0,
          rotateX: 0,
          scale: 0.28,
          scaleZ: 0.05,
          duration: 0.9,
          ease: "power2.inOut",
        },
        1.5,
      );

      // GSAP defaults transformOrigin to "50% 50% 0" and ignores the
      // CSS-declared origin once it touches transforms — so we have to
      // re-pin the hinge axis here. Without this, rotateX(-95) spins the
      // lid around its center instead of folding around its bottom edge.
      gsap.set(lidRef.current, { transformOrigin: "50% 100% 0" });

      tl.to(
        lidRef.current,
        // Exactly -90° = perfectly flat. -95° (5° overshoot) leaves the lid
        // tipped slightly forward toward the camera, so its front edge
        // catches more perspective expansion than the base.
        { rotateX: -90, duration: 0.9, ease: "power2.inOut" },
        1.5,
      );

      // Take over the base's transform from CSS (rotateX 95° about top
      // hinge) so GSAP can compose scaleX on top of it cleanly. Then widen
      // the base in phase 2 so the keyboard panel matches the lid's
      // perspective-magnified width when the laptop is closed.
      gsap.set(baseRef.current, {
        rotateX: 95,
        transformOrigin: "50% 0%",
      });

      tl.to(
        baseRef.current,
        { scaleX: 1.875, duration: 0.9, ease: "power2.inOut" },
        1.5,
      );

      // Fade the Hero (rendered inside the screen) out slightly ahead of the
      // lid finishing — by the time the lid is flat, the screen content is
      // already gone, so no flattened "black slab" of the Hero remains.
      tl.to(
        screenRef.current,
        { opacity: 0, duration: 0.5, ease: "power2.in" },
        1.5,
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative" style={{ height: "320vh" }}>
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
            <EmbeddedLaptop lidRef={lidRef} screenRef={screenRef} baseRef={baseRef}>
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
          <div className="max-w-lg">
            <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
              建立信任
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 text-gray-900 leading-snug">
              “这个系统不是在猜你想选什么课。
              <br className="hidden md:block" />
              它是在计算你的整个学业路径。”
            </h2>
            <div className="space-y-4 text-[15px] text-gray-600 leading-relaxed">
              <p>Meridian 会同时分析：</p>
              <ul className="space-y-2.5 pl-1">
                {[
                  "学校培养方案与课程规则",
                  "不同课程之间的限制关系",
                  "GPA、保研、出国等不同目标",
                  "时间成本、课程风险与冲突",
                ].map((it) => (
                  <li key={it} className="flex items-start gap-3">
                    <span
                      className="trust-check w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-[2px]"
                      style={{
                        backgroundColor: "#ffffff",
                        borderColor: "#d1d5db",
                      }}
                    >
                      <Check
                        className="trust-check-icon w-3 h-3 text-white"
                        strokeWidth={3}
                        style={{ opacity: 0 }}
                      />
                    </span>
                    <span className="text-gray-800">{it}</span>
                  </li>
                ))}
              </ul>
              <p>然后在这些条件之间，寻找代价更低的路径。</p>
              <p>
                有些规则，人很难靠自己整理计算。
                <br />
                但系统可以。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
