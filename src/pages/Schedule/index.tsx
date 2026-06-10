import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe2,
  Plus,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRules } from "@/hooks/useRules";
import type { Rule } from "@/api/ruleApi";
import type { ConfidenceLevel } from "@/api/ruleConflictApi";
import { SEED_RULES, SEED_CONFLICTS, SEED_POLICIES } from "./scheduleSeed";

/**
 * 学校官方 PDF 文档清单。
 * 临时方案:PDF 直接放 public/docs/ 走静态资源。
 * 未来:文档应从 DB 读(用户上传 → Supabase Storage → 关联 rule_source 表),
 * 见 docs/CURRENT_TASK.md 排队记录"PDF 上传与展示"。
 */
const PDF_DOCS = [
  {
    id: "guide",
    title: "华东师范大学 2025 年本科生学习指南",
    url: "/docs/ecnu-2025-guide.pdf",
  },
  {
    id: "handbook",
    title: "华东师范大学 2025 年本科生手册",
    url: "/docs/ecnu-2025-handbook.pdf",
  },
] as const;

/**
 * Schedule 页 —— 用户规则知识库 + 冲突 + 学校特殊政策。
 *
 * 三段数据来源：
 *  1. 规则结构树 + Trust 三列：来自 `rule` 表（hook: useRules）
 *  2. 冲突卡片：来自 `rule_conflict` 表（同 hook）
 *  3. 学校特殊政策：暂走 SEED，不入库（属 track_* 范畴，等 schema pivot 后再迁）
 *
 * 访客（未登录）→ 全部读 SEED，CRUD 按钮隐藏，顶部横幅提示「示例预览」
 * 登录用户 → 拉 hook 数据；空态用 SEED 视觉占位 + 「上方为示例」提示，鼓励新建
 *
 * CRUD 入口：
 *  - 「+ 新建冲突」：inline form panel（冲突区上方展开）
 *  - conflict 卡片：右上角 ✕
 *  - 注:规则本身是学校官方文档,用户不再增删,所以不挂"新建规则"入口
 */
export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const {
    rules,
    conflicts,
    rulesByBranch,
    ruleMap,
    loading,
    error,
    createConflict,
    removeConflict,
    refresh,
  } = useRules();

  // 当前预览的 PDF id。一个学校规则一致,后台用同一份;有多份(指南 + 手册)时用 select 切换。
  const [selectedDocId, setSelectedDocId] = useState<(typeof PDF_DOCS)[number]["id"]>(
    PDF_DOCS[0].id,
  );
  const selectedDoc = PDF_DOCS.find((d) => d.id === selectedDocId) ?? PDF_DOCS[0];

  const isResolving = authLoading || loading;
  const isGuest = !authLoading && !user;
  const isEmpty = !isResolving && !isGuest && rules.length === 0 && conflicts.length === 0;
  /**
   * 访客 / 登录空态 / 仍在解析（auth + hook）→ 全部展示 SEED。
   * 把 isResolving 并进来是为了消除 TD-25 闪屏：第一帧直接 SEED，
   * 而不是「空表 → SEED」或「空表 → 真实数据」的两段跳变。
   */
  const showSeed = isResolving || isGuest || isEmpty;

  const displayConflicts = showSeed ? SEED_CONFLICTS : conflicts;
  const displayRulesByBranch = useMemo(() => {
    if (!showSeed) return rulesByBranch;
    const map = new Map<string, Rule[]>();
    for (const r of SEED_RULES) {
      const list = map.get(r.branch);
      if (list) list.push(r);
      else map.set(r.branch, [r]);
    }
    return Array.from(map, ([branch, items]) => ({ branch, items }));
  }, [showSeed, rulesByBranch]);
  const displayRuleMap = useMemo(() => {
    if (!showSeed) return ruleMap;
    const m = new Map<string, Rule>();
    for (const r of SEED_RULES) m.set(r.id, r);
    return m;
  }, [showSeed, ruleMap]);

  /** 默认打开第一个分组 */
  const [openBranch, setOpenBranch] = useState<string | null>(
    () => displayRulesByBranch[0]?.branch ?? null,
  );
  // 数据切换时（访客 → 登录 / DB → SEED），若当前 openBranch 已不存在，落回第一个
  const safeOpenBranch =
    openBranch && displayRulesByBranch.some((b) => b.branch === openBranch)
      ? openBranch
      : (displayRulesByBranch[0]?.branch ?? null);

  const [conflictFormOpen, setConflictFormOpen] = useState(false);

  const canEdit = !isGuest && !authLoading;

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Status banners */}
      {isGuest && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600">
          <span>访客预览 · 登录后即可录入并保存你的规则知识库。</span>
          <span className="text-slate-400">示例数据</span>
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-flame/40 bg-white px-4 py-2.5 text-xs text-flame">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-slate-700"
          >
            <RefreshCcw className="h-3 w-3" /> 重试
          </button>
        </div>
      )}

      {/* Top: 左结构树 + 右 PDF 原件预览 */}
      <div className="mt-2 grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Tree column —— 裸列表, 细线分隔；flex col 让分支卡填底对齐右栏 */}
        <aside
          className="animate-fade-in-up-soft flex flex-col"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-2 px-1">
            <FileText className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold tracking-tight">规则结构树</h2>
          </div>
          {/* 当前预览的 PDF 文档:同一学校规则一份,有多份(指南/手册)时下拉切换。
              学校官方 PDF 是只读参考资料,所以这里不是"新建规则"入口。 */}
          <label className="mt-1 flex items-center gap-1 px-1 text-xs text-slate-500">
            <span className="text-slate-400">当前文档</span>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value as typeof selectedDocId)}
              className="min-w-0 flex-1 cursor-pointer truncate rounded-md border border-transparent bg-transparent px-1 py-0.5 text-xs text-slate-700 outline-none transition-colors hover:border-slate-200 focus:border-slate-300"
            >
              {PDF_DOCS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>

          {/* 分支列表：单层 card + 内部 divide-y 细线，flex-1 填底与右侧 PDF 对齐 */}
          <div className="mt-3 flex min-h-0 flex-1 flex-col divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {displayRulesByBranch.length === 0 && !loading && (
              <p className="p-4 text-center text-xs text-slate-400">暂无规则</p>
            )}
            {displayRulesByBranch.map((b) => {
              const open = safeOpenBranch === b.branch;
              const highRules = b.items.filter((r) => r.trust === "high");
              return (
                <div key={b.branch}>
                  <button
                    type="button"
                    onClick={() => setOpenBranch(open ? null : b.branch)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-sm font-medium text-slate-900">{b.branch}</span>
                    <span className="ml-auto text-[11px] tabular-nums text-slate-400">
                      {b.items.length}
                    </span>
                  </button>
                  {open && (
                    <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 px-4 py-3">
                      {/* 当前分区官方规则 · 高可信度 */}
                      <div>
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                          <ShieldCheck className="h-3 w-3 text-maya" />
                          官方规则 · 高可信度
                        </p>
                        {highRules.length === 0 ? (
                          <p className="mt-2 text-[11px] text-slate-400">本分区暂无官方规则</p>
                        ) : (
                          <ul className="mt-2 space-y-2.5">
                            {highRules.map((leaf) => (
                              <li key={leaf.id} className="text-xs">
                                <p className="font-medium text-slate-900">{leaf.title}</p>
                                {leaf.body && (
                                  <p className="mt-0.5 text-slate-600 leading-5">{leaf.body}</p>
                                )}
                                <p className="mt-1 text-[11px] text-slate-400">
                                  {leaf.source ?? "未注明来源"}
                                  {leaf.source_page && (
                                    <span className="ml-1 text-slate-300">· {leaf.source_page}</span>
                                  )}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right · PDF 原件预览。
            当前临时方案:public/docs/*.pdf 静态文件,iframe 直接嵌浏览器原生 PDF
            viewer。未来:从 Supabase Storage 拉用户上传文档(见 TD 待办)。 */}
        <main
          className="animate-fade-in-up-soft flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex flex-none items-center gap-2 border-b border-slate-200 px-4 py-3">
            <FileText className="h-4 w-4 text-slate-500" />
            <h2 className="truncate text-sm font-semibold text-slate-950">{selectedDoc.title}</h2>
            <a
              href={selectedDoc.url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              新窗口打开
            </a>
          </div>
          <iframe
            key={selectedDoc.id}
            src={selectedDoc.url}
            title={selectedDoc.title}
            className="min-h-[480px] flex-1 border-0"
          />
        </main>
      </div>

      {/* 冲突规则 */}
      <div className="mt-8">
        <div className="flex items-center gap-2 px-1">
          <ShieldAlert className="h-5 w-5 text-flame" />
          <h2 className="font-semibold tracking-tight">冲突规则</h2>
          <span className="ml-auto text-xs text-slate-400 tabular-nums">
            {displayConflicts.length} 条需要人工确认
          </span>
          {canEdit && (
            <button
              type="button"
              onClick={() => setConflictFormOpen((v) => !v)}
              disabled={rules.length < 2}
              className="inline-flex items-center gap-1 rounded-md bg-flame px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-flame/90 disabled:cursor-not-allowed disabled:bg-slate-300"
              title={rules.length < 2 ? "至少有 2 条规则才能新建冲突" : ""}
            >
              <Plus className="h-3 w-3" />
              新建冲突
            </button>
          )}
        </div>

        {canEdit && conflictFormOpen && rules.length >= 2 && (
          <NewConflictForm
            rules={rules}
            onCancel={() => setConflictFormOpen(false)}
            onSubmit={async (input) => {
              const saved = await createConflict(input);
              if (saved) setConflictFormOpen(false);
            }}
          />
        )}

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {displayConflicts.length === 0 && !loading && (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 lg:col-span-2">
              暂无冲突记录
            </p>
          )}
          {displayConflicts.map((c, i) => {
            const a = displayRuleMap.get(c.rule_a_id);
            const b = displayRuleMap.get(c.rule_b_id);
            return (
              <article
                key={c.id}
                className="group animate-fade-in-up-soft relative rounded-xl border border-flame/40 bg-white p-4"
                style={{ animationDelay: `${60 + i * 60}ms` }}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 items-center rounded-full bg-flame/15 px-2 text-[11px] font-semibold text-flame">
                    冲突
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {c.title}
                  </h3>
                  {c.confidence && (
                    <span className="text-[11px] text-slate-400">
                      置信度 {confidenceLabel(c.confidence)}
                    </span>
                  )}
                  {canEdit && !showSeed && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`删除冲突「${c.title}」？`)) {
                          void removeConflict(c.id);
                        }
                      }}
                      className="invisible ml-auto rounded p-1 text-slate-400 transition-colors hover:bg-flame/10 hover:text-flame group-hover:visible"
                      aria-label="删除冲突"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <ConflictSide
                    side="A"
                    text={a?.title ?? "(规则已删除)"}
                    source={a?.source ?? null}
                    highlighted={c.resolved_by === "a"}
                  />
                  <ConflictSide
                    side="B"
                    text={b?.title ?? "(规则已删除)"}
                    source={b?.source ?? null}
                    highlighted={c.resolved_by === "b"}
                  />
                </div>

                {c.judgement && (
                  <div className="mt-4 rounded-xl bg-slate-950 p-3 text-white">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                      AI 判断
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-100">
                      {c.judgement}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {/* 学校特殊政策 (SEED 不入库) */}
      <div className="mt-8">
        <div className="flex items-center gap-2 px-1">
          <Globe2 className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">学校特殊政策</h2>
          <span className="ml-auto text-xs text-slate-400">留学 / 保研专项</span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SEED_POLICIES.map((p, i) => (
            <article
              key={p.title}
              className="animate-fade-in-up-soft rounded-xl border border-slate-200 bg-white p-4"
              style={{ animationDelay: `${60 + i * 50}ms` }}
            >
              <span className="inline-flex h-5 items-center rounded-full bg-sapphire/15 px-2 text-[11px] font-semibold text-sapphire">
                {p.scope}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-1.5 text-xs leading-5 text-slate-600">{p.body}</p>
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

/* ───────────────────────── 子组件：冲突单侧 ───────────────────────── */

function ConflictSide({
  side,
  text,
  source,
  highlighted,
}: {
  side: "A" | "B";
  text: string;
  source: string | null;
  highlighted: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${highlighted ? "border-maya/50 bg-white" : "border-slate-200 bg-white"}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
        {side} 方{highlighted && " · 已采纳"}
      </p>
      <p className="mt-1 text-xs text-slate-800">{text}</p>
      <p className="mt-2 text-[11px] text-slate-500">
        来源：{source ?? "未注明"}
      </p>
    </div>
  );
}

/* ───────────────────────── 子组件：新建冲突 inline 表单 ───────────────────────── */

function NewConflictForm({
  rules,
  onSubmit,
  onCancel,
}: {
  rules: Rule[];
  onSubmit: (input: {
    ruleAId: string;
    ruleBId: string;
    title: string;
    judgement: string | null;
    confidence: ConfidenceLevel | null;
  }) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [aId, setAId] = useState(rules[0]?.id ?? "");
  const [bId, setBId] = useState(rules[1]?.id ?? "");
  const [title, setTitle] = useState("");
  const [judgement, setJudgement] = useState("");
  const [confidence, setConfidence] = useState<ConfidenceLevel>("med");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const t = title.trim();
    if (!t || !aId || !bId || aId === bId) return;
    setBusy(true);
    try {
      await onSubmit({
        ruleAId: aId,
        ruleBId: bId,
        title: t,
        judgement: judgement.trim() || null,
        confidence,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-flame/40 bg-white p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] font-medium text-slate-600">
          A 方规则
          <select
            value={aId}
            onChange={(e) => setAId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-400"
          >
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-medium text-slate-600">
          B 方规则
          <select
            value={bId}
            onChange={(e) => setBId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-400"
          >
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-[11px] font-medium text-slate-600">
        冲突主题
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="如：体育课是否计入 GPA"
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-400"
        />
      </label>
      <label className="block text-[11px] font-medium text-slate-600">
        AI 判断（可空）
        <textarea
          value={judgement}
          onChange={(e) => setJudgement(e.target.value)}
          rows={2}
          className="mt-1 w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-400"
        />
      </label>
      <label className="block text-[11px] font-medium text-slate-600">
        置信度
        <select
          value={confidence}
          onChange={(e) => setConfidence(e.target.value as ConfidenceLevel)}
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-400"
        >
          <option value="high">高</option>
          <option value="med">中</option>
          <option value="low">低</option>
        </select>
      </label>
      {aId === bId && (
        <p className="text-[11px] text-flame">A / B 方不能是同一条规则</p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-md px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200"
        >
          取消
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || !title.trim() || aId === bId}
          className="rounded-md bg-flame px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-flame/90 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {busy ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}

function confidenceLabel(c: ConfidenceLevel): string {
  if (c === "high") return "高";
  if (c === "med") return "中";
  return "低";
}
