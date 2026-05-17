import { toast } from "sonner";

/**
 * 应用级错误上报通道。
 *
 * 设计目标：让 api / hooks / AI provider 抛错时，用户能看到一条 toast
 * 而不是只在 console（旧 TD-4：profile / rag_source / 未来 AI 失败用户只看空态）。
 *
 * Toaster 实例由 src/routes/__root.tsx Providers 内挂载（richColors）。
 *
 * ## 不接入清单
 *
 * - **authApi.ts**：Login / Register 页已有内联红字 setError 展示，
 *   再接 toast 会出现一份错误两处显示。auth 流程错误信息走原 throw 路径，
 *   由 page UI 自己消费。
 *
 * ## 公开 API
 *
 * - `reportApiError(scope, err)`：写 console.error + 弹 toast.error，
 *   不抛错。`scope` 用 "profile.update" / "rule.create" / "ai.chat" 这种
 *   「域名.动作」格式，便于多 toast 同时弹时用户能区分来源。
 *
 * - `failApiCall(scope, message)`：报错 + 抛 Error，**调用即终止**（返回 never）。
 *   适合替换 `throw new Error(...)` 的薄壳惯用法。
 */

export function reportApiError(scope: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);

  // 控制台保留完整错误对象以便调试 stack trace
  if (typeof console !== "undefined") {
    console.error(`[${scope}]`, err);
  }

  // SSR 期间（typeof window === undefined）sonner toast 调用不会渲染，
  // 但内部会试图操作 DOM，所以这里守一下避免 server build 噪声
  if (typeof window === "undefined") return;

  toast.error(`${scope}：${msg}`);
}

/**
 * 报错 + 抛错的便捷形式。等价于：
 *   const err = new Error(message);
 *   reportApiError(scope, err);
 *   throw err;
 *
 * 用法：
 *   if (error) failApiCall("profile.update", error.message);
 *   if (!isSupabaseConfigured) failApiCall("profile.fetch", NOT_CONFIGURED_MSG);
 */
export function failApiCall(scope: string, message: string): never {
  const err = new Error(message);
  reportApiError(scope, err);
  throw err;
}
