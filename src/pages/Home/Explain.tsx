/** "可解释性" — sample course recommendation cards with rule/data/risk tags. */
export default function Explain() {
  return (
    <section
      id="explain"
      className="px-6 pt-40 pb-24 bg-gray-50 border-y border-gray-100"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
            可解释性
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            每个推荐都有理由
          </h2>
          <p className="text-base text-gray-600 mt-5 max-w-xl mx-auto">
            推荐由三部分构成：
            <span className="font-semibold text-black">规则 / 数据 / 推断</span>
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
                <p className="text-2xl font-semibold">
                  8.4<span className="text-sm text-gray-400">/10</span>
                </p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium h-fit">
                  推荐原因
                </span>
                <p className="text-gray-700 flex-1">
                  符合你的核心要求 (CS 主修 4 学分要求)。
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-medium h-fit">
                  风险提示
                </span>
                <p className="text-gray-700 flex-1">
                  历史平均分 B-，新生通过率约 78%。
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium h-fit">
                  数据来源
                </span>
                <p className="text-gray-700 flex-1">
                  学校 2024 课程目录 · RateMyProf 估算
                </p>
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
                <p className="text-2xl font-semibold">
                  6.7<span className="text-sm text-gray-400">/10</span>
                </p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium h-fit">
                  推荐原因
                </span>
                <p className="text-gray-700 flex-1">
                  为 CS 280 (二年级核心) 的先修课程。
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-medium h-fit">
                  风险提示
                </span>
                <p className="text-gray-700 flex-1">
                  课程难度高，与其他理科课同期可能超载。
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium h-fit">
                  数据来源
                </span>
                <p className="text-gray-700 flex-1">
                  学校先修课规则 · 历届课程评价 (估算)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
