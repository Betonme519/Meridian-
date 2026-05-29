/**
 * Server route —— `POST /api/ai/chat`
 *
 * Phase 2（2026-05-29）：接真上游 LLM。
 *
 * 当前上游：智谱 GLM（OpenAI 兼容协议）
 *   - endpoint: https://open.bigmodel.cn/api/paas/v4/chat/completions
 *   - 默认 model: glm-5.1（可被 GLM_MODEL env 覆盖）
 *   - key: ZHIPU_API_KEY（wrangler secret / 本地 .dev.vars）
 *
 * 切换其他 OpenAI 兼容厂商（DeepSeek / Qwen / 其他 Zhipu 档位）：
 *   - 改 GLM_MODEL（同一厂商内切档：glm-5.1 / glm-4.5 / glm-4.5-air / glm-4.5-flash）
 *   - 换厂商时改 UPSTREAM_BASE_URL + 对应 *_API_KEY；协议本体不变
 *
 * 协议（与 src/ai/providers/remote.ts 对齐）：
 *   Request:  POST application/json   body: { messages: Message[], stream: true }
 *   Response: 200 text/event-stream   body: `data: <JSON Token>\n\n` × N + `data: [DONE]\n\n`
 *   Token:    { type: "text", value: string }   见 src/ai/stream.ts
 *
 * ⚠️ 鉴权：本路由暂未校验 Supabase JWT，跟 Phase 1 stub 行为一致。
 *    Phase 3 加 rate limit / 用量统计时一并补上（见 backend_migration_plan §Phase 3）。
 */

import { createFileRoute } from "@tanstack/react-router";

// ---------------------------------------------------------------------------
// 配置常量
// ---------------------------------------------------------------------------

const ZHIPU_ENDPOINT =
  "https://open.bigmodel.cn/api/paas/v4/chat/completions";

const DEFAULT_MODEL = "glm-5.1";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequestBody {
  messages?: ChatMessage[];
  stream?: boolean;
}

// 上游 OpenAI 兼容 SSE chunk 结构（按需取字段，多余忽略）
interface UpstreamChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
  error?: { message?: string };
}

// ---------------------------------------------------------------------------
// SSE 工具
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();

function sseLine(payload: string): Uint8Array {
  return encoder.encode(`data: ${payload}\n\n`);
}

function sseToken(value: string): Uint8Array {
  return sseLine(JSON.stringify({ type: "text", value }));
}

const SSE_DONE = sseLine("[DONE]");

// ---------------------------------------------------------------------------
// 错误归一
// ---------------------------------------------------------------------------

/** 上游错误对外脱敏：不暴露厂商名 / endpoint / key 末尾等 */
function sanitizedError(status: number, raw?: string): string {
  if (status === 401 || status === 403) return "AI 服务鉴权失败（请联系管理员）";
  if (status === 429) return "AI 服务繁忙，请稍后重试";
  if (status >= 500) return "AI 服务暂时不可用";
  if (raw && raw.length < 200) return raw;
  return `AI 服务异常（${status}）`;
}

// ---------------------------------------------------------------------------
// 上游 SSE → 归一化 Token 流
// ---------------------------------------------------------------------------

/**
 * 把上游 OpenAI 兼容 SSE 流转成我们自己的 `{type:"text",value}` SSE 流。
 *
 * 关键点：
 *  - 上游 chunk: `data: {"choices":[{"delta":{"content":"hi"}}]}\n\n`
 *  - 上游 done : `data: [DONE]\n\n`
 *  - 我方 chunk: `data: {"type":"text","value":"hi"}\n\n`
 *  - 我方 done : `data: [DONE]\n\n`
 *  - 跳过 keep-alive 空行 / `: ping` 等注释行
 *  - abort 短路：clientSignal 一断就停推
 */
function pipeUpstreamToClient(
  upstreamBody: ReadableStream<Uint8Array>,
  clientSignal: AbortSignal,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamBody.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const safeClose = () => {
        try {
          controller.close();
        } catch {
          /* 已关 */
        }
      };

      try {
        while (true) {
          if (clientSignal.aborted) {
            safeClose();
            return;
          }
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE 事件 \n\n 分隔
          let idx: number;
          while ((idx = buffer.indexOf("\n\n")) >= 0) {
            const event = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);

            for (const line of event.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              if (trimmed.startsWith(":")) continue; // SSE 注释
              if (!trimmed.startsWith("data:")) continue;

              const payload = trimmed.slice(5).trim();
              if (!payload) continue;
              if (payload === "[DONE]") {
                controller.enqueue(SSE_DONE);
                safeClose();
                return;
              }

              try {
                const chunk = JSON.parse(payload) as UpstreamChunk;

                // 上游 SSE 内嵌错误
                if (chunk.error?.message) {
                  controller.enqueue(
                    sseLine(
                      JSON.stringify({
                        error: sanitizedError(502, chunk.error.message),
                      }),
                    ),
                  );
                  controller.enqueue(SSE_DONE);
                  safeClose();
                  return;
                }

                const delta = chunk.choices?.[0]?.delta?.content;
                if (typeof delta === "string" && delta.length > 0) {
                  controller.enqueue(sseToken(delta));
                }
              } catch {
                // 上游送来无法 parse 的行 → 吞掉避免炸流
              }
            }
          }
        }

        // 上游正常结束但没发 [DONE]
        controller.enqueue(SSE_DONE);
        safeClose();
      } catch (err) {
        try {
          controller.enqueue(
            sseLine(
              JSON.stringify({
                error: sanitizedError(
                  502,
                  err instanceof Error ? err.message : "stream error",
                ),
              }),
            ),
          );
          controller.enqueue(SSE_DONE);
        } catch {
          /* ignore */
        }
        safeClose();
      } finally {
        try {
          reader.releaseLock();
        } catch {
          /* ignore */
        }
      }
    },

    cancel() {
      // 客户端取消 → 上游 reader 在循环中检测 aborted 自然退出
    },
  });
}

// ---------------------------------------------------------------------------
// 主入口
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // 1. 解析 body
        let body: ChatRequestBody;
        try {
          body = (await request.json()) as ChatRequestBody;
        } catch {
          return Response.json(
            { error: { message: "请求体不是合法 JSON" } },
            { status: 400 },
          );
        }
        if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
          return Response.json(
            { error: { message: "请求体缺失 messages 数组" } },
            { status: 400 },
          );
        }

        // 2. 读 env
        const apiKey =
          (globalThis as { process?: { env?: Record<string, string> } })
            .process?.env?.ZHIPU_API_KEY;
        const model =
          (globalThis as { process?: { env?: Record<string, string> } })
            .process?.env?.GLM_MODEL || DEFAULT_MODEL;

        if (!apiKey) {
          return Response.json(
            {
              error: {
                message:
                  "AI 服务未配置（缺少 ZHIPU_API_KEY，本地需 .dev.vars / 部署需 wrangler secret put）",
              },
            },
            { status: 500 },
          );
        }

        // 3. 调上游
        let upstream: Response;
        try {
          upstream = await fetch(ZHIPU_ENDPOINT, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${apiKey}`,
              accept: "text/event-stream",
            },
            body: JSON.stringify({
              model,
              messages: body.messages,
              stream: true,
            }),
            signal: request.signal,
          });
        } catch (err) {
          return Response.json(
            {
              error: {
                message: sanitizedError(
                  502,
                  err instanceof Error ? err.message : undefined,
                ),
              },
            },
            { status: 502 },
          );
        }

        // 4. 上游非 2xx → 502 + 脱敏
        if (!upstream.ok) {
          let rawMsg: string | undefined;
          try {
            const errJson = (await upstream.json()) as {
              error?: { message?: string };
            };
            rawMsg = errJson?.error?.message;
          } catch {
            /* ignore */
          }
          return Response.json(
            { error: { message: sanitizedError(upstream.status, rawMsg) } },
            { status: 502 },
          );
        }

        if (!upstream.body) {
          return Response.json(
            { error: { message: "AI 服务返回为空" } },
            { status: 502 },
          );
        }

        // 5. 透传 SSE
        const stream = pipeUpstreamToClient(upstream.body, request.signal);
        return new Response(stream, {
          status: 200,
          headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
            "x-accel-buffering": "no",
          },
        });
      },

      // 健康检查
      GET: async () => {
        const hasKey = Boolean(
          (globalThis as { process?: { env?: Record<string, string> } })
            .process?.env?.ZHIPU_API_KEY,
        );
        const model =
          (globalThis as { process?: { env?: Record<string, string> } })
            .process?.env?.GLM_MODEL || DEFAULT_MODEL;
        return Response.json({
          ok: true,
          phase: "2",
          upstream: "zhipu",
          model,
          keyConfigured: hasKey,
          endpoint: "/api/ai/chat",
        });
      },
    },
  },
});
