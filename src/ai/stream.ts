/**
 * AI 流式协议核心 —— provider 与调用方之间的契约。
 *
 * 设计要点：
 *  - `Token = string`：真 provider（Anthropic / OpenAI）的 SSE 事件最终归一成
 *    "文本增量"。结构化事件（tool_use_delta、citation 等）等到接真 provider
 *    再把 Token 扩成 union；当前 mock 不需要。
 *  - `AsyncIterable<Token>`：调用方用 `for await ... of stream` 消费，标准 ES2018，
 *    AbortController 通过 `signal?.aborted` 在 provider 内部短路。
 *  - 不在这里定 retry / timeout —— 单独留给 fetch wrapper（见 TECH_DEBT TD-13）。
 *
 * 公共 API：
 *  - `Token` / `Role` / `Message` / `ChatOptions` / `Chat`  类型
 *  - `collect(stream)`  把流全收成一个 string，用于"我只要个答案"的非流式场景
 */

export type Token = string;

export type Role = "user" | "assistant" | "system";

export interface Message {
  role: Role;
  content: string;
}

export interface ChatOptions {
  messages: Message[];
  /** 用户主动取消 / 组件卸载时传入；provider 应在 yield 之间检查 aborted */
  signal?: AbortSignal;
}

export type Chat = (opts: ChatOptions) => AsyncIterable<Token>;

/**
 * 把流式输出全收成一个 string。
 * 适用：批处理 / 后台任务 / 单元测试 —— 任何不需要"边收边渲"的场景。
 */
export async function collect(stream: AsyncIterable<Token>): Promise<string> {
  let out = "";
  for await (const t of stream) out += t;
  return out;
}
