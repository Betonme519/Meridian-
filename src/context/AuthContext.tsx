import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@/api/authApi";
import type { AuthUser } from "@/api/authApi";

/**
 * AuthContext — 应用级用户态。后端是 Supabase（见 src/api/authApi.ts）。
 *
 *  - 首次加载：调 `getCurrentUser` 拉当前 session
 *  - 订阅 `onAuthChange`：多 tab 同步登出 / 静默刷新 token / 跨页签登录
 *  - login / register / logout 主动 setUser，避免等订阅事件的一次 tick 延迟
 *
 * 切后端只动 `authApi.ts`，本文件不变。
 */

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const u = await authApi.getCurrentUser();
      if (!cancelled) {
        setUser(u);
        setLoading(false);
      }
    })();

    const unsubscribe = authApi.onAuthChange((u) => {
      if (!cancelled) setUser(u);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    setUser(session.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const session = await authApi.register(email, password, name);
    setUser(session.user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}
