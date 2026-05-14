/**
 * Prompt 模板集合。
 *
 * 真 provider（接 Anthropic 后）按这些模板组 messages；mock 不读 prompt，走启发式
 * 规则。模板返回 `Message[]`，调用方直接喂 `chat({ messages, signal })`。
 *
 * 一个 prompt = 一个 use case，独立函数；不在这里搞 prompt 链。
 *
 * 公共 API：
 *  - recommendModePrompt(userText)  —— 根据用户自描述推荐 goal_mode
 */

import type { Message } from "./stream";

/**
 * 根据用户的中文自描述，推荐最匹配的 goal_mode。
 *
 * 期望输出格式（mock 也遵守，方便 page 用同一份正则解析）：
 *
 *   推荐：<mode>
 *
 *   理由：<2-3 句话，引用用户原话里的关键词>
 *
 * 不要输出任何其他内容。
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

理由：<2-3 句话，引用用户原话里的关键词解释为什么选这个 mode>`;
