import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Plus } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/**
 * "FAQ" — landing page Q&A. Behavior:
 *  - Default: only the question shows.
 *  - Hover (on devices with hover): answer slides open, "+" rotates into
 *    "×", row gets a soft tint, number / title darken.
 *  - Touch devices ((hover: none)): answer is always visible — falling
 *    back gracefully so mobile users never see a dead row.
 *
 * Entrance: kicker → heading → items stagger fade-up via ScrollTrigger.
 * Items use a grid-template-rows 0fr → 1fr trick so the open animation
 * goes to natural content height without measuring JS.
 */

const FAQS = [
  { q: "Meridian 会替我做决定吗？", a: "不会。" },
  { q: "Meridian 会编造学校规则吗？", a: "不会，所有规则附来源。" },
  { q: "Meridian 能保证高 GPA 吗？", a: "不能，它提供的是更合理路径。" },
  { q: "Meridian 会爬学校系统吗？", a: "不会，只解析用户上传文件。" },
];

export default function Faq() {
  const sectionRef = useRef<HTMLElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const trigger = sectionRef.current;

      gsap.to(kickerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        scrollTrigger: { trigger, start: "top 85%", once: true },
      });
      gsap.to(headingRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.75,
        delay: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger, start: "top 85%", once: true },
      });
      gsap.to(itemsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: 0.4,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: { trigger, start: "top 85%", once: true },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="faq" className="px-6 py-32 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <p
            ref={kickerRef}
            className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4"
            style={{ opacity: 0, transform: "translateY(12px)" }}
          >
            FAQ
          </p>
          <h2
            ref={headingRef}
            className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900"
            style={{ opacity: 0, transform: "translateY(24px)" }}
          >
            常见问题
          </h2>
        </div>

        {/* List */}
        <div className="border-t border-gray-200">
          {FAQS.map((item, i) => (
            <div
              key={item.q}
              ref={(el) => {
                itemsRef.current[i] = el;
              }}
              className="group border-b border-gray-200 cursor-default transition-colors duration-300 hover:bg-gray-50"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              <div className="grid grid-cols-[auto_1fr_auto] gap-8 md:gap-14 px-4 md:px-8 py-8 items-baseline">
                <span className="text-xl md:text-2xl font-medium text-gray-400 tabular-nums tracking-tight transition-colors duration-300 group-hover:text-gray-900">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg md:text-xl font-medium text-gray-900 leading-7 transition-transform duration-300 group-hover:translate-x-0.5">
                    {item.q}
                  </h3>
                  <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] [@media(hover:none)]:grid-rows-[1fr] transition-[grid-template-rows] duration-400 ease-out">
                    <div className="overflow-hidden">
                      <p className="pt-3 text-base text-gray-600 leading-7 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-300 delay-100">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
                <Plus
                  className="w-7 h-7 md:w-8 md:h-8 text-gray-400 mt-1 self-start transition-all duration-300 group-hover:rotate-45 group-hover:text-gray-900"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
