import { Calculator } from "lucide-react";

/** "透明度" — GPA formula card. */
export default function GpaMath() {
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
              <span className="border-b border-white/40 px-3 pb-1">
                Σ (绩点<sub>课程</sub> × 学分<sub>课程</sub>)
              </span>
              <span className="pt-1">
                Σ 学分<sub>课程</sub>
              </span>
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
