-- ─────────────────────────────────────────────────────────────────────
-- 0007_verify — requirement_advice 表 + RLS + 索引存在性校验
--
-- 跑法：Supabase Dashboard SQL Editor 逐段粘贴，每段独立运行。
-- ─────────────────────────────────────────────────────────────────────

-- § 1  表存在
SELECT to_regclass('public.requirement_advice') AS requirement_advice_exists;
-- 期望：public.requirement_advice

-- § 2  列结构
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='requirement_advice'
 ORDER BY ordinal_position;
-- 期望：id / goal_mode / requirement_id / one_liner / goal_fit /
--      shortcut_oneliners / source_ref / priority / created_at / updated_at

-- § 3  unique 约束
SELECT conname, pg_get_constraintdef(c.oid)
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
 WHERE t.relname='requirement_advice' AND contype='u';
-- 期望：requirement_advice_goal_mode_requirement_id_key (goal_mode, requirement_id)

-- § 4  CHECK 约束
SELECT conname, pg_get_constraintdef(c.oid)
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
 WHERE t.relname='requirement_advice' AND contype='c';
-- 期望：goal_mode in (...8 modes...) / goal_fit in (best/ok/bad) /
--      one_liner length 8-200 / priority 0-100

-- § 5  索引
SELECT indexname FROM pg_indexes
 WHERE schemaname='public' AND tablename='requirement_advice'
 ORDER BY indexname;
-- 期望：requirement_advice_pkey / idx_req_advice_goal_priority / idx_req_advice_req /
--      requirement_advice_goal_mode_requirement_id_key

-- § 6  RLS 已启用
SELECT relname, relrowsecurity FROM pg_class
 WHERE relnamespace='public'::regnamespace AND relname='requirement_advice';
-- 期望：relrowsecurity = true

-- § 7  策略
SELECT polname, polcmd FROM pg_policy
 WHERE polrelid='public.requirement_advice'::regclass;
-- 期望：advice_read_all / r

-- § 8  Trigger（updated_at）
SELECT tgname FROM pg_trigger
 WHERE tgrelid='public.requirement_advice'::regclass AND NOT tgisinternal;
-- 期望：trg_req_advice_updated_at
