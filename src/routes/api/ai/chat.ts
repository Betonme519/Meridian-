/**
 * Server route stub —— `POST /api/ai/chat`
 *
 * Phase 1 占位实现：不接真上游，返回固定的 mock SSE 流（10 个 text token + [DONE]），
 * 用来验证前后端契约链路打通。
 *
 * 真接入流程见 docs/AI_PROXY_SPEC.md §Step 1-5（Phase 2 时执行）。
 *
 * 协议（与 src/ai/providers/remote.ts 对齐）：
 *   Request:  POST application/json   body: { messages: Message[], stream: true }
 *   Response: 200 text/event-stream   body: `data: <JSON Token>\n\n` × N + `data: [DONE]\n\n`
 *   Token:    { type: "text", value: string }   见 src/ai/stream.ts
 *
 * ⚠️ 鉴权：本 stub 不校验用户 session。Phase 2 接真 LLM 时**必须**加 Supabase JWT 校验
 *    （见 AI_PROXY_SPEC.md §鉴权）。
 *
 * ⚠️ TanStack Start server route 签名可能随版本漂移。1.167 文档形态：
 *    `createFileRoute('/path')({ server: { handlers: { POST: ... } } })`
 *    若 `bun dev` 报签名不符，按运行时报错对齐即可——本文件实现逻辑（mock SSE）不变。
 */

import { createFileRoute } from "@tanstack/react-router";

/** mock 流的 token 文本（10 段） */
const MOCK_TOKENS = [
  "已收到",
  "你的",
  "请求",
  "。",
  "当前",
  "是",
  "Phase 1",
  " mock ",
  "stub",
  "。",
];

/** 编码 SSE 一行 `data: <payload>\n\n` */
function sseLine(payload: string): Uint8Array {
  return new TextEncoder().encode(`data: ${payload}\n\n`);
}

/** mock SSE 流：每 50ms 推一个 text token，结尾 [DONE] */
function makeMockStream(signal?: AbortSignal): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const value of MOCK_TOKENS) {
          if (signal?.aborted) {
            controller.close();
            return;
          }
          controller.enqueue(sseLine(JSON.stringify({ type: "text", value })));
          await new Promise((r) => setTimeout(r, 50));
        }
        controller.enqueue(sseLine("[DONE]"));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // body 校验：messages 缺失即 400（不强校验内容，stub 阶段宽松）
        try {
          const body = (await request.json()) as { messages?: unknown };
          if (!body || !Array.isArray(body.messages)) {
            return Response.json(
              { error: { message: "请求体缺失 messages 数组" } },
              { status: 400 },
            );
          }
        } catch {
          return Response.json(
            { error: { message: "请求体不是合法 JSON" } },
            { status: 400 },
          );
        }

        // 返回 mock SSE 流
        const stream = makeMockStream(request.signal);
        return new Response(stream, {
          status: 200,
          headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
            // 防止部分 reverse proxy 缓冲 SSE
            "x-accel-buffering": "no",
          },
        });
      },

      // 健康检查：GET 返 JSON，方便部署后 curl 验证
      GET: async () => {
        return Response.json({
          ok: true,
          phase: "1",
          endpoint: "/api/ai/chat",
          note: "Phase 1 mock stub. 用 POST 调用获取 SSE 流。真上游接入见 docs/AI_PROXY_SPEC.md。",
        });
      },
    },
  },
});
