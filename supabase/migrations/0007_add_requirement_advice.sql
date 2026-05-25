-- ─────────────────────────────────────────────────────────────────────
-- 0007_add_requirement_advice — 静态路径库 Layer 1 / 排队 13.5
--
-- 设计动机（2026-05-25 用户拍板）：
--   不在 runtime 跑 AI 生成 reason，而是 Claude 一次性预编译 (goal × req) → 文案。
--   8 goal_mode × 35 reqs（15 用户可见 + 20 关键规则）= ~280 行 seed。
--   配套 0008 requirement_link 表存 req↔req 5 种关系，AI 后期只做组合不做生成。
--
-- 详见 docs/CURRENT_TASK.md 排队 13.5。
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================
-- UP — apply this migration
-- ============================================================

-- § 1  requirement_advice — (goal_mode, requirement_id) → 文案 / 适配度 / 优先级
CREATE TABLE IF NOT EXISTS public.requirement_advice (
    id                  uuid primary key default gen_random_uuid(),
    goal_mode           text not null check (goal_mode in (
                            '高 GPA','最轻松毕业','保研路线','留学路线',
                            '实习优先','时间自由','低压力模式','个性化定制')),
    requirement_id      uuid not null references public.track_requirement(id) on delete cascade,
    one_liner           text not null check (char_length(one_liner) between 8 and 200),
    goal_fit            text not null check (goal_fit in ('best','ok','bad')),
    -- 12.5 预留：2-4 条 shortcut 变体 [{"oneLiner":"...","goalFit":{...}}]
    shortcut_oneliners  jsonb not null default '[]'::jsonb,
    source_ref          text,
    priority            int not null default 50 check (priority between 0 and 100),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    -- 同 (goal × req) 唯一：avoid duplicate seed insert
    unique (goal_mode, requirement_id)
);

-- § 2  索引：路径查询主流；(goal, req) unique 已隐含建索引，单独加 goal / req 提高范围查询
CREATE INDEX IF NOT EXISTS idx_req_advice_goal_priority
    ON public.requirement_advice(goal_mode, priority);
CREATE INDEX IF NOT EXISTS idx_req_advice_req
    ON public.requirement_advice(requirement_id);

-- § 3  RLS：所有人 SELECT；INSERT/UPDATE/DELETE 仅 service_role bypass
ALTER TABLE public.requirement_advice ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS advice_read_all ON public.requirement_advice;
CREATE POLICY advice_read_all ON public.requirement_advice
    FOR SELECT USING (true);

-- § 4  trigger：updated_at（沿用 0001 已建的 set_updated_at 函数）
DROP TRIGGER IF EXISTS trg_req_advice_updated_at ON public.requirement_advice;
CREATE TRIGGER trg_req_advice_updated_at
    BEFORE UPDATE ON public.requirement_advice
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- DOWN  (manual, DO NOT EXEC)
-- ============================================================
--
-- DROP TRIGGER IF EXISTS trg_req_advice_updated_at ON public.requirement_advice;
-- DROP POLICY  IF EXISTS advice_read_all           ON public.requirement_advice;
-- DROP INDEX   IF EXISTS public.idx_req_advice_req;
-- DROP INDEX   IF EXISTS public.idx_req_advice_goal_priority;
-- DROP TABLE   IF EXISTS public.requirement_advice;
