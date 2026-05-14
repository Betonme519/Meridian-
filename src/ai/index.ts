/**
 * AI 抽象层总入口 —— 调用方只 import 这里，**不要**直接 import `providers/*`。
 *
 * Provider 选择：`VITE_AI_PROVIDER` 环境变量（默认 mock）。
 *   - mock：默认，本地无 key 也能跑通流式 UI（src/ai/providers/mock.ts）
 *   - anthropic：stub，调用即抛错（src/ai/providers/anthropic.ts）；
 *     接真 provider 后切过去
 *
 * 公共 API：
 *  - chat                  默认 Chat 实现（按 env 选 provider）
 *  - Token / Message / ... 类型，re-export 自 stream.ts
 *  - schema / prompts      re-export
 */

import { mockChat } from "./providers/mock";
import { anthropicChat } from "./providers/anthropic";
import type { Chat } from "./stream";

const PROVIDER =
  (import.meta.env.VITE_AI_PROVIDER as string | undefined) ?? "mock";

/** 默认 chat —— 根据 VITE_AI_PROVIDER 选 mock / anthropic */
export const chat: Chat = PROVIDER === "anthropic" ? anthropicChat : mockChat;

export type {
  Chat,
  ChatOptions,
  Message,
  Role,
  Token,
} from "./stream";
export { collect } from "./stream";

export * from "./schema";
export * from "./prompts";
