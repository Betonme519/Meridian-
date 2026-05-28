import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Circle, ListTodo, Loader2 } from "lucide-react";
import { useTrack } from "@/hooks/useTrack";
import { useUserRequirementDone } from "@/hooks/useUserRequirementDone";
import { useAuth } from "@/hooks/useAuth";
import { isUserVisibleRequirement, classifyCategory } from "@/lib/trackUserView";
import type { TrackRequirement, TrackCategory } from "@/api/trackApi";

/**
 * Upload 页 · 毕业要求完成情况
 *
 * 反向勾选式 + 折叠 + per-requirement 学分滑块
 *
 * 设计：
 *  - category 默认折叠，header chip 显示 done/total（快速用户只需看 chip）
 *  - 展开 category 后显示其下所有 requirement
 *  - **每条 requirement** 自带 chevron：点击展开后显示 0 → threshold 滑块
 *    （仅 kind=credits + threshold>0 时显示；其他 kind 直接显示 toggle 不带滑块）
 *  - 默认所有 requirement 视为已完成，取消勾选写入 user_requirement_done
 *  - 滑块当前是 local state 占位，后续接 user_progress.credits 时再持久化
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
 *   E2-3 计算机这种 "0/3/5 / 师范 4" 复杂条件解不出 → 返回 0 不显示滑块
 */
function getCreditCap(r: TrackRequirement): number {
  if (r.threshold != null && r.threshold > 0) return r.threshold;
  // 抠 "(8 学分)" / "8 学分" / "≥ 6 年" 一类，只匹配 "N 学分"
  const m = r.title.match(/(\d+(?:\.\d+)?)\s*学分/);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
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
      const visible = reqs.filter(isUserVisibleRequirement);
      if (visible.length > 0) out.push({ category, requirements: visible });
    }
    return out;
  }, [categories, requirementsByCategoryId]);

  const totalCount = sections.reduce((acc, s) => acc + s.requirements.length, 0);
  const incompleteCount = incompleteReqIds.size;
  const completedCount = totalCount - incompleteCount;

  const loading = authLoading || trackLoading || doneLoading;
  const error = trackError ?? doneError;

  // 展开状态：默认全部 category 折叠 / 全部 requirement 折叠
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [expandedReqs, setExpandedReqs] = useState<Set<string>>(new Set());
  // requirement 学分草稿（reqId → 当前已修学分，local state 占位）
  const [creditDrafts, setCreditDrafts] = useState<Record<string, number>>({});

  function toggleCat(id: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleReq(id: string) {
    setExpandedReqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setCreditDraft(reqId: string, value: number) {
    setCreditDrafts((prev) => ({ ...prev, [reqId]: value }));
  }

  return (
    <div>
      <header className="flex items-end justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">毕业要求完成情况</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="rounded-full bg-maya/15 px-2.5 py-1 font-medium text-slate-700">
            已完成 {completedCount} / {totalCount}
          </span>
          {incompleteCount > 0 && (
            <span className="rounded-full bg-flame/10 px-2.5 py-1 font-medium text-flame">
              待完成 {incompleteCount}
            </span>
          )}
        </div>
      </header>
      <p className="mt-1 px-1 text-xs leading-5 text-slate-500">
        默认所有要求视为已完成；<strong className="text-flame">取消勾选</strong>
        = 这条还没做。点击每条要求可展开学分滑块快速填写已修学分。
      </p>

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

      {/* 单层 card，内部 divide-y 细线分隔各 category */}
      {sections.length > 0 && (
        <div className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {sections.map((s) => {
            const catOpen = expandedCats.has(s.category.id);
            const doneInCat = s.requirements.filter((r) => !isReqIncomplete(r.id)).length;
            const totalInCat = s.requirements.length;

            return (
              <div key={s.category.id}>
                <button
                  type="button"
                  onClick={() => toggleCat(s.category.id)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  {catOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  <h3 className="text-sm font-semibold text-slate-950">{s.category.title}</h3>
                  <span className="font-mono text-[11px] text-slate-400">{s.category.code}</span>
                  <span className="ml-auto text-[11px] tabular-nums text-slate-500">
                    {doneInCat} / {totalInCat}
                  </span>
                </button>

                {catOpen && (
                  <ul className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/40">
                    {s.requirements.map((r) => {
                      const incomplete = isReqIncomplete(r.id);
                      const reqOpen = expandedReqs.has(r.id);
                      // 学分上限：threshold 优先，否则从 title 解 "N 学分"
                      const threshold = getCreditCap(r);
                      const hasSlider = threshold > 0;
                      const credit = creditDrafts[r.id] ?? (incomplete ? 0 : threshold);
                      return (
                        <li key={r.id} className="px-3 py-1.5">
                          <div className="flex items-start gap-1">
                            {/* 反向勾选 toggle —— 占左侧 */}
                            <button
                              type="button"
                              disabled={isGuest}
                              onClick={() => void toggle(r.id)}
                              className={`flex flex-1 items-start gap-2 rounded-lg px-2 py-1 text-left text-xs transition-colors ${
                                isGuest
                                  ? "cursor-not-allowed opacity-60"
                                  : "hover:bg-white"
                              }`}
                              title={
                                incomplete ? "未完成 · 点击标记完成" : "已完成 · 点击取消勾选"
                              }
                            >
                              {incomplete ? (
                                <Circle className="mt-0.5 h-4 w-4 flex-none text-flame" />
                              ) : (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-maya" />
                              )}
                              <span className="flex-1 leading-5">
                                <span className="font-mono text-[10px] text-slate-400">
                                  {r.code}
                                </span>{" "}
                                <span className={incomplete ? "text-flame" : "text-slate-700"}>
                                  {r.title}
                                </span>
                              </span>
                            </button>

                            {/* 展开按钮 —— 仅 hasSlider 时显示 */}
                            {hasSlider && (
                              <button
                                type="button"
                                onClick={() => toggleReq(r.id)}
                                className="flex flex-none items-center gap-0.5 rounded-md px-1.5 py-1 text-[10px] font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
                                aria-label={reqOpen ? "收起学分填写" : "展开学分填写"}
                                title="展开学分滑块"
                              >
                                {reqOpen ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                                <span className="tabular-nums">{threshold} 学分</span>
                              </button>
                            )}
                          </div>

                          {/* 展开后的滑块 —— 每条 requirement 自己一条 */}
                          {hasSlider && reqOpen && (
                            <div className="ml-7 mt-1 border-l border-slate-200 pl-3">
                              <div className="flex items-baseline justify-between">
                                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                                  已修学分（拖动填写）
                                </span>
                                <span className="text-xs tabular-nums text-slate-700">
                                  <strong className="font-semibold text-slate-900">
                                    {credit}
                                  </strong>
                                  <span className="text-slate-400"> / {threshold}</span>
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={threshold}
                                step={0.5}
                                value={credit}
                                disabled={isGuest}
                                onChange={(e) =>
                                  setCreditDraft(r.id, Number(e.target.value))
                                }
                                className="mt-1 block w-full accent-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
