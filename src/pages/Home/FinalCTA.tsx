import { ArrowRight } from "lucide-react";

/** Final call-to-action band, anchor target for nav `#cta` link. */
export default function FinalCTA() {
  return (
    <section id="cta" className="px-6 py-28">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]">
          三分钟，
          <br />
          搞清你学校的全部规则
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
        <p className="text-xs text-gray-500 mt-5">
          无需注册 · 无风险 · 可随时关闭
        </p>
      </div>
    </section>
  );
}
