/**
 * Anthropic provider stub —— **不推荐使用，请用 providers/remote.ts 替代**。
 *
 * 2026-05-17 决策（用户拍板）：后期 LLM provider 不一定是 Anthropic，
 * 可能接 Qwen / Zhipu / DeepSeek / Anthropic 任意一家。
 * 因此前端**不直接面向具体 LLM**，统一通过 `providers/remote.ts` 走本地
 * server-side proxy（`/api/ai/chat`），由 server 端根据 env 路由到上游。
 *
 * 本文件保留：
 *  - 历史路径：旧代码 `VITE_AI_PROVIDER=anthropic` 仍可解析（提前抛错而非 404）
 *  - 文档锚点：留着 SSE 事件归一规则的注释，便于真接入时参考
 *
 * 切到本 provider 的方式：`.env.local` 设 `VITE_AI_PROVIDER=anthropic`。
 * 当前调用直接抛错，提示开发者改用 remote。
 *
 * 如果将来必须前端直连（绕过 BFF），要做的：
 *  1. API key 走 Edge Function / Cloudflare Worker —— **不能**放 VITE_*（公开 bundle）
 *  2. 用 SSE / fetch streaming 读 `messages` endpoint 的 `content_block_delta` 事件
 *  3. 把 SSE 事件归一成 Token（TextDelta union 成员）yield 出去
 *  4. signal.aborted 时 abort fetch
 *  5. 错误归一成 Error 抛出（让 UI catch 走通用 fail 路径）
 */

import type { Chat } from "../stream";

export const anthropicChat: Chat = async function* () {
  throw new Error(
    "Anthropic 直连 provider 已弃用。请用 VITE_AI_PROVIDER=mock（本地）或 =remote（接 BFF）;详见 src/ai/providers/remote.ts。",
  );
  // 不可达，仅让 TS 推断出 AsyncGenerator 返回类型（Token 是 union，yield TextDelta 占位）
  yield { type: "text", value: "" };
};
