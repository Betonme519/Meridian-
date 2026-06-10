/**
 * Feedback API —— 用户问题反馈（头像菜单「帮助」→ 弹窗提交）。
 *
 * 数据模型见 supabase/migrations/0014_add_feedback.sql：feedback 表，RLS 只放行
 * 登录用户「以自己身份」INSERT；无 SELECT policy → 前端读不到任何反馈，管理员在
 * Supabase Dashboard 查看。
 *
 * 切后端只动本文件。
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface SubmitFeedbackInput {
  /** 当前登录用户 id（= auth.uid()），RLS 用它校验 with check */
  userId: string;
  email?: string | null;
  message: string;
  /** 提交时所在页面路径，便于定位（可空） */
  page?: string | null;
}

const MAX_LEN = 2000;

/**
 * 提交一条反馈。校验非空 + 限长。失败抛 Error（调用方在弹窗里 catch 显示），
 * 不走全局 errorBus —— 反馈是局部交互，错误就地提示即可。
 *
 * feedback 表未进 `db.ts`（不重跑 gen types），故用 loose 客户端插入。
 */
export async function submitFeedback(input: SubmitFeedbackInput): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase 未配置，暂时无法提交反馈。");
  }
  const message = input.message.trim();
  if (!message) throw new Error("反馈内容不能为空。");

  const sb = supabase as unknown as {
    from: (table: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  };

  const { error } = await sb.from("feedback").insert({
    user_id: input.userId,
    email: input.email ?? null,
    message: message.slice(0, MAX_LEN),
    page: input.page ?? null,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });

  if (error) throw new Error(`提交失败：${error.message}`);
}
