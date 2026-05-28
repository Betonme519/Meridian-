/**
 * AI 抽象层总入口 —— 调用方只 import 这里，**不要**直接 import `providers/*`。
 *
 * Provider 选择：`VITE_AI_PROVIDER` 环境变量。
 *
 * | 值          | provider 文件                  | 用途                                                  |
 * | ----------- | ------------------------------ | ----------------------------------------------------- |
 * | `mock`      | providers/mock.ts              | 默认。本地无 key 跑通流式 UI / 单测 / CI               |
 * | `remote`    | providers/remote.ts            | 走本地 server-side proxy `/api/ai/chat`；上游 LLM     |
 * |             |                                | (Anthropic / Qwen / Zhipu / DeepSeek) 由 server 决定  |
 * | `anthropic` | providers/anthropic.ts (弃用) | 历史路径，直接抛错提示改用 remote                      |
 *
 * 2026-05-17 决策：用户后期 LLM 可能接 Qwen / Zhipu / DeepSeek / Anthropic
 * 任一家。前端**不直接面向具体 LLM**，统一走 remote provider。
 *
 * 公共 API：
 *  - chat                  默认 Chat 实现（按 env 选 provider）
 *  - tokenText(tok)        从 Token discriminated union 取文本
 *  - Token / Message / ... 类型，re-export 自 stream.ts
 *  - schema / prompts      re-export
 */

import { mockChat } from "./providers/mock";
import { remoteChat } from "./providers/remote";
import { anthropicChat } from "./providers/anthropic";
import type { Chat } from "./stream";

const PROVIDER = (import.meta.env.VITE_AI_PROVIDER as string | undefined) ?? "mock";

function resolveChat(name: string): Chat {
  switch (name) {
    case "remote":
      return remoteChat;
    case "anthropic":
      return anthropicChat; // 已弃用，调用即抛错
    case "mock":
    default:
      return mockChat;
  }
}

/** 默认 chat —— 根据 VITE_AI_PROVIDER 选 provider */
export const chat: Chat = resolveChat(PROVIDER);

export type { Chat, ChatOptions, Message, Role, Token, TextDelta } from "./stream";
export { collect, tokenText } from "./stream";

export * from "./schema";
export * from "./prompts";
