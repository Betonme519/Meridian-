import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as profileApi from "@/api/profileApi";
import type { Profile, ProfilePatch } from "@/api/profileApi";
import { useAuth } from "@/hooks/useAuth";

/**
 * ProfileContext — 应用级 profile 态，跟 AuthContext 分开。
 *
 * 设计意图：
 *  - AuthContext 标"不要修改"（公共 API 已稳定）；profile 字段单独走 Provider
 *  - 监听 useAuth 的 user.id：登入 → 拉 profile；登出 → 清 profile
 *  - 兜底创建：getProfile 返回 null（trigger 失败 / 历史账号漏建）→ upsert 一条
 *  - updateProfile 乐观更新：先 setState，再异步写 DB；失败 revert + 暴露 error
 *
 * 公共 API：
 *   profile        当前 profile，未登录或加载中为 null
 *   loading        首次拉取 / 兜底创建是否进行中
 *   error          最近一次操作的错误（不阻断渲染，UI 自行决定如何展示）
 *   updateProfile  乐观更新单字段或多字段
 *   refresh        强制重拉（多 tab 同步 / 失败重试）
 *
 * 切后端只动 src/api/profileApi.ts，本文件不变。
 */

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 防 race：用户快速切换账号时，旧 fetch 完成不应覆盖新结果
  const requestIdRef = useRef(0);

  const loadProfile = useCallback(
    async (userId: string, fallbackName: string | null) => {
      const reqId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        let p = await profileApi.getProfile(userId);
        if (!p) {
          // 兜底创建：trigger 没跑或历史账号漏建
          p = await profileApi.upsertProfile(userId, { name: fallbackName });
        }
        if (reqId !== requestIdRef.current) return; // 被新请求覆盖了，丢弃
        setProfile(p);
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        const msg = e instanceof Error ? e.message : "加载 profile 失败";
        setError(msg);
        setProfile(null);
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    },
    [],
  );

  // 跟 useAuth 的 user 同步
  useEffect(() => {
    if (authLoading) return; // auth 还没初始化完，等
    if (!user) {
      // 登出 / 访客 → 清掉 profile
      requestIdRef.current++; // 取消进行中的 fetch
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }
    // 当前 profile 已是这个用户的，无需重拉
    if (profile?.id === user.id) return;
    void loadProfile(user.id, user.name ?? null);
    // profile 故意不进 deps —— 我们只在 user.id 变化时触发拉取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, loadProfile]);

  const refresh = useCallback(async () => {
    if (!user) return;
    await loadProfile(user.id, user.name ?? null);
  }, [user, loadProfile]);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!user || !profile) {
        // 不抛错；调用方一般是 UI 事件回调，无 user/profile 就静默
        return;
      }
      // 乐观更新
      const prev = profile;
      const next: Profile = { ...profile, ...patch } as Profile;
      setProfile(next);
      setError(null);
      try {
        const saved = await profileApi.updateProfile(user.id, patch);
        if (saved) {
          setProfile(saved); // 服务器回传的最权威（updated_at 等）
        }
      } catch (e) {
        // revert
        setProfile(prev);
        const msg = e instanceof Error ? e.message : "保存 profile 失败";
        setError(msg);
        throw e; // 让调用方有机会感知
      }
    },
    [user, profile],
  );

  return (
    <ProfileContext.Provider
      value={{ profile, loading, error, updateProfile, refresh }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfileContext must be used within <ProfileProvider>");
  }
  return ctx;
}
