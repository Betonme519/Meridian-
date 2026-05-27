-- ─────────────────────────────────────────────────────────────────────
-- 0011_verify — 校验 E3-1 标题清理
-- ─────────────────────────────────────────────────────────────────────

-- § 1  E3-1 当前 title 应为新值
SELECT code, title
FROM public.track_requirement
WHERE code = 'E3-1';
-- 期望：通识教育总学分 (8 学分)

-- § 2  旧 title 应已不存在
SELECT COUNT(*) AS legacy_rows
FROM public.track_requirement
WHERE title = '通识教育总学分 (8 学分 / 3 模块)';
-- 期望：0
