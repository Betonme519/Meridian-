import { createClient } from "@supabase/supabase-js";

/**
 * Supabase 客户端单例。
 *
 * 环境变量：`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
 *  - 浏览器端：anon key 设计上即公开（行级权限 RLS 在 Supabase 端把守）
 *  - SSR（Cloudflare Worker）：env 变量在 build 时由 Vite 注入，两端共用
 *
 * env 缺失策略（fail-soft）：
 *  - 启动时不抛错，避免整个 app（包括 Home / Login 等不需要 auth 的页）启动不了
 *  - 在 console 留警告
 *  - 实际调用 auth 方法（login / register / getUser 等）时才报错给用户
 *
 * 调用入口：
 *  - auth：见 `src/api/authApi.ts`（薄壳，AuthContext 通过它调用）
 *  - 业务数据（未来）：直接 `supabase.from("table")...`，或封装到 `src/api/*`
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured && typeof console !== "undefined") {
  console.warn(
    "[Supabase] 环境变量缺失：VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY。" +
      " auth 功能不可用，请在 .env.local 配置后重启 dev server（参考 .env.example）。",
  );
}

const isBrowser = typeof window !== "undefined";

// 用占位 URL / key 让 createClient 能初始化；真调 auth 方法时由 authApi.ts 再次校验
export const supabase = createClient(
  SUPABASE_URL ?? "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY ?? "placeholder-anon-key",
  {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
    },
  },
);
