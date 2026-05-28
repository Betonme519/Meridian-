import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useProfile } from "@/hooks/useProfile";
import {
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import LogoFace from "@/components/effects/LogoFace";

/** sessionStorage key:Dashboard 输入框暂存,AIAdvisor mount 时读出来填进 textarea */
const ASK_DRAFT_KEY = "meridian.ai-feed.ask-draft";

/**
 * AI Feed (/dashboard) — 用户不看复杂图就能了解当前情况与最新动态。
 *
 * 历史:
 * 2026-05-26 删 Section 1「信息导入」(Import 页已完整覆盖) +
 *            删 Section 3「模拟动作」(Workspace ImpactPanel 已有同款 take/delay/switch)。
 * 此页定位收敛为「决策状态快报」,不再承担入口卡 / 模拟器职责。
 */

/* ───────────────────────── Decision state ───────────────────────── */

type DecisionCard = {
  title: string;
  body: string;
  meta: string;
  tone: "neutral" | "good" | "warn";
  cta?: { label: string; to: string };
};

const decisionCards: DecisionCard[] = [
  {
    title: "当前目标",
    body: "高 GPA 模式 · 保研路线",
    meta: "上次更新 12h 前",
    tone: "neutral",
    cta: { label: "调整目标权重", to: "/ai-advisor" },
  },
  {
    title: "AI 最近一次推荐",
    body: "建议本学期保留 中国近现代史纲要 与 大学英语,谨慎同修 数据结构。",
    meta: "基于培养方案 v2024 + 你的 workload 上限",
    tone: "good",
  },
  {
    title: "最近风险变化",
    body: "压分风险 ↓ 12%(模拟退掉数据结构后)",
    meta: "近 7 天 · 含 3 次模拟",
    tone: "good",
  },
  {
    title: "卡住的 requirement",
    body: "第二课堂 还差 2 分 · 劳动教育 1 学分",
    meta: "毕业进度 86%",
    tone: "warn",
    cta: { label: "前往规则", to: "/schedule" },
  },
  // 卡 5「下一步建议」在组件内 useMemo + pickNextStep() 动态注入,这里不放
];

// 卡 5「下一步建议」短期文案池(AI 真接通前用)。
// 选择策略:按小时 hash 轮换(Math.floor(now / 3600) % LEN),避免每次进页都变。
// 风格约束(CLAUDE.md "不要:营销腔" + DESIGN_SYSTEM "直接,承认局限"):
//   - 用"你"不用"您",避免"赋能 / 助力 / 一键"等词
//   - 给具体动作(拖动 / 上传 / 比较),不给口号
//   - 承认 AI 当前能力有限("先把数据补全"比"AI 会自动帮你做"更诚实)
const NEXT_STEP_POOL: Array<Omit<DecisionCard, "tone">> = [
  {
    title: "下一步建议",
    body: "把还没上传的培养方案补齐,AI 才能识别出你的真实毕业要求。",
    meta: "数据补全",
    cta: { label: "去导入", to: "/import" },
  },
  {
    title: "下一步建议",
    body: "在 Workspace 拖一节课到不同学期,看 GPA / 工作量怎么变。",
    meta: "模拟",
    cta: { label: "打开 Workspace", to: "/course-planner" },
  },
  {
    title: "下一步建议",
    body: "把目标权重调一下,看推荐排序会不会变。",
    meta: "调权重",
    cta: { label: "调权重", to: "/ai-advisor" },
  },
  {
    title: "下一步建议",
    body: "Rule Graph 里有几条规则置信度还是 'low',挑一条手动确认下。",
    meta: "规则审计",
    cta: { label: "去规则页", to: "/schedule" },
  },
  {
    title: "下一步建议",
    body: "把上学期成绩单也传上来,GPA 计算会更准。",
    meta: "数据补全",
    cta: { label: "去导入", to: "/import" },
  },
  {
    title: "下一步建议",
    body: "用自然语言重新描述一次你的现状,AI 帮你重新匹配目标模式。",
    meta: "重新对齐",
    cta: { label: "去 Goal Mode", to: "/ai-advisor" },
  },
  {
    title: "下一步建议",
    body: "Workspace 里同时打开两种排课方案,横向比较哪个更省心。",
    meta: "模拟",
    cta: { label: "打开 Workspace", to: "/course-planner" },
  },
  {
    title: "下一步建议",
    body: "查一下还有哪些 requirement 卡住,优先解决那些。",
    meta: "毕业进度",
    cta: { label: "查毕业进度", to: "/schedule" },
  },
];

function pickNextStep(): DecisionCard {
  // 按小时 hash 轮换。SSR 时 Date.now() 与客户端可能差一拍,
  // 但本组件在 _app 鉴权之后才渲染(client-only 流程),hydration 不爆。
  const idx = Math.floor(Date.now() / 1000 / 3600) % NEXT_STEP_POOL.length;
  return { ...NEXT_STEP_POOL[idx], tone: "neutral" };
}

// 用项目"功能页 accent palette"(flame / gold / maya / sapphire)做语义色,
//   不用 Tailwind 默认的 emerald / amber——那些不在本项目设计标准内。
//   confident / 正面 → maya(配 sapphire 文字)
//   估算 / 风险      → gold(配 flame 文字)
//   中性 / 数据来源  → slate
//   大面积背景仍是 白卡;palette 色只落到 border / chip,符合"标记色只在小色块"铁律。
const toneClass: Record<DecisionCard["tone"], string> = {
  neutral: "border-slate-200 bg-white",
  good: "border-maya/40 bg-white",
  warn: "border-gold/50 bg-white",
};

// 图标外圈用浅 pill 包住 icon;text 用同色板里更深的色保证对比度
const toneIconWrap: Record<DecisionCard["tone"], string> = {
  neutral: "bg-slate-100 text-slate-600",
  good: "bg-maya/15 text-sapphire",
  warn: "bg-gold/15 text-flame",
};

// hover 时把 border 拉浓一档,让"鼠标停留"有明确反馈
const toneCardHover: Record<DecisionCard["tone"], string> = {
  neutral: "hover:border-slate-300",
  good: "hover:border-maya/70",
  warn: "hover:border-gold/80",
};

// hover 顶端 1px 高光条的色,呼应卡片 tone
const toneAccent: Record<DecisionCard["tone"], string> = {
  neutral: "bg-slate-300",
  good: "bg-sapphire/60",
  warn: "bg-flame/70",
};

// meta 文字保持中性 slate 保证对比度;tone 视觉差异交给 border + icon。
const toneText: Record<DecisionCard["tone"], string> = {
  neutral: "text-slate-500",
  good: "text-slate-500",
  warn: "text-slate-500",
};

/* ───────────────────────── Page ───────────────────────── */

export default function DashboardPage() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  // 派生当前目标模式:profile 加载完成后用 profile.goal_mode;guest / loading 时 fallback
  const currentGoalMode = profile?.goal_mode ?? "高 GPA";

  // 顶部提问输入框:不接 LLM,提交后跳 /ai-advisor 由那边复用现有 stream 能力继续。
  const [askInput, setAskInput] = useState("");
  const handleAsk = () => {
    const text = askInput.trim();
    if (!text) return;
    try {
      sessionStorage.setItem(ASK_DRAFT_KEY, text);
    } catch {
      // private mode / quota 等场景静默吞:跳过去用户重输一次也行
    }
    void navigate({ to: "/ai-advisor" });
  };

  // 卡 5「下一步建议」用文案池按小时轮换;useMemo 让同一次 render 内一致,
  // 也让组件不会因为 Date.now() 每帧变化触发重渲染。
  const nextStepCard = useMemo(() => pickNextStep(), []);
  const allDecisionCards = useMemo(
    () => [...decisionCards, nextStepCard],
    [nextStepCard],
  );

  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8">
      {/* Ask box — Gemini/GPT 风格首屏入口
          min-h ~50vh:对话区在 viewport 中偏上,下方"当前决策状态"区下沉一档,
          但仍保证首屏可以完整看到 5 张卡(xl 下 1 大 + 2×2 布局)。
          Cmd/Ctrl+Enter 快捷键继续生效,只是不再在 UI 文案里告知。 */}
      <div className="flex min-h-[44vh] flex-col justify-center pb-6 sm:min-h-[48vh] sm:pb-8">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <LogoFace size={48} className="text-slate-900" />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            你今天想问点什么?
          </h1>
        </div>
        <div className="mx-auto mt-7 w-full max-w-2xl">
          <div className="relative">
            <textarea
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              onKeyDown={(e) => {
                // Cmd/Ctrl+Enter 快速提交,Enter 自身保留为换行(快捷键继续支持,只是不再在 UI 文案里告知)
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              placeholder="实习能不能算第二课堂? 换保研方向会有什么后果?"
              rows={3}
              className="block w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 pr-14 text-sm leading-6 text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900"
            />
            {/* Submit arrow:有输入时走品牌渐变 gold → maya → sapphire
                (黄→浅蓝→蓝),to-br 斜向左上→右下,空时灰底 disabled。
                disabled:bg-none 显式清掉渐变 background-image,让灰底色生效。 */}
            <button
              type="button"
              onClick={handleAsk}
              disabled={!askInput.trim()}
              aria-label="提问"
              className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold via-maya to-sapphire text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:bg-none disabled:text-slate-400 disabled:shadow-none"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            记下今天的新想法,或问问系统查一条学校规则是否属实
          </p>
        </div>
      </div>

      <div className="pb-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold tracking-tight">当前决策状态</h2>
        </div>
        {/* xl 断点下走「左 1 大卡 + 右 2×2 网格」布局:
              当前目标卡 row-span-2 占满左列,其余 4 张卡填右侧两列两行。
              md / 移动端退化为均匀 2 列 / 单列。
            高度整体压紧:gap 收到 3,卡片 padding 收到 p-4 / xl:p-5。 */}
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3 xl:grid-rows-2">
          {allDecisionCards.map((c, i) => {
            // 「当前目标」卡片的 body 实时反映 profile.goal_mode
            const body =
              c.title === "当前目标" ? `${currentGoalMode} 模式` : c.body;
            const isHero = c.title === "当前目标";
            return (
              <article
                key={c.title}
                className={`animate-fade-in-up-soft group relative flex flex-col overflow-hidden rounded-2xl border p-4 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] ${toneCardHover[c.tone]} ${toneClass[c.tone]} ${isHero ? "xl:row-span-2 xl:p-5" : ""}`}
                style={{ animationDelay: `${80 + i * 60}ms` }}
              >
                {/* hover 时从顶端晕开一条 1px tone 色高光 + 微 wash,作为"被选中"的呼应 */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute inset-x-0 top-0 h-px origin-center scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100 ${toneAccent[c.tone]}`}
                />
                <div className="flex items-center justify-between gap-3">
                  <h3
                    className={`font-semibold text-slate-900 ${isHero ? "text-sm xl:text-base" : "text-sm"}`}
                  >
                    {c.title}
                  </h3>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ease-out group-hover:scale-110 ${toneIconWrap[c.tone]}`}
                    aria-hidden
                  >
                    {c.tone === "good" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                    ) : c.tone === "warn" ? (
                      <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2} />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
                    )}
                  </span>
                </div>
                <p
                  className={`leading-5 text-slate-800 ${isHero ? "mt-3 text-sm xl:text-base xl:leading-6" : "mt-2 text-sm"}`}
                >
                  {body}
                </p>
                {/* meta + CTA 用 mt-auto 推到卡底,让 hero 卡和右侧 2×2 卡片视觉对齐
                    pt 收紧到 3,整体高度更紧凑 */}
                <div className="mt-auto pt-3">
                  <p className={`text-[11px] ${toneText[c.tone]}`}>{c.meta}</p>
                  {c.cta && (
                    <Link
                      to={c.cta.to}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-700 transition-colors hover:text-slate-950"
                    >
                      {c.cta.label}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
