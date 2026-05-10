/**
 * 访客模式（guest mode）开关。
 *
 * 用途：用户在 Login 页点「暂时跳过」后置位，让 `_app.tsx beforeLoad` 放行，
 * 用户可浏览 5 个功能页（dashboard / ai-advisor / course-planner / import / schedule）
 * 而无需注册登录。功能页对未登录态自行做空状态处理（"没有用户数据"）。
 *
 * 存储：`localStorage["meridian_guest_mode"] === "1"` 即为访客态。
 *  - 仅浏览器端有效（SSR 一律视作非访客，由 `_app.tsx` 的 SSR 守卫覆盖）
 *  - try/catch 包住所有 storage 调用，防 Safari 隐私模式 / quota 异常
 *
 * 生命周期：
 *  - 进入：Login 页「暂时跳过」按钮调用 `enterGuestMode()`
 *  - 离开：登录成功 / 注册成功 / 退出登录均调 `exitGuestMode()`，
 *    避免访客标志在状态切换后残留导致门禁被错误绕过
 */

const KEY = "meridian_guest_mode";

export function isGuestMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function enterGuestMode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // 隐私模式 / quota 满 → 静默失败，下一次 beforeLoad 会把用户踢回 /login
  }
}

export function exitGuestMode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
