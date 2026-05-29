import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Quote, Star } from "lucide-react";

/**
 * "真实反馈" — 3 testimonial cards.
 *
 * 设计与 Transparency 对齐：白底 + 渐变 wash、eyebrow + 大标题、低饱和 chip、
 * 鼠标 hover 用 cubic-bezier(0.16,1,0.3,1) 缓缓亮起。
 *
 * 评分星星按滚动进度逐一点亮：
 *   - 进度 0：section 顶刚刚进入视口底
 *   - 进度 1：section 正中央位于视口正中央 → 12 颗 lit 星全部点亮
 * 进度通过 scroll listener + rAF 更新到 state，star 的 fill 用 CSS transition
 * 平滑过渡。
 */

type Item = {
  tone: string;
  toneClass: string;
  stars: number;
  quote: string;
  author: string;
  role: string;
  highlight?: boolean;
};

const ITEMS: Item[] = [
  {
    tone: "功能结果",
    toneClass: "bg-gray-100 text-gray-700 border-gray-300",
    stars: 4,
    quote:
      "查询转学分政策只花了一分钟。原本要在 portal 里翻半小时才能找到那一段。",
    author: "Tao",
    role: "大三 · 数学",
  },
  {
    tone: "正面反馈",
    toneClass: "bg-maya/15 text-sapphire border-maya/40",
    stars: 5,
    quote:
      "第一次有人把我学校那本 80 页的手册讲清楚。选课前看了一遍，避开两门高风险课。",
    author: "Lin",
    role: "大一新生",
  },
  {
    tone: "中性反馈",
    toneClass: "bg-gold/15 text-flame border-gold/40",
    stars: 4,
    quote:
      "课程难度估算偏乐观了，我那门 ECON 实际比预测难得多。但绩点公式和先修课检查很准。",
    author: "Marcus",
    role: "大二在读",
    highlight: true,
  },
  {
    tone: "功能结果",
    toneClass: "bg-gray-100 text-gray-700 border-gray-300",
    stars: 5,
    quote: "导出的 PDF 直接拿去和导师讨论，三分钟搞定原本要两小时的对话。",
    author: "Aisha",
    role: "转专业学生",
  },
  {
    tone: "正面反馈",
    toneClass: "bg-maya/15 text-sapphire border-maya/40",
    stars: 5,
    quote:
      "作为国际学生最怕错过 prerequisite。这里把链路画得很清楚，不用再追导师 office hour。",
    author: "Sara",
    role: "国际学生",
  },
];

// pre-compute global lit-star indices: card c star i → index in 0..totalLit
// (null means this slot never lights)
const LIT_MAP: (number | null)[][] = (() => {
  let n = 0;
  return ITEMS.map((it) => {
    const row: (number | null)[] = [];
    for (let i = 0; i < 5; i++) {
      if (i < it.stars) row.push(n++);
      else row.push(null);
    }
    return row;
  });
})();
const TOTAL_LIT = LIT_MAP.flat().filter((v) => v !== null).length;

export default function Feedback() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  // entrance fade-up — once
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // scroll-driven progress for star cascade
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when section top = vh (just entering); 1 when section center = vh/2
      const total = vh / 2 + rect.height / 2;
      const traveled = vh - rect.top;
      const p = Math.max(0, Math.min(1, traveled / total));
      setProgress(p);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="feedback"
      className="px-6 py-24 bg-gray-50 border-y border-gray-100"
    >
      <div className="max-w-[1700px] mx-auto">
        <div
          className="text-center max-w-3xl mx-auto mb-14"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(18px)",
            transition:
              "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,0.61,0.36,1)",
          }}
        >
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
            真实反馈
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
            包括我们做得不够好的地方
          </h2>
          <p className="text-sm text-gray-600">
            每一条都是真实学生的实际案例反馈。
          </p>
        </div>

        {/* 5 cards in one row at xl, all participating in a symmetric fan:
            outer cards tilt more, inner two tilt less, center stays upright
            (the apex of the fan). Outer cards also scale down a notch and
            sit at lower z-index for a subtle "back row" feel. All cards
            flatten + rise on hover via transform + z-index. */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 xl:gap-5">
          {ITEMS.map((it, c) => {
            // [outer-left, inner-left, center, inner-right, outer-right]
            const tilt = [
              "xl:translate-x-3 xl:rotate-[-3.5deg] xl:scale-[0.95] xl:origin-bottom xl:z-0",
              "xl:rotate-[-1.5deg] xl:origin-bottom xl:z-10",
              "xl:z-20",
              "xl:rotate-[1.5deg] xl:origin-bottom xl:z-10",
              "xl:-translate-x-3 xl:rotate-[3.5deg] xl:scale-[0.95] xl:origin-bottom xl:z-0",
            ][c];
            const hover =
              "xl:hover:rotate-0 xl:hover:translate-x-0 xl:hover:scale-100 xl:hover:z-30";
            return (
              <div
                key={it.author}
                className={`relative xl:transition-transform xl:duration-[700ms] xl:ease-[cubic-bezier(0.16,1,0.3,1)] ${tilt} ${hover}`}
              >
                <FeedbackCard
                  item={it}
                  cardIdx={c}
                  litRow={LIT_MAP[c]}
                  progress={progress}
                  visible={visible}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Module-level component — defined OUTSIDE Feedback so its function reference
// stays stable across the parent's frequent scroll-driven re-renders. Otherwise
// the card would unmount/remount on every scroll, killing both CSS transitions
// and the local hover state.
function FeedbackCard({
  item,
  cardIdx,
  litRow,
  progress,
  visible,
}: {
  item: Item;
  cardIdx: number;
  litRow: (number | null)[];
  progress: number;
  visible: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const { tone, toneClass, quote, author, role, highlight } = item;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative bg-white rounded-2xl border flex flex-col cursor-default overflow-hidden ${
        highlight
          ? "border-gold/60 ring-2 ring-gold/20"
          : "border-gray-200"
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered
            ? "translateY(-3px)"
            : "translateY(0)"
          : "translateY(20px)",
        borderColor: hovered && !highlight ? "#111827" : undefined,
        transition: [
          `opacity 0.7s ease ${0.2 + cardIdx * 0.1}s`,
          `transform 0.5s cubic-bezier(0.22,0.61,0.36,1)`,
          `border-color 0.25s ease`,
        ].join(", "),
      }}
    >
      <div className="p-6 flex flex-col flex-1">
        {/* header: tone tag + stars */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`text-xs font-medium px-2 py-1 rounded border ${toneClass}`}
          >
            {tone}
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const litIdx = litRow[i];
              const threshold =
                litIdx !== null ? (litIdx + 0.5) / TOTAL_LIT : 2;
              const isLit = litIdx !== null && progress >= threshold;
              return (
                <Star
                  key={i}
                  className="w-3.5 h-3.5"
                  strokeWidth={1.5}
                  style={{
                    // 用项目 palette gold (#FFB62E) 替代 Tailwind amber-500
                    fill: isLit ? "#FFB62E" : "#e5e7eb",
                    color: isLit ? "#FFB62E" : "#e5e7eb",
                    transition:
                      "fill 0.4s cubic-bezier(0.22,0.61,0.36,1), color 0.4s cubic-bezier(0.22,0.61,0.36,1)",
                  }}
                />
              );
            })}
          </div>
        </div>

        <Quote className="w-5 h-5 text-gray-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm text-gray-800 leading-relaxed flex-1">
          {quote}
        </p>

        {/* author block */}
        <div className="mt-5 pt-4 flex items-center gap-3 border-t border-gray-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
            {author.charAt(0)}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-gray-900">{author}</span>
            <span className="text-xs text-gray-500">{role}</span>
          </div>
        </div>
      </div>

      {highlight && (
        <div className="flex items-start gap-2 bg-gold/10 border-t border-gold/30 px-6 py-3 text-xs leading-relaxed text-flame">
          <AlertTriangle
            className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
            strokeWidth={1.6}
          />
          <span>系统标记：课程难度为估算值，可能与个人体验存在偏差。</span>
        </div>
      )}
    </div>
  );
}
