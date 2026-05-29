import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useProfile } from "@/hooks/useProfile";
import {
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Sparkles,
  Square,
  TriangleAlert,
} from "lucide-react";
import LogoFace from "@/components/effects/LogoFace";
import { chat, tokenText, type Message } from "@/ai";

/**
 * Home / Dashboard (/dashboard) — 工具页主入口。
 *
 * 历史:
 * 2026-05-26 删 Section 1「信息导入」+ Section 3「模拟动作」(原职能由 Import 页 +
 *            Workspace ImpactPanel 覆盖)。
 * 2026-05-27 Hero 输入框 + 跨页 sessionStorage handoff 到 AIAdvisor。
 * 2026-05-29 sessionStorage handoff 取消，改同页内嵌流式对话（chat from @/ai）。
 * 2026-05-30 对话态布局深度重构（用户拍板，多轮迭代）：
 *   - 空态：保留原 hero + 决策卡横向 grid 布局
 *   - 对话态：使用 max-w-7xl 容器（**禁止水平溢出**），双栏 grid [1fr_340px]
 *   - 左主对话区：thread 滚动 + 钉底输入框（输入框 max-w-2xl 居中收窄）
 *   - 右侧决策卡竖列：border-l 加深一档 slate-200 形成清晰分隔线
 *   - thread 内容 max-w-3xl mx-auto 居中收窄（跟 input 同宽），避免主区太宽消息飘
 *   - 气泡 user 贴右 / assistant 贴左（容器已窄无需补 padding）
 *   - max-w 80% 让气泡更宽
 *   - assistant bubble 前置放大 LogoFace（40px，呼吸 + 变脸动画）
 *   - 决策栏 header 去掉 border-b 横线（用户拍板，过分割）
 *   - 「思考中」贴流式 assistant bubble 下方一行小字（不在 header 右上）
 *   - 输入块无外层白底/border，融入页面背景
 *   - submit 按钮常驻 bg-brand-gradient，不再 disabled 灰态（空文本 onClick 内部短路）
 *   - 决策卡竖列复用空态同份 allDecisionCards 数据
 *   - 进对话后无显式回空态入口（未来需要可加"新对话"按钮，当前先简化）
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

  // ── 对话态 ──────────────────────────────────────────────────
  const [askInput, setAskInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  // 卡 5「下一步建议」用文案池按小时轮换;useMemo 让同一次 render 内一致,
  // 也让组件不会因为 Date.now() 每帧变化触发重渲染。
  const nextStepCard = useMemo(() => pickNextStep(), []);
  const allDecisionCards = useMemo(
    () => [...decisionCards, nextStepCard],
    [nextStepCard],
  );

  const hasConversation = messages.length > 0 || streaming;

  // 自动滚到对话底（流式追加 token 时跟随）
  useEffect(() => {
    if (!hasConversation) return;
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingText, hasConversation]);

  // 组件卸载时打断未完成的 stream，避免 setState on unmounted warning
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleAsk = async () => {
    const text = askInput.trim();
    // 空文本 / 流式中：onClick 内部短路（按钮视觉常驻渐变，不再 disabled）
    if (!text || streaming) return;

    abortRef.current?.abort();

    const userMsg: Message = { role: "user", content: text };
    const nextMessages: Message[] = [...messages, userMsg];
    setMessages(nextMessages);
    setAskInput("");
    setStreaming(true);
    setStreamingText("");
    setError(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let acc = "";
    try {
      for await (const tok of chat({
        messages: nextMessages,
        signal: ctrl.signal,
      })) {
        if (ctrl.signal.aborted) break;
        acc += tokenText(tok);
        setStreamingText(acc);
      }
      if (!ctrl.signal.aborted && acc) {
        setMessages([...nextMessages, { role: "assistant", content: acc }]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI 调用失败";
      setError(msg);
    } finally {
      if (abortRef.current === ctrl) {
        setStreaming(false);
        setStreamingText("");
        abortRef.current = null;
      }
    }
  };

  // 流式过程中点 stop：保留已收到的部分文本作为 assistant message
  const handleStop = () => {
    const ctrl = abortRef.current;
    if (!ctrl) return;
    ctrl.abort();
    if (streamingText) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: streamingText },
      ]);
    }
    setStreaming(false);
    setStreamingText("");
    abortRef.current = null;
  };

  if (!hasConversation) {
    /* ── 空态：原 hero + 决策卡布局（保留） ─────────────────────── */
    return (
      <section className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex min-h-[44vh] flex-col justify-center pb-6 sm:min-h-[48vh] sm:pb-8">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <LogoFace size={48} className="text-slate-900" />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              你今天想问点什么?
            </h1>
          </div>
          <div className="mx-auto mt-7 w-full max-w-2xl">
            <AskBox
              value={askInput}
              onChange={setAskInput}
              onSubmit={handleAsk}
              onStop={handleStop}
              streaming={streaming}
            />
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
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3 xl:grid-rows-2">
            {allDecisionCards.map((c, i) => {
              const body =
                c.title === "当前目标" ? `${currentGoalMode} 模式` : c.body;
              const isHero = c.title === "当前目标";
              return (
                <article
                  key={c.title}
                  className={`animate-fade-in-up-soft group relative flex flex-col overflow-hidden rounded-2xl border p-4 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] ${toneCardHover[c.tone]} ${toneClass[c.tone]} ${isHero ? "xl:row-span-2 xl:p-5" : ""}`}
                  style={{ animationDelay: `${80 + i * 60}ms` }}
                >
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

        <NavigateGuard navigate={navigate} />
      </section>
    );
  }

  /* ── 对话态：max-w-7xl 容器内双栏满高（禁止水平溢出） ───────── */
  // 高度跟 Workspace/AIAdvisor 单屏化对齐（navbar 顶部 5rem）。
  // 用 max-w-7xl + 父 padding 留出内边，避免对话区超出 viewport 出现水平滚动。
  return (
    <section className="mx-auto grid h-[calc(100vh-5rem)] max-w-7xl grid-cols-1 lg:grid-cols-[1fr_340px]">
      {/* 左主对话区：thread + 钉底输入 */}
      <div className="flex min-w-0 flex-col overflow-hidden">
        {/* thread 滚动区：内层 max-w-4xl 靠左 mr-auto（对话部分整体左移） */}
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="mr-auto max-w-4xl space-y-5">
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} />
            ))}
            {streaming && (
              <ChatBubble
                role="assistant"
                content={streamingText}
                isStreaming
              />
            )}
            {error && (
              <div className="rounded-xl border border-flame/40 bg-white px-3 py-2 text-xs text-flame">
                {error}
              </div>
            )}
            <div ref={threadEndRef} />
          </div>
        </div>

        {/* 钉底输入：max-w-3xl 靠左 mr-auto（跟 thread 同向左移） */}
        <div className="px-5 pb-5 pt-2 sm:px-8 sm:pb-6">
          <div className="mr-auto max-w-3xl">
            <AskBox
              value={askInput}
              onChange={setAskInput}
              onSubmit={handleAsk}
              onStop={handleStop}
              streaming={streaming}
              compact
            />
          </div>
        </div>
      </div>

      {/* 右侧决策卡竖列：内容右移（lg:pl-8）+ 下移（lg:pt-6），border-l 不动 */}
      <aside className="hidden border-l border-slate-200 bg-slate-50/40 lg:flex lg:flex-col lg:overflow-hidden lg:pl-8 lg:pt-6">
        <div className="flex items-center gap-2 px-4 py-3">
          <Sparkles className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold tracking-tight text-slate-800">
            当前决策状态
          </h3>
        </div>
        <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-3">
          {allDecisionCards.map((c, i) => {
            const body =
              c.title === "当前目标" ? `${currentGoalMode} 模式` : c.body;
            return (
              <article
                key={c.title}
                className={`animate-fade-in-up-soft group relative flex flex-col overflow-hidden rounded-2xl border p-3.5 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] ${toneCardHover[c.tone]} ${toneClass[c.tone]}`}
                style={{ animationDelay: `${80 + i * 60}ms` }}
              >
                {/* hover 时从顶端晕开 1px tone 色高光条 */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute inset-x-0 top-0 h-px origin-center scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100 ${toneAccent[c.tone]}`}
                />
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-slate-900">
                    {c.title}
                  </h4>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ease-out group-hover:scale-110 ${toneIconWrap[c.tone]}`}
                    aria-hidden
                  >
                    {c.tone === "good" ? (
                      <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                    ) : c.tone === "warn" ? (
                      <TriangleAlert className="h-3 w-3" strokeWidth={2} />
                    ) : (
                      <Sparkles className="h-3 w-3" strokeWidth={1.8} />
                    )}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-800">{body}</p>
                <div className="mt-2 pt-2">
                  <p className={`text-[10px] ${toneText[c.tone]}`}>{c.meta}</p>
                  {c.cta && (
                    <Link
                      to={c.cta.to}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 transition-colors hover:text-slate-950"
                    >
                      {c.cta.label}
                      <ArrowRight className="h-3 w-3 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </aside>
    </section>
  );
}

/**
 * 占位组件 —— 让 navigate 在编译期被引用，避免删 sessionStorage handoff 后
 * useNavigate 变成"声明未使用"的告警（同时给未来的"去 AI Advisor"按钮留口子）。
 * 不渲染任何东西。
 */
function NavigateGuard(_: { navigate: ReturnType<typeof useNavigate> }) {
  return null;
}

/* ───────────────────────── 子组件：AskBox ──────────────────────────
 *
 * submit 按钮常驻 bg-brand-gradient —— 不再 disabled 灰态（用户拍板 2026-05-30）。
 * 空文本/流式中：onClick 走 handleAsk / handleStop 内部短路，视觉始终激活。
 */
function AskBox({
  value,
  onChange,
  onSubmit,
  onStop,
  streaming,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  streaming: boolean;
  compact?: boolean;
}) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Enter = 发送（ChatGPT 风格）；Shift+Enter = 换行；Cmd/Ctrl+Enter 兼容老快捷键
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!streaming) onSubmit();
          }
        }}
        placeholder="实习能不能算第二课堂? 换保研方向会有什么后果?"
        rows={compact ? 2 : 3}
        disabled={streaming}
        className="block w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 pr-14 text-sm leading-6 text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      />
      {streaming ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="停止"
          className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:text-slate-900"
        >
          <Square className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          aria-label="提问"
          className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-white shadow-sm transition-all hover:brightness-110"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}

/* ───────────────────────── 子组件：ChatBubble ─────────────────────── */
/**
 * 气泡左右贴边（无 max-w 居中）：
 *   - user：黑底白字，贴右
 *   - assistant：白卡 + 前置放大 LogoFace，贴左
 *   - max-w-[80%] 让气泡更宽（用户拍板 2026-05-30：左右分得更开）
 *   - whitespace-pre-wrap 保留换行
 *   - streaming 时末尾闪烁光标 + bubble 下方一行「思考中…」小字（贴在 bubble 旁，不再在 header 右上）
 */
function ChatBubble({
  role,
  content,
  isStreaming = false,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
}) {
  const isUser = role === "user";

  if (isUser) {
    // mr-24 (6rem=96px) ≈ thread 4xl 与 input 3xl 差额的近似，user 比对齐线再右移一档
    return (
      <div className="flex justify-end mr-24">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-slate-900 px-4 py-3 text-sm leading-6 text-white shadow-sm">
          {content}
        </div>
      </div>
    );
  }

  // -ml-2 sm:-ml-4 让 LogoFace + bubble 整体向左突出一档
  return (
    <div className="flex items-start justify-start gap-3 -ml-2 sm:-ml-4">
      {/* 放大的 LogoFace 作为 assistant 前置图标（呼吸/变脸动画） */}
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center text-slate-900">
        <LogoFace size={40} className="text-slate-900" />
      </div>
      <div className="flex max-w-[80%] flex-col">
        <div className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm">
          {content || (
            <span className="text-slate-400">{isStreaming ? "" : "(空回复)"}</span>
          )}
          {isStreaming && (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-slate-900"
            />
          )}
        </div>
        {isStreaming && (
          <span className="mt-1.5 pl-1 text-[11px] text-slate-400">
            思考中…
          </span>
        )}
      </div>
    </div>
  );
}
