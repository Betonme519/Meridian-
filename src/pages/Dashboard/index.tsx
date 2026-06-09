import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useProfile } from "@/hooks/useProfile";
import { useRagSources } from "@/hooks/useRagSources";
import { buildPersonalDocBlock } from "@/lib/personalDocContext";
import { ArrowRight, ArrowUp, Network, Square, Target, Upload, type LucideIcon } from "lucide-react";
import LogoFace from "@/components/effects/LogoFace";
import Aurora from "@/components/effects/Aurora";
import { chat, tokenText, type Message } from "@/ai";
import cardGoalBg from "@/assets/images/home-cards/goal.png";
import cardRecommendBg from "@/assets/images/home-cards/recommend.png";
import cardRiskBg from "@/assets/images/home-cards/risk.png";
import cardProgressBg from "@/assets/images/home-cards/progress.png";
import cardNextBg from "@/assets/images/home-cards/next.png";

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
 *   - 对话态：使用 max-w-7xl 容器（**禁止水平溢出**），双栏 grid [1fr_420px]
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
    title: "最近一次推荐",
    body: "建议本学期保留 中国近现代史纲要 与 大学英语,谨慎同修 数据结构。",
    meta: "基于培养方案 v2024 + 你的 workload 上限",
    tone: "good",
    cta: { label: "查看推荐", to: "/ai-advisor" },
  },
  {
    title: "风险变化",
    body: "压分风险 ↓ 12%(模拟退掉数据结构后)",
    meta: "近 7 天 · 含 3 次模拟",
    tone: "good",
    cta: { label: "查看风险", to: "/course-planner" },
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

// 决策卡逐卡配置：底图（桌面「首页图片素材」已复制进 assets）+ 文字是否白 +
// 圆形跳转键样式 + 是否隐藏 body·meta。边框 / 右上角图标已整体去掉（见渲染处）。
// 「下一步建议」8 条文案共用同一标题 → 同一份配置。
type CardConfig = {
  bg: string;
  /** 深色底图上标题 / 正文 / meta 用白字 */
  textWhite?: boolean;
  /** 圆形跳转键：white = 白底黑箭头，black = 黑底白箭头 */
  ctaTone: "white" | "black";
  hideBody?: boolean;
  hideMeta?: boolean;
};
const cardConfig: Record<string, CardConfig> = {
  当前目标: { bg: cardGoalBg, textWhite: true, ctaTone: "white", hideMeta: true },
  最近一次推荐: { bg: cardRecommendBg, ctaTone: "black", hideMeta: true },
  风险变化: { bg: cardRiskBg, textWhite: true, ctaTone: "white", hideMeta: true },
  "卡住的 requirement": { bg: cardProgressBg, textWhite: true, ctaTone: "white", hideMeta: true },
  下一步建议: { bg: cardNextBg, ctaTone: "black", hideMeta: true },
};

/** 把底图合进卡片 style：cover 铺满、居中、不重复；无匹配则返回空对象 */
function cardBgStyle(title: string): CSSProperties {
  const bg = cardConfig[title]?.bg;
  return bg
    ? {
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {};
}

/** 圆形箭头跳转键 —— 取代原本「文字标签 + 箭头」的链接。white=白底黑箭头 / black=黑底白箭头 */
function CtaArrow({ to, label, tone }: { to: string; label: string; tone: "white" | "black" }) {
  const cls =
    tone === "black" ? "bg-slate-900 text-white" : "bg-white text-slate-900 ring-1 ring-black/5";
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={`mt-3 inline-flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-transform duration-300 ease-out hover:scale-105 group-hover:translate-x-0.5 ${cls}`}
    >
      <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
    </Link>
  );
}

/** Home 空态快捷跳转胶囊 —— 浅灰描边、透明填充（透出底部极光）、浅灰字（比边框略深）+ 左侧导航 icon。 */
function JumpPill({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-500 transition-colors duration-200 hover:border-slate-400 hover:text-slate-700 sm:text-sm"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {label}
    </Link>
  );
}

// meta 文字保持中性 slate 保证对比度（非白字卡片用）。
const toneText: Record<DecisionCard["tone"], string> = {
  neutral: "text-slate-500",
  good: "text-slate-500",
  warn: "text-slate-500",
};

/* ───────────────────────── Page ───────────────────────── */

export default function DashboardPage() {
  const { profile } = useProfile();
  // 13.8-A：已解析的个人文档（成绩单 / 培养方案）—— 发问时作 system 上下文 prepend
  const { parsedDocs } = useRagSources();
  const navigate = useNavigate();
  // 派生当前目标模式:profile 加载完成后用 profile.goal_mode;guest / loading 时 fallback
  const currentGoalMode = profile?.goal_mode ?? "高 GPA";

  // ── 对话态 ──────────────────────────────────────────────────
  const [askInput, setAskInput] = useState("");
  // 点击空态界面空白处 → 记录点击点，触发极光「像素荡漾」波纹（不重放入场）
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);
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

    // 13.8-A：有已解析个人文档时，prepend 一条 system 上下文给 AI 读真实成绩 /
    // 培养方案。只进发往模型的消息，不进 UI 的 messages state（保持对话干净）。
    const docBlock = buildPersonalDocBlock(parsedDocs);
    const sentMessages: Message[] = docBlock
      ? [{ role: "system", content: docBlock }, ...nextMessages]
      : nextMessages;

    let acc = "";
    try {
      for await (const tok of chat({
        messages: sentMessages,
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
    /* ── 空态：只留居中的「你今天想问点什么」对话入口（决策卡仅对话态显示） ── */
    return (
      <section
        onClick={(e) => {
          // 点界面空白处 → 从点击点起一段像素荡漾波纹；点输入框 / 按钮 / 链接不触发
          if ((e.target as HTMLElement).closest("input,button,a,textarea")) return;
          const x = e.clientX;
          const y = e.clientY;
          setRipple((r) => ({ x, y, key: (r?.key ?? 0) + 1 }));
        }}
        className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-center px-5 sm:px-8"
      >
        {/* 底部极光背景：fixed 贴视口底，pointer-events-none 不挡交互；内容在 z-10 浮其上。
            lg:left-16 让开左侧 icon rail。翻转已在 shader 内做（硬边在底、模糊朝上 + 入场从底部中心铺开），
            这里不再用 CSS rotate。配色：橙(flame) → 黄(gold) → 浅蓝(maya)。 */}
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[42vh] lg:left-16"
          aria-hidden
        >
          <Aurora colorStops={["#FE6237", "#FFB62E", "#7CC3FF"]} blend={1.0} ripple={ripple} />
        </div>
        <div className="relative z-10 flex flex-col pb-[12vh]">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <LogoFace size={56} className="text-slate-900" />
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              你今天想问点什么?
            </h1>
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            记下今天的新想法,或问问系统查一条学校规则是否属实
          </p>
          <div className="mx-auto mt-6 w-full max-w-3xl">
            <AskBox
              value={askInput}
              onChange={setAskInput}
              onSubmit={handleAsk}
              onStop={handleStop}
              streaming={streaming}
            />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <JumpPill to="/course-planner" label="当前规则路径" icon={Network} />
              <JumpPill to="/ai-advisor" label="当前目标" icon={Target} />
              <JumpPill to="/import" label="上传文件" icon={Upload} />
            </div>
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
    <section className="mx-auto grid h-[calc(100vh-5rem)] max-w-[96rem] grid-cols-1 lg:grid-cols-[1fr_420px]">
      {/* 左主对话区：thread + 钉底输入 */}
      <div className="flex min-w-0 flex-col overflow-hidden">
        {/* thread 滚动区：内层 max-w-4xl 居中 mx-auto；lg 起左侧多留白把气泡整体再往右挪一点
            （只影响气泡，不动下方输入框 —— 输入框是另一个独立容器） */}
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-6 sm:px-8 lg:pl-32">
          <div className="mx-auto max-w-4xl space-y-5">
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

        {/* 钉底输入：max-w-3xl 居中 mx-auto（跟 thread 同向右移） */}
        <div className="px-5 pb-5 pt-2 sm:px-8 sm:pb-6">
          <div className="mx-auto max-w-3xl">
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

      {/* 右侧决策卡竖列：再右移一档（lg:pl-16），去掉「当前决策状态」标题 + icon，
          5 张卡单列竖向居中（justify-center），不纵向滚动。 */}
      <aside className="hidden border-l border-slate-200 bg-slate-50/40 lg:flex lg:flex-col lg:overflow-hidden lg:pl-24">
        <div className="flex flex-1 flex-col justify-center space-y-3 p-3">
          {allDecisionCards.map((c, i) => {
            const body =
              c.title === "当前目标" ? `${currentGoalMode} 模式` : c.body;
            const cfg = cardConfig[c.title];
            const white = cfg?.textWhite;
            return (
              <article
                key={c.title}
                className={`animate-fade-in-up-soft group relative flex flex-col overflow-hidden rounded-2xl p-3.5 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] bg-white`}
                style={{ animationDelay: `${80 + i * 60}ms`, ...cardBgStyle(c.title) }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs font-semibold ${white ? "text-white" : "text-slate-900"}`}>
                    {c.title}
                  </h4>
                </div>
                {!cfg?.hideBody && (
                  <p className={`mt-2 text-xs leading-5 ${white ? "text-white/90" : "text-slate-800"}`}>
                    {body}
                  </p>
                )}
                <div className="mt-2 pt-2">
                  {!cfg?.hideMeta && (
                    <p className={`text-[10px] ${white ? "text-white/75" : toneText[c.tone]}`}>
                      {c.meta}
                    </p>
                  )}
                  {c.cta && (
                    <CtaArrow to={c.cta.to} label={c.cta.label} tone={cfg?.ctaTone ?? "white"} />
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
      {/* 单行胶囊输入：rounded-full 两端圆头，发送键贴右侧竖向居中。
          非 compact（首页 hero）整体放大一档（h-14 + text-base）。 */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // 单行：Enter = 发送
          if (e.key === "Enter") {
            e.preventDefault();
            if (!streaming) onSubmit();
          }
        }}
        placeholder="实习能不能算第二课堂? 换保研方向会有什么后果?"
        disabled={streaming}
        className={`block w-full rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
          compact ? "h-12 px-5 pr-14 text-sm" : "h-14 px-6 pr-16 text-base"
        }`}
      />
      {streaming ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="停止"
          className="absolute right-2.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:text-slate-900"
        >
          <Square className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          aria-label="提问"
          className="absolute right-2.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand-gradient text-white shadow-sm transition-all hover:brightness-110"
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
