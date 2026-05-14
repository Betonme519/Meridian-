import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe2,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ───────────────────────── Section 1 · Rule structure tree ───────────────────────── */

type RuleLeaf = {
  title: string;
  source: string;
  page?: string;
};

type RuleBranch = {
  title: string;
  leaves: RuleLeaf[];
};

const ruleTree: RuleBranch[] = [
  {
    title: "GPA 计算规则",
    leaves: [
      { title: "必修课全部计入 GPA", source: "培养方案 v2024", page: "第 6 页 §3.1" },
      { title: "体育课不计入 GPA", source: "教务处官网", page: "学籍 §2" },
      { title: "P/F 课程不计入 GPA", source: "培养方案 v2024", page: "第 7 页 §3.4" },
    ],
  },
  {
    title: "学分结构",
    leaves: [
      { title: "专业必修 60 学分", source: "培养方案 v2024", page: "第 12 页" },
      { title: "公选 8 学分", source: "培养方案 v2024", page: "第 13 页" },
      { title: "第二课堂 6 分（非学分）", source: "学校教务处", page: "二课实施细则" },
    ],
  },
  {
    title: "替代规则",
    leaves: [
      { title: "全国大学生数学建模比赛可抵 2 分二课", source: "AI 推测", page: "规则分析" },
      { title: "省级志愿者证书 8h 可计入劳动教育", source: "学生评价", page: "匿名社区" },
    ],
  },
];

/* ───────────────────────── Section 2 · Trust columns ───────────────────────── */

type TrustLevel = "high" | "med" | "low";

type TrustItem = {
  title: string;
  source: string;
  body: string;
};

const trustData: Record<TrustLevel, { label: string; cls: string; head: string; body: string; icon: LucideIcon; items: TrustItem[] }> = {
  high: {
    label: "官方规则",
    head: "border-emerald-200 bg-emerald-50",
    body: "text-emerald-900",
    cls: "bg-emerald-100 text-emerald-800",
    icon: ScrollText,
    items: [
      { title: "必修课全部计入 GPA", source: "培养方案 v2024 第 6 页", body: "GPA = Σ(学分 × 绩点) / 总学分，所有必修课均参与。" },
      { title: "毕业总学分 ≥ 158", source: "教务系统学籍模块", body: "包含专业课 60 + 公选 8 + 通识 90。" },
    ],
  },
  med: {
    label: "AI 推测",
    head: "border-amber-200 bg-amber-50",
    body: "text-amber-900",
    cls: "bg-amber-100 text-amber-800",
    icon: Sparkles,
    items: [
      { title: "数模比赛可抵 2 分二课", source: "AI 规则分析（基于 v2023 案例）", body: "学校尚未在 v2024 明文写入，但同等比赛历史上批准过。" },
      { title: "MUS 102 可改 P/F", source: "AI 规则分析", body: "公选课通常允许 P/F，但需在第 4 周前申请。" },
    ],
  },
  low: {
    label: "学生评价",
    head: "border-slate-200 bg-slate-50",
    body: "text-slate-700",
    cls: "bg-slate-200 text-slate-700",
    icon: Users,
    items: [
      { title: "CS 241 压分严重", source: "匿名社区 / 课评网", body: "学生反映均分 B-，建议同修不超过 2 门难课。" },
      { title: "HIST 118 给分宽松", source: "匿名社区", body: "近 3 年 A 段比例超 40%。" },
    ],
  },
};

/* ───────────────────────── Section 3 · Conflict rules ───────────────────────── */

type Conflict = {
  title: string;
  a: { source: string; text: string };
  b: { source: string; text: string };
  judgement: string;
};

const conflicts: Conflict[] = [
  {
    title: "体育课是否计入 GPA",
    a: { source: "培养方案 v2024", text: "全部必修课计入 GPA" },
    b: { source: "教务处官网", text: "体育课只记是否合格，不计 GPA" },
    judgement: "AI 倾向教务处口径（实际入库不计），但建议导师/教务确认。",
  },
  {
    title: "比赛能否抵学分",
    a: { source: "AI 规则分析", text: "数模国赛可抵 2 分二课" },
    b: { source: "培养方案 v2024", text: "未在替代清单明列" },
    judgement: "需教务个案审批。其他同学历史成功案例不保证当届有效。",
  },
];

/* ───────────────────────── Section 4 · Special policies ───────────────────────── */

type Policy = {
  scope: string;
  title: string;
  body: string;
};

const policies: Policy[] = [
  { scope: "港校申请", title: "避免过多 P/F",     body: "港校录取常 case-by-case 看转录里 P/F 比例，超过 15% 会被质疑学业严肃性。" },
  { scope: "MIT 暑研",   title: "线上实验不替代",  body: "MIT 不接受 fully online 的实验课替代实地实验学分。" },
  { scope: "保研 985",   title: "排名 + 论文双门槛", body: "多数 985 要求年级前 10% 且至少一作核心期刊或国奖。" },
  { scope: "出国 GRE",   title: "GRE 有效期 5 年",  body: "提前一年内考完最稳，避免赶申请季。" },
];

/* ───────────────────────── Page ───────────────────────── */

export default function SchedulePage() {
  const [openBranch, setOpenBranch] = useState<string | null>(ruleTree[0].title);

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Hero */}

      {/* Section 1 + 2 · Tree + Trust */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* Tree */}
        <aside
          className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-5"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold tracking-tight">规则结构树</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">培养方案 v2024 + 教务处文件</p>

          <div className="mt-4 space-y-2">
            {ruleTree.map((b) => {
              const open = openBranch === b.title;
              return (
                <div key={b.title} className="rounded-xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenBranch(open ? null : b.title)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-sm font-medium text-slate-900">{b.title}</span>
                    <span className="ml-auto text-[11px] tabular-nums text-slate-400">
                      {b.leaves.length}
                    </span>
                  </button>
                  {open && (
                    <ul className="space-y-1 border-t border-slate-100 px-3 py-2">
                      {b.leaves.map((leaf) => (
                        <li
                          key={leaf.title}
                          className="rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
                        >
                          <p className="text-xs font-medium text-slate-800">{leaf.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {leaf.source}
                            {leaf.page && <span className="ml-1 text-slate-400">· {leaf.page}</span>}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Trust columns */}
        <main className="space-y-4">
          {(["high", "med", "low"] as TrustLevel[]).map((level, idx) => {
            const t = trustData[level];
            const Icon = t.icon;
            return (
              <article
                key={level}
                className={`animate-fade-in-up-soft rounded-2xl border p-5 ${t.head}`}
                style={{ animationDelay: `${100 + idx * 80}ms` }}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${t.body}`} />
                  <h2 className={`font-semibold tracking-tight ${t.body}`}>{t.label}</h2>
                  <span
                    className={`ml-auto inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold ${t.cls}`}
                  >
                    可信度 {level === "high" ? "高" : level === "med" ? "中" : "低"}
                  </span>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {t.items.map((it) => (
                    <li
                      key={it.title}
                      className="rounded-xl border border-white/60 bg-white/80 p-3.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{it.title}</p>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-900"
                        >
                          查看原文
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-slate-700">{it.body}</p>
                      <p className="mt-2 text-[11px] text-slate-500">来源：{it.source}</p>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </main>
      </div>

      {/* Section 3 · Conflicts */}
      <div className="mt-12">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-500" />
          <h2 className="font-semibold tracking-tight">冲突规则</h2>
          <span className="ml-auto text-xs text-slate-400 tabular-nums">
            {conflicts.length} 条需要人工确认
          </span>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {conflicts.map((c, i) => (
            <article
              key={c.title}
              className="animate-fade-in-up-soft rounded-2xl border border-rose-200 bg-white p-5"
              style={{ animationDelay: `${60 + i * 60}ms` }}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 items-center rounded-full bg-rose-100 px-2 text-[11px] font-semibold text-rose-800">
                  冲突
                </span>
                <h3 className="text-sm font-semibold text-slate-900">{c.title}</h3>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">A 方</p>
                  <p className="mt-1 text-xs text-slate-800">{c.a.text}</p>
                  <p className="mt-2 text-[11px] text-slate-500">来源：{c.a.source}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">B 方</p>
                  <p className="mt-1 text-xs text-slate-800">{c.b.text}</p>
                  <p className="mt-2 text-[11px] text-slate-500">来源：{c.b.source}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-950 p-3 text-white">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  AI 判断
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-100">{c.judgement}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Section 4 · Special policies */}
      <div className="mt-12">
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">学校特殊政策</h2>
          <span className="ml-auto text-xs text-slate-400">留学 / 保研专项</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {policies.map((p, i) => (
            <article
              key={p.title}
              className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-5"
              style={{ animationDelay: `${60 + i * 50}ms` }}
            >
              <span className="inline-flex h-5 items-center rounded-full bg-indigo-50 px-2 text-[11px] font-semibold text-indigo-800">
                {p.scope}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">{p.body}</p>
            </article>
          ))}
        </div>

        <Link
          to="/course-planner"
          search={{ id: undefined }}
          className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-slate-700 transition-colors hover:text-slate-950"
        >
          回到 Workspace 看影响传播
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
