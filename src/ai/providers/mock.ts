/**
 * Mock AI provider —— 默认实现，不发任何网络请求。
 *
 * 用途：在接真 provider 之前给前端跑通"流式 UI + abort + state pipeline"。
 * 设计：
 *  - 默认路径：从最后一条 user message 跑正则启发式（recommendMode），得 mode + rationale
 *  - 排队 13 路径：识别 GRAD_PATH_ADVISOR_MARKER → 解析 user JSON → 8×5 矩阵生成 rationale
 *    → 输出 GradPathAdvisorResponse JSON 字符串（一次性，不按字符流）
 *  - 按字符 yield，模拟键入感（18ms/字）；advisor JSON 也走字符流便于上层 collect()
 *  - 每个 yield 前查 signal.aborted —— 用户取消时优雅 return（不抛 AbortError）
 *
 * 接真 Anthropic provider 后，本文件保留 — 单元测试 / CI / 无 key 环境都能用。
 */

import type { Chat } from "../stream";
import type { GoalMode } from "@/api/profileApi";
import { GRAD_PATH_ADVISOR_MARKER, type GradPathAdvisorInput, type AdvisorSkeletonPath } from "../prompts";

const TOKEN_DELAY_MS = 18;

/**
 * 启发式：把用户中文描述映射到 8 个 mode 之一。
 *
 * 顺序敏感：先扫高优先级关键词（保研 / 留学 / 实习），再扫情绪 / 时间 / 毕业，
 * 没命中就回落到「高 GPA」。
 *
 * 关键词集合从原 AIAdvisor `recommendMode` 函数迁移过来，保持行为一致。
 */
function recommendMode(text: string): GoalMode {
  const c = text.toLowerCase();
  if (/保研|排名|科研|导师/.test(c)) return "保研路线";
  if (/留学|申请|推荐信|海外|gre|托福|雅思/.test(c)) return "留学路线";
  if (/实习|工作|上班|面试|offer/.test(c)) return "实习优先";
  if (/压力|焦虑|睡眠|轻松|健康/.test(c)) return "低压力模式";
  if (/毕业|requirement|学分|第二课堂|劳动教育/.test(c)) return "最轻松毕业";
  if (/自由|时间|兴趣|社团|生活/.test(c)) return "时间自由";
  return "高 GPA";
}

/**
 * 给推荐 mode 配 2 句话理由。模板化拼装：
 *   - 第一句解释为啥这个 mode 匹配（mode 决定）
 *   - 第二句引用一两个用户原话里的关键词（动态从 userText 抓）
 */
function rationaleFor(mode: GoalMode, userText: string): string {
  const headline: Record<GoalMode, string> = {
    "高 GPA": "你的描述里没有明显的方向偏好，保持 GPA 通常是最稳的中间路径。",
    最轻松毕业: "你似乎更在意把毕业要求压到最低，省下时间做别的事。",
    保研路线: "保研对绩点 / 排名 / 科研经历都是硬要求，要按这条路安排课程。",
    留学路线: "留学申请重视 GPA / 语言成绩 / 推荐信，要早做语言准备和科研衔接。",
    实习优先: "把时间留给实习，意味着课程要选 workload 小、可灵活调时段的。",
    时间自由: "你想给个人发展留空间，建议把硬课压在少数学期、其他学期轻装。",
    低压力模式: "你提到了压力 / 健康 / 睡眠 —— 课程负荷要往低优先级走。",
    个性化定制: "你的目标看起来是多个方向的组合，建议在权重面板做精细配比。",
  };

  // 从用户文本里抓 1-2 个关键词原话引用
  const keywordHits = [
    /保研/,
    /排名/,
    /科研/,
    /导师/,
    /留学/,
    /申请/,
    /推荐信/,
    /海外/,
    /GRE/i,
    /托福/,
    /雅思/,
    /实习/,
    /工作/,
    /面试/,
    /offer/i,
    /压力/,
    /焦虑/,
    /睡眠/,
    /轻松/,
    /健康/,
    /毕业/,
    /学分/,
    /第二课堂/,
    /劳动教育/,
    /自由/,
    /时间/,
    /兴趣/,
    /社团/,
    /生活/,
    /GPA/i,
    /绩点/,
    /workload/i,
  ];
  const quoted = keywordHits
    .map((re) => userText.match(re)?.[0])
    .filter((w): w is string => Boolean(w))
    .slice(0, 2);

  const cite = quoted.length ? `结合你提到的「${quoted.join("、")}」，` : "";

  return `${headline[mode]} ${cite}这个模式会优先匹配该方向的课程与规则。`;
}

/* ───────────────────────── Grad Path Advisor 模板化 rationale（排队 13） ───────────────────────── */

/**
 * 8 goal × 5 bucket = 40 句 rationale 矩阵。
 * milestone=course 时按 bucket 取；milestone=second / thesis 时走单独矩阵（见下）。
 */
const ADVISOR_BUCKET_RATIONALE: Record<GoalMode, Record<string, string>> = {
  "高 GPA": {
    公共必修: "公共必修虽不进主力均分但失分拉低排名，挑评分宽松的组合先扫清",
    通识必修: "通识是 GPA 加分位，选你擅长的领域稳拿 4.0",
    专业必修: "专业必修是 GPA 主战场，一门 90+ 抵得过三门通识",
    专业选修: "按拿分难度选，避开冷门硬课，保住主战场分数",
    任选: "任选填学分缺口，选 workload 小且评分宽松的",
  },
  最轻松毕业: {
    公共必修: "公必先扫清，避免大四补考压力",
    通识必修: "通识按学分最低组合选，不追求加分",
    专业必修: "专必无可绕，按培养方案学期分布跟读",
    专业选修: "选修挑学分高且要求宽松的，单门省两门工作量",
    任选: "任选直接挑你已经在听的 / 朋友推荐的高通过课",
  },
  保研路线: {
    公共必修: "公必失分会拉低综合排名，挑 GPA 友好的小心选",
    通识必修: "通识是 GPA 弹性区，选擅长领域稳分",
    专业必修: "专必排名命脉，全部冲 90+，导师筛简历看这里",
    专业选修: "专选与目标导师方向对齐，铺路科研课题",
    任选: "任选省学分给科研留时间，选低投入高分课",
  },
  留学路线: {
    公共必修: "英语类公必直接关联语言成绩，优先冲高分",
    通识必修: "通识保 GPA 基本盘，海外算分按均分",
    专业必修: "专必 GPA 是申请硬门槛，按 3.7+ 目标走",
    专业选修: "专选选英文授课 / 涉外方向，与目标项目契合",
    任选: "任选省时间准备语言考试和文书",
  },
  实习优先: {
    公共必修: "公必塞已有专业课时段的那天，单日满课让其他天空出实习",
    通识必修: "通识选可调时段或线上的，避开实习黄金时段",
    专业必修: "专必无可绕，但优先选给分宽松的班次",
    专业选修: "专选挑与目标岗位技能栈对齐的（项目类、技术栈匹配）",
    任选: "任选拖到大四下学期，给实习留连续档期",
  },
  时间自由: {
    公共必修: "公必集中在一两个学期一次冲完，给其他学期留空白",
    通识必修: "通识按兴趣选，不追求 GPA 也不卷",
    专业必修: "专必按部就班，不提前不滞后",
    专业选修: "选修挑你真感兴趣的方向，质量优于学分",
    任选: "任选随兴趣，刻意保留探索带宽",
  },
  低压力模式: {
    公共必修: "公必按最低门槛通过即可，不冲 GPA",
    通识必修: "通识选熟悉领域 / 评分宽松的，减少认知负担",
    专业必修: "专必无可绕，但选给分宽松的班次降低重修风险",
    专业选修: "选修限制每学期 ≤ 2 门，分散到多学期",
    任选: "任选挑同班同学一起上的，互相支撑减压",
  },
  个性化定制: {
    公共必修: "按你的 goal_weights 综合权衡，公必基础学分别落下",
    通识必修: "通识按权重组合选，兼顾兴趣 / GPA / workload",
    专业必修: "专必是底线，按培养方案不打折扣",
    专业选修: "选修按你的多维目标组合，质量与数量平衡",
    任选: "任选填权重缺口，灵活补齐",
  },
};

/** milestone=second / thesis 时按 goal 单独取（不分 bucket） */
const ADVISOR_MILESTONE_RATIONALE: Record<GoalMode, Record<"second" | "thesis", string>> = {
  "高 GPA": {
    second: "用一两次高质量项目覆盖第二课堂，不分散主力 GPA 精力",
    thesis: "毕业论文按部就班，选稳妥题目不冒险",
  },
  最轻松毕业: {
    second: "二课堂按最低学分凑齐，一次大型活动顶多次小活动",
    thesis: "论文选导师有积累的方向，复用现有素材",
  },
  保研路线: {
    second: "二课堂与科研项目合并：一次发表 = 双覆盖",
    thesis: "论文与意向导师方向对齐，可直接转研究生课题",
  },
  留学路线: {
    second: "二课堂凑国际交流 / 暑校 / 学术竞赛，CV 上写得出",
    thesis: "论文做你能写进 SOP 的真课题，质量优先",
  },
  实习优先: {
    second: "实习本身可申报二课堂学分，先去再补流程",
    thesis: "论文与实习 / 工作经验联动，省素材采集时间",
  },
  时间自由: {
    second: "二课堂选你真喜欢的活动，不为学分硬凑",
    thesis: "论文按部就班，留时间给个人探索",
  },
  低压力模式: {
    second: "二课堂选低强度活动，志愿 / 校园活动门槛低",
    thesis: "论文选你能稳定推进的题目，避免拖延复发",
  },
  个性化定制: {
    second: "按 goal_weights 组合二课堂活动类型",
    thesis: "论文方向按权重多维匹配（学术 + 兴趣 + 就业）",
  },
};

const ADVISOR_FALLBACK_REASON: Record<GoalMode, string> = {
  "高 GPA": "推荐这条以保持 GPA 主战场不失分",
  最轻松毕业: "推荐这条以快速凑齐毕业学分",
  保研路线: "推荐这条以巩固保研排名 / 科研履历",
  留学路线: "推荐这条以衔接留学申请材料",
  实习优先: "推荐这条以释放实习连续档期",
  时间自由: "推荐这条以保留个人探索带宽",
  低压力模式: "推荐这条以降低学业认知负担",
  个性化定制: "推荐这条以匹配多维目标加权",
};

/**
 * 按 skeleton + goalMode 拼模板化 rationale。
 * - milestone=course：按 bucket 取 ADVISOR_BUCKET_RATIONALE
 * - milestone=second/thesis：取 ADVISOR_MILESTONE_RATIONALE
 * - 任何缺位回退 ADVISOR_FALLBACK_REASON
 */
function buildAdvisorReason(skeleton: AdvisorSkeletonPath, goalMode: GoalMode | null): string {
  const g = goalMode ?? "高 GPA";
  if (skeleton.milestone === "course" && skeleton.bucket) {
    const fromBucket = ADVISOR_BUCKET_RATIONALE[g]?.[skeleton.bucket];
    if (fromBucket) return fromBucket;
  }
  if (skeleton.milestone === "second" || skeleton.milestone === "thesis") {
    const fromMs = ADVISOR_MILESTONE_RATIONALE[g]?.[skeleton.milestone];
    if (fromMs) return fromMs;
  }
  return ADVISOR_FALLBACK_REASON[g];
}

/**
 * 收到 GRAD_PATH_ADVISOR_MARKER → 解析 user JSON → 拼 GradPathAdvisorResponse JSON 字符串。
 * 解析失败 fallback 返 `{"paths":[],"rankings":[],"gaps":[]}` 让上层 zod.parse 通过。
 */
function buildAdvisorResponse(userJson: string): string {
  let parsed: GradPathAdvisorInput | null = null;
  try {
    parsed = JSON.parse(userJson) as GradPathAdvisorInput;
  } catch {
    return JSON.stringify({ paths: [], rankings: [], gaps: [] });
  }
  if (!parsed || !Array.isArray(parsed.skeleton)) {
    return JSON.stringify({ paths: [], rankings: [], gaps: [] });
  }
  const paths = parsed.skeleton.map((sk) => ({
    milestone: sk.milestone,
    bucket: sk.bucket,
    categoryId: sk.categoryId,
    requirementId: sk.requirementId,
    optionId: sk.optionId,
    reason: buildAdvisorReason(sk, parsed!.goalMode),
    shortcuts: [],
  }));
  return JSON.stringify({ paths, rankings: [], gaps: [] });
}

export const mockChat: Chat = async function* ({ messages, signal }) {
  // 排队 13 advisor 分支：system 消息以 GRAD_PATH_ADVISOR_MARKER 开头
  const sys = messages.find((m) => m.role === "system");
  if (sys && sys.content.startsWith(GRAD_PATH_ADVISOR_MARKER)) {
    const userMsg = messages.find((m) => m.role === "user");
    const reply = buildAdvisorResponse(userMsg?.content ?? "");
    // advisor JSON 一次性输出，不按字符流（上层 collect 一次 await 即可）
    if (signal?.aborted) return;
    yield { type: "text", value: reply };
    return;
  }

  // 默认 recommendMode 分支：取最后一条 user message 当输入
  let userText = "";
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      userText = messages[i].content;
      break;
    }
  }

  const mode = recommendMode(userText);
  const reply = `推荐：${mode}\n\n理由：${rationaleFor(mode, userText)}`;

  for (const ch of reply) {
    if (signal?.aborted) return;
    await new Promise<void>((resolve) => setTimeout(resolve, TOKEN_DELAY_MS));
    // Token 是 discriminated union（见 stream.ts AI2 修复），yield 必须包成 TextDelta
    yield { type: "text", value: ch };
  }
};
