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
          <p
            className="text-sm md:text-base font-medium tracking-wide text-white/60 mb-6 animate-fade-in-up"
            style={{ opacity: 0, animationDelay: "0.1s" }}
          >
            Academics should not be your entire focus.
          </p>

          <h1 className="text-4xl md:text-6xl lg:text-[68px] font-semibold leading-[1.1] tracking-tight mb-6 text-white">
            <div>
              <SplitText
                text="学业不应该成为你的全部"
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
            Meridian 解析学校规则、培养方案与绩点逻辑，
            <br />
            帮你用更轻松的方式完成学业。
          </p>

          <div
            className="flex flex-col items-center gap-3 animate-fade-in-up"
            style={{ opacity: 0, animationDelay: "0.4s" }}
          >
            <a
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-medium border border-white bg-transparent text-white hover:bg-white/95 hover:text-black hover:border-white/95 transition-colors duration-300"
            >
              开始分析
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <p className="text-xs text-white/40">免费 · 无需注册 · 支持导出</p>
          </div>
        </div>
      </div>
    </section>
  );
}
