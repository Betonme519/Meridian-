-- =====================================================================
-- 0004_add_source_ref 跑完后的验证清单
-- 在 Supabase Dashboard → SQL Editor 逐段跑, 看输出是否符合预期
-- =====================================================================


-- ──────────────────────────────────────────────────────────────────────
-- 验证 1  track_requirement.source_ref 存在 + text + 可空 + 无默认
-- ──────────────────────────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'track_requirement'
  AND column_name = 'source_ref';
-- 期望 1 行:
--   source_ref | text | YES | NULL


-- ──────────────────────────────────────────────────────────────────────
-- 验证 2  track_option.source_ref 存在 + text + 可空 + 无默认
-- ──────────────────────────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'track_option'
  AND column_name = 'source_ref';
-- 期望 1 行:
--   source_ref | text | YES | NULL


-- ──────────────────────────────────────────────────────────────────────
-- 验证 3  COMMENT ON COLUMN 已写入
-- ──────────────────────────────────────────────────────────────────────
SELECT
  c.relname AS table_name,
  a.attname AS column_name,
  pg_catalog.col_description(a.attrelid, a.attnum) AS comment
FROM pg_catalog.pg_attribute a
JOIN pg_catalog.pg_class c     ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('track_requirement','track_option')
  AND a.attname = 'source_ref'
ORDER BY c.relname;
-- 期望 2 行, comment 列非空 (内容前缀「原始规则来源」)


-- ──────────────────────────────────────────────────────────────────────
-- 验证 4  端到端插入: requirement / option 带 source_ref 能写也能读
--   自建临时 track + category + requirement + option, 由本段末尾的
--   DELETE FROM track WHERE school='__TEST__' 通过 CASCADE 链路一次清掉.
-- ──────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_track_id        uuid;
  v_category_id     uuid;
  v_requirement_id  uuid;
  v_option_id       uuid;
BEGIN
  -- 前置 cleanup: 上一次 verify (0003 / 0004) 若没收尾, 这里先清干净.
  -- CASCADE 自动清下游 category / requirement / option.
  DELETE FROM track WHERE school = '__TEST__';

  -- 临时 track (school 级, 不踩 0003 三档约束)
  INSERT INTO track (school, year, name, scope_level)
  VALUES ('__TEST__', 2099, '__T 0004__', 'school')
  RETURNING id INTO v_track_id;

  -- 临时 category
  INSERT INTO track_category (track_id, code, title, order_index)
  VALUES (v_track_id, '__CAT__', '__测试分类__', 0)
  RETURNING id INTO v_category_id;

  -- 带 source_ref 的 requirement (kind=credits 必须填 threshold)
  INSERT INTO track_requirement
    (track_id, category_id, code, title, kind, threshold, source_ref)
  VALUES
    (v_track_id, v_category_id, '__REQ__', '__测试规则__',
     'credits', 12, 'ecnu_rules_digest_A.md §A1-6')
  RETURNING id INTO v_requirement_id;

  -- 带 source_ref 的 option (kind=course 必须填 credits)
  INSERT INTO track_option
    (track_id, requirement_id, kind, code, name, credits, source_ref)
  VALUES
    (v_track_id, v_requirement_id, 'course', '__OPT__', '__测试课__',
     3, 'ecnu_rules_digest_A.md §A1-6')
  RETURNING id INTO v_option_id;

  RAISE NOTICE 'requirement.source_ref = %',
    (SELECT source_ref FROM track_requirement WHERE id = v_requirement_id);
  RAISE NOTICE 'option.source_ref      = %',
    (SELECT source_ref FROM track_option WHERE id = v_option_id);
END
$$;


-- ──────────────────────────────────────────────────────────────────────
-- Cleanup  删 __TEST__ track, CASCADE 自动清 category / requirement / option
-- ──────────────────────────────────────────────────────────────────────
DELETE FROM track WHERE school = '__TEST__';
-- 期望: 1 行 track 被删; CASCADE 链路自动清 category / requirement / option
