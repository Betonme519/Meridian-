import { Upload, Sliders, FileText } from "lucide-react";

/** "去黑箱" — 3-step flow. */
export default function Flow() {
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
