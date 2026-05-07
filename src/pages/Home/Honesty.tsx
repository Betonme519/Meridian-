import { ShieldCheck, Database, HelpCircle } from "lucide-react";

/**
 * "诚实性" — fully merged section. The old "一个 AI 凭什么" trust block
 * and the original 3-column 确定/估算/未知 grid have been interleaved
 * rather than stacked: the trust hero asks the framing question, the 4
 * transparency prompts are distilled into a hero lead-in plus one
 * "question" line per column (问 → 答 mapping), and the original
 * Honesty H2 "我们不会假装什么都知道" becomes the closing line.
 */
export default function Honesty() {
  const cols = [
    {
      title: "确定",
      question: "哪些来自学校官方政策？",
      Icon: ShieldCheck,
      tone: "bg-emerald-50 border-emerald-200 text-emerald-900",
      iconBg: "bg-emerald-500",
      items: ["学校绩点规则", "学分与权重", "官方政策"],
    },
    {
      title: "估算",
      question: "哪些是估出来的？",
      Icon: Database,
      tone: "bg-amber-50 border-amber-200 text-amber-900",
      iconBg: "bg-amber-500",
      items: ["课程难度", "工作量", "选课竞争"],
    },
    {
      title: "未知",
      question: "错误可能出现在哪里？",
      Icon: HelpCircle,
      tone: "bg-gray-100 border-gray-300 text-gray-900",
      iconBg: "bg-gray-700",
      items: ["老师打分风格", "考试难度", "个人能力"],
    },
  ];

  return (
    <section
      id="honesty"
      className="px-6 py-24 bg-gray-50 border-y border-gray-100"
    >
      <div className="max-w-6xl mx-auto">
        {/* Hero: question + tagline + lead-in */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
            诚实性
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
            “一个 AI 凭什么帮我选课？”
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            每条推荐都会标记它来自哪条规则——
            <br className="hidden md:block" />
            以及那条规则属于「确定 · 估算 · 未知」中的哪一类。
          </p>
        </div>

        {/* 3 cols: each col answers one transparency question */}
        <div className="grid md:grid-cols-3 gap-5">
          {cols.map(({ title, question, Icon, tone, iconBg, items }) => (
            <div key={title} className={`rounded-2xl border p-6 ${tone}`}>
              <p className="text-xs font-medium opacity-70 mb-4 leading-relaxed">
                {question}
              </p>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}
                >
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

        {/* Closing line — formerly the standalone Honesty H2 */}
        <p className="text-center text-base text-gray-600 mt-14 max-w-2xl mx-auto leading-relaxed">
          所以我们不会假装什么都知道——把规则、估算和未知都摆出来，让你看清。
        </p>
      </div>
    </section>
  );
}
