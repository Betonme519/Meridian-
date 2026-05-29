// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// 启动时加载 .dev.vars 注入 process.env
// ---------------------------------------------------------------------------
//
// 背景：`.dev.vars` 是 wrangler dev 的 secret 注入文件。`vite dev` 默认不读它，
// 也不把非 `VITE_` 前缀的 .env 变量注入 server-side process.env。
//
// 后果：`src/routes/api/ai/chat.ts` 在 vite dev 模式下 `process.env.ZHIPU_API_KEY`
// 始终 undefined → keyConfigured=false → 500 报"AI 服务未配置"。
//
// 解决：在 vite config 加载前手动解析 .dev.vars 注入 process.env。
// 仅 dev / build 期生效，**不会**进客户端 bundle（无 VITE_ 前缀的变量 vite
// 不会暴露到 import.meta.env）。
//
// 部署到 Cloudflare Worker 时此段不跑（CF 用 wrangler secret put 注入），
// 也不需要它跑。
// ---------------------------------------------------------------------------
const devVarsPath = path.resolve(".dev.vars");
if (fs.existsSync(devVarsPath)) {
  const content = fs.readFileSync(devVarsPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    // 不覆盖已存在的 env（允许 shell 临时 override）
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export default defineConfig();
