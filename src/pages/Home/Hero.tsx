import { ArrowRight } from "lucide-react";
import GridMotion from "@/components/effects/GridMotion";
import SplitText from "@/components/effects/SplitText";

const _imgs = [
  "/首页 (1).jpg",
  "/首页 (2).jpg",
  "/首页 (3).jpg",
  "/首页 (4).jpg",
  "/首页 (5).jpg",
  "/首页 (6).jpg",
  "/首页（7）.jpg",
];

const heroGridItems = [
  _imgs[0], _imgs[4], _imgs[2], _imgs[6], _imgs[1], _imgs[5], _imgs[3],
  _imgs[5], _imgs[2], _imgs[6], _imgs[3], _imgs[0], _imgs[4], _imgs[1],
  _imgs[3], _imgs[0], _imgs[4], _imgs[1], _imgs[6], _imgs[2], _imgs[5],
  _imgs[1], _imgs[6], _imgs[3], _imgs[5], _imgs[2], _imgs[0], _imgs[4],
];

/**
 * Hero section — landing headline + CTA, with the GridMotion image wall as
 * background. Rendered inside the laptop screen by HeroLaptopShowcase.
 */
export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <GridMotion items={heroGridItems} gradientColor="#0a0a0a" />
      </div>

      <div
        className="absolute inset-0 z-10"
        style={{
          backdropFilter: "blur(1px)",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      <div className="relative z-20 flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 max-w-5xl mx-auto text-center w-full">
          <div
            className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full animate-fade-in-up"
            style={{
              opacity: 0,
              animationDelay: "0.1s",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-white/80">
              为大学选课设计 · 选课前 3 分钟搞清所有规则
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-[68px] font-semibold leading-[1.1] tracking-tight mb-6 text-white">
            <div>
              <SplitText
                text="你不需要为成绩焦虑，"
                splitType="chars"
                delay={40}
                duration={0.9}
                from={{ opacity: 0, y: 50 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.05}
                rootMargin="0px"
                textAlign="center"
              />
            </div>
            <div>
              <SplitText
                text="你只需要在选课时"
                splitType="chars"
                delay={40}
                duration={0.9}
                from={{ opacity: 0, y: 50 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.05}
                rootMargin="0px"
                textAlign="center"
              />
            </div>
            <div className="bg-gradient-to-r from-white via-white/80 to-white/50 bg-clip-text text-transparent">
              <SplitText
                text="做对几个决定"
                splitType="chars"
                delay={40}
                duration={0.9}
                from={{ opacity: 0, y: 50 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.05}
                rootMargin="0px"
                textAlign="center"
              />
            </div>
          </h1>

          <p
            className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ opacity: 0, animationDelay: "0.3s" }}
          >
            大多数学生在四年中都未完全搞清绩点与学分规则
            <br />
            这个系统让你用最轻松的方式顺利结业
          </p>

          <div
            className="flex flex-col items-center gap-3 animate-fade-in-up"
            style={{ opacity: 0, animationDelay: "0.4s" }}
          >
            <a
              href="#cta"
              className="inline-flex items-center gap-2 text-black px-7 py-3.5 rounded-full text-base font-medium transition-colors"
              style={{ background: "rgba(255,255,255,0.95)" }}
            >
              开始分析
              <ArrowRight className="w-4 h-4" />
            </a>
            <p className="text-xs text-white/40">免费 · 无需注册 · 支持导出</p>
          </div>
        </div>
      </div>
    </section>
  );
}
