-- =====================================================================
-- 0003_relax_track_scope 跑完后的验证清单
-- 在 Supabase Dashboard → SQL Editor 逐段跑, 看输出是否符合预期
-- =====================================================================


-- ──────────────────────────────────────────────────────────────────────
-- 验证 1  track 表新列存在: scope_level / college; major 改 nullable
-- ──────────────────────────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'track'
  AND column_name IN ('scope_level', 'college', 'major')
ORDER BY column_name;
-- 期望 3 行:
--   college      | text | YES | NULL
--   major        | text | YES | NULL
--   scope_level  | text | NO  | 'school'::text


-- ──────────────────────────────────────────────────────────────────────
-- 验证 2  约束就位: track_scope_level_chk + track_scope_consistency_chk
-- ──────────────────────────────────────────────────────────────────────
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'track'::regclass
  AND contype = 'c'
  AND conname IN ('track_scope_level_chk', 'track_scope_consistency_chk')
ORDER BY conname;
-- 期望 2 行 (CHECK 表达式)


-- ──────────────────────────────────────────────────────────────────────
-- 验证 3  旧 UNIQUE 已删除, 新 UNIQUE INDEX 已建
-- ──────────────────────────────────────────────────────────────────────
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'track'
ORDER BY indexname;
-- 期望:
--   - track_pkey (PK)
--   - idx_track_school_major (旧, 沿用)
--   - idx_track_school_college (新, partial)
--   - idx_track_scope_unique (新 UNIQUE)
-- 不应该再见到 track_school_major_year_unique


-- ──────────────────────────────────────────────────────────────────────
-- 验证 4  插入合法数据: 全校通用 track
--   前置 cleanup: 上一次 verify (0003 / 0004) 若没收尾, 这里先清干净,
--   避免重跑撞 idx_track_scope_unique. CASCADE 自动清下游.
-- ──────────────────────────────────────────────────────────────────────
DELETE FROM track WHERE school = '__TEST__';

INSERT INTO track (school, year, name, scope_level)
VALUES ('__TEST__', 2099, '__全校通用 test__', 'school')
RETURNING id, school, year, scope_level, college, major;
-- 期望 1 行: scope_level='school', college=NULL, major=NULL


-- ──────────────────────────────────────────────────────────────────────
-- 验证 5  插入合法数据: 学院级 track (同 school+year, 不冲突 UNIQUE)
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO track (school, year, name, scope_level, college)
VALUES ('__TEST__', 2099, '__设计学院 test__', 'college', '__设计学院__')
RETURNING id, school, year, scope_level, college, major;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 6  插入合法数据: 专业级 track
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO track (school, year, name, scope_level, college, major)
VALUES ('__TEST__', 2099, '__视传 test__', 'major', '__设计学院__', '__视传__')
RETURNING id, school, year, scope_level, college, major;


-- ──────────────────────────────────────────────────────────────────────
-- 验证 7  CHECK 拦截违规数据 (school 级带 college → 应报错)
-- 注释掉, 取消注释跑一次手动测; 期望报错 track_scope_consistency_chk
-- ──────────────────────────────────────────────────────────────────────
-- INSERT INTO track (school, year, name, scope_level, college)
-- VALUES ('__TEST__', 2099, '__违规__', 'school', '__C__');


-- ──────────────────────────────────────────────────────────────────────
-- 验证 8  UNIQUE 拦截重复 (再插一条「__TEST__ 2099 全校通用」 → 应报错)
-- 注释掉, 取消注释跑一次手动测; 期望报错 idx_track_scope_unique
-- ──────────────────────────────────────────────────────────────────────
-- INSERT INTO track (school, year, name, scope_level)
-- VALUES ('__TEST__', 2099, '__重复__', 'school');


-- ──────────────────────────────────────────────────────────────────────
-- 验证 9  scope_level 三档枚举拦截 (写 'foo' → 应报错)
-- 注释掉, 取消注释跑一次手动测; 期望报错 track_scope_level_chk
-- ──────────────────────────────────────────────────────────────────────
-- INSERT INTO track (school, year, name, scope_level)
-- VALUES ('__TEST__', 2099, '__违规枚举__', 'foo');


-- ──────────────────────────────────────────────────────────────────────
-- Cleanup  删掉所有 __TEST__ 数据
-- ──────────────────────────────────────────────────────────────────────
DELETE FROM track WHERE school = '__TEST__';
-- 期望: 3 行被删 (school/college/major 各一条)
