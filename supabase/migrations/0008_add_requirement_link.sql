-- ─────────────────────────────────────────────────────────────────────
-- 0008_add_requirement_link — requirement ↔ requirement 5 种关系
--
-- 设计动机（2026-05-25 用户拍板）：
--   0007 advice 是扁平 (goal × req) → 文案，**编码不了 req ↔ req 关系**。
--   静态路径库要能回答「劳动教育可以被创新创业学分顶 ≤ 2 分」这种跨条目逻辑，
--   必须独立 link 表。后期 AI 不重新挖关系，只用 link 表做组合。
--
-- 5 种 kind 含义：
--   - substitute   A 可被 B 替代（bidirectional 经常为 true）
--   - prerequisite A 是 B 的前置（B 依赖 A 先完成 / 通过门槛）
--   - excludes     A 完成则 B 不需要做（A 满足某条件即豁免 B）
--   - cross_ref    A 在条款中引用 B（细则交叉指向，UI 用来做 hover link）
--   - triggers     A 的违反 / 满足触发 B（缺勤→无考试资格→重修→警示→退学）
--
-- 详见 docs/CURRENT_TASK.md 排队 13.5。
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================
-- UP — apply this migration
-- ============================================================

-- § 1  requirement_link — req_a → req_b，5 档 kind
CREATE TABLE IF NOT EXISTS public.requirement_link (
    id              uuid primary key default gen_random_uuid(),
    from_req        uuid not null references public.track_requirement(id) on delete cascade,
    to_req          uuid not null references public.track_requirement(id) on delete cascade,
    kind            text not null check (kind in (
                        'substitute','prerequisite','excludes','cross_ref','triggers')),
    -- 双向语义：替代/互斥常 true（双向有效）；前置/触发/引用通常 false（单向）
    bidirectional   boolean not null default false,
    -- 关系细节，kind 决定 metadata 形态：
    --   substitute: {"max_credits": 2}
    --   prerequisite: {"min_score": 85}
    --   triggers: {"condition": "absence > 1/3"}
    metadata        jsonb not null default '{}'::jsonb,
    note            text,
    source_ref      text,
    created_at      timestamptz not null default now(),
    -- 同 (from, to, kind) 唯一：一对 req 同种关系只一条
    unique (from_req, to_req, kind),
    -- 禁自环
    check (from_req <> to_req)
);

-- § 2  索引：双向查询都要快
CREATE INDEX IF NOT EXISTS idx_req_link_from ON public.requirement_link(from_req, kind);
CREATE INDEX IF NOT EXISTS idx_req_link_to ON public.requirement_link(to_req, kind);
CREATE INDEX IF NOT EXISTS idx_req_link_kind ON public.requirement_link(kind);

-- § 3  RLS：所有人 SELECT；INSERT/UPDATE/DELETE 仅 service_role bypass
ALTER TABLE public.requirement_link ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS link_read_all ON public.requirement_link;
CREATE POLICY link_read_all ON public.requirement_link
    FOR SELECT USING (true);

-- ============================================================
-- DOWN  (manual, DO NOT EXEC)
-- ============================================================
--
-- DROP POLICY IF EXISTS link_read_all       ON public.requirement_link;
-- DROP INDEX  IF EXISTS public.idx_req_link_kind;
-- DROP INDEX  IF EXISTS public.idx_req_link_to;
-- DROP INDEX  IF EXISTS public.idx_req_link_from;
-- DROP TABLE  IF EXISTS public.requirement_link;
