-- ─────────────────────────────────────────────────────────────────────
-- Migration template — copy 后改名为 000N_<verb>_<noun>.sql
-- 配套 verify：另写 000N_verify.sql（逐段独立可粘）
--
-- 规约（详见 docs/SCHEMA_EVOLUTION.md）：
--   1. UP 段必须幂等：DROP IF EXISTS / CREATE IF NOT EXISTS / ON CONFLICT
--   2. 必须配 verify 文件，列每张表 / 每条 policy / 每条 trigger 的存在性查询
--   3. 必须配文件末尾 DOWN 注释段（不执行，给人工回滚 / 后人审计）
--   4. 跑 migration：Supabase Dashboard SQL Editor 粘贴 → 全选 → Run
--   5. 命名：动词 + 名词（add_x_schema / relax_x_scope / extend_x_kinds / seed_x_data）
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================
-- UP — apply this migration
-- ============================================================

-- § 1  示例：建表
-- CREATE TABLE IF NOT EXISTS public.example (
--     id          uuid primary key default gen_random_uuid(),
--     user_id     uuid not null references auth.users(id) on delete cascade,
--     name        text not null,
--     created_at  timestamptz not null default now(),
--     updated_at  timestamptz not null default now()
-- );

-- § 2  示例：索引
-- CREATE INDEX IF NOT EXISTS idx_example_user ON public.example(user_id);

-- § 3  示例：RLS
-- ALTER TABLE public.example ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS example_owner_select ON public.example;
-- CREATE POLICY example_owner_select ON public.example
--     FOR SELECT USING (auth.uid() = user_id);

-- § 4  示例：trigger（沿用 0001_init_schema.sql 中已建的 set_updated_at 函数）
-- DROP TRIGGER IF EXISTS trg_example_updated_at ON public.example;
-- CREATE TRIGGER trg_example_updated_at
--     BEFORE UPDATE ON public.example
--     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- DOWN  (manual, DO NOT EXEC)
-- ============================================================
--
-- 误跑回滚步骤参考：
--   1. 先在 Supabase Dashboard 备份当前数据（Database → Backups → On-demand）
--   2. 再人工粘贴下面的 SQL（按依赖反序）
--   3. 验证 0(N-1)_verify.sql 全段返回预期值
--
-- DROP TRIGGER  IF EXISTS trg_example_updated_at ON public.example;
-- DROP POLICY   IF EXISTS example_owner_select   ON public.example;
-- DROP INDEX    IF EXISTS public.idx_example_user;
-- DROP TABLE    IF EXISTS public.example;
--
-- ⚠️ 涉及 DROP COLUMN / DROP TABLE 的 migration，DOWN 段无法恢复数据。
--    生产期回滚必须先恢复备份再跑 DOWN。
