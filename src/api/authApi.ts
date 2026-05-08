/**
 * Auth API — MOCK IMPLEMENTATION (localStorage-backed).
 *
 * ⚠️ 这是开发期占位实现，**不是真实后端**。
 *  - 任意邮箱 + 任意 ≥6 位密码即可"登录"
 *  - 注册同样不校验唯一性，只生成 mock user
 *  - session 存 `localStorage["meridian:auth"]`，刷新仍在登录态
 *
 * 上线时替换为真后端：
 *  1. 把这四个函数体替换成 `fetch("/api/auth/login", ...)` 等真实调用
 *  2. 返回类型保持 `MockSession` / `AuthUser` 的形状，或调整后同步更新
 *     `src/context/AuthContext.tsx` 的 setUser 数据结构
 *  3. token 改成真 JWT；可选：加 refresh token 流程
 *  4. 上层（AuthContext / Login / Register）零修改即可工作
 *
 * 详见 docs/AI_MEMORY.md → "Mock 鉴权（2026-05-08）"
 */

const STORAGE_KEY = "meridian:auth";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface MockSession {
  user: AuthUser;
  token: string;
}

function makeSession(email: string, name?: string): MockSession {
  return {
    user: {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `u_${Math.random().toString(36).slice(2)}`,
      email,
      name: (name && name.trim()) || email.split("@")[0],
      createdAt: new Date().toISOString(),
    },
    token: `mock_${Math.random().toString(36).slice(2)}`,
  };
}

function persist(session: MockSession) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function login(
  email: string,
  password: string,
): Promise<MockSession> {
  await delay(300);
  if (!email.includes("@")) throw new Error("请输入有效邮箱");
  if (!password || password.length < 6) throw new Error("密码至少 6 位");
  const session = makeSession(email);
  persist(session);
  return session;
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<MockSession> {
  await delay(300);
  if (!email.includes("@")) throw new Error("请输入有效邮箱");
  if (!password || password.length < 8) throw new Error("密码至少 8 位");
  const session = makeSession(email, name);
  persist(session);
  return session;
}

export async function logout(): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as MockSession;
    return session.user ?? null;
  } catch {
    return null;
  }
}
