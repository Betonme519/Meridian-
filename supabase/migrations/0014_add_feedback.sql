-- ─────────────────────────────────────────────────────────────────────
-- 0014_add_feedback — 用户问题反馈（头像菜单「帮助」→ 弹窗提交）
--
-- 设计：登录用户提交反馈 → feedback 表。**只放行 INSERT**，不建 SELECT/UPDATE/
-- DELETE policy → 普通客户端（anon / authed）读不到任何行；管理员在 Supabase
-- Dashboard（Table Editor，service_role 绕过 RLS）查看。照 0009 的 owner 模式，
-- 但权限收窄到「以自己身份插入」。
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================
-- UP — apply this migration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feedback (
    id          uuid primary key default gen_random_uuid(),
    -- 提交者；用户注销后保留反馈内容（set null 不级联删）
    user_id     uuid references auth.users(id) on delete set null,
    email       text,
    message     text not null,
    -- 提交时所在页面路径（如 /course-planner），便于定位
    page        text,
    user_agent  text,
    created_at  timestamptz not null default now()
);

-- 按时间倒序拉最新反馈（后台查看高频）
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at desc);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 仅登录用户可以「以自己身份」插入；anon（auth.uid() 为 null）被拒。
-- 没有 SELECT policy → 任何前端都读不到 → 反馈不会泄露给其他用户。
DROP POLICY IF EXISTS feedback_insert_self ON public.feedback;
CREATE POLICY feedback_insert_self ON public.feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DOWN  (manual, DO NOT EXEC)
-- ============================================================
--
-- DROP POLICY IF EXISTS feedback_insert_self ON public.feedback;
-- DROP INDEX  IF EXISTS public.idx_feedback_created;
-- DROP TABLE  IF EXISTS public.feedback;
