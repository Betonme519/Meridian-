-- =====================================================================
-- ⚠️  历史快照: 本文件对应 0002 跑完时的 schema 状态.
--     0003_relax_track_scope 已演进 track 表 (major nullable / 新增 scope_level + college /
--     CHECK 三档自洽 / 新 UNIQUE INDEX 取代旧三元组). 0003 跑通后请改用 0003_verify.sql.
--     本文件留作历史参考, 重跑里面的 INSERT 也仍合法 (major 现在可空, 旧三元组不再唯一约束).
-- =====================================================================
-- 0002_add_track_schema 跑完后的验证清单
-- 在 Supabase Dashboard → SQL Editor 逐段跑, 看输出是否符合预期
-- =====================================================================


-- ──────────────────────────────────────────────────────────────────────
-- 验证 1  5 张表是否都建出来了 (期望 5 行)
-- ──────────────────────────────────────────────────────────────────────
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('track','track_category','track_requirement','track_option','user_progress')
ORDER BY tablename;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 2  RLS 是否全开 (期望 5 行, rowsecurity 全 t)
-- ──────────────────────────────────────────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('track','track_category','track_requirement','track_option','user_progress')
ORDER BY tablename;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 3  policy 数量
--   track / track_category / track_requirement / track_option  : 各 1 (只 SELECT public)
--   user_progress                                                : 4 (owner CRUD)
--   合计 8
-- ──────────────────────────────────────────────────────────────────────
SELECT tablename, COUNT(*) AS policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('track','track_category','track_requirement','track_option','user_progress')
GROUP BY tablename
ORDER BY tablename;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 4  trigger 数量 (5 张表每张 1 个 trg_<table>_updated_at)
-- ──────────────────────────────────────────────────────────────────────
SELECT
  event_object_table  AS table_name,
  trigger_name
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('track','track_category','track_requirement','track_option','user_progress')
ORDER BY event_object_table, trigger_name;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 5  公共表 SELECT 跑通 (track 当前空, 期望 0 行不报错)
-- ──────────────────────────────────────────────────────────────────────
SELECT COUNT(*) AS track_rows FROM track;
SELECT COUNT(*) AS category_rows FROM track_category;
SELECT COUNT(*) AS requirement_rows FROM track_requirement;
SELECT COUNT(*) AS option_rows FROM track_option;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 6  普通用户写公共表会被拒
-- (在 SQL Editor 右上角切到 "authenticated" 角色跑, 期望报 RLS 拒绝)
-- 默认 SQL Editor 是 service_role 会 bypass, 这条不切角色测不了
-- ──────────────────────────────────────────────────────────────────────
-- INSERT INTO track (school, major, year, name)
-- VALUES ('TEST', 'TEST', 2024, 'TEST') RETURNING id;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 7  service_role 写公共表能写 (跑完记得 cleanup)
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO track (school, major, year, name)
VALUES ('__TEST__', '__TEST__', 2099, '__TEST track 验证__')
RETURNING id, school, major, year, name, created_at;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 8  CASCADE 删除链路: 删 track → category / requirement / option / user_progress 全跟删
-- (先临时插 → 删 → 期望各子表 0 行)
-- ──────────────────────────────────────────────────────────────────────
WITH t AS (SELECT id FROM track WHERE school = '__TEST__' AND year = 2099)
INSERT INTO track_category (track_id, code, title)
SELECT id, 'test-cat', '__TEST category__' FROM t
RETURNING id;

DELETE FROM track WHERE school = '__TEST__' AND year = 2099;

SELECT COUNT(*) AS remaining FROM track_category WHERE code = 'test-cat';
-- 期望 0 (CASCADE 已跟删)


-- ──────────────────────────────────────────────────────────────────────
-- 验证 9  user_progress owner-only RLS 实战
-- ──────────────────────────────────────────────────────────────────────
-- 跳过: track / option 还没 seed, 没法插一条真 user_progress 测.
-- 等排队 10 灌入学校数据后再回来验.
