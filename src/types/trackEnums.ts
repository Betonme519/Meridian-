/**
 * Track 五张公共表的枚举类型 —— 与 Supabase DB CHECK 约束同源。
 *
 * 为什么不直接从 Database 类型推断：截至 2026-05-17，`src/types/db.ts`
 * 仍是 0002 之前的 7 张用户表快照，**不含** track_* 列（漂移已 5 个月）。
 * 等 SB1（重 gen db.ts）跑完，再把本文件的常量改成：
 *   type Req = Database["public"]["Tables"]["track_requirement"]["Row"];
 *   export type RequirementKind = Req["kind"];
 * 但 META 字典仍由本文件维护。
 *
 * 来源对齐：
 *  - track.scope_level         supabase/migrations/0003_relax_track_scope.sql line 59
 *  - track_requirement.kind    supabase/migrations/0002 line 106 + 0006_extend_requirement_kinds.sql
 *  - track_option.kind         supabase/migrations/0002 line 146
 *  - user_progress.status      supabase/migrations/0002 line 186
 *
 * 任何新加 CHECK 字面量的 migration 必须**同步本文件**，否则前端逻辑会落后于 DB。
 */

// ─────────────────────────────────────────────────────────────────────
// track.scope_level — 培养方案颗粒度
// ─────────────────────────────────────────────────────────────────────

export const TRACK_SCOPE_LEVELS = ["school", "college", "major"] as const;
export type TrackScopeLevel = (typeof TRACK_SCOPE_LEVELS)[number];

export const TRACK_SCOPE_META: Record<TrackScopeLevel, { label: string; desc: string }> = {
  school: {
    label: "全校通用",
    desc: "全校学生共用的规则（如思政、英语、体育）",
  },
  college: {
    label: "学院分流",
    desc: "按学院/培养类型差异化（如师范生、强基计划）",
  },
  major: {
    label: "专业培养",
    desc: "具体专业的培养方案（课程、学分、毕业要求）",
  },
};

// ─────────────────────────────────────────────────────────────────────
// track_requirement.kind — 12 档 (0002 修课语义 4 + 0006 学校规则语义 8)
// ─────────────────────────────────────────────────────────────────────

export const REQUIREMENT_KINDS = [
  // 0002 「修课要求」语义
  "count",
  "credits",
  "one_of",
  "all_of",
  // 0006 「学校规则」语义（canonical kind，详见 docs/track_kind_taxonomy.md）
  "time_limit",
  "gpa_threshold",
  "status_gate",
  "warning_threshold",
  "assessment_rule",
  "score_scheme",
  "tuition",
  "program_rule",
] as const;

export type RequirementKind = (typeof REQUIREMENT_KINDS)[number];

/** 修课要求语义子集（与 threshold 字段联用） */
export const COURSE_REQUIREMENT_KINDS = [
  "count",
  "credits",
  "one_of",
  "all_of",
] as const satisfies readonly RequirementKind[];

export type CourseRequirementKind = (typeof COURSE_REQUIREMENT_KINDS)[number];

/** 学校规则语义子集（与 metadata jsonb 联用） */
export const SCHOOL_REQUIREMENT_KINDS = [
  "time_limit",
  "gpa_threshold",
  "status_gate",
  "warning_threshold",
  "assessment_rule",
  "score_scheme",
  "tuition",
  "program_rule",
] as const satisfies readonly RequirementKind[];

export type SchoolRequirementKind = (typeof SCHOOL_REQUIREMENT_KINDS)[number];

export const REQUIREMENT_KIND_META: Record<
  RequirementKind,
  { label: string; group: "course" | "rule"; desc: string }
> = {
  count: { label: "选修门数", group: "course", desc: "从下属 option 至少修 N 门" },
  credits: { label: "累计学分", group: "course", desc: "累计学分 ≥ N" },
  one_of: { label: "必选 1 门", group: "course", desc: "从下属 option 必选 1 门" },
  all_of: { label: "全部必修", group: "course", desc: "下属 option 全部必修" },

  time_limit: { label: "时间限制", group: "rule", desc: "毕业 / 修业 / 选课 / 缓考等时间窗" },
  gpa_threshold: { label: "GPA 门槛", group: "rule", desc: "保研 / 奖学金 / 推免 GPA 阈值" },
  status_gate: { label: "状态门禁", group: "rule", desc: "降级 / 退学 / 转专业等状态条件" },
  warning_threshold: { label: "学业警示线", group: "rule", desc: "GPA / 学分 / 不及格门数预警" },
  assessment_rule: { label: "考核规则", group: "rule", desc: "考试形式 / 重修 / 缓考流程" },
  score_scheme: { label: "评分方案", group: "rule", desc: "GPA 公式 / A 等比例 / 成绩换算" },
  tuition: { label: "学费收费", group: "rule", desc: "学费标准 / 退费规则" },
  program_rule: { label: "计划专项", group: "rule", desc: "创新创业 / 学科竞赛 / 强基等专项计划" },
};

// ─────────────────────────────────────────────────────────────────────
// track_option.kind — 3 档
// ─────────────────────────────────────────────────────────────────────

export const OPTION_KINDS = ["course", "alt", "project"] as const;
export type OptionKind = (typeof OPTION_KINDS)[number];

export const OPTION_KIND_META: Record<OptionKind, { label: string; desc: string }> = {
  course: { label: "课程", desc: "标准课程（需 credits 字段）" },
  alt: { label: "替代", desc: "替代项（不计学分，引用其他 option）" },
  project: { label: "项目", desc: "项目 / 实习 / 论文（学分可空）" },
};

// ─────────────────────────────────────────────────────────────────────
// user_progress.status — 5 档
// ─────────────────────────────────────────────────────────────────────

export const USER_PROGRESS_STATUSES = ["planned", "enrolled", "done", "waived", "dropped"] as const;
export type UserProgressStatus = (typeof USER_PROGRESS_STATUSES)[number];

export const USER_PROGRESS_META: Record<
  UserProgressStatus,
  { label: string; tone: "neutral" | "good" | "warn" }
> = {
  planned: { label: "计划中", tone: "neutral" },
  enrolled: { label: "在修", tone: "neutral" },
  done: { label: "已完成", tone: "good" },
  waived: { label: "免修", tone: "good" },
  dropped: { label: "已退课", tone: "warn" },
};
