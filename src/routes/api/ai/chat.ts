/**
 * Server route —— `POST /api/ai/chat`
 *
 * Phase 2（2026-05-29）：接真上游 LLM + Supabase 鉴权 + per-user rate limit。
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
 *             headers: Authorization: Bearer <supabase_access_token>
 *   Response: 200 text/event-stream   body: `data: <JSON Token>\n\n` × N + `data: [DONE]\n\n`
 *             401 未登录 / 403 token 过期 / 429 超限 / 502 上游异常
 *   Token:    { type: "text", value: string }   见 src/ai/stream.ts
 *
 * 鉴权：Authorization Bearer → supabase.auth.getUser(token) 验签
 * Rate limit：进程内 Map per user，1 分钟窗口 60 次（Worker 单实例够用，
 *             多实例 / 长期方案用 KV 升级，见 backend_migration_plan §Phase 6）
 *
 * 13.8-B 手册 RAG（best-effort）：调上游前 embed 用户问题 → match_handbook_chunks
 *   RPC 召回 top-K 手册条款 → prepend 为 system 上下文。失败 / 无命中静默跳过。
 *   前提：migration 0012 + 0012_seed_handbook_chunks.sql 已灌库（见 genHandbookChunks.ts）。
 */

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// 配置常量
// ---------------------------------------------------------------------------

const ZHIPU_ENDPOINT =
  "https://open.bigmodel.cn/api/paas/v4/chat/completions";

const DEFAULT_MODEL = "glm-5.1";

// Rate limit：每用户 1 分钟 60 次（advisor 场景充足，不至于挡住正常使用）
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

// 13.8-B 手册 RAG：embed 用户问题 → match_handbook_chunks 召回 → prepend 上下文。
// 同一个 ZHIPU_API_KEY；embedding-3 dimensions=1024 与 migration 0012 对齐。
const EMBED_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/embeddings";
const DEFAULT_EMBED_MODEL = "embedding-3";
const EMBED_DIMS = 1024;
const RAG_TOP_K = 5;
const RAG_MIN_SIMILARITY = 0.3; // 低于此视为不相关，丢弃，避免硬塞噪声
const RAG_CONTEXT_CHAR_CAP = 4_000; // 注入上下文的字符预算

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
// Env 读取（统一封装，避免 process 类型断言遍地）
// ---------------------------------------------------------------------------

function readEnv(name: string): string | undefined {
  return (globalThis as { process?: { env?: Record<string, string> } })
    .process?.env?.[name];
}

// ---------------------------------------------------------------------------
// Supabase session 校验
// ---------------------------------------------------------------------------
//
// 每请求 lazy 创建 server client（不 module-scope cache —— env 读取在 request
// 期更稳；createClient 本身轻量）。persistSession=false 因为 server 端无浏览器
// 存储概念，每次靠传入 token 验证。
//
// getUser(token) 会向 Supabase Auth 服务发请求验签，频繁场景下可改 jose 本地
// 解 JWT（不打远端）；当前 QPS 低不优化。
// ---------------------------------------------------------------------------

type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; message: string };

async function authenticateRequest(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { ok: false, status: 401, message: "请先登录后使用 AI 服务" };
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, status: 401, message: "请先登录后使用 AI 服务" };
  }

  const supabaseUrl = readEnv("SUPABASE_URL");
  const supabaseAnonKey = readEnv("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      status: 500,
      message:
        "AI 服务未配置（缺少 SUPABASE_URL / SUPABASE_ANON_KEY，本地需 .dev.vars / 部署需 wrangler secret put）",
    };
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user?.id) {
      return { ok: false, status: 401, message: "登录已过期，请重新登录" };
    }
    return { ok: true, userId: data.user.id };
  } catch {
    return { ok: false, status: 401, message: "登录校验失败，请重新登录" };
  }
}

// ---------------------------------------------------------------------------
// Per-user rate limit（进程内 Map，1 分钟窗口）
// ---------------------------------------------------------------------------
//
// Worker 单实例内有效。多实例 / 持久化方案见 backend_migration_plan §Phase 6
// （Cloudflare KV 或 Durable Objects）。当前用户量 1，简单实现够用且为最终方案
// 留出口子（rateLimitCheck 函数 signature 不变，store 层换实现即可）。
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

function rateLimitCheck(
  userId: string,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000),
    );
    return { ok: false, retryAfterSec };
  }
  entry.count += 1;
  return { ok: true };
}

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
// 手册 RAG 检索（13.8-B，best-effort）
// ---------------------------------------------------------------------------
//
// embed 用户最后一条问题 → match_handbook_chunks RPC 召回 top-K → 拼成 system
// 上下文。任何一步失败（embedding 报错 / RPC 报错 / 无命中 / 手册没灌库）都返
// null，对话照常进行 —— RAG 是增强，不是依赖。
// ---------------------------------------------------------------------------

interface MatchedChunk {
  source_key: string;
  heading: string | null;
  content: string;
  similarity: number;
}

async function retrieveHandbookContext(
  query: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const supabaseUrl = readEnv("SUPABASE_URL");
    const supabaseAnonKey = readEnv("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) return null;

    const q = query.trim();
    if (!q) return null;

    // 1) embed 问题（截断长 query，省 token）
    const embedRes = await fetch(EMBED_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: readEnv("EMBEDDING_MODEL") || DEFAULT_EMBED_MODEL,
        input: q.slice(0, 2_000),
        dimensions: EMBED_DIMS,
      }),
    });
    if (!embedRes.ok) return null;
    const embedJson = (await embedRes.json()) as {
      data?: { embedding: number[] }[];
    };
    const vec = embedJson.data?.[0]?.embedding;
    if (!vec || vec.length === 0) return null;

    // 2) 余弦最近邻 RPC（match RPC 是 SECURITY DEFINER，anon 客户端即可查）
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc("match_handbook_chunks", {
      query_embedding: vec,
      match_count: RAG_TOP_K,
    });
    if (error || !Array.isArray(data) || data.length === 0) return null;

    const chunks = (data as MatchedChunk[]).filter(
      (c) => (c.similarity ?? 0) >= RAG_MIN_SIMILARITY,
    );
    if (chunks.length === 0) return null;

    // 3) 拼上下文，预算内截断
    let acc =
      "以下是从学校官方手册检索到的相关条款，回答时可引用并注明大致出处；" +
      "手册没提到的不要编造：\n\n";
    for (const c of chunks) {
      const head = c.heading
        ? `〔${c.source_key}·${c.heading}〕`
        : `〔${c.source_key}〕`;
      const piece = `${head}\n${c.content}\n\n`;
      if (acc.length + piece.length > RAG_CONTEXT_CHAR_CAP) break;
      acc += piece;
    }
    return acc.trim();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 主入口
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // 1. Supabase session 校验（401 拦匿名）
        const auth = await authenticateRequest(request);
        if (!auth.ok) {
          return Response.json(
            { error: { message: auth.message } },
            { status: auth.status },
          );
        }

        // 2. Per-user rate limit（429 拦 spam）
        const limit = rateLimitCheck(auth.userId);
        if (!limit.ok) {
          return Response.json(
            {
              error: {
                message: `请求过于频繁，请 ${limit.retryAfterSec} 秒后再试`,
              },
            },
            {
              status: 429,
              headers: { "retry-after": String(limit.retryAfterSec) },
            },
          );
        }

        // 3. 解析 body
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

        // 4. 读 env
        const apiKey = readEnv("ZHIPU_API_KEY");
        const model = readEnv("GLM_MODEL") || DEFAULT_MODEL;

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

        // 4.5 手册 RAG（13.8-B）：检索相关条款 prepend system 上下文。
        //     best-effort —— 失败 / 无命中 / 手册未灌库都静默跳过，不影响对话。
        const lastUser = [...body.messages]
          .reverse()
          .find((m) => m.role === "user");
        if (lastUser?.content) {
          const ragBlock = await retrieveHandbookContext(
            lastUser.content,
            apiKey,
          );
          if (ragBlock) {
            body.messages = [
              { role: "system", content: ragBlock },
              ...body.messages,
            ];
          }
        }

        // 5. 调上游
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

        // 6. 上游非 2xx → 502 + 脱敏
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

        // 7. 透传 SSE
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
        return Response.json({
          ok: true,
          phase: "2",
          upstream: "zhipu",
          model: readEnv("GLM_MODEL") || DEFAULT_MODEL,
          keyConfigured: Boolean(readEnv("ZHIPU_API_KEY")),
          supabaseConfigured: Boolean(
            readEnv("SUPABASE_URL") && readEnv("SUPABASE_ANON_KEY"),
          ),
          authEnforced: true,
          rateLimit: `${RATE_LIMIT_MAX} req / ${RATE_LIMIT_WINDOW_MS / 1000}s per user`,
          rag: {
            embedModel: readEnv("EMBEDDING_MODEL") || DEFAULT_EMBED_MODEL,
            dims: EMBED_DIMS,
            topK: RAG_TOP_K,
            note: "best-effort；手册未灌库 / 无命中则静默跳过",
          },
          endpoint: "/api/ai/chat",
        });
      },
    },
  },
});
