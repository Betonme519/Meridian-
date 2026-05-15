-- =====================================================================
-- Meridian — track schema (毕业路径五层结构)
-- Migration: 0002_add_track_schema
-- Created:   2026-05-15
-- Reference: docs/TRACK_SCHEMA.md
--
-- 5 张表:
--   track / track_category / track_requirement / track_option   公共可读, service_role 写
--   user_progress                                                owner-only
--
-- + 5 个 trg_<table>_updated_at trigger (沿用 0001 的 set_updated_at)
-- + 5 表 RLS:
--     - track_* 四张: SELECT USING (true), 其余不写 policy → 默认拒
--                    service_role bypass RLS, seed SQL 在 SQL Editor 跑即可
--     - user_progress: 4 条 owner-only policy (沿用 0001 通用模板)
--
-- 跑法:  Supabase Dashboard → SQL Editor → 整片粘贴 → Run
--        失败时整个事务回滚, 修完重跑即可 (本文件幂等)
--
-- 依赖:  0001 必须先跑 (set_updated_at trigger 函数 + auth.users 引用)
-- =====================================================================


-- =====================================================================
-- § 1  track   (公共表)
-- =====================================================================
CREATE TABLE IF NOT EXISTS track (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school         text NOT NULL,
  major          text NOT NULL,
  year           smallint NOT NULL,
  name           text NOT NULL,
  version        text,
  source_url     text,
  total_credits  numeric(5,1),
  description    text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT track_year_range CHECK (year BETWEEN 1990 AND 2099),
  CONSTRAINT track_school_major_year_unique UNIQUE (school, major, year)
);

CREATE INDEX IF NOT EXISTS idx_track_school_major ON track (school, major);

ALTER TABLE track ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS track_select_public ON track;
CREATE POLICY track_select_public ON track
  FOR SELECT USING (true);
-- INSERT/UPDATE/DELETE 不写 policy → 普通用户默认拒, service_role bypass RLS

DROP TRIGGER IF EXISTS trg_track_updated_at ON track;
CREATE TRIGGER trg_track_updated_at
  BEFORE UPDATE ON track
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- § 2  track_category   (公共表)
-- =====================================================================
CREATE TABLE IF NOT EXISTS track_category (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id       uuid NOT NULL REFERENCES track(id) ON DELETE CASCADE,
  code           text NOT NULL,
  title          text NOT NULL,
  order_index    smallint NOT NULL DEFAULT 0,
  credit_target  numeric(5,1),
  description    text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT track_category_code_unique UNIQUE (track_id, code)
);

CREATE INDEX IF NOT EXISTS idx_track_category_track_order
  ON track_category (track_id, order_index);

ALTER TABLE track_category ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS track_category_select_public ON track_category;
CREATE POLICY track_category_select_public ON track_category
  FOR SELECT USING (true);

DROP TRIGGER IF EXISTS trg_track_category_updated_at ON track_category;
CREATE TRIGGER trg_track_category_updated_at
  BEFORE UPDATE ON track_category
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- § 3  track_requirement   (公共表)
-- =====================================================================
CREATE TABLE IF NOT EXISTS track_requirement (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id      uuid NOT NULL REFERENCES track(id) ON DELETE CASCADE,
  category_id   uuid NOT NULL REFERENCES track_category(id) ON DELETE CASCADE,
  code          text NOT NULL,
  title         text NOT NULL,
  order_index   smallint NOT NULL DEFAULT 0,
  kind          text NOT NULL DEFAULT 'count',
  threshold     numeric(5,1),
  description   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT track_requirement_code_unique UNIQUE (category_id, code),
  CONSTRAINT track_requirement_kind_chk
    CHECK (kind IN ('count','credits','one_of','all_of')),
  CONSTRAINT track_requirement_threshold_chk
    CHECK (kind = 'all_of' OR threshold IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_track_requirement_track
  ON track_requirement (track_id);
CREATE INDEX IF NOT EXISTS idx_track_requirement_category
  ON track_requirement (category_id, order_index);

ALTER TABLE track_requirement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS track_requirement_select_public ON track_requirement;
CREATE POLICY track_requirement_select_public ON track_requirement
  FOR SELECT USING (true);

DROP TRIGGER IF EXISTS trg_track_requirement_updated_at ON track_requirement;
CREATE TRIGGER trg_track_requirement_updated_at
  BEFORE UPDATE ON track_requirement
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- § 4  track_option   (公共表)
-- =====================================================================
CREATE TABLE IF NOT EXISTS track_option (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id        uuid NOT NULL REFERENCES track(id) ON DELETE CASCADE,
  requirement_id  uuid NOT NULL REFERENCES track_requirement(id) ON DELETE CASCADE,
  kind            text NOT NULL DEFAULT 'course',
  code            text NOT NULL,
  name            text NOT NULL,
  credits         numeric(4,1),
  semester_hint   text,
  prerequisites   text[] NOT NULL DEFAULT '{}'::text[],
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT track_option_code_unique UNIQUE (requirement_id, code),
  CONSTRAINT track_option_kind_chk
    CHECK (kind IN ('course','alt','project')),
  CONSTRAINT track_option_course_credits_chk
    CHECK (kind <> 'course' OR credits IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_track_option_track
  ON track_option (track_id);
CREATE INDEX IF NOT EXISTS idx_track_option_requirement
  ON track_option (requirement_id);
CREATE INDEX IF NOT EXISTS idx_track_option_code
  ON track_option (track_id, code);

ALTER TABLE track_option ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS track_option_select_public ON track_option;
CREATE POLICY track_option_select_public ON track_option
  FOR SELECT USING (true);

DROP TRIGGER IF EXISTS trg_track_option_updated_at ON track_option;
CREATE TRIGGER trg_track_option_updated_at
  BEFORE UPDATE ON track_option
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- § 5  user_progress   (owner-only)
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id    uuid NOT NULL REFERENCES track(id) ON DELETE CASCADE,
  option_id   uuid NOT NULL REFERENCES track_option(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'planned',
  grade       text,
  semester    text,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_progress_user_option_unique UNIQUE (user_id, option_id),
  CONSTRAINT user_progress_status_chk
    CHECK (status IN ('planned','enrolled','done','waived','dropped'))
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_track
  ON user_progress (user_id, track_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_status
  ON user_progress (user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_progress_option
  ON user_progress (option_id);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_progress_select_owner ON user_progress;
CREATE POLICY user_progress_select_owner ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_progress_insert_owner ON user_progress;
CREATE POLICY user_progress_insert_owner ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_progress_update_owner ON user_progress;
CREATE POLICY user_progress_update_owner ON user_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_progress_delete_owner ON user_progress;
CREATE POLICY user_progress_delete_owner ON user_progress
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_user_progress_updated_at ON user_progress;
CREATE TRIGGER trg_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
