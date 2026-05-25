-- ─────────────────────────────────────────────────────────────────────
-- 0009_verify — user_requirement_done 表存在性 / RLS / 索引 校验
-- ─────────────────────────────────────────────────────────────────────

-- § 1  表存在
SELECT to_regclass('public.user_requirement_done') AS table_exists;
-- 期望：public.user_requirement_done

-- § 2  列结构
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='user_requirement_done'
 ORDER BY ordinal_position;
-- 期望：id / user_id / requirement_id / note / created_at / updated_at

-- § 3  unique + FK 约束
SELECT conname, contype, pg_get_constraintdef(c.oid)
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
 WHERE t.relname='user_requirement_done'
 ORDER BY contype, conname;
-- 期望：unique (user_id, requirement_id) / FK user_id / FK requirement_id

-- § 4  索引
SELECT indexname FROM pg_indexes
 WHERE schemaname='public' AND tablename='user_requirement_done'
 ORDER BY indexname;
-- 期望：user_requirement_done_pkey / idx_urd_user / idx_urd_req /
--      user_requirement_done_user_id_requirement_id_key

-- § 5  RLS
SELECT relname, relrowsecurity FROM pg_class
 WHERE relnamespace='public'::regnamespace AND relname='user_requirement_done';
-- 期望：relrowsecurity = true

-- § 6  策略
SELECT polname, polcmd, polqual::text FROM pg_policy
 WHERE polrelid='public.user_requirement_done'::regclass;
-- 期望：urd_owner_all / * (ALL) / (auth.uid() = user_id)

-- § 7  trigger
SELECT tgname FROM pg_trigger
 WHERE tgrelid='public.user_requirement_done'::regclass AND NOT tgisinternal;
-- 期望：trg_urd_updated_at
