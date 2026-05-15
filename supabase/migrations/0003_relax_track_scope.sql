-- =====================================================================
-- Meridian — track scope evolution (适用范围三档)
-- Migration: 0003_relax_track_scope
-- Created:   2026-05-15
-- Reference: docs/TRACK_SCHEMA.md (D-track-2 升级版)
--
-- 把 track 的 (school, major, year) UNIQUE 改成支持三档适用范围:
--   scope_level = 'school'   → college NULL, major NULL  (全校通用)
--   scope_level = 'college'  → college 非空, major NULL  (学院通用)
--   scope_level = 'major'    → college / major 都非空   (专业级)
--
-- 改动:
--   - DROP CONSTRAINT track_school_major_year_unique  (旧三元组)
--   - ALTER major DROP NOT NULL                       (school/college 级时为 null)
--   - ADD scope_level text NOT NULL DEFAULT 'school'  (新 enum 列)
--   - ADD college text                                 (新可空列)
--   - ADD CHECK 三档自洽                                (DB 层语义守卫)
--   - CREATE UNIQUE INDEX (school, year, scope_level, COALESCE(college,''), COALESCE(major,''))
--
-- 不动:
--   - RLS policies (track_select_public 沿用)
--   - trigger (trg_track_updated_at 沿用)
--   - 旧索引 idx_track_school_major 沿用 (按 school+major 查仍有用)
--
-- 当前 track 表数据: 空 (0002_verify 的 __TEST__ 行已 cleanup).
-- 跑法: Supabase Dashboard SQL Editor 整片粘贴 → Run. 幂等可重跑.
-- =====================================================================


-- =====================================================================
-- § 1  删除旧 UNIQUE 约束
-- =====================================================================
ALTER TABLE track
  DROP CONSTRAINT IF EXISTS track_school_major_year_unique;


-- =====================================================================
-- § 2  major 允许 NULL (scope_level = 'school' / 'college' 时为 null)
-- =====================================================================
ALTER TABLE track ALTER COLUMN major DROP NOT NULL;


-- =====================================================================
-- § 3  新增 scope_level + college 两列
--   IF NOT EXISTS 让本文件幂等
-- =====================================================================
ALTER TABLE track
  ADD COLUMN IF NOT EXISTS scope_level text NOT NULL DEFAULT 'school',
  ADD COLUMN IF NOT EXISTS college text;


-- =====================================================================
-- § 4  CHECK 约束: scope_level 三档 + 三档语义自洽
-- =====================================================================

-- scope_level 必须是三档之一
ALTER TABLE track DROP CONSTRAINT IF EXISTS track_scope_level_chk;
ALTER TABLE track ADD CONSTRAINT track_scope_level_chk
  CHECK (scope_level IN ('school', 'college', 'major'));

-- 三档语义自洽:
--   school  → college / major 都必须 NULL
--   college → college 必须非空, major 必须 NULL
--   major   → college / major 都必须非空
ALTER TABLE track DROP CONSTRAINT IF EXISTS track_scope_consistency_chk;
ALTER TABLE track ADD CONSTRAINT track_scope_consistency_chk
  CHECK (
    (scope_level = 'school'  AND college IS NULL     AND major IS NULL)
    OR (scope_level = 'college' AND college IS NOT NULL AND major IS NULL)
    OR (scope_level = 'major'   AND college IS NOT NULL AND major IS NOT NULL)
  );


-- =====================================================================
-- § 5  新 UNIQUE INDEX (用 COALESCE 处理 NULL — Postgres 里 NULL ≠ NULL)
--   保证 (school, year) 下每个 (scope_level, college, major) 组合唯一.
--   例: 不会出现两条「华师大 2023 全校通用」.
-- =====================================================================
DROP INDEX IF EXISTS idx_track_scope_unique;
CREATE UNIQUE INDEX idx_track_scope_unique
  ON track (
    school,
    year,
    scope_level,
    COALESCE(college, ''),
    COALESCE(major, '')
  );


-- =====================================================================
-- § 6  辅助索引: 按 college 查所有学院级 / 专业级 track
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_track_school_college
  ON track (school, college)
  WHERE college IS NOT NULL;
