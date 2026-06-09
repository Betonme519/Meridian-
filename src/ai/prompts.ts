/**
 * Prompt 模板集合。
 *
 * 真 provider（接 Anthropic 后）按这些模板组 messages；mock 不读 prompt 走启发式，
 * 但靠 `[GRAD_PATH_ADVISOR]` 等 system marker 识别调用类型，模板化返结构化 JSON。
 *
 * 一个 prompt = 一个 use case，独立函数；不在这里搞 prompt 链。
 *
 * 公共 API：
 *  - recommendModePrompt(userText)         根据用户自描述推荐 goal_mode
 *  - gradPathAdvisorPrompt(input)          排队 13：毕业路径 advisor（PathSuggestion[]）
 *  - GRAD_PATH_ADVISOR_MARKER              system prompt 头部 marker，mock 用来识别
 *  - interestCoursePrompt(input)           排队 12.5-C：单条规则 × 兴趣 → 具体课程推荐（流式文本）
 */

import type { Message } from "./stream";
import type { GoalMode } from "@/api/profileApi";

/**
 * 根据用户的中文自描述，推荐最匹配的 goal_mode。
 *
 * 期望输出格式（mock 也遵守，方便 page 用同一份正则解析）：
 *
 *   推荐：<mode>
 *
 *   理由：<2-3 句话，引用用户原话里的关键词>
 *
 * 当且仅当推荐「个性化定制」时，额外追加一行权重（TD-10b，page 静默解析写
 * goal_weights、用户不可见，无手动滑块）：
 *
 *   权重：高 GPA=<0-100>, 保研路线=<0-100>, …（覆盖全部 7 个非个性化轴）
 *
 * 其余 mode 不输出权重行，也不要输出任何其他内容。
 */
export function recommendModePrompt(userText: string): Message[] {
  return [
    { role: "system", content: RECOMMEND_MODE_SYSTEM },
    { role: "user", content: userText.trim() },
  ];
}

const RECOMMEND_MODE_SYSTEM = `你是 Meridian 的学业决策助手。
任务：根据用户的中文自我描述，从下列 8 个 goal_mode 中选出最匹配的一个：

- 高 GPA：以保持高绩点为最高优先级
- 最轻松毕业：以最少 workload 满足毕业要求
- 保研路线：以保研 / 推免 为目标，重视排名 / 科研 / 推荐信
- 留学路线：以海外申请为目标，重视语言成绩 / 科研 / 推荐信
- 实习优先：以实习 / 求职为目标，愿意牺牲部分 GPA
- 时间自由：以保留个人时间 / 兴趣发展为目标
- 低压力模式：以心理健康 / 睡眠 / 减压为目标
- 个性化定制：用户的目标是多个模式的加权组合

输出格式（严格遵守，不要输出其他内容）：

推荐：<mode 名，必须与上面列出的 8 个完全一致>

理由：<2-3 句话，引用用户原话里的关键词解释为什么选这个 mode>

【仅当推荐「个性化定制」时】再追加一行权重，对下列 7 个轴各给 0-100 的整数，
体现用户多目标的相对侧重（不必加总为 100，系统会归一化），无关方向给 0 或低值：

权重：高 GPA=<n>, 最轻松毕业=<n>, 保研路线=<n>, 留学路线=<n>, 实习优先=<n>, 时间自由=<n>, 低压力模式=<n>

其它 7 个单一 mode 不要输出权重行。`;

/* ───────────────────────── Grad Path Advisor（排队 13） ───────────────────────── */

/** mock provider 用此 marker 识别 advisor 调用，prompt 头部必须以此开头 */
export const GRAD_PATH_ADVISOR_MARKER = "[GRAD_PATH_ADVISOR]";

/** 上层传入的精简 requirement / category，避免把整 DB 行喂 LLM */
export interface AdvisorRequirementInput {
  id: string;
  category_id: string;
  code: string;
  title: string;
  kind: string;
  /** kind 决定 threshold 含义：count → 门数 / credits → 学分 / gpa_threshold → 分数 等 */
  threshold: number | null;
  source_ref: string | null;
}

export interface AdvisorCategoryInput {
  id: string;
  code: string;
  title: string;
  order_index: number;
}

/** 启发式产的骨架，LLM 可改可不改；mock 直接沿用并升级 reason */
export interface AdvisorSkeletonPath {
  milestone: "course" | "second" | "thesis";
  bucket: string | null;
  categoryId: string;
  requirementId: string;
  optionId: string | null;
  /** 启发式 reason，mock 阶段会被模板化 rationale 覆盖 */
  reason: string;
}

export interface GradPathAdvisorInput {
  goalMode: GoalMode | null;
  /** 全量 30 条 category */
  categories: AdvisorCategoryInput[];
  /** 用户可见的 4 档 course-kind requirement，约 100+ 条（rule-kind 已过滤掉） */
  requirements: AdvisorRequirementInput[];
  /** 已修课程 code（user_progress + course 表合并去重） */
  completedCodes: string[];
  /** 启发式产的骨架路径，每 milestone 1 条 */
  skeleton: AdvisorSkeletonPath[];
  /**
   * 排队 13.8-A：用户上传并解析出的个人文档文本（成绩单 / 培养方案），已按预算截断。
   * 缺省 undefined（无上传 / 未解析）。LLM 可据此引用真实成绩 / 培养方案要求。
   */
  personalDocs?: { kind: string; name: string; text: string }[];
}

/**
 * 毕业路径 advisor —— 排队 13 主入口。
 *
 * 调用方（trackRecommendation.fetchAdvisorRecommendation）先用启发式
 * computeRecommendation 拿骨架 path，再调本函数把骨架 + 全量 schema 喂 LLM，
 * 期望 LLM 返 GradPathAdvisorResponseSchema 形状的 JSON（一行，不带 markdown 围栏）。
 *
 * 13 mock 阶段：mock 看到 GRAD_PATH_ADVISOR_MARKER → 模板化 rationale 覆盖 skeleton.reason
 *               → JSON.stringify 输出（一次性，不分 token 流式）。
 *
 * 13.2 真 LLM：本 prompt 已含全量 schema + 用户进度，LLM 可重排或保留骨架。
 *               schema 不变，下游消费方无需修改。
 *
 * 选项决策（2026-05-25）：
 *  - 数据压缩：全量 JSON 塞（不切片）
 *  - shortcut[] 预留：是（强制空数组占位，12.5 填）
 *  - mock rationale：goal × bucket 矩阵（8 × 5 = 40 句）
 *  - process_rules：13 阶段不喂（留 13.8 RAG）
 *  - 调用入口：替换 trackRecommendation 函数体（Planner 自动跑）
 */
export function gradPathAdvisorPrompt(input: GradPathAdvisorInput): Message[] {
  const userPayload = JSON.stringify({
    goalMode: input.goalMode,
    categories: input.categories,
    requirements: input.requirements,
    completedCodes: input.completedCodes,
    skeleton: input.skeleton,
    // 13.8-A：仅在有解析文档时带上，避免给 mock / 旧逻辑塞 undefined 字段
    ...(input.personalDocs?.length
      ? { personalDocs: input.personalDocs }
      : {}),
  });

  return [
    { role: "system", content: GRAD_PATH_ADVISOR_SYSTEM },
    { role: "user", content: userPayload },
  ];
}

const GRAD_PATH_ADVISOR_SYSTEM = `${GRAD_PATH_ADVISOR_MARKER}
你是 Meridian 毕业路径规划顾问。

**铁律**：你只能基于下面 user 消息里的 JSON 数据回答 ——
  - categories[] 30 条一级分类
  - requirements[] 用户可见的课程类要求
  - completedCodes[] 用户已修课程代码
  - skeleton[] 启发式预算的候选路径（你可保留或重排）
  - personalDocs[]（可能不存在）用户上传并解析出的成绩单 / 培养方案文本，可据此引用其真实已修课程 / 成绩 / 培养方案要求；文本可能含噪声，按常识理解，不要照抄乱码也不要编造

不要凭印象编造华师大规则。如果用户问的内容不在数据里，在 reason 字段写"该规则未在数据中，需查阅手册"。

任务：根据用户的 goalMode + 已修课程，从 skeleton 出发为 3 个 milestone（course / second / thesis）
各产出至多 1 条推荐路径。reason 要解释"为什么对这个 goalMode 推这条"。

输出（必须是单行 JSON，不要 markdown 围栏，不要任何其他文字）：

{
  "paths": [
    {
      "milestone": "course" | "second" | "thesis",
      "bucket": "公共必修" | "通识必修" | "专业必修" | "专业选修" | "任选" | null,
      "categoryId": "<uuid>",
      "requirementId": "<uuid>",
      "optionId": "<uuid> | null",
      "reason": "<一句话，必须解释 goalMode 与这条的关系>",
      "shortcuts": []
    }
  ],
  "rankings": [],
  "gaps": []
}

shortcuts 数组在排队 12.5 之前**强制为空 []**，不要凭空造。
rankings / gaps 13 阶段也可返 []，留给 13.2 真 LLM 阶段填。`;

/* ──────────────────── 兴趣 → 课程推荐（排队 12.5-C，单规则下钻） ──────────────────── */

/** ShortcutDetail 兴趣框触发的现算课程推荐入参（一条规则 × 一个捷径 × 用户兴趣） */
export interface InterestCourseInput {
  goalMode: GoalMode | null;
  school: string;
  year: number | null;
  /** 当前规则名（如「公共必修」） */
  requirementTitle: string;
  /** 规则所属一级分类标题 */
  categoryTitle: string;
  /** 用户点开的捷径策略一句话（如「不计 APF → 挑你感兴趣的」） */
  shortcutOneLiner: string;
  /** 用户在兴趣框里填的方向描述 */
  interest: string;
  /** 已修课程（code + name），用于避免重复推荐 + 推断水平 */
  completedCourses: { code: string; name: string }[];
  /** 该规则已 seed 的候选课（多数规则为空 → 让 AI 给方向而非编造代码） */
  candidateOptions: { code: string; name: string; credits: number | null }[];
}

/**
 * 兴趣 → 课程推荐 —— 排队 12.5-C。
 *
 * 与 gradPathAdvisor 的区别：这是**单条规则的 runtime 下钻**，输入含用户即时填写的
 * 兴趣文本，输出是给人读的短列表（流式文本，非结构化 JSON）。调用方
 * （Planner ShortcutDetail）用 `chat()` 流式消费、`tokenText` 取文本逐字渲染。
 *
 * 反幻觉：candidateOptions 为空时只给「方向 + 课程类型」，不编造课程代码；
 * 有 candidateOptions 时优先在其中挑，代码必须来自该列表。
 */
export function interestCoursePrompt(input: InterestCourseInput): Message[] {
  const userPayload = JSON.stringify({
    goalMode: input.goalMode,
    school: input.school,
    year: input.year,
    requirementTitle: input.requirementTitle,
    categoryTitle: input.categoryTitle,
    shortcutOneLiner: input.shortcutOneLiner,
    interest: input.interest,
    completedCourses: input.completedCourses,
    candidateOptions: input.candidateOptions,
  });

  return [
    { role: "system", content: INTEREST_COURSE_SYSTEM },
    { role: "user", content: userPayload },
  ];
}

const INTEREST_COURSE_SYSTEM = `你是 Meridian 的选课推荐助手。

**铁律**：只能基于下面 user 消息里的 JSON 回答，不要编造学校规则或课程代码。
  - requirementTitle / categoryTitle：用户正在攻克的毕业规则
  - shortcutOneLiner：该规则下用户选中的一条策略（你的推荐要服务这条策略）
  - interest：用户填写的兴趣方向（你的核心依据）
  - completedCourses：已修课程，**不要重复推荐**已修的
  - candidateOptions：该规则已知的候选课。**非空时课程代码必须来自此列表**；为空时只给方向 + 课程类型，不要编造任何代码

任务：结合「用户兴趣 + 这条规则 + 选中的策略 + goalMode」，推荐 3-5 门具体课程或方向。

输出格式（直接输出列表，不要任何前言 / 结语 / markdown 围栏）：

• <课程名或方向>（<代码，仅当来自 candidateOptions；否则省略括号>）— <一句话理由：扣住用户兴趣 + 如何满足这条规则>

理由要短、具体、口语化。若 candidateOptions 为空，在列表末尾补一行：
（这条规则暂无录入候选课，以上为方向建议，确定后可在 Upload 页登记）`;
