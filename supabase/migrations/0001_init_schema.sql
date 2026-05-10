-- =====================================================================
-- Meridian — initial schema
-- Migration: 0001_init_schema
-- Created:   2026-05-10
-- Reference: docs/DATA_MODEL.md
--
-- 6 业务表 (profiles / course / plan / rule / rule_conflict / chat_message)
-- + 1 RAG 表 (rag_source)
-- + 3 trigger 函数 (set_updated_at / handle_new_user / check_rule_conflict_owner)
-- + 6 表 RLS (24 policies, profiles 无 DELETE / chat_message 无 UPDATE)
-- + auth.users INSERT trigger + 旧账号 backfill
--
-- 跑法:  Supabase Dashboard → SQL Editor → 整片粘贴 → Run
--        失败时整个事务回滚, 修完重跑即可 (本文件幂等)
--
-- Storage bucket (rag_sources) 在 § 10, 默认注释掉, 推荐走 Dashboard UI
-- =====================================================================


-- =====================================================================
-- § 0  扩展
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =====================================================================
-- § 1  Helper 函数
-- =====================================================================

-- 通用 updated_at 维护
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- auth.users INSERT 后自动建 profiles
-- SECURITY DEFINER + search_path 必需: trigger 函数得以 owner 权限
-- 才能跨 schema 写 public.profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

-- rule_conflict 用户一致性校验
-- 防止用户用别人的 rule_id 拼凑 conflict 记录 (污染表, 不泄漏数据但不优雅)
CREATE OR REPLACE FUNCTION check_rule_conflict_owner()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT user_id FROM rule WHERE id = NEW.rule_a_id) <> NEW.user_id
  OR (SELECT user_id FROM rule WHERE id = NEW.rule_b_id) <> NEW.user_id THEN
    RAISE EXCEPTION 'rule_a/rule_b must belong to the same user_id';
  END IF;
  RETURN NEW;
END $$;


-- =====================================================================
-- § 2  profiles
-- =====================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text,
  school        text,
  major         text,
  grade         smallint,
  target_gpa    numeric(3,2),
  goal_mode     text DEFAULT '高 GPA' CHECK (goal_mode IN
                  ('高 GPA','最轻松毕业','保研路线','留学路线','实习优先',
                   '时间自由','低压力模式','个性化定制')),
  goal_weights  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_owner ON profiles;
CREATE POLICY profiles_select_owner ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_owner ON profiles;
CREATE POLICY profiles_insert_owner ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_owner ON profiles;
CREATE POLICY profiles_update_owner ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- 无 DELETE policy: 删账号才会删 profiles, 走 auth.users CASCADE

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- § 3  rag_source  (先于 rule, rule.rag_source_id FK 引用)
-- =====================================================================
CREATE TABLE IF NOT EXISTS rag_source (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text NOT NULL,
  kind           text NOT NULL CHECK (kind IN ('培养方案','成绩单','课表','手册','其它')),
  mime           text,
  size_bytes     bigint,
  storage_path   text NOT NULL,
  parsed_status  text NOT NULL DEFAULT 'pending'
                 CHECK (parsed_status IN ('pending','parsing','parsed','failed')),
  parsed_text    text,
  parse_error    text,
  parsed_at      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_user_kind   ON rag_source (user_id, kind);
CREATE INDEX IF NOT EXISTS idx_rag_user_status ON rag_source (user_id, parsed_status);

ALTER TABLE rag_source ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rag_source_select_owner ON rag_source;
CREATE POLICY rag_source_select_owner ON rag_source
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS rag_source_insert_owner ON rag_source;
CREATE POLICY rag_source_insert_owner ON rag_source
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS rag_source_update_owner ON rag_source;
CREATE POLICY rag_source_update_owner ON rag_source
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS rag_source_delete_owner ON rag_source;
CREATE POLICY rag_source_delete_owner ON rag_source
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_rag_source_updated_at ON rag_source;
CREATE TRIGGER trg_rag_source_updated_at
  BEFORE UPDATE ON rag_source
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- § 4  course
-- =====================================================================
CREATE TABLE IF NOT EXISTS course (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code          text NOT NULL,
  name          text NOT NULL,
  credits       numeric(3,1),
  category      text CHECK (category IN ('必修','选修','公选','通识','体育','实践','第二课堂')),
  semester      text,
  status        text NOT NULL DEFAULT 'planned'
                CHECK (status IN ('planned','enrolled','completed','dropped','failed')),
  grade_letter  text,
  grade_point   numeric(3,2),
  counts_in_gpa boolean NOT NULL DEFAULT true,
  instructor    text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_user_semester ON course (user_id, semester);
CREATE INDEX IF NOT EXISTS idx_course_user_status   ON course (user_id, status);
CREATE INDEX IF NOT EXISTS idx_course_user_code     ON course (user_id, code);

ALTER TABLE course ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_select_owner ON course;
CREATE POLICY course_select_owner ON course
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS course_insert_owner ON course;
CREATE POLICY course_insert_owner ON course
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS course_update_owner ON course;
CREATE POLICY course_update_owner ON course
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS course_delete_owner ON course;
CREATE POLICY course_delete_owner ON course
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_course_updated_at ON course;
CREATE TRIGGER trg_course_updated_at
  BEFORE UPDATE ON course
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- § 5  plan
-- =====================================================================
CREATE TABLE IF NOT EXISTS plan (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL DEFAULT '未命名规划',
  goal_mode    text,
  nodes        jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges        jsonb NOT NULL DEFAULT '[]'::jsonb,
  viewport     jsonb,
  is_archived  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_user_active  ON plan (user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_plan_user_updated ON plan (user_id, updated_at DESC);

ALTER TABLE plan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plan_select_owner ON plan;
CREATE POLICY plan_select_owner ON plan
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS plan_insert_owner ON plan;
CREATE POLICY plan_insert_owner ON plan
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS plan_update_owner ON plan;
CREATE POLICY plan_update_owner ON plan
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS plan_delete_owner ON plan;
CREATE POLICY plan_delete_owner ON plan
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_plan_updated_at ON plan;
CREATE TRIGGER trg_plan_updated_at
  BEFORE UPDATE ON plan
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- § 6  rule  (FK rag_source_id 现在合法, rag_source 已建)
-- =====================================================================
CREATE TABLE IF NOT EXISTS rule (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch         text NOT NULL,
  title          text NOT NULL,
  body           text,
  trust          text NOT NULL DEFAULT 'med' CHECK (trust IN ('high','med','low')),
  source         text,
  source_page    text,
  rag_source_id  uuid REFERENCES rag_source(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rule_user_branch ON rule (user_id, branch);
CREATE INDEX IF NOT EXISTS idx_rule_user_trust  ON rule (user_id, trust);

ALTER TABLE rule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rule_select_owner ON rule;
CREATE POLICY rule_select_owner ON rule
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS rule_insert_owner ON rule;
CREATE POLICY rule_insert_owner ON rule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS rule_update_owner ON rule;
CREATE POLICY rule_update_owner ON rule
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS rule_delete_owner ON rule;
CREATE POLICY rule_delete_owner ON rule
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_rule_updated_at ON rule;
CREATE TRIGGER trg_rule_updated_at
  BEFORE UPDATE ON rule
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- § 7  rule_conflict
-- =====================================================================
CREATE TABLE IF NOT EXISTS rule_conflict (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_a_id    uuid NOT NULL REFERENCES rule(id) ON DELETE CASCADE,
  rule_b_id    uuid NOT NULL REFERENCES rule(id) ON DELETE CASCADE,
  title        text NOT NULL,
  judgement    text,
  confidence   text CHECK (confidence IN ('high','med','low')),
  resolved_by  text CHECK (resolved_by IN ('a','b','unresolved')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (rule_a_id < rule_b_id),
  UNIQUE (rule_a_id, rule_b_id)
);

CREATE INDEX IF NOT EXISTS idx_rule_conflict_user ON rule_conflict (user_id);
CREATE INDEX IF NOT EXISTS idx_rule_conflict_a    ON rule_conflict (rule_a_id);
CREATE INDEX IF NOT EXISTS idx_rule_conflict_b    ON rule_conflict (rule_b_id);

ALTER TABLE rule_conflict ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rule_conflict_select_owner ON rule_conflict;
CREATE POLICY rule_conflict_select_owner ON rule_conflict
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS rule_conflict_insert_owner ON rule_conflict;
CREATE POLICY rule_conflict_insert_owner ON rule_conflict
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS rule_conflict_update_owner ON rule_conflict;
CREATE POLICY rule_conflict_update_owner ON rule_conflict
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS rule_conflict_delete_owner ON rule_conflict;
CREATE POLICY rule_conflict_delete_owner ON rule_conflict
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_rule_conflict_updated_at ON rule_conflict;
CREATE TRIGGER trg_rule_conflict_updated_at
  BEFORE UPDATE ON rule_conflict
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_rule_conflict_owner_check ON rule_conflict;
CREATE TRIGGER trg_rule_conflict_owner_check
  BEFORE INSERT OR UPDATE ON rule_conflict
  FOR EACH ROW EXECUTE FUNCTION check_rule_conflict_owner();


-- =====================================================================
-- § 8  chat_message  (无 updated_at, 无 UPDATE policy)
-- =====================================================================
CREATE TABLE IF NOT EXISTS chat_message (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  role            text NOT NULL CHECK (role IN ('user','assistant','system')),
  content         text NOT NULL,
  mode            text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_user_conv_created ON chat_message (user_id, conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_user_created      ON chat_message (user_id, created_at DESC);

ALTER TABLE chat_message ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_message_select_owner ON chat_message;
CREATE POLICY chat_message_select_owner ON chat_message
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS chat_message_insert_owner ON chat_message;
CREATE POLICY chat_message_insert_owner ON chat_message
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS chat_message_delete_owner ON chat_message;
CREATE POLICY chat_message_delete_owner ON chat_message
  FOR DELETE USING (auth.uid() = user_id);
-- 无 UPDATE policy: 历史消息不可改 (要改 = 删了重建)


-- =====================================================================
-- § 9  auth.users INSERT trigger + 旧账号 backfill
-- =====================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- backfill: 把 trigger 装上之前就存在的账号补建 profiles 行
-- 幂等 (ON CONFLICT DO NOTHING), 跑多少次都安全
INSERT INTO profiles (id, name)
SELECT id, raw_user_meta_data->>'name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- =====================================================================
-- § 10  Storage bucket + RLS  (默认注释, 推荐 Dashboard UI 操作)
-- =====================================================================
-- 取消注释整段并 Run 即可 SQL 创建; 否则去 Dashboard:
--   1. Storage → New bucket → name="rag_sources" → Private
--   2. 给 bucket 加 4 条 path-based RLS:
--      USING / WITH CHECK 都填: bucket_id = 'rag_sources'
--                            AND auth.uid()::text = (storage.foldername(name))[1]
--      4 个 verb 全配 (SELECT/INSERT/UPDATE/DELETE)
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('rag_sources', 'rag_sources', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- DROP POLICY IF EXISTS rag_sources_select_owner ON storage.objects;
-- CREATE POLICY rag_sources_select_owner ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'rag_sources'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- DROP POLICY IF EXISTS rag_sources_insert_owner ON storage.objects;
-- CREATE POLICY rag_sources_insert_owner ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'rag_sources'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- DROP POLICY IF EXISTS rag_sources_update_owner ON storage.objects;
-- CREATE POLICY rag_sources_update_owner ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'rag_sources'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- DROP POLICY IF EXISTS rag_sources_delete_owner ON storage.objects;
-- CREATE POLICY rag_sources_delete_owner ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'rag_sources'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );


-- =====================================================================
-- 完
-- =====================================================================
