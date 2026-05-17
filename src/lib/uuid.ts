/**
 * UUID v4 生成 —— 三层兜底，永远返回合法 UUID v4 字面量。
 *
 * 为啥要兜底：DB 多张表的 PK / FK 列声明为 `uuid`（例：rag_source.id /
 * chat_message.conversation_id），写入时若给非 UUID 字符串，Postgres 直接抛
 * `invalid input syntax for type uuid: "..."`。客户端 id 预生成场景必须返回合法 UUID。
 *
 * 三层兜底：
 *  1. `crypto.randomUUID()` —— Chrome 92+ / Safari 15.4+ / Firefox 95+ / Edge 92+（推荐路径，原生 CSPRNG）
 *  2. `crypto.getRandomValues()` 手拼 v4 —— 几乎所有现代浏览器都有；安全性同 randomUUID
 *  3. `Math.random()` 兜底 —— 极旧浏览器；非加密随机但碰撞概率仍极低（v4 空间 2^122）
 *
 * 不依赖 npm 包：项目零运行时依赖原则。生成的 UUID 满足 RFC 4122 §4.4 v4 格式：
 *   `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`（version=4, variant=10xx）。
 */
export function randomUUID(): string {
  // 显式 capture 一次，避免连续 narrowing 让 TS 把 crypto 误判成 never
  const c: Crypto | undefined =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: Crypto }).crypto
      : undefined;

  if (c?.randomUUID) {
    return c.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  // RFC 4122 §4.4：version (byte 6 高 4 位 = 0100) + variant (byte 8 高 2 位 = 10)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
