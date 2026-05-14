/**
 * Anthropic provider stub —— 接口位占好，等 TD-1 推进时实现。
 *
 * 切到本 provider 的方式：`.env.local` 设 `VITE_AI_PROVIDER=anthropic`。
 * 当前调用直接抛错，提示开发者切回 mock。
 *
 * 接真 Anthropic 时要做的：
 *  1. API key 走 Edge Function / Cloudflare Worker —— **不能**放 VITE_*（公开 bundle）
 *  2. 用 SSE / fetch streaming 读 `messages` endpoint 的 `content_block_delta` 事件
 *  3. 把 SSE 事件归一成 Token（string 增量）yield 出去
 *  4. signal.aborted 时 abort fetch
 *  5. 错误归一成 Error 抛出（让 UI catch 走通用 fail 路径）
 */

import type { Chat } from "../stream";

export const anthropicChat: Chat = async function* () {
  throw new Error(
    "Anthropic provider 未实现。当前请用 VITE_AI_PROVIDER=mock；接真 Anthropic 见 TECH_DEBT TD-1。",
  );
  // 不可达，仅让 TS 推断出 AsyncGenerator 返回类型
  // eslint-disable-next-line no-unreachable
  yield "";
};
