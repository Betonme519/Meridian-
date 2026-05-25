-- ─────────────────────────────────────────────────────────────────────
-- 0008_verify — requirement_link 表 + RLS + 索引 + 5 档 kind CHECK
-- ─────────────────────────────────────────────────────────────────────

-- § 1  表存在
SELECT to_regclass('public.requirement_link') AS requirement_link_exists;

-- § 2  列结构
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='requirement_link'
 ORDER BY ordinal_position;
-- 期望：id / from_req / to_req / kind / bidirectional / metadata / note /
--      source_ref / created_at

-- § 3  unique + check 约束
SELECT conname, contype, pg_get_constraintdef(c.oid)
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
 WHERE t.relname='requirement_link'
 ORDER BY contype, conname;
-- 期望：unique (from_req, to_req, kind) / check kind in (...) /
--      check from_req <> to_req / FK from_req → track_requirement /
--      FK to_req → track_requirement

-- § 4  索引
SELECT indexname FROM pg_indexes
 WHERE schemaname='public' AND tablename='requirement_link'
 ORDER BY indexname;
-- 期望：requirement_link_pkey / idx_req_link_from / idx_req_link_to /
--      idx_req_link_kind / requirement_link_from_req_to_req_kind_key

-- § 5  RLS
SELECT relname, relrowsecurity FROM pg_class
 WHERE relnamespace='public'::regnamespace AND relname='requirement_link';
-- 期望：relrowsecurity = true

-- § 6  策略
SELECT polname, polcmd FROM pg_policy
 WHERE polrelid='public.requirement_link'::regclass;
-- 期望：link_read_all / r
