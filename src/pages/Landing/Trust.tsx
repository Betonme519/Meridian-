import { CheckCircle2 } from "lucide-react";

/**
 * Standalone Trust section. Currently NOT mounted on the Home page (the
 * trust copy lives inside HeroLaptopShowcase as the page-2 left panel).
 * Kept here so it can be re-introduced or reused on another page without
 * rewriting it.
 */
export default function Trust() {
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
            "一个 AI 凭什么帮我选课？"
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
