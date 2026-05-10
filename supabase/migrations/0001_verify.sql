-- =====================================================================
-- 0001_init_schema 跑完后的验证清单
-- 在 Supabase Dashboard → SQL Editor 逐段跑, 看输出是否符合预期
-- =====================================================================


-- ──────────────────────────────────────────────────────────────────────
-- 验证 1  7 张表是否都建出来了 (期望 7 行)
-- ──────────────────────────────────────────────────────────────────────
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles','rag_source','course','plan','rule','rule_conflict','chat_message')
ORDER BY tablename;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 2  RLS 是否全开 (期望 7 行, rowsecurity 全 t)
-- ──────────────────────────────────────────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles','rag_source','course','plan','rule','rule_conflict','chat_message')
ORDER BY tablename;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 3  policy 数量 (期望: profiles 3 / chat_message 3 / 其他每表 4 / 总计 25)
-- ──────────────────────────────────────────────────────────────────────
SELECT tablename, COUNT(*) AS policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles','rag_source','course','plan','rule','rule_conflict','chat_message')
GROUP BY tablename
ORDER BY tablename;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 4  trigger 数量
--   profiles / rag_source / course / plan / rule         : 1 (updated_at)
--   rule_conflict                                         : 2 (updated_at + owner_check)
--   chat_message                                          : 0
--   auth.users                                            : 1 (on_auth_user_created)
-- ──────────────────────────────────────────────────────────────────────
SELECT
  event_object_schema AS schema,
  event_object_table  AS table,
  trigger_name
FROM information_schema.triggers
WHERE event_object_schema IN ('public','auth')
  AND trigger_name LIKE 'trg_%' OR trigger_name = 'on_auth_user_created'
ORDER BY event_object_schema, event_object_table, trigger_name;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 5  backfill 跑通了吗? 当前用户应该有一行 profile
-- ──────────────────────────────────────────────────────────────────────
SELECT id, name, school, major, grade, target_gpa, goal_mode, created_at
FROM profiles
WHERE id = auth.uid();


-- ──────────────────────────────────────────────────────────────────────
-- 验证 6  RLS 实战测试: 当前 user 可以写 course
-- (跑完记得删掉这条 test row, 见下面 cleanup)
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO course (user_id, code, name, status)
VALUES (auth.uid(), 'TEST 101', '测试课程', 'planned')
RETURNING id, code, name, status, created_at;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 7  没登录 (anon role) 应该读不到 course
-- 在 SQL Editor 右上角切到 "anon" 角色再跑这条, 期望返回 0 行
-- ──────────────────────────────────────────────────────────────────────
SELECT COUNT(*) AS visible_rows FROM course;


-- ──────────────────────────────────────────────────────────────────────
-- Cleanup  删掉刚才插的 test row
-- ──────────────────────────────────────────────────────────────────────
DELETE FROM course WHERE code = 'TEST 101' AND user_id = auth.uid();
