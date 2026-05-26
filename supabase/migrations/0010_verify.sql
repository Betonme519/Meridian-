-- ─────────────────────────────────────────────────────────────────────
-- 0010_verify — 校验排队 12.5 子任务 B shortcut seed 落地
--
-- 跑法：Supabase Dashboard SQL editor 一次性贴下面 4 段，分别看返回
-- ─────────────────────────────────────────────────────────────────────

-- § 1  有 shortcut（jsonb 非空）的 advice 行数
--      期望：15 reqs × 8 goals = 120
SELECT COUNT(*) AS rows_with_shortcuts
FROM public.requirement_advice
WHERE jsonb_array_length(shortcut_oneliners) >= 2;

-- § 2  按 goal_mode 分组的 shortcut 覆盖数（应每 goal = 15）
SELECT goal_mode, COUNT(*) AS reqs_with_shortcuts
FROM public.requirement_advice
WHERE jsonb_array_length(shortcut_oneliners) >= 2
GROUP BY goal_mode
ORDER BY goal_mode;

-- § 3  抽样 E2-1（思政）8 goal 行的 shortcut_oneliners
--      期望：8 行，shortcut_oneliners 都是同一份 3 条 shortcut（与 goal 解耦）
SELECT ra.goal_mode,
       jsonb_array_length(ra.shortcut_oneliners) AS shortcut_count,
       ra.shortcut_oneliners->0->>'oneLiner'      AS first_oneliner
FROM public.requirement_advice ra
JOIN public.track_requirement r ON r.id = ra.requirement_id
WHERE r.code = 'E2-1'
ORDER BY ra.goal_mode;

-- § 4  抽样 E2-2（英语）首条 shortcut 的 goalFit map 完整性
SELECT ra.goal_mode,
       ra.shortcut_oneliners->0->>'id'        AS shortcut_id,
       ra.shortcut_oneliners->0->'goalFit'    AS goal_fit
FROM public.requirement_advice ra
JOIN public.track_requirement r ON r.id = ra.requirement_id
WHERE r.code = 'E2-2'
LIMIT 4;
