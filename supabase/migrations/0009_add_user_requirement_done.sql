-- ─────────────────────────────────────────────────────────────────────
-- 0009_add_user_requirement_done — 反向勾选式进度收集（12.5 sub-task 0）
--
-- 设计动机（2026-05-25 用户拍板）：
--   学校 ingest 不现实（无 API 无爬虫）。让学生填"还剩几学分英语"颗粒度太细。
--   反向打勾：默认全 requirement 视为已完成，**取消勾选** = 还没做 → 写一行入表。
--   下次取消勾选 / 完成后勾回 → 删除该行。
--
--   表只存"未完成"的 requirement。空表 = 全部完成。最常见的"已修完很多课"高年级学生
--   只需取消勾选 1-2 条，DB 体量永远小。
--
-- 跟 user_progress 关系：
--   user_progress    选项 / 课程级（option_id 必填）→ 排队 11/12 已用
--   user_requirement_done  requirement 级（option_id 不存在 / 不细记）→ 本表
--
--   两者并行存在，UI 合并：isCompleted = user_progress 命中 || user_requirement_done 缺勤
--   一致性靠应用层（不写跨表 trigger，避免误删）。
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================
-- UP — apply this migration
-- ============================================================

-- § 1  user_requirement_done — owner-only 表，标记某 requirement 用户尚未完成
CREATE TABLE IF NOT EXISTS public.user_requirement_done (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    requirement_id  uuid not null references public.track_requirement(id) on delete cascade,
    -- 解释字段：用户为什么标了这条；可空，UI 不强制
    note            text,
    -- 一对 (user, req) 只一行；ON CONFLICT 走幂等 upsert
    unique (user_id, requirement_id),
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- § 2  索引：按用户拉自己所有未完成 req（高频）
CREATE INDEX IF NOT EXISTS idx_urd_user ON public.user_requirement_done(user_id);
CREATE INDEX IF NOT EXISTS idx_urd_req ON public.user_requirement_done(requirement_id);

-- § 3  RLS：owner-only 全 CRUD
ALTER TABLE public.user_requirement_done ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS urd_owner_all ON public.user_requirement_done;
CREATE POLICY urd_owner_all ON public.user_requirement_done
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- § 4  trigger：updated_at（沿用 0001 已建的 set_updated_at 函数）
DROP TRIGGER IF EXISTS trg_urd_updated_at ON public.user_requirement_done;
CREATE TRIGGER trg_urd_updated_at
    BEFORE UPDATE ON public.user_requirement_done
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- DOWN  (manual, DO NOT EXEC)
-- ============================================================
--
-- DROP TRIGGER IF EXISTS trg_urd_updated_at      ON public.user_requirement_done;
-- DROP POLICY  IF EXISTS urd_owner_all           ON public.user_requirement_done;
-- DROP INDEX   IF EXISTS public.idx_urd_req;
-- DROP INDEX   IF EXISTS public.idx_urd_user;
-- DROP TABLE   IF EXISTS public.user_requirement_done;
