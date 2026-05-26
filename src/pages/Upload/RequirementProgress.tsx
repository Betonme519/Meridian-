import { useMemo } from "react";
import { CheckCircle2, Circle, ListTodo, Loader2 } from "lucide-react";
import { useTrack } from "@/hooks/useTrack";
import { useUserRequirementDone } from "@/hooks/useUserRequirementDone";
import { useAuth } from "@/hooks/useAuth";
import { isUserVisibleRequirement, classifyCategory } from "@/lib/trackUserView";
import type { TrackRequirement, TrackCategory } from "@/api/trackApi";

/**
 * Upload 页 · 毕业要求完成情况（排队 12.5 sub-task 0）
 *
 * 反向勾选式：默认所有 requirement 视为"已完成"（勾选状态）。
 * **取消勾选 = 还没完成**，写入 user_requirement_done。
 * 重新勾选 = 已完成，删除该行。
 *
 * 用户主诉：
 *   - 学校无法 ingest 学生进度
 *   - 让学生填"还差几学分"太复杂 → 反向打勾把心智从"我做了什么"翻转到"我还差什么"
 *   - 大三 / 大四 95% 已完成 → 只需取消 1-2 条；大一 / 大二全部取消一次性勾几下
 *
 * 配色 / 间距 / kicker / 排版 复用 Upload 页 Section 6 / 7 既有模式。
 */

interface CategorySection {
  category: TrackCategory;
  requirements: TrackRequirement[];
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

  // 仅显示用户可见的 course-kind requirement（与画布同步）
  const sections: CategorySection[] = useMemo(() => {
    const out: CategorySection[] = [];
    for (const category of categories) {
      const cls = classifyCategory(category.code, category.title);
      if (!cls) continue; // 管理规则隐藏
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

  return (
    <div className="mt-12">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Section 8 · 反向勾选式进度
          </p>
          <h2 className="mt-1 font-semibold tracking-tight">毕业要求完成情况</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            默认所有要求视为已完成。<strong className="text-flame">取消勾选</strong>
            =这条还没做，下次完成后再勾回即可。
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
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

      {isGuest && (
        <p className="mt-4 rounded-xl border border-gold/50 bg-white p-3 text-xs leading-5 text-slate-700">
          访客模式只看不存。登录后勾选状态会保存到你的账号。
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-flame/40 bg-white p-3 text-xs leading-5 text-flame">
          {error}
        </p>
      )}

      {loading && !sections.length && (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> 加载毕业要求…
        </div>
      )}

      {!loading && totalCount === 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          <ListTodo className="mx-auto mb-2 h-6 w-6 text-slate-400" />
          暂无可勾选要求 —— 数据未加载或当前 track 无 course-kind requirement。
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <section
            key={s.category.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-950">{s.category.title}</h3>
              <span className="font-mono text-[11px] text-slate-400">{s.category.code}</span>
            </div>
            <ul className="mt-3 space-y-1">
              {s.requirements.map((r) => {
                const incomplete = isReqIncomplete(r.id);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      disabled={isGuest}
                      onClick={() => void toggle(r.id)}
                      className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                        isGuest
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-slate-50"
                      }`}
                      title={incomplete ? "未完成 · 点击标记完成" : "已完成 · 点击取消勾选"}
                    >
                      {incomplete ? (
                        <Circle className="mt-0.5 h-4 w-4 flex-none text-flame" />
                      ) : (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-maya" />
                      )}
                      <span className="flex-1 leading-5">
                        <span className="font-mono text-[10px] text-slate-400">{r.code}</span>{" "}
                        <span className={incomplete ? "text-flame" : "text-slate-700"}>
                          {r.title}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
