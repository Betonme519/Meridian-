import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Gauge,
  GraduationCap,
  HeartPulse,
  Plane,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Mode = {
  title: string;
  desc: string;
  icon: LucideIcon;
  logic: string;
  example: string;
  pro?: boolean;
};

const modes: Mode[] = [
  {
    title: "高 GPA",
    desc: "优先选择高给分、低压分风险课程",
    icon: Trophy,
    logic: "系统会优先保护绩点、避开压分风险，并把 workload 控制在可承受区间内。",
    example: "推荐 HIST 118，历史 A 段比例高；谨慎同修 CS241 与高数。",
  },
  {
    title: "最轻松毕业",
    desc: "用最低时间成本完成 requirement",
    icon: GraduationCap,
    logic: "系统会优先补齐毕业要求，降低高强度课程与非必要学分。",
    example: "优先选择能同时完成公选、志愿时长与第二课堂的活动。",
  },
  {
    title: "保研路线",
    desc: "保护核心课、科研与排名指标",
    icon: Target,
    logic: "系统会提高核心课、排名相关课程与科研时间的权重。",
    example: "保留专业核心课，减少会挤压科研产出的低价值选修。",
  },
  {
    title: "留学路线",
    desc: "关注 GPA、推荐信与课程 rigor",
    icon: Plane,
    logic: "系统会平衡 GPA、课程含金量、推荐信来源与申请时间线。",
    example: "保留有推荐信价值的教授课程，即使 workload 略高。",
  },
  {
    title: "实习优先",
    desc: "避开高密度课表与关键工作日",
    icon: Timer,
    logic: "系统会优先保护工作日连续时间，并压低周中 workload 峰值。",
    example: "把实验课移出实习日，避免连续三天高强度排课。",
  },
  {
    title: "时间自由",
    desc: "降低连续上课与碎片化安排",
    icon: Gauge,
    logic: "系统会减少碎片化空档，让课表更集中，保留大块自由时间。",
    example: "优先推荐集中在两到三天内完成的课程组合。",
  },
  {
    title: "低压力模式",
    desc: "限制 workload 峰值与考试重叠",
    icon: HeartPulse,
    logic: "系统会把压力上限作为硬约束，避免考试、项目和实验集中。",
    example: "即使 GPA 收益更高，也会避开高压同修组合。",
  },
  {
    title: "个性化定制",
    desc: "组合多目标、按你独特的复杂场景定制权重",
    icon: Wand2,
    logic:
      "你可以为多个目标设定权重比例（如保研 60% + 留学 30% + 实习 10%），系统按这个权重动态平衡推荐。",
    example: "同时申请保研与海外项目时，定制兼顾 GPA、推荐信与科研产出的混合权重组合。",
    pro: true,
  },
];

function recommendMode(text: string) {
  const content = text.toLowerCase();
  if (/保研|排名|科研|导师/.test(content)) return "保研路线";
  if (/留学|申请|推荐信|海外|gre|托福|雅思/.test(content)) return "留学路线";
  if (/实习|工作|上班|面试|offer/.test(content)) return "实习优先";
  if (/压力|焦虑|睡眠|轻松|健康/.test(content)) return "低压力模式";
  if (/毕业|requirement|学分|第二课堂|劳动教育/.test(content)) return "最轻松毕业";
  if (/自由|时间|兴趣|社团|生活/.test(content)) return "时间自由";
  return "高 GPA";
}

export default function AIAdvisorPage() {
  const [selectedMode, setSelectedMode] = useState("高 GPA");
  const [profileText, setProfileText] = useState(
    "我想保持 GPA，但这学期还要实习，每周最多只能学习 20 小时。",
  );
  const [parsedNote, setParsedNote] = useState("");

  const activeMode = useMemo(
    () => modes.find((mode) => mode.title === selectedMode) ?? modes[0],
    [selectedMode],
  );

  function handleParse() {
    const nextMode = recommendMode(profileText);
    setSelectedMode(nextMode);
    setParsedNote(`AI 已根据你的描述推荐：${nextMode}`);
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Hero */}
      <header className="animate-fade-in-up-soft">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          整个系统的核心逻辑控制器
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          你可以直接选择一个目标，也可以口述自己的复杂情况，让 AI 解析后选择最适合你的推荐逻辑。
        </p>
      </header>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_380px]">
        <main className="grid gap-3 sm:grid-cols-2">
          {modes.map((mode, i) => {
            const Icon = mode.icon;
            const active = mode.title === selectedMode;
            return (
              <button
                key={mode.title}
                type="button"
                onClick={() => {
                  setSelectedMode(mode.title);
                  setParsedNote("");
                }}
                aria-pressed={active}
                className={`group animate-fade-in-up-soft relative overflow-hidden rounded-2xl border p-5 text-left transition-colors duration-300 ${
                  active
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-950 hover:border-slate-400"
                }`}
                style={{ animationDelay: `${60 + i * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      active
                        ? "bg-white/10"
                        : mode.pro
                          ? "bg-amber-50 text-amber-700 group-hover:bg-amber-100/70"
                          : "bg-slate-100 group-hover:bg-slate-200/70"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {mode.pro && (
                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${
                          active
                            ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
                            : "border-amber-300 bg-amber-50 text-amber-700"
                        }`}
                      >
                        Pro
                      </span>
                    )}
                    {active ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-pulse-halo absolute inset-0 rounded-full bg-emerald-300" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        </span>
                        Active
                      </span>
                    ) : !mode.pro ? (
                      <CheckCircle2 className="h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                    ) : null}
                  </div>
                </div>
                <h2 className="mt-5 text-lg font-semibold tracking-tight">{mode.title}</h2>
                <p
                  className={`mt-2 text-sm leading-6 ${
                    active ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {mode.desc}
                </p>
              </button>
            );
          })}
        </main>

        <aside className="space-y-5">
          {/* Voice input */}
          <div
            className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-5"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">描述你的情况</h2>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-1 transition-colors focus-within:border-slate-400">
              <textarea
                value={profileText}
                onChange={(event) => setProfileText(event.target.value)}
                className="block min-h-32 w-full resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="例如：我想保研，但这学期有实习，不能让 workload 超过 20 小时。"
              />
              <div className="flex items-center justify-between border-t border-slate-200/70 px-3 py-2 text-[11px] text-slate-400 tabular-nums">
                <span>{profileText.length} 字</span>
                <span className="uppercase tracking-[0.18em]">中文 · 自然语言</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleParse}
              className="group mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <Sparkles className="h-4 w-4 transition-transform duration-500 ease-out group-hover:rotate-12" />
              让 AI 选择模式
            </button>
            {parsedNote ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {parsedNote}
              </p>
            ) : null}
          </div>

          {/* Active logic — emphasized dark card */}
          <div
            className="animate-fade-in-up-soft relative overflow-hidden rounded-2xl border border-slate-900 bg-slate-950 p-6 text-white"
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
              当前启用逻辑
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight">
              {activeMode.title}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">{activeMode.logic}</p>
          </div>

          {/* Example */}
          <div
            className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-5"
            style={{ animationDelay: "240ms" }}
          >
            <h2 className="font-semibold">推荐变化示例</h2>
            <p className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {activeMode.example}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
