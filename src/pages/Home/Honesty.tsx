import { ShieldCheck, Database, HelpCircle } from "lucide-react";

/** "诚实性" — 3 columns: certain / estimated / unknown. */
export default function Honesty() {
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
    <section
      id="honesty"
      className="px-6 py-24 bg-gray-50 border-y border-gray-100"
    >
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
      </div>
    </section>
  );
}
