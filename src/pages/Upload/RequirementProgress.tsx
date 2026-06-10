import { useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronRight, Circle, ListTodo, Loader2 } from "lucide-react";
import { useTrack } from "@/hooks/useTrack";
import { useUserRequirementDone } from "@/hooks/useUserRequirementDone";
import { useAuth } from "@/hooks/useAuth";
import { isUserVisibleRequirement, classifyCategory } from "@/lib/trackUserView";
import type { TrackRequirement, TrackCategory } from "@/api/trackApi";

/**
 * Upload 页 · 毕业要求完成情况
 *
 * 正向勾选式 + 折叠 + per-requirement 学分滑块
 *
 * 设计：
 *  - category 默认折叠，header chip 显示 done/total（快速用户只需看 chip）
 *  - 展开 category 后显示其下所有 requirement
 *  - **每条 requirement** 自带 chevron：点击展开后显示 0 → threshold 滑块
 *    （仅 kind=credits + threshold>0 时显示；其他 kind 直接显示 toggle 不带滑块）
 *  - 默认所有 requirement 都未完成（不打勾）；用户主动勾选写入 user_requirement_done
 *  - 滑块当前是 local state 占位，后续接 user_progress.credits 时再持久化
 *  - 注:hook 返回的 `incompleteReqIds` 字段名是历史遗留(早期是反向勾选语义),
 *    现在 set 内成员表示"已完成"——本组件做语义翻转,不改 hook 源码
 */

interface CategorySection {
  category: TrackCategory;
  requirements: TrackRequirement[];
}

/**
 * 取一条 requirement 的"学分上限"。
 * - 优先 threshold（kind=credits 时最权威）
 * - threshold 为 NULL 时尝试从 title 抠出第一个 "N 学分"
 *   覆盖 E2-1 思政（17）/ E2-5 国情（3）/ E2-8 通识必修（4）/ E3 系列等
 *   E2-3 计算机这种 "0/3/5 / 师范 4" 复杂条件解不出 → 默认按 5 学分给进度条
 */
function getCreditCap(r: TrackRequirement): number {
  if (r.threshold != null && r.threshold > 0) return r.threshold;
  // 抠 "(8 学分)" / "8 学分" / "≥ 6 年" 一类，只匹配 "N 学分"
  const m = r.title.match(/(\d+(?:\.\d+)?)\s*学分/);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  // 解不出明确学分（如 E2-3 公共计算机 "0/3/5 / 师范4"）→ 默认按 5 学分,
  // 不返回 0（否则整条无进度条）。用户：这类"修 3 或 5 分"的至少按 5 算,也得有进度条。
  return 5;
}

export default function RequirementProgress() {
  const { user, loading: authLoading } = useAuth();
  const isGuest = !authLoading && !user;
  const {
    categories,
    requirementsByCategoryId,
    loading: trackLoading,
    error: trackError,
  } = useTrack();
  const {
    incompleteReqIds,
    isReqIncomplete,
    loading: doneLoading,
    error: doneError,
    toggle,
  } = useUserRequirementDone();

  const sections: CategorySection[] = useMemo(() => {
    const out: CategorySection[] = [];
    for (const category of categories) {
      const cls = classifyCategory(category.code, category.title);
      if (!cls) continue;
      const reqs = requirementsByCategoryId.get(category.id) ?? [];
      const visible = reqs.filter((r) => isUserVisibleRequirement(r));
      if (visible.length > 0) out.push({ category, requirements: visible });
    }
    return out;
  }, [categories, requirementsByCategoryId]);

  // 翻转语义:set 内成员 = 已完成,所以 size 直接是 doneCount
  const totalCount = sections.reduce((acc, s) => acc + s.requirements.length, 0);
  const doneCount = incompleteReqIds.size;
  const pendingCount = totalCount - doneCount;
  // hook 还叫 isReqIncomplete 但我们当 isReqDone 用
  const isReqDone = isReqIncomplete;

  const loading = authLoading || trackLoading || doneLoading;
  const error = trackError ?? doneError;

  // ── 分类展开逻辑（手风琴：同时只一个开） ─────────────────────────────
  // 两种模式：
  //  · 没钉住任何（pinnedId=null）→ 悬停预览：鼠标移到哪个分类哪个展开，移出全收。
  //  · 钉住了某个（点击）→ 进入「点击切换」模式：钉住的常驻展开（渐变），**悬停别的
  //    不再展开**，必须点击才把钉住+展开切到新的那个；再点钉住的本身则取消。
  // 故展开的 = pinnedId 优先、否则看 hoverId。
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const openId = pinnedId ?? hoverId;

  // openId 的 ref 镜像，给事件回调读「当前展开的是谁」而不吃闭包旧值
  const openIdRef = useRef<string | null>(null);
  openIdRef.current = openId;

  // 切换锁：手风琴切换时，上方分类收起会塌缩布局、把下方顶到静止的鼠标下面，
  // 浏览器据此对静止鼠标反复派发 mouseenter → 两个框无限抖动。切换后锁 ~320ms
  // （略大于展开动画 300ms），期间忽略一切 enter，等动画稳定再放开 → 断掉死循环。
  const lockRef = useRef(false);
  // 收起宽限：移出卡片瞬间若因塌缩误触 leave，延迟 90ms 再收；期间进了别的分类就取消。
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enterCat = (id: string) => {
    if (pinnedId !== null) return; // 已钉住 → 进入点击切换模式，悬停不接管（也顺带杜绝抖动）
    if (lockRef.current) return; // 切换动画未结束，忽略布局位移引发的伪 enter
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (id === openIdRef.current) return; // 已经是它，不动（也不上锁）
    setHoverId(id);
    lockRef.current = true;
    setTimeout(() => {
      lockRef.current = false;
    }, 320);
  };

  const scheduleCloseAll = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setHoverId(null), 90);
  };

  // 点击：切到/取消钉住。同步 hoverId 到点的这个 —— 取消钉住后落回鼠标所在的它，
  // 不会因 hoverId 残留旧值而跳去展开别的。
  const togglePin = (id: string) => {
    setPinnedId((p) => (p === id ? null : id));
    setHoverId(id);
  };

  // requirement 学分草稿（reqId → 当前已修学分，local state 占位）
  const [creditDrafts, setCreditDrafts] = useState<Record<string, number>>({});

  function setCreditDraft(reqId: string, value: number) {
    setCreditDrafts((prev) => ({ ...prev, [reqId]: value }));
  }

  return (
    <div>
      <header className="flex items-end justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-slate-500" />
          {/* hover 标题弹出说明（替代原常驻提示句）：纯 CSS group-hover */}
          <div className="group relative inline-flex items-center">
            <h2 className="cursor-help font-semibold tracking-tight">毕业要求完成情况</h2>
            <span className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-normal leading-5 text-slate-600 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              勾选你已完成的毕业要求;带学分的要求可直接拖右侧滑块填写已修学分。访客模式只看不存。
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="rounded-full bg-maya/15 px-2.5 py-1 font-medium text-slate-700">
            已完成 {doneCount} / {totalCount}
          </span>
          {pendingCount > 0 && doneCount > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
              待完成 {pendingCount}
            </span>
          )}
        </div>
      </header>

      {isGuest && (
        <p className="mt-3 rounded-xl border border-gold/50 bg-white p-3 text-xs leading-5 text-slate-700">
          访客模式只看不存。登录后勾选状态会保存到你的账号。
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-flame/40 bg-white p-3 text-xs leading-5 text-flame">
          {error}
        </p>
      )}

      {loading && !sections.length && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> 加载毕业要求…
        </div>
      )}

      {!loading && totalCount === 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          <ListTodo className="mx-auto mb-2 h-6 w-6 text-slate-400" />
          暂无可勾选要求 —— 数据未加载或当前 track 无 course-kind requirement。
        </div>
      )}

      {/* 单层 card，内部 divide-y 细线分隔各 category。移出整张卡 → 全部收起 */}
      {sections.length > 0 && (
        <div
          className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          onMouseLeave={scheduleCloseAll}
        >
          {sections.map((s) => {
            // 翻转:set 内 = done,所以直接 filter set 内
            const doneInCat = s.requirements.filter((r) => isReqDone(r.id)).length;
            const totalInCat = s.requirements.length;
            const catOpen = openId === s.category.id;
            const isPinned = pinnedId === s.category.id;

            return (
              // 鼠标进入本块即展开它、同时收起其它（手风琴）；从 A 移到 B 直接平滑切换，
              // 不会先瞬间收回。移出整张卡（外层 onMouseLeave）才全收。
              <div key={s.category.id} onMouseEnter={() => enterCat(s.category.id)}>
                <button
                  type="button"
                  onClick={() => togglePin(s.category.id)}
                  className={`flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors ${
                    isPinned ? "bg-brand-gradient" : catOpen ? "bg-slate-50" : ""
                  }`}
                  title={isPinned ? "已固定 · 点击收起" : "点击固定展开"}
                >
                  <ChevronRight
                    className={`h-4 w-4 transition-transform duration-300 ${
                      catOpen ? "rotate-90" : ""
                    } ${isPinned ? "text-white" : "text-slate-400"}`}
                  />
                  <h3
                    className={`text-sm font-semibold ${isPinned ? "text-white" : "text-slate-950"}`}
                  >
                    {s.category.title}
                  </h3>
                  <span
                    className={`ml-auto text-[11px] tabular-nums ${
                      isPinned ? "text-white/90" : "text-slate-500"
                    }`}
                  >
                    {doneInCat} / {totalInCat}
                  </span>
                </button>

                {/* 展开/收起动画：grid-rows 0fr↔1fr + back-out 贝塞尔（微 Q 弹），不闪不跳 */}
                <div
                  className={`grid transition-all duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${
                    catOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <ul className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/40">
                    {s.requirements.map((r) => {
                      const done = isReqDone(r.id);
                      // 学分上限:threshold 优先,否则从 title 解 "N 学分",仍解不出默认 5
                      const threshold = Math.floor(getCreditCap(r));
                      const hasSlider = threshold > 0;
                      const credit = creditDrafts[r.id] ?? (done ? threshold : 0);
                      const pct = hasSlider ? Math.round((credit / threshold) * 100) : 0;
                      return (
                        <li
                          key={r.id}
                          className="grid grid-cols-1 items-center gap-x-3 gap-y-1.5 px-3 py-2 sm:grid-cols-2"
                        >
                          {/* 正向勾选 toggle —— 默认不打勾,用户主动点（占左半,标题左对齐） */}
                          <button
                            type="button"
                            disabled={isGuest}
                            onClick={() => void toggle(r.id)}
                            className={`flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-left text-xs transition-colors ${
                              isGuest ? "cursor-not-allowed opacity-60" : "hover:bg-white"
                            }`}
                            title={done ? "已完成 · 点击取消勾选" : "未完成 · 点击标记完成"}
                          >
                            {done ? (
                              <CheckCircle2 className="h-4 w-4 flex-none text-maya" />
                            ) : (
                              <Circle className="h-4 w-4 flex-none text-slate-300" />
                            )}
                            <span className="min-w-0 leading-5">
                              <span className="font-mono text-[10px] text-slate-400">{r.code}</span>{" "}
                              <span className={done ? "text-slate-700" : "text-slate-600"}>
                                {r.title}
                              </span>
                            </span>
                          </button>

                          {/* 内联学分滑块 —— 占右半(左界=整行中线),右端对齐(数字固定 w-12);
                              轨道灰色无描边(appearance-none),已修部分用品牌渐变(行内 90deg gradient) */}
                          {hasSlider && (
                            <div className="flex items-center gap-2 pr-1">
                              <input
                                type="range"
                                min={0}
                                max={threshold}
                                step={1}
                                value={credit}
                                disabled={isGuest}
                                onChange={(e) => setCreditDraft(r.id, Number(e.target.value))}
                                style={{
                                  background: `linear-gradient(90deg, #FFB62E 0%, #7CC3FF ${pct / 2}%, #4164FF ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
                                }}
                                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full outline-none disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-progress]:bg-transparent [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_1px_3px_rgba(15,23,42,0.35)] [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(15,23,42,0.35)]"
                                aria-label={`${r.title} 已修学分`}
                                title="拖动填写已修学分"
                              />
                              <span className="w-12 flex-none text-right text-[11px] tabular-nums text-slate-600">
                                <strong className="font-semibold text-slate-900">{credit}</strong>
                                <span className="text-slate-400">/{threshold}</span>
                              </span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
