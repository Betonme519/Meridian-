/**
 * AI 流式协议核心 —— provider 与调用方之间的契约。
 *
 * 设计要点：
 *  - `Token` 是 discriminated union，当前只有 1 个 case `TextDelta`。
 *    后期接真 provider 时扩展 `CitationBlock` / `ToolUseDelta` / 等结构化事件，
 *    调用方走 `switch (tok.type)` / `tokenText(tok)` 不会被破坏。
 *    —— 这是 2026-05-17 二级炸药 AI2 的修复结果，前向兼容性改动。
 *  - `AsyncIterable<Token>`：调用方用 `for await ... of stream` 消费，标准 ES2018,
 *    AbortController 通过 `signal?.aborted` 在 provider 内部短路。
 *  - 不在这里定 retry / timeout —— 单独留给 fetch wrapper（见 TECH_DEBT TD-13）。
 *
 * 公共 API：
 *  - `Token` / `TextDelta` / `Role` / `Message` / `ChatOptions` / `Chat`  类型
 *  - `tokenText(tok)`   从任何 Token 取 displayable 文本（对结构化事件返回 ""）
 *  - `collect(stream)`  把流全收成一个 string，用于"我只要个答案"的非流式场景
 */

/** 文本增量 —— 真 provider SSE 的 content_block_delta、mock 的字符流都归一到这里 */
export interface TextDelta {
  type: "text";
  value: string;
}

/**
 * Token —— 流式事件的 union 类型。
 *
 * 当前只有 TextDelta。**未来扩展占位**：接真 provider（Anthropic/Qwen/Zhipu/DeepSeek
 * 任一家）时，按需添加：
 *
 *   export interface CitationBlock { type: "citation"; ruleId: string; quote: string; }
 *   export interface ToolUseDelta  { type: "tool_use"; name: string; partialJson: string; }
 *   export type Token = TextDelta | CitationBlock | ToolUseDelta;
 *
 * 消费方应当用 `switch (tok.type)` 或 `tokenText(tok)` 取值，**不要**当字符串拼。
 */
export type Token = TextDelta;

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
 * 从任意 Token 取可显示文本。
 * - TextDelta → token.value
 * - 未来 CitationBlock / ToolUseDelta → 返回 ""（不进入累积文本）
 *
 * 消费方 99% 场景用这个 + 单独再 switch 取结构化事件做 sidecar 渲染。
 */
export function tokenText(tok: Token): string {
  // 当 Token 扩成 union 时，把"非文本"case 加在 switch 里返回 ""，文本 case 返回 value。
  // 默认 fallthrough 抛错而非走 exhaustive `never`：union 只 1 个成员时 TS 会把
  // default 分支视为可达，强制走 never 反而编译失败。
  if (tok.type === "text") return tok.value;
  throw new Error(`Unhandled Token type: ${(tok as { type: string }).type}`);
}

/**
 * 把流式输出全收成一个 string。
 * 适用：批处理 / 后台任务 / 单元测试 —— 任何不需要"边收边渲"的场景。
 */
export async function collect(stream: AsyncIterable<Token>): Promise<string> {
  let out = "";
  for await (const t of stream) out += tokenText(t);
  return out;
}
