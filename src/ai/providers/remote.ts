/**
 * Remote provider —— 通过本地 server-side proxy 调上游 LLM。
 *
 * 设计目标：让前端**只面向一个 endpoint**（`/api/ai/chat`），不直接面向任何
 * 具体 LLM 厂商。上游 LLM 是 Anthropic / Qwen / Zhipu / DeepSeek 哪一家
 * 由 server 端 env 决定（`AI_UPSTREAM=anthropic|qwen|zhipu|deepseek`），
 * 切换上游不动前端代码。
 *
 * 2026-05-17 现状：
 *  - 本文件是骨架，调用即抛 501（server route 也是 501 占位）
 *  - 切到真上游需要做：
 *     1. 在 server route `src/routes/api/ai/chat.ts` 实现真正的 proxy 逻辑
 *     2. 用 wrangler secret 注入对应上游的 API key（**不**走 VITE_*）
 *     3. SSE 解析归一到 Token discriminated union（见 stream.ts）
 *  - 不真接 Anthropic 之外的厂商时，本文件**形态不变**（contract 锁定）
 *
 * 协议（前后端约定）：
 *   POST /api/ai/chat
 *   Content-Type: application/json
 *   Body: { messages: Message[], stream: true }
 *   Response: text/event-stream，每行 `data: <JSON Token>\n\n`
 *     - Token 是 stream.ts 定义的 TextDelta（未来扩 union）
 *     - 最后一行 `data: [DONE]\n\n` 表示完结
 *     - error 时 server 返 4xx/5xx + JSON `{ error: { message: string } }`
 */

import type { Chat, Token } from "../stream";

// 2026-05-28: 路径从 `/api/ai.chat` 改为 `/api/ai/chat`（TanStack Router 文件路由
// 对 `.` 解释为分段符；改用 `/` 与目录式 server route `src/routes/api/ai/chat.ts` 对齐）。
const ENDPOINT = "/api/ai/chat";

export const remoteChat: Chat = async function* ({ messages, signal }) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/event-stream" },
    body: JSON.stringify({ messages, stream: true }),
    signal,
  });

  if (!res.ok) {
    // 4xx/5xx：尝试解析 JSON 错误体，失败就用 statusText
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = (await res.json()) as { error?: { message?: string } };
      if (data?.error?.message) msg = data.error.message;
    } catch {
      /* ignore — 用上面的 statusText */
    }
    throw new Error(`AI 调用失败：${msg}`);
  }

  if (!res.body) {
    throw new Error("AI 调用返回为空，请检查 server route 是否正常。");
  }

  // SSE 解析：按行读，data: ... 段反序列化成 Token
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) return;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE 事件以 \n\n 分隔
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        const event = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        for (const line of event.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") return;
          try {
            const tok = JSON.parse(payload) as Token;
            yield tok;
          } catch {
            // 上游送来无法解析的行，吞掉避免炸链路；console 留个痕
            if (typeof console !== "undefined") {
              console.warn("[remoteChat] 无法解析 SSE 行:", payload);
            }
          }
        }
      }
    }
  } finally {
    // 释放 reader（避免 stream 泄漏）
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
};
