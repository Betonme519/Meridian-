import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Gauge,
  GraduationCap,
  HeartPulse,
  History,
  Plane,
  Sparkles,
  Target,
  Timer,
  Trash2,
  Trophy,
  Undo2,
  Wand2,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useChatMessages } from "@/hooks/useChatMessages";
import { GOAL_MODES, type GoalMode } from "@/api/profileApi";
import { chat, recommendModePrompt, tokenText } from "@/ai";

type Mode = {
  title: GoalMode;
  desc: string;
  icon: LucideIcon;
  logic: string;
  example: string;
  pro?: boolean;
};

/**
 * 把 ISO 时间格式化成"刚刚 / N 分钟前 / N 小时前 / N 天前 / 绝对日期"。
 * 历史列表上的时间戳，不需要精确到秒。
 */
function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  return date.toLocaleDateString("zh-CN");
}

const modes: Mode[] = [
  {
    title: "高 GPA",
    desc: "优先选择高给分、低压分风险课程",
    icon: Trophy,
    logic: "系统会优先保护绩点、避开压分风险，并把 workload 控制在可承受区间内。",
    example: "推荐 中国近现代史纲要，历史 A 段比例高；谨慎同修 数据结构 与 高等数学。",
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
    desc: "关注 GPA、推荐信与课程含金量",
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

export default function AIAdvisorPage() {
  const { profile, updateProfile } = useProfile();
  // selectedMode 从 profile.goal_mode 派生；guest / loading 时 fallback 高 GPA
  const selectedMode: GoalMode = profile?.goal_mode ?? "高 GPA";

  // 初值留空让 placeholder 显示（浅灰示例），用户点击 / 输入后自然消失
  const [profileText, setProfileText] = useState("");
  // parsedNote 现在挂的是流式输出（多行）：「推荐：...\n\n理由：...」
  const [parsedNote, setParsedNote] = useState("");
  const [streaming, setStreaming] = useState(false);
  // 取消上一轮 stream（用户连点 / 切模式 / 卸载）
  const abortRef = useRef<AbortController | null>(null);

  // 对话历史持久化（chat_message 表）
  const {
    conversations,
    loading: loadingConversations,
    activeConversationId,
    activeMessages,
    loadingActive,
    persistRound,
    selectConversation,
    clearActive,
    remove: removeConversation,
  } = useChatMessages();

  // 接收从 AI Feed (/dashboard) 顶部「你今天想问点什么」入口传来的草稿。
  // mount 时读一次、立刻清掉,避免下次再进页面又被自动填上旧内容。
  // 用 sessionStorage 而非 search params:不改 route 配置 + 关页就清。
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem("meridian.ai-feed.ask-draft");
      if (draft && draft.trim()) {
        setProfileText(draft);
        sessionStorage.removeItem("meridian.ai-feed.ask-draft");
      }
    } catch {
      // private mode / quota 静默吞
    }
  }, []);

  // 选中历史会话后，把 user msg 灌进 textarea + assistant msg 灌进 parsedNote，
  // 让用户直接看到那次推荐的内容。切走（clearActive）时由对应 handler 清空。
  useEffect(() => {
    if (!activeConversationId || activeMessages.length === 0) return;
    const userMsg = activeMessages.find((m) => m.role === "user");
    const assistantMsg = activeMessages.find((m) => m.role === "assistant");
    if (userMsg) setProfileText(userMsg.content);
    if (assistantMsg) setParsedNote(assistantMsg.content);
  }, [activeConversationId, activeMessages]);

  const activeMode = useMemo(
    () => modes.find((mode) => mode.title === selectedMode) ?? modes[0],
    [selectedMode],
  );

  // 切换模式 = abort 进行中的 stream + 写回 profile（乐观更新立刻反映；
  // 失败由 ProfileContext.error 暴露）
  const setSelectedMode = (mode: GoalMode) => {
    abortRef.current?.abort();
    void updateProfile({ goal_mode: mode }).catch((e) =>
      console.warn("[AIAdvisor] 保存目标模式失败:", e),
    );
  };

  // 用 AI 流式推荐 goal_mode：
  //  1. abort 上一轮（连点 / 切模式 / 卸载 时也走这条路）；同时退出"查看历史"态
  //  2. for-await 消费 token，逐字累加到 parsedNote（实时渲染）
  //  3. 流完正则解析"推荐：<mode>"，校验在 GOAL_MODES 里再写 profile
  //  4. mock provider abort 走优雅 return（不抛）；真 provider 抛 AbortError
  //  5. 不管走哪条路，都把 user + assistant 两条 message 落 chat_message 表
  //     （aborted=true 时 assistantMessage 可能是部分输出，meta.aborted=true 标识）
  async function handleParse() {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const snapshotUserText = profileText;
    // 启动新一轮 = 退出"查看历史"态。selectConversation(null) 会清 active marker
    // + 清空 activeMessages；sync-effect 因 activeConversationId 变 null 会早退，
    // 不会把刚刚 setParsedNote("") 的清空回滚。
    selectConversation(null);
    setParsedNote("");
    setStreaming(true);

    let acc = "";
    let crashed = false;
    try {
      for await (const tok of chat({
        messages: recommendModePrompt(snapshotUserText),
        signal: ctrl.signal,
      })) {
        // Token 是 discriminated union（AI2 修复）；用 tokenText 取可显示文本
        // 未来 provider 加 citation / tool_use case 时这里不变。
        acc += tokenText(tok);
        setParsedNote(acc);
      }
    } catch (e) {
      // mock provider abort = 优雅 return，不进 catch；进 catch 的多半是真 provider 抛的 AbortError 或其它错
      if ((e as Error)?.name !== "AbortError") {
        crashed = true;
        setParsedNote(`AI 推荐失败：${(e as Error).message}`);
      }
    } finally {
      if (abortRef.current === ctrl) {
        setStreaming(false);
        abortRef.current = null;
      }
    }

    if (crashed) return;

    const wasAborted = ctrl.signal.aborted;

    // 解析 mode（部分输出也可能含「推荐：xxx」首行，宽松提取）
    const m = acc.match(/推荐[：:]\s*(.+?)(?:\n|$)/);
    const candidate = m?.[1]?.trim();
    const mode: GoalMode | null =
      candidate && (GOAL_MODES as readonly string[]).includes(candidate)
        ? (candidate as GoalMode)
        : null;

    // 干净跑完才写 profile（abort 时 acc 可能不完整，不要把半截解析写回）
    if (!wasAborted && mode) setSelectedMode(mode);

    // 落库：用户有输入 + acc 非空（至少有半截 assistant 内容）才写
    if (snapshotUserText.trim() && acc) {
      void persistRound({
        userMessage: snapshotUserText,
        assistantMessage: acc,
        mode,
        aborted: wasAborted,
      });
    }
  }

  /**
   * 用户点"返回新建"：清空 textarea / parsedNote / active 标识，回到空白态。
   */
  function handleNewConversation() {
    selectConversation(null);
    setProfileText("");
    setParsedNote("");
  }

  /**
   * 用户点历史条目：先 select（异步拉取详情），detail 回来后 effect 灌进
   * textarea + parsedNote。点 active 自己等于退出查看。
   */
  function handleSelectHistory(conversationId: string) {
    if (activeConversationId === conversationId) {
      handleNewConversation();
      return;
    }
    selectConversation(conversationId);
  }

  // 卸载时 abort：避免 setState on unmounted + provider 继续 yield
  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <section className="mx-auto flex max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-6 xl:h-[calc(100vh-5rem)]">
      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1fr_380px]">
        <main className="grid min-h-0 gap-3 sm:grid-cols-2 sm:grid-rows-4">
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
                className={`group animate-fade-in-up-soft relative overflow-hidden rounded-2xl border p-4 text-left transition-colors duration-300 ${
                  active
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-950 hover:border-slate-400"
                }`}
                style={{ animationDelay: `${60 + i * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      active
                        ? "bg-white/10"
                        : mode.pro
                          ? "bg-gold/10 text-gold group-hover:bg-gold/20"
                          : "bg-slate-100 group-hover:bg-slate-200/70"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.7} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {mode.pro && (
                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${
                          active
                            ? "border-gold/40 bg-gold/10 text-gold/80"
                            : "border-gold/50 bg-gold/10 text-gold"
                        }`}
                      >
                        Pro
                      </span>
                    )}
                    {active ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-maya">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-pulse-halo absolute inset-0 rounded-full bg-maya" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-maya" />
                        </span>
                        Active
                      </span>
                    ) : !mode.pro ? (
                      <CheckCircle2 className="h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                    ) : null}
                  </div>
                </div>
                <h2 className="mt-3 text-base font-semibold tracking-tight">{mode.title}</h2>
                <p
                  className={`mt-1 text-xs leading-5 ${
                    active ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {mode.desc}
                </p>
              </button>
            );
          })}
        </main>

        <aside className="flex min-h-0 flex-col gap-3">
          {/* Voice input */}
          <div
            className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-4"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">描述你的情况</h2>
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-1 transition-colors focus-within:border-slate-400">
              <textarea
                id="ai-advisor-profile-text"
                name="profileText"
                value={profileText}
                onChange={(event) => {
                  setProfileText(event.target.value);
                  // 用户开始编辑 = 退出"查看历史"态，下次 parse 自然是新会话
                  if (activeConversationId) selectConversation(null);
                }}
                className="block min-h-20 w-full resize-none bg-transparent px-3 py-2 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="例：我想保研，但这学期有实习，不能让 workload 超过 20 小时。"
              />
            </div>
            {activeConversationId && (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  正在查看历史会话
                </span>
                <button
                  type="button"
                  onClick={handleNewConversation}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 font-medium hover:bg-slate-100"
                >
                  <Undo2 className="h-3 w-3" />
                  返回新建
                </button>
              </div>
            )}
            {/* Mesh 渐变:maya 满底,gold/sapphire 只在左右两端做小色斑,
                让浅蓝主色保持视觉主导。disabled 时不挂 inline style,
                className 的 bg-slate-200 接管。 */}
            <button
              type="button"
              onClick={handleParse}
              disabled={streaming || !profileText.trim()}
              style={
                streaming || !profileText.trim()
                  ? undefined
                  : {
                      backgroundColor: "#7CC3FF",
                      backgroundImage:
                        "radial-gradient(circle at 0% 15%, #FFB62E 0%, rgba(255,182,46,0) 28%), " +
                        "radial-gradient(circle at 92% 85%, #4164FF 0%, rgba(65,100,255,0) 32%)",
                    }
              }
              className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-full bg-slate-200 px-4 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:text-slate-400 disabled:shadow-none"
            >
              {streaming ? "分析中…" : "让系统听听你的想法"}
            </button>
            {parsedNote ? (
              <p className="mt-2 flex items-start gap-1.5 whitespace-pre-wrap text-sm font-medium text-slate-700">
                <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0" />
                <span>
                  {parsedNote}
                  {streaming && (
                    <span className="ml-0.5 animate-pulse">▍</span>
                  )}
                </span>
              </p>
            ) : null}
          </div>

          {/* Active logic — emphasized dark card */}
          <div
            className="animate-fade-in-up-soft relative overflow-hidden rounded-2xl border border-slate-900 bg-slate-950 p-4 text-white"
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
              当前启用逻辑
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {activeMode.title}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-300">{activeMode.logic}</p>
          </div>

          {/* Example */}
          <div
            className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-4"
            style={{ animationDelay: "240ms" }}
          >
            <h2 className="font-semibold">推荐变化示例</h2>
            <p className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
              {activeMode.example}
            </p>
          </div>

          {/* Conversation history */}
          <div
            className="animate-fade-in-up-soft flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-4"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <History className="h-4 w-4 text-slate-500" />
                对话历史
              </h2>
              {conversations.length > 0 && (
                <span className="text-[11px] tabular-nums text-slate-400">
                  最近 {conversations.length} 条
                </span>
              )}
            </div>

            {loadingConversations ? (
              <p className="mt-3 text-sm text-slate-400">加载中…</p>
            ) : conversations.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                暂无历史。跑一次推荐就会出现在这里。
              </p>
            ) : (
              <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {conversations.map((c) => {
                  const active = c.conversation_id === activeConversationId;
                  return (
                    <li key={c.conversation_id}>
                      <div
                        className={`group flex items-start gap-2 rounded-xl border p-3 transition-colors ${
                          active
                            ? "border-slate-950 bg-slate-50"
                            : "border-slate-100 bg-white hover:border-slate-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectHistory(c.conversation_id)}
                          className="min-w-0 flex-1 text-left"
                          disabled={loadingActive && active}
                        >
                          <p className="truncate text-sm font-medium text-slate-800">
                            {c.preview || "（无内容）"}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            {c.mode && (
                              <span className="rounded-full bg-slate-100 px-1.5 py-0.5">
                                {c.mode}
                              </span>
                            )}
                            {c.aborted && (
                              <span className="flex items-center gap-1 text-flame">
                                <XCircle className="h-3 w-3" />
                                中断
                              </span>
                            )}
                            <span className="tabular-nums">
                              {formatRelativeTime(c.last_at)}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (window.confirm("删除这条对话历史？")) {
                              void removeConversation(c.conversation_id).catch(
                                (err) =>
                                  console.warn("[AIAdvisor] 删除失败:", err),
                              );
                            }
                          }}
                          className="text-slate-400 opacity-0 transition-opacity hover:text-flame group-hover:opacity-100"
                          aria-label="删除对话"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
