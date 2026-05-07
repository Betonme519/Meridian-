import { useMemo, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import {
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  GraduationCap,
  LineChart,
  ShieldAlert,
  Timer,
  TrendingUp,
} from "lucide-react";

type ScenarioAction = {
  type: string;
  title: string;
  primary: string;
  secondary: string;
  summary: string;
  metrics: [string, string][];
};

const actions: ScenarioAction[] = [
  {
    type: "Drop 课",
    title: "退掉 CS 241",
    primary: "GPA +0.06",
    secondary: "毕业进度 -3%",
    summary: "短期可以保护 GPA，但会推迟后续系统课程的先修链。",
    metrics: [
      ["GPA 变化", "+0.06"],
      ["毕业进度", "83%"],
      ["时间压力", "15h/周"],
      ["风险变化", "-12%"],
    ],
  },
  {
    type: "换课",
    title: "HIST 118 换到陈教授班",
    primary: "GPA +0.11",
    secondary: "时间压力不变",
    summary: "收益最高，且不改变毕业路径，是当前最稳的模拟动作。",
    metrics: [
      ["GPA 变化", "+0.11"],
      ["毕业进度", "89%"],
      ["时间压力", "18h/周"],
      ["风险变化", "-24%"],
    ],
  },
  {
    type: "P/F",
    title: "MATH 233 改为 P/F",
    primary: "风险 -18%",
    secondary: "GPA 波动降低",
    summary: "适合低压力或保底策略，但需要确认该课是否仍满足 requirement。",
    metrics: [
      ["GPA 变化", "+0.04"],
      ["毕业进度", "88%"],
      ["时间压力", "18h/周"],
      ["风险变化", "-18%"],
    ],
  },
  {
    type: "暑校",
    title: "暑期补公选 2 学分",
    primary: "毕业进度 +6%",
    secondary: "秋季 workload -3h",
    summary: "会牺牲暑期时间，但能显著降低秋季毕业压力。",
    metrics: [
      ["GPA 变化", "+0.02"],
      ["毕业进度", "95%"],
      ["时间压力", "15h/周"],
      ["风险变化", "-16%"],
    ],
  },
  {
    type: "替代学分",
    title: "竞赛抵扣劳动教育",
    primary: "Requirement +1",
    secondary: "时间成本低",
    summary: "对毕业 requirement 的价值高，几乎不增加课业负担。",
    metrics: [
      ["GPA 变化", "+0.00"],
      ["毕业进度", "92%"],
      ["时间压力", "18h/周"],
      ["风险变化", "-10%"],
    ],
  },
];

const metricIcons = [TrendingUp, GraduationCap, Timer, ShieldAlert];

export default function GPASimulatorPage() {
  const [selectedAction, setSelectedAction] = useState(actions[1].type);
  const activeAction = useMemo(
    () => actions.find((action) => action.type === selectedAction) ?? actions[1],
    [selectedAction],
  );

  return (
    <DashboardLayout>
      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-500">方案模拟</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">如果这样选，会发生什么</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            你可以模拟 drop 课、换课、P/F、暑校与替代学分。系统实时计算
            GPA、毕业进度、时间压力与风险变化。
          </p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-4">
          {activeAction.metrics.map(([label, value], index) => {
            const Icon = metricIcons[index];
            return (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <Icon className="h-5 w-5 text-slate-400" />
                </div>
                <p className="mt-4 text-3xl font-semibold">{value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
          <main className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">可模拟动作</h2>
            </div>
            <div className="mt-5 space-y-3">
              {actions.map((action) => {
                const active = action.type === selectedAction;
                return (
                  <button
                    key={action.type}
                    type="button"
                    onClick={() => setSelectedAction(action.type)}
                    className={`grid w-full gap-3 rounded-lg border p-4 text-left transition-colors md:grid-cols-[120px_1fr_120px_160px_24px] md:items-center ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${active ? "text-slate-200" : "text-slate-500"}`}
                    >
                      {action.type}
                    </span>
                    <span className="text-sm font-medium">{action.title}</span>
                    <span
                      className={`text-sm font-semibold ${active ? "text-emerald-300" : "text-emerald-700"}`}
                    >
                      {action.primary}
                    </span>
                    <span className={`text-sm ${active ? "text-slate-300" : "text-slate-500"}`}>
                      {action.secondary}
                    </span>
                    {active ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <span />}
                  </button>
                );
              })}
            </div>
          </main>

          <aside className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-slate-500" />
                <h2 className="font-semibold">实时推演</h2>
              </div>
              <div className="mt-6 flex h-52 items-end gap-3">
                {[52, 61, 66, 73, 69, 82].map((height, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-3">
                    <div
                      className="w-full rounded-t-md bg-slate-950"
                      style={{
                        height: `${height + (selectedAction.length % 4) * 3}%`,
                        opacity: 0.45 + index * 0.07,
                      }}
                    />
                    <span className="text-xs text-slate-400">S{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-500" />
                <h2 className="font-semibold">当前路径判断</h2>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-700">{activeAction.summary}</p>
            </div>
          </aside>
        </div>
      </section>
    </DashboardLayout>
  );
}
