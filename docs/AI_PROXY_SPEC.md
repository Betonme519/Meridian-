# AI Proxy Spec — `/api/ai/chat`

> 前后端契约文档。后期接真 LLM 时按本 spec 实现 server route，前端不动。
> Last updated: **2026-05-28**
>
> **2026-05-28 变更**：endpoint 从 `/api/ai.chat` 改为 `/api/ai/chat`，并新增
> Phase 1 mock stub（`src/routes/api/ai/chat.ts`）。原因与后续路线见
> [`backend_migration_plan.md`](./backend_migration_plan.md)。

---

> ✅ **当前状态（2026-05-29）：Phase 2 进行中，上游 = 智谱 GLM-5.1**
> 用户 2026-05-29 拍板智谱。`src/routes/api/ai/chat.ts` 已从 mock 换成真 SSE proxy
> （OpenAI 兼容协议 → 智谱 endpoint）。本地 `.dev.vars` 注入 `ZHIPU_API_KEY` + `GLM_MODEL=glm-5.1`。
> 部署前还需：`wrangler secret put` + Supabase session 校验 + rate limit。
> 详见 [`backend_migration_plan.md`](./backend_migration_plan.md) §Phase 2。

---

## 背景

用户后期 LLM provider 未定（可能接 Anthropic / Qwen / Zhipu / DeepSeek 任一家）。
为避免前端被某一家 LLM 锁死，2026-05-17 决策：

- **前端**只面向 1 个 endpoint：`POST /api/ai/chat`，归一成 SSE 流
- **server 端**按 env 路由到上游（`AI_UPSTREAM=anthropic|qwen|zhipu|deepseek`）
- **切换上游**：改 `wrangler secret` + 改 `AI_UPSTREAM` env，**不动前端代码**

前端实现见 `src/ai/providers/remote.ts`，已可用（直接 fetch 本 endpoint）。
server 端 endpoint 在 Phase 1（2026-05-28）建了 mock stub（`src/routes/api/ai/chat.ts`），
Phase 2 接真上游时**替换 stub 实现**即可，前端不动。

---

## 接入步骤（接真上游时执行）

### Step 1：选 LLM 上游

最便宜的"先跑通"路线推荐顺序：
1. **DeepSeek**（v3 / r1）：API 价格最低、SSE 协议与 OpenAI 兼容、中文 OK
2. **Qwen**（通义千问 plus）：阿里云国内速度快、SSE 兼容、企业实名才能买
3. **Zhipu**（GLM-4）：自家 SSE 协议要单独适配
4. **Anthropic**（claude-haiku-4.5）：质量最高但要海外网络 / 企业账号 / 单价较高

### Step 2：拿 API key + 灌入 Cloudflare Worker

```bash
# 不要写进 wrangler.jsonc 的 vars 段（vars 是构建时常量，会进 bundle）
wrangler secret put AI_UPSTREAM_KEY    # 上游 API key
wrangler secret put AI_UPSTREAM        # 上游名："deepseek" | "qwen" | "zhipu" | "anthropic"
wrangler secret put AI_UPSTREAM_MODEL  # 模型名，如 "deepseek-chat" / "qwen-plus" / "glm-4-air" / "claude-haiku-4-5"
```

### Step 3：写 server route

**2026-05-28：Phase 1 已建占位文件** `src/routes/api/ai/chat.ts`，
Phase 2 接真上游时**替换 mock 流为下面的 proxy 实现**即可（文件路径与 createFileRoute 路径不变）：

```ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages: Message[] };

        const upstream = process.env.AI_UPSTREAM;
        const key = process.env.AI_UPSTREAM_KEY;
        const model = process.env.AI_UPSTREAM_MODEL;
        if (!upstream || !key || !model) {
          return Response.json(
            { error: { message: "AI upstream 未配置（AI_UPSTREAM/_KEY/_MODEL）" } },
            { status: 500 }
          );
        }

        // 按 upstream 路由到不同实现
        switch (upstream) {
          case "deepseek": return proxyDeepSeek({ messages, model, key, signal: request.signal });
          case "qwen":     return proxyQwen    ({ messages, model, key, signal: request.signal });
          case "zhipu":    return proxyZhipu   ({ messages, model, key, signal: request.signal });
          case "anthropic":return proxyAnthropic({ messages, model, key, signal: request.signal });
          default:
            return Response.json(
              { error: { message: `不支持的上游：${upstream}` } },
              { status: 400 }
            );
        }
      },
    },
  },
});
```

**注意**：TanStack Start v1.167 的 server route API 是 `Route.server.handlers.<METHOD>`。
具体签名可能跟版本走，写时跑 `bun dev` 看 dev 时报错对齐。

### Step 4：每家上游的归一化（核心是 SSE 解析）

每个 `proxyX` 函数返 `Response` 对象，body 是 `ReadableStream<Uint8Array>`，
每条 chunk 是 `data: <JSON Token>\n\n`：

```
data: {"type":"text","value":"推"}\n\n
data: {"type":"text","value":"荐"}\n\n
data: {"type":"text","value":"："}\n\n
...
data: [DONE]\n\n
```

`Token` 类型见 `src/ai/stream.ts`，当前是 `{ type: "text"; value: string }`，
未来扩 `CitationBlock` / `ToolUseDelta` 时按同样 SSE 协议 yield 即可。

### Step 5：错误归一

- 上游 4xx/5xx → 本 endpoint 返 502 + `{ error: { message: "..." } }`
- 上游 SSE 内部错误事件 → 本 endpoint 在 SSE 流里发 `data: {"error":"..."}\n\n` 再 `[DONE]`
- 不要把上游原始错误穿透到前端（暴露厂商名 / key 末尾等敏感信息）

---

## 各家上游 SSE 协议速记

| 上游 | endpoint | 协议 | 文本增量字段 |
|---|---|---|---|
| DeepSeek | `https://api.deepseek.com/chat/completions` `stream: true` | OpenAI compatible | `choices[0].delta.content` |
| Qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` `stream: true` | OpenAI compatible | `choices[0].delta.content` |
| Zhipu | `https://open.bigmodel.cn/api/paas/v4/chat/completions` `stream: true` | OpenAI compatible | `choices[0].delta.content` |
| Anthropic | `https://api.anthropic.com/v1/messages` `stream: true` | Anthropic SSE | `content_block_delta.delta.text` |

**好消息**：前三家协议**完全一致**，可共用 1 个 `proxyOpenAICompatible` 实现，
只换 endpoint + key + model name 即可。Anthropic 单独写一份。

---

## 鉴权

- server route 在 `_app.tsx beforeLoad` 之外，**没有自动鉴权**
- 接入时**必须**在 server handler 内手动校验 Supabase session：
  ```ts
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return new Response(null, { status: 401 });
  // 用 anon key 调 supabase.auth.getUser(token) 验证
  ```
- 同时记录 user_id → server-side rate limiting / 用量统计

---

## 客户端集成

`src/ai/providers/remote.ts` 已实现 SSE 解析骨架，做了：

- POST `/api/ai/chat` with `{ messages, stream: true }`
- 4xx/5xx 时解析 `error.message` 抛错
- 按 `\n\n` 拆 SSE 事件，每行 `data: <JSON>` 反序列化成 `Token`
- `data: [DONE]` 表示流结束
- AbortController 通过 `signal` 传给 fetch，取消时 reader 自动释放

**前端切换**：`.env.local` 设 `VITE_AI_PROVIDER=remote`（默认 `mock`），
不动其它代码。

---

## 测试

接入后跑：
1. `bun run dev`，确保 `/api/ai/chat` 不 404（Phase 1 之后 stub 会返 mock SSE）
2. AIAdvisor 页输入文字 → 流式回答正常
3. 中途按"取消" → fetch abort + reader release，控制台 0 error
4. wrangler secret 错配（如假 key）→ 前端 toast 显示 "AI 调用失败：..."
5. 改 `AI_UPSTREAM`（DeepSeek → Qwen） → 同样请求，body 一致，回答风格变

---

## 相关文档

- **`src/ai/stream.ts`** —— Token / Chat / Message 类型
- **`src/ai/providers/remote.ts`** —— 客户端 SSE 解析实现
- **`src/ai/providers/mock.ts`** —— 不联网的开发态 provider
- **`src/ai/index.ts`** —— provider 路由（`VITE_AI_PROVIDER` 选择）
- **`backend_migration_plan.md` Phase 2** —— 本 spec 在总路线中的位置
- **`_archive/ARCHITECTURE_AUDIT.md` §13 SB2/AI1** —— 本 spec 的原始决策来源（已归档）
