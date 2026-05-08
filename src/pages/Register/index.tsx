import { Link } from "@tanstack/react-router";
import { useState } from "react";

/**
 * Register page — visual sibling of Login. Same typography rules per
 * docs/DESIGN_SYSTEM.md (Inter, font-semibold tracking-tight, text-* scale,
 * rounded-2xl card / rounded-full pill controls). Holds the minimum
 * fields a future auth backend would expect (name / email / password /
 * confirm) plus a terms checkbox. Submission is a stub; password mismatch
 * and missing-consent are checked client-side.
 */
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    if (!agree) {
      setError("请先同意服务条款");
      return;
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
          创建账户
        </h1>
        <p
          className="animate-fade-in-up-soft text-center text-sm text-gray-500 mb-8"
          style={{ animationDelay: "200ms" }}
        >
          开始使用 Meridian 学业决策引擎
        </p>

        <form
          onSubmit={handleSubmit}
          className="animate-fade-in-up-soft flex flex-col gap-4 mb-3"
          style={{ animationDelay: "260ms" }}
        >
          <input
            type="text"
            placeholder="姓名"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-full border border-gray-300 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-colors"
          />
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
            placeholder="密码（至少 8 位）"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-gray-300 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-colors"
          />
          <input
            type="password"
            placeholder="确认密码"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-full border border-gray-300 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-colors"
          />

          <label className="flex items-start gap-2 px-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-[3px] h-3.5 w-3.5 accent-gray-900 cursor-pointer"
            />
            <span className="text-xs leading-5 text-gray-500">
              我已阅读并同意
              <a
                href="#"
                className="mx-1 font-medium text-gray-900 underline underline-offset-2 hover:text-gray-700 transition-colors"
              >
                服务条款
              </a>
              与
              <a
                href="#"
                className="ml-1 font-medium text-gray-900 underline underline-offset-2 hover:text-gray-700 transition-colors"
              >
                隐私政策
              </a>
            </span>
          </label>

          {error && (
            <p className="m-0 text-xs text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="rounded-full bg-black px-7 py-3.5 text-white text-base font-medium hover:bg-gray-800 transition-colors cursor-pointer"
          >
            创建账户
          </button>
        </form>

        <p
          className="animate-fade-in-up-soft text-sm text-gray-500 m-0"
          style={{ animationDelay: "460ms" }}
        >
          已经有账户？
          <Link
            to="/login"
            className="ml-1 font-medium text-gray-900 underline underline-offset-2 decoration-gray-900 hover:text-gray-700 transition-colors"
          >
            登录
          </Link>
        </p>
      </div>
    </main>
  );
}
