-- =====================================================================
-- 0006_extend_requirement_kinds 跑完后的验证清单
-- 在 Supabase Dashboard → SQL Editor 逐段跑, 看输出是否符合预期
-- =====================================================================


-- ──────────────────────────────────────────────────────────────────────
-- 验证 1  CHECK 已扩到 12 档枚举
-- ──────────────────────────────────────────────────────────────────────
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'track_requirement'::regclass
  AND contype = 'c'
  AND conname IN ('track_requirement_kind_chk', 'track_requirement_threshold_chk')
ORDER BY conname;
-- 期望 2 行:
--   track_requirement_kind_chk      | CHECK (kind = ANY (ARRAY['count','credits',...,'program_rule']))
--   track_requirement_threshold_chk | CHECK (kind='all_of' OR threshold IS NOT NULL OR metadata <> '{}'::jsonb)


-- ──────────────────────────────────────────────────────────────────────
-- 验证 2  metadata 列存在 + jsonb + NOT NULL + DEFAULT '{}'
-- ──────────────────────────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'track_requirement'
  AND column_name = 'metadata';
-- 期望 1 行:
--   metadata | jsonb | NO | '{}'::jsonb


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
  AND c.relname = 'track_requirement'
  AND a.attname = 'metadata';
-- 期望 1 行, comment 列以 "规则细节" 开头


-- ──────────────────────────────────────────────────────────────────────
-- 验证 4  端到端 INSERT: 8 个新 canonical kind 各插一条 + metadata 形态测试
--   自建临时 track + category, 末段 CASCADE cleanup. 前置 cleanup 防重跑撞.
-- ──────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_track_id     uuid;
  v_category_id  uuid;
BEGIN
  -- 前置 cleanup: 上一次 verify 若没收尾, 这里先清干净
  DELETE FROM track WHERE school = '__TEST__';

  INSERT INTO track (school, year, name, scope_level)
  VALUES ('__TEST__', 2099, '__T 0006__', 'school')
  RETURNING id INTO v_track_id;

  INSERT INTO track_category (track_id, code, title, order_index)
  VALUES (v_track_id, '__CAT__', '__测试分类__', 0)
  RETURNING id INTO v_category_id;

  -- 8 个新 kind 各一条 (metadata 形态参考 track_kind_taxonomy.md)
  INSERT INTO track_requirement (track_id, category_id, code, title, kind, threshold, metadata) VALUES
    (v_track_id, v_category_id, '__T1__', '最长学习年限', 'time_limit',
       6, '{"unit":"year","direction":"upper"}'::jsonb),
    (v_track_id, v_category_id, '__T2__', 'GPA 学位阈值', 'gpa_threshold',
       2.0, '{"scope":"degree_apply","scale":"4.0"}'::jsonb),
    (v_track_id, v_category_id, '__T3__', '毕业资格三档', 'status_gate',
       NULL, '{"tiers":[{"name":"毕业","pct":100},{"name":"结业","pct":90}]}'::jsonb),
    (v_track_id, v_category_id, '__T4__', '退学线', 'warning_threshold',
       10, '{"trigger":"credits_per_semester<10%","action":"dropout"}'::jsonb),
    (v_track_id, v_category_id, '__T5__', '出勤要求', 'assessment_rule',
       NULL, '{"check":"attendance","min":"2/3"}'::jsonb),
    (v_track_id, v_category_id, '__T6__', '五级记分', 'score_scheme',
       NULL, '{"mapping":{"A":[90,100],"B":[80,89]}}'::jsonb),
    (v_track_id, v_category_id, '__T7__', '超额学分单价', 'tuition',
       165, '{"unit":"yuan_per_credit","international":300}'::jsonb),
    (v_track_id, v_category_id, '__T8__', '辅修学分要求', 'program_rule',
       NULL, '{"module":"minor","credit_range":[28,40]}'::jsonb);

  RAISE NOTICE 'inserted 8 new-kind requirements, kinds = %',
    (SELECT array_agg(kind ORDER BY code) FROM track_requirement WHERE track_id = v_track_id);
  RAISE NOTICE 'sample metadata (T8) = %',
    (SELECT metadata FROM track_requirement WHERE track_id = v_track_id AND code = '__T8__');
END
$$;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 5  CHECK 拦截违规 kind (写 'foo' → 应报错)
-- 注释掉, 取消注释跑一次手动测; 期望报错 track_requirement_kind_chk
-- ──────────────────────────────────────────────────────────────────────
-- INSERT INTO track_requirement (track_id, category_id, code, title, kind, threshold)
-- SELECT id, (SELECT id FROM track_category WHERE track_id = t.id LIMIT 1),
--        '__BAD__', '__违规__', 'foo', 1
-- FROM track t WHERE school = '__TEST__' LIMIT 1;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 6  threshold + metadata 都空, kind != 'all_of' → 应报错
-- 注释掉, 取消注释跑一次手动测; 期望报错 track_requirement_threshold_chk
-- ──────────────────────────────────────────────────────────────────────
-- INSERT INTO track_requirement (track_id, category_id, code, title, kind)
-- SELECT id, (SELECT id FROM track_category WHERE track_id = t.id LIMIT 1),
--        '__BAD2__', '__违规2__', 'count'
-- FROM track t WHERE school = '__TEST__' LIMIT 1;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 7  threshold 空但 metadata 非空 + kind != 'all_of' → 应通过 (新规则)
--   验证 4 里的 T3 / T5 / T6 / T8 就是这种情况, 已经测过 — 这段冗余, 保留作示意
-- ──────────────────────────────────────────────────────────────────────
-- 见验证 4 NOTICE 输出 (kinds 列表含 status_gate / assessment_rule / score_scheme / program_rule)


-- ──────────────────────────────────────────────────────────────────────
-- Cleanup  删 __TEST__ track, CASCADE 自动清下游
-- ──────────────────────────────────────────────────────────────────────
DELETE FROM track WHERE school = '__TEST__';
-- 期望: 1 行 track 被删; CASCADE 链路自动清 category / requirement
