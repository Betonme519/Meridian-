/**
 * Mock AI provider —— 默认实现，不发任何网络请求。
 *
 * 用途：在接真 provider 之前给前端跑通"流式 UI + abort + state pipeline"。
 * 设计：
 *  - 不解析 prompt，直接从最后一条 user message 跑正则启发式（沿用原 AIAdvisor
 *    的 `recommendMode`），得出 mode + 模板化 rationale
 *  - 按字符 yield，模拟键入感（18ms/字）
 *  - 每个 yield 前查 signal.aborted —— 用户取消时优雅 return（不抛 AbortError）
 *
 * 接真 Anthropic provider 后，本文件保留 — 单元测试 / CI / 无 key 环境都能用。
 */

import type { Chat } from "../stream";
import type { GoalMode } from "@/api/profileApi";

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
    "最轻松毕业": "你似乎更在意把毕业要求压到最低，省下时间做别的事。",
    "保研路线": "保研对绩点 / 排名 / 科研经历都是硬要求，要按这条路安排课程。",
    "留学路线": "留学申请重视 GPA / 语言成绩 / 推荐信，要早做语言准备和科研衔接。",
    "实习优先": "把时间留给实习，意味着课程要选 workload 小、可灵活调时段的。",
    "时间自由": "你想给个人发展留空间，建议把硬课压在少数学期、其他学期轻装。",
    "低压力模式": "你提到了压力 / 健康 / 睡眠 —— 课程负荷要往低优先级走。",
    "个性化定制": "你的目标看起来是多个方向的组合，建议在权重面板做精细配比。",
  };

  // 从用户文本里抓 1-2 个关键词原话引用
  const keywordHits = [
    /保研/, /排名/, /科研/, /导师/,
    /留学/, /申请/, /推荐信/, /海外/, /GRE/i, /托福/, /雅思/,
    /实习/, /工作/, /面试/, /offer/i,
    /压力/, /焦虑/, /睡眠/, /轻松/, /健康/,
    /毕业/, /学分/, /第二课堂/, /劳动教育/,
    /自由/, /时间/, /兴趣/, /社团/, /生活/,
    /GPA/i, /绩点/, /workload/i,
  ];
  const quoted = keywordHits
    .map((re) => userText.match(re)?.[0])
    .filter((w): w is string => Boolean(w))
    .slice(0, 2);

  const cite = quoted.length
    ? `结合你提到的「${quoted.join("、")}」，`
    : "";

  return `${headline[mode]} ${cite}这个模式会优先匹配该方向的课程与规则。`;
}

export const mockChat: Chat = async function* ({ messages, signal }) {
  // 取最后一条 user message 当输入；没 user 就用空串走 fallback
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
    yield ch;
  }
};
