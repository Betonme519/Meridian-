import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Upload,
  Sliders,
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Database,
  Calculator,
  Quote,
  Star,
} from "lucide-react";
import GridMotion from "@/components/effects/GridMotion";
import LaptopFrame from "@/components/effects/LaptopFrame";

function Nav() {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <nav className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
            <span className="text-black text-xs font-bold">M</span>
          </div>
          <span className="text-base font-semibold tracking-tight text-white">Meridian</span>
        </div>
        <div className="hidden md:flex items-center gap-12 text-sm text-white/70">
          <a href="#flow" className="hover:text-white transition-colors">首页概览</a>
          <a href="#explain" className="hover:text-white transition-colors">我的计划</a>
          <a href="#honesty" className="hover:text-white transition-colors">课程库</a>
          <a href="#feedback" className="hover:text-white transition-colors">评价社区</a>
        </div>
        <a
          href="#cta"
          className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
        >
          开始分析
        </a>
      </nav>
    </div>
  );
}

/* ----------------------------- Section 1: Hero ---------------------------- */
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
  _imgs[0],_imgs[4],_imgs[2],_imgs[6],_imgs[1],_imgs[5],_imgs[3],
  _imgs[5],_imgs[2],_imgs[6],_imgs[3],_imgs[0],_imgs[4],_imgs[1],
  _imgs[3],_imgs[0],_imgs[4],_imgs[1],_imgs[6],_imgs[2],_imgs[5],
  _imgs[1],_imgs[6],_imgs[3],_imgs[5],_imgs[2],_imgs[0],_imgs[4],
];

function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <GridMotion items={heroGridItems} gradientColor="#0a0a0a" />
      </div>

      <div
        className="absolute inset-0 z-10"
        style={{
          backdropFilter: 'blur(1px)',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      <div className="relative z-20 flex flex-col min-h-screen">
        <Nav />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 max-w-5xl mx-auto text-center w-full">
        <div
          className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full animate-fade-in-up"
          style={{
            opacity: 0,
            animationDelay: "0.1s",
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-white/80">为大学选课设计 · 选课前 3 分钟搞清所有规则</span>
        </div>

        <h1
          className="text-4xl md:text-6xl lg:text-[68px] font-semibold leading-[1.1] tracking-tight mb-6 text-white animate-fade-in-up"
          style={{ opacity: 0, animationDelay: "0.2s" }}
        >
          <span className="block">你不需要为成绩焦虑，</span>
          <span className="block">你只需要在选课时</span>
          <span className="block bg-gradient-to-r from-white via-white/80 to-white/50 bg-clip-text text-transparent">
            做对几个决定
          </span>
        </h1>

        <p
          className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
          style={{ opacity: 0, animationDelay: "0.3s" }}
        >
          大多数学生在四年中都未完全搞清绩点与学分规则<br />
          这个系统让你用最轻松的方式顺利结业
        </p>

        <div
          className="flex flex-col items-center gap-3 animate-fade-in-up"
          style={{ opacity: 0, animationDelay: "0.4s" }}
        >
          <a
            href="#cta"
            className="inline-flex items-center gap-2 text-black px-7 py-3.5 rounded-full text-base font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.95)' }}
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

/* ------------------------- Section 2: Trust / Doubt ----------------------- */
function Trust() {
  const points = [
    "每个推荐来自哪条规则",
    "哪些数据来自学校官方政策",
    "哪些是估算",
    "错误可能出现在哪里",
  ];
  return (
    <section className="px-6 py-24 bg-gray-50 border-y border-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
            建立信任
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
            “一个 AI 凭什么帮我选课？”
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            这个系统不要求你相信它，
            <br className="hidden md:block" />
            而是让你看清每一步是如何得出的。
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
          {points.map((p) => (
            <div
              key={p}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5"
            >
              <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
              <span className="text-sm text-gray-800">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Section 3: Flow ------------------------------ */
function Flow() {
  const steps = [
    {
      Icon: Upload,
      title: "上传学校手册",
      desc: "提取绩点规则、权重、政策。用户可以查看和修改每一条。",
      tag: "Step 01",
    },
    {
      Icon: Sliders,
      title: "输入选课意向",
      desc: "系统基于规则计算，并在每个评分旁显示评分依据。",
      tag: "Step 02",
    },
    {
      Icon: FileText,
      title: "输出推荐",
      desc: "提供完整推理过程和数据来源，可导出为 PDF / CSV。",
      tag: "Step 03",
    },
  ];
  return (
    <section id="flow" className="px-6 py-24 max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
          去黑箱
        </p>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
          这不是黑箱，这是流程
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {steps.map(({ Icon, title, desc, tag }, i) => (
          <div
            key={title}
            className="relative bg-white border border-gray-200 rounded-2xl p-7 hover:border-black transition-colors"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-mono text-gray-400">{tag}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gray-300" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------ Section 4: Explainability ----------------------- */
function Explain() {
  return (
    <section id="explain" className="px-6 py-24 bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
            可解释性
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            每个推荐都有理由
          </h2>
          <p className="text-base text-gray-600 mt-5 max-w-xl mx-auto">
            推荐由三部分构成：<span className="font-semibold text-black">规则 / 数据 / 推断</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">CS 101</p>
                <h3 className="text-lg font-semibold">计算机科学导论</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">综合评分</p>
                <p className="text-2xl font-semibold">8.4<span className="text-sm text-gray-400">/10</span></p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium h-fit">推荐原因</span>
                <p className="text-gray-700 flex-1">符合你的核心要求 (CS 主修 4 学分要求)。</p>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-medium h-fit">风险提示</span>
                <p className="text-gray-700 flex-1">历史平均分 B-，新生通过率约 78%。</p>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium h-fit">数据来源</span>
                <p className="text-gray-700 flex-1">学校 2024 课程目录 · RateMyProf 估算</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">MATH 220</p>
                <h3 className="text-lg font-semibold">线性代数</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">综合评分</p>
                <p className="text-2xl font-semibold">6.7<span className="text-sm text-gray-400">/10</span></p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium h-fit">推荐原因</span>
                <p className="text-gray-700 flex-1">为 CS 280 (二年级核心) 的先修课程。</p>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-medium h-fit">风险提示</span>
                <p className="text-gray-700 flex-1">课程难度高，与其他理科课同期可能超载。</p>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium h-fit">数据来源</span>
                <p className="text-gray-700 flex-1">学校先修课规则 · 历届课程评价 (估算)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Section 5: GPA Math -------------------------- */
function GpaMath() {
  return (
    <section className="px-6 py-24 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
          透明度
        </p>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5">
          绩点不是玄学，是公式
        </h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          系统会解析你学校的绩点计算方式，并完整展示计算逻辑。
        </p>
      </div>

      <div className="bg-black text-white rounded-2xl p-8 md:p-12">
        <div className="flex items-center gap-2 mb-6 text-gray-400 text-sm">
          <Calculator className="w-4 h-4" />
          <span>加权平均绩点 (WGPA)</span>
        </div>

        <div className="text-center py-8">
          <div className="font-mono text-2xl md:text-4xl font-light tracking-wide">
            <span className="text-gray-400">GPA</span>
            <span className="mx-3">=</span>
            <span className="inline-flex flex-col items-center mx-2">
              <span className="border-b border-white/40 px-3 pb-1">Σ (绩点<sub>课程</sub> × 学分<sub>课程</sub>)</span>
              <span className="pt-1">Σ 学分<sub>课程</sub></span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
          <div>
            <p className="text-xs text-gray-400 mb-1">课程绩点来源</p>
            <p className="text-sm">学校手册 §4.2 等级换算表</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">学分权重</p>
            <p className="text-sm">学校手册 §3.1 学分定义</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">特殊规则</p>
            <p className="text-sm">P/F 课程不计入 (§4.5)</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------- Section 6: Certain vs Uncertain -------------------- */
function Honesty() {
  const cols = [
    {
      title: "确定",
      Icon: ShieldCheck,
      tone: "bg-emerald-50 border-emerald-200 text-emerald-900",
      iconBg: "bg-emerald-500",
      items: ["学校绩点规则", "学分与权重", "官方政策"],
    },
    {
      title: "估算",
      Icon: Database,
      tone: "bg-amber-50 border-amber-200 text-amber-900",
      iconBg: "bg-amber-500",
      items: ["课程难度", "工作量", "选课竞争"],
    },
    {
      title: "未知",
      Icon: HelpCircle,
      tone: "bg-gray-100 border-gray-300 text-gray-900",
      iconBg: "bg-gray-700",
      items: ["老师打分风格", "考试难度", "个人能力"],
    },
  ];
  return (
    <section id="honesty" className="px-6 py-24 bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
            诚实性
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            我们不会假装什么都知道
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {cols.map(({ title, Icon, tone, iconBg, items }) => (
            <div key={title} className={`rounded-2xl border p-6 ${tone}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <ul className="space-y-2.5">
                {items.map((it) => (
                  <li key={it} className="flex items-center gap-2 text-sm">
                    <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- Section 7: Risk & Control ------------------------ */
function Control() {
  const items = [
    { title: "可以质疑任何推荐", desc: "每条推理都附带原始规则与数据，你可以反驳。" },
    { title: "数据由用户控制", desc: "上传内容仅在本地解析，可一键导出或删除。" },
    { title: "最终决策由用户决定", desc: "系统不替你选课，只让你看清取舍。" },
  ];
  return (
    <section className="px-6 py-24 max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
            风险与控制权
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            如果系统错了，<br />你仍然掌控一切
          </h2>
        </div>
        <div className="space-y-4">
          {items.map((it, i) => (
            <div key={it.title} className="flex gap-4 p-5 rounded-xl border border-gray-200 hover:border-black transition-colors">
              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold mb-1">{it.title}</h3>
                <p className="text-sm text-gray-600">{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- Section 8: Real Feedback ------------------------- */
function Feedback() {
  const items = [
    {
      tone: "正面反馈",
      toneClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      stars: 5,
      quote: "第一次有人把我学校那本 80 页的手册讲清楚。选课前看了一遍，避开两门高风险课。",
      author: "Lin · 大一新生",
    },
    {
      tone: "中性反馈",
      toneClass: "bg-amber-50 text-amber-700 border-amber-200",
      stars: 3,
      quote: "课程难度估算偏乐观了，我那门 ECON 实际比预测难得多。但绩点公式和先修课检查很准。",
      author: "Marcus · 大二在读",
      highlight: true,
    },
    {
      tone: "功能结果",
      toneClass: "bg-gray-100 text-gray-700 border-gray-300",
      stars: 4,
      quote: "导出的 PDF 直接拿去和导师讨论，三分钟搞定原本要两小时的对话。",
      author: "Aisha · 转专业学生",
    },
  ];
  return (
    <section id="feedback" className="px-6 py-24 bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
            真实反馈
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
            包括我们做得不够好的地方
          </h2>
          <p className="text-sm text-gray-600">下面有一条标注 “系统估算偏差” 的真实案例。</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {items.map((it) => (
            <div
              key={it.author}
              className={`bg-white rounded-2xl border p-6 flex flex-col ${
                it.highlight ? "border-amber-300 ring-2 ring-amber-100" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-medium px-2 py-1 rounded border ${it.toneClass}`}>
                  {it.tone}
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < it.stars ? "fill-black text-black" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Quote className="w-5 h-5 text-gray-300 mb-3" />
              <p className="text-sm text-gray-800 leading-relaxed flex-1">{it.quote}</p>
              <p className="text-xs text-gray-500 mt-5 pt-4 border-t border-gray-100">
                — {it.author}
              </p>
              {it.highlight && (
                <div className="mt-3 flex items-start gap-2 text-xs text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>系统标记：课程难度为估算值，可能与个人体验存在偏差。</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Section 9: Final CTA ------------------------- */
function FinalCTA() {
  return (
    <section id="cta" className="px-6 py-28">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]">
          三分钟，<br />搞清你学校的全部规则
        </h2>
        <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto">
          上传学校手册，查看你的绩点计算方式与选课风险。
        </p>
        <a
          href="#"
          className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
        >
          立即开始
          <ArrowRight className="w-4 h-4" />
        </a>
        <p className="text-xs text-gray-500 mt-5">无需注册 · 无风险 · 可随时关闭</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 px-6 py-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">M</span>
          </div>
          <span className="font-medium text-gray-700">Meridian</span>
        </div>
        <p>© 2026 Meridian · Academic Decision Engine</p>
      </div>
    </footer>
  );
}

/* ---------- Hero → Laptop scroll showcase (replaces standalone Trust) ----- */
function HeroLaptopShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const laptopRef = useRef<HTMLDivElement>(null);

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
        },
      });

      // Hero: full-screen → shrink and tilt into the laptop screen on the right.
      // Timeline runs 0 → 1 across the pinned scroll. Hero is static for the
      // first 35% so the user gets a moment to read the headline.
      tl.to(
        heroRef.current,
        {
          scale: 0.34,
          xPercent: 25,
          yPercent: -2,
          rotateX: -2.5,
          ease: "power2.inOut",
        },
        0.35,
      );

      tl.fromTo(
        trustRef.current,
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, ease: "power2.out" },
        0.5,
      );

      tl.fromTo(
        laptopRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, ease: "power2.out" },
        0.45,
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative" style={{ height: "200vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-white">
        {/* Layer 1: Hero — starts full-screen, shrinks toward laptop screen */}
        <div
          ref={heroRef}
          className="absolute inset-0 z-10"
          style={{
            transformOrigin: "center center",
            perspective: "1500px",
            willChange: "transform",
          }}
        >
          <Hero />
        </div>

        {/* Layer 2: Laptop frame — fades in on the right (transparent screen) */}
        <div
          ref={laptopRef}
          className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-center pl-4 z-20 pointer-events-none"
          style={{ opacity: 0 }}
        >
          <LaptopFrame />
        </div>

        {/* Layer 3: Trust copy — fades in on the left */}
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

export default function HomePage() {
  return (
    <main className="bg-white min-h-screen">
      <HeroLaptopShowcase />
      <Flow />
      <Explain />
      <GpaMath />
      <Honesty />
      <Control />
      <Feedback />
      <FinalCTA />
      <Footer />
    </main>
  );
}
