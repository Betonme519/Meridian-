import { AlertTriangle, Quote, Star } from "lucide-react";

/** "真实反馈" — 3 testimonial cards including a flagged divergent case. */
export default function Feedback() {
  const items = [
    {
      tone: "正面反馈",
      toneClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      stars: 5,
      quote:
        "第一次有人把我学校那本 80 页的手册讲清楚。选课前看了一遍，避开两门高风险课。",
      author: "Lin · 大一新生",
    },
    {
      tone: "中性反馈",
      toneClass: "bg-amber-50 text-amber-700 border-amber-200",
      stars: 3,
      quote:
        "课程难度估算偏乐观了，我那门 ECON 实际比预测难得多。但绩点公式和先修课检查很准。",
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
    <section
      id="feedback"
      className="px-6 py-24 bg-gray-50 border-y border-gray-100"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
            真实反馈
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
            包括我们做得不够好的地方
          </h2>
          <p className="text-sm text-gray-600">
            下面有一条标注 "系统估算偏差" 的真实案例。
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {items.map((it) => (
            <div
              key={it.author}
              className={`bg-white rounded-2xl border p-6 flex flex-col ${
                it.highlight
                  ? "border-amber-300 ring-2 ring-amber-100"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded border ${it.toneClass}`}
                >
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
              <p className="text-sm text-gray-800 leading-relaxed flex-1">
                {it.quote}
              </p>
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
