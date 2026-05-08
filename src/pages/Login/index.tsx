import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Login page — standalone auth surface, not wrapped by DashboardLayout.
 * Card composition reuses the Uiverse "akshat-patel28" pill-input layout,
 * but typography & spacing follow docs/DESIGN_SYSTEM.md (Inter,
 * font-semibold tracking-tight, text-* scale, rounded-2xl card / rounded-full
 * pill controls).
 *
 * Auth wiring talks to the AuthContext which currently uses a mock backend
 * (任意 ≥6 位密码即可通过). See src/api/authApi.ts + docs/AI_MEMORY.md.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div
        className="animate-fade-in-up-soft w-full max-w-[440px] min-h-[640px] bg-white rounded-2xl border border-gray-200 shadow-[0_5px_20px_rgba(0,0,0,0.04)] px-9 py-11 box-border"
        style={{ animationDelay: "0ms" }}
      >
        <div
          className="animate-fade-in-up-soft flex justify-center mb-3"
          style={{ animationDelay: "80ms" }}
        >
          <Link
            to="/"
            className="text-xs font-medium text-gray-500 tracking-widest uppercase hover:text-gray-900 transition-colors"
          >
            Meridian
          </Link>
        </div>
        <h1
          className="animate-fade-in-up-soft text-center text-3xl font-semibold tracking-tight text-gray-900 mb-2"
          style={{ animationDelay: "140ms" }}
        >
          Welcome back
        </h1>
        <p
          className="animate-fade-in-up-soft text-center text-sm text-gray-500 mb-8"
          style={{ animationDelay: "200ms" }}
        >
          登录继续你的学业决策
        </p>

        <form
          onSubmit={handleSubmit}
          className="animate-fade-in-up-soft flex flex-col gap-4 mb-3"
          style={{ animationDelay: "260ms" }}
        >
          <input
            type="email"
            placeholder="邮箱"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-gray-300 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-colors"
          />
          <input
            type="password"
            placeholder="密码"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-gray-300 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-colors"
          />

          <p className="m-0 text-end">
            <button
              type="button"
              className="text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-gray-900 transition-colors cursor-pointer"
            >
              忘记密码？
            </button>
          </p>

          {error && (
            <p className="m-0 text-xs text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-black px-7 py-3.5 text-white text-base font-medium hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "登录中…" : "登录"}
          </button>
        </form>

        <p
          className="animate-fade-in-up-soft text-sm text-gray-500 m-0"
          style={{ animationDelay: "460ms" }}
        >
          没有账户？
          <Link
            to="/register"
            className="ml-1 font-medium text-gray-900 underline underline-offset-2 decoration-gray-900 hover:text-gray-700 transition-colors"
          >
            注册
          </Link>
        </p>

        <div
          className="animate-fade-in-up-soft mt-6 flex flex-col gap-3"
          style={{ animationDelay: "520ms" }}
        >
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-full bg-black text-white px-5 py-3 text-sm font-medium border border-black hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <AppleIcon />
            <span>Continue with Apple</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-full bg-white text-gray-900 px-5 py-3 text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </main>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.46 2.23-1.21 3.02-.81.86-2.13 1.53-3.21 1.45-.13-1.13.43-2.31 1.18-3.07.84-.86 2.27-1.5 3.24-1.4zM20.25 17.16c-.55 1.27-.81 1.83-1.51 2.95-.98 1.56-2.36 3.5-4.07 3.51-1.52.02-1.91-.99-3.97-.98-2.06.01-2.49 1-4.01.98-1.71-.01-3.02-1.77-4-3.32-2.74-4.36-3.03-9.49-1.34-12.21 1.2-1.93 3.09-3.06 4.87-3.06 1.81 0 2.95.99 4.45.99 1.46 0 2.34-.99 4.43-.99 1.58 0 3.26.86 4.45 2.35-3.91 2.14-3.27 7.73.7 9.78z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
