-- =====================================================================
-- Meridian — 0005 全段 验证 (school track + 师范学院 college track)
-- Migration verify: 0005_verify
-- Created:   2026-05-16 (扩展自试点 A 段 8 段)
--
-- 每段都是【单行 SQL】, 用户可单独选中某段全文一次粘贴跑.
-- Supabase SQL Editor 会自动加 LIMIT 100, 不影响 GROUP BY / 简单 SELECT.
--
-- 期望总览:
--   - 2 个 track (school + college 师范学院)
--   - 30 个 track_category (29 全校 + 1 师范)
--   - 198 个 track_requirement (190 全校 + 8 师范)
-- =====================================================================


-- ===== § 1  track 表 (期望 2 行: school + college 师范学院) =====
SELECT id, school, year, scope_level, college, name FROM track WHERE school = '华东师范大学' AND year = 2023 ORDER BY scope_level DESC;


-- ===== § 2  track_category 总览 (期望 30 行 / 全校 29 + 师范 1) =====
SELECT c.code, c.title, c.order_index, t.scope_level, t.college FROM track_category c JOIN track t ON c.track_id = t.id WHERE t.school = '华东师范大学' AND t.year = 2023 ORDER BY t.scope_level, c.order_index;


-- ===== § 3  track_requirement 总数 (期望 198 = 190 全校 + 8 师范) =====
SELECT t.scope_level, count(r.id) AS n FROM track_requirement r JOIN track t ON r.track_id = t.id WHERE t.school = '华东师范大学' AND t.year = 2023 GROUP BY t.scope_level ORDER BY t.scope_level;


-- ===== § 4  按 kind 分组总览 (期望 10 档 / 共 198 行) =====
SELECT kind, count(*) AS n FROM track_requirement r JOIN track t ON r.track_id = t.id WHERE t.school = '华东师范大学' AND t.year = 2023 GROUP BY kind ORDER BY n DESC, kind;


-- ===== § 5  按 category 分组 (期望 30 行) =====
SELECT c.code, c.title, count(r.id) AS n FROM track_category c LEFT JOIN track_requirement r ON r.category_id = c.id WHERE c.track_id IN (SELECT id FROM track WHERE school = '华东师范大学' AND year = 2023) GROUP BY c.code, c.title ORDER BY c.code;


-- ===== § 6  source_ref 命中检查 (期望 0 = 198 行全有 source_ref) =====
SELECT count(*) AS missing_source_ref FROM track_requirement r JOIN track t ON r.track_id = t.id WHERE t.school = '华东师范大学' AND t.year = 2023 AND (source_ref IS NULL OR source_ref = '');


-- ===== § 7  metadata 命中检查 (期望 0 = 198 行全有 metadata) =====
SELECT count(*) AS empty_metadata FROM track_requirement r JOIN track t ON r.track_id = t.id WHERE t.school = '华东师范大学' AND t.year = 2023 AND metadata = '{}'::jsonb;


-- ===== § 8  抽样: A1-10 退学情形 (跨学期累计公式) =====
SELECT code, kind, threshold, jsonb_pretty(metadata) AS metadata_pretty FROM track_requirement WHERE code = 'A1-10';


-- ===== § 9  抽样: B3-1 预警线 14% (核心毕业风险触发) =====
SELECT code, kind, threshold, jsonb_pretty(metadata) AS metadata_pretty FROM track_requirement WHERE code = 'B3-1';


-- ===== § 10  抽样: C6-6 竞赛获奖三档分值表 (大表 metadata) =====
SELECT code, title, jsonb_pretty(metadata) AS metadata_pretty FROM track_requirement WHERE code = 'C6-6';


-- ===== § 11  抽样: C7-2 A 类竞赛奖金表 (大表 metadata) =====
SELECT code, title, jsonb_pretty(metadata) AS metadata_pretty FROM track_requirement WHERE code = 'C7-2';


-- ===== § 12  抽样: D4-12 毕业论文重复率两档处理 =====
SELECT code, kind, threshold, jsonb_pretty(metadata) AS metadata_pretty FROM track_requirement WHERE code = 'D4-12';


-- ===== § 13  抽样: E2-3 公共计算机课程 (非师范 / 师范 双分支) =====
SELECT code, title, jsonb_pretty(metadata) AS metadata_pretty FROM track_requirement WHERE code = 'E2-3';


-- ===== § 14  抽样: 师范学院 track 全部 8 条 (验证 scope_level=college 挂对) =====
SELECT r.code, r.title, r.kind FROM track_requirement r JOIN track t ON r.track_id = t.id WHERE t.school = '华东师范大学' AND t.year = 2023 AND t.scope_level = 'college' AND t.college = '师范学院' ORDER BY r.code;


-- ===== § 15  module metadata 分布 (C/D 段的 module key, 验证项目级规则归类) =====
SELECT metadata->>'module' AS module, count(*) AS n FROM track_requirement r JOIN track t ON r.track_id = t.id WHERE t.school = '华东师范大学' AND t.year = 2023 AND metadata ? 'module' GROUP BY metadata->>'module' ORDER BY n DESC;


-- =====================================================================
-- 期望结果总览:
--   § 1:  2 行 (school 全校 / college 师范学院)
--   § 2:  30 行 (school: A1-A5/B1-B6/C1-C9/D1-D6/E1-E3 共 29 + college: E4 共 1)
--   § 3:  2 行 → school=190, college=8
--   § 4:  10 档:
--          program_rule     56  (C/D/E 项目级 + 师范段大头)
--          assessment_rule  37  (B/D 过程类)
--          status_gate      31  (各段状态门槛)
--          time_limit       21  (各段时间约束)
--          credits          13  (E 公共必修 + 通识 + 师范课程结构)
--          gpa_threshold    11  (A3-2 学位 / B5 体测 / C9-1 推免 / D4-8 优秀率 / 等)
--          score_scheme     11  (B2/B5/B6 成绩记分)
--          warning_threshold 8  (A1-10 / B3-1 / B4-4 / D1-6 / D3-6 / D4-10 / D4-12 / D6-5)
--          tuition           8  (B6 学分制收费 + C1-5 辅修)
--          all_of            2  (E2-1 思政 / E2-5 国情教育)
--          --- count / one_of 当前 0 (留给排队 11 课程列表)
--          合计 198
--   § 5:  30 行: A1=9 / A2=2 / A3=4 / A4=3 / A5=5 = 23 (A 段)
--               B1=6 / B2=14 / B3=5 / B4=6 / B5=7 / B6=10 = 48 (B 段)
--               C1=10 / C2=7 / C3=4 / C4=2 / C5=8 / C6=9 / C7=4 / C8=4 / C9=8 = 56 (C 段)
--               D1=5 / D2=7 / D3=6 / D4=15 / D5=7 / D6=9 = 49 (D 段)
--               E1=2 / E2=8 / E3=4 = 14 (E 全校)
--               E4=8 = 8 (E 师范)
--   § 6:  1 行 → missing_source_ref = 0
--   § 7:  1 行 → empty_metadata = 0
--   § 8:  A1-10 metadata 含 unit/per_semester_min/cumulative_formula/all_triggers
--   § 9:  B3-1 metadata 含 stage="warning" / triggers (3 条规则: 学分线/GPA/其他)
--   § 10: C6-6 metadata 含 tiers (top_3_events/A_class/B_class) × scope_levels × award_levels
--   § 11: C7-2 metadata 含 scope_levels (intl/national/provincial) × award_levels × take_max
--   § 12: D4-12 metadata.tiers 三档 (<30% / 30-50% / >=50%)
--   § 13: E2-3 metadata.branches 两档 (non_normal 0/3/5 学分 + normal_student 4 学分)
--   § 14: 8 行 (E4-1 ~ E4-8, kind 分布 1 status_gate + 5 program_rule + 2 credits)
--   § 15: module 分布: minor=10 / double_degree=7 / strong_base=4 / personalized=2 /
--                       major_transfer=8 / innovation=9 / award=4 / micro_program=1 /
--                       excellence_college=3 / recommendation=8 (C 段, 不含 C1-1/C1-5 等无 module)
--                       internship=6 / thesis=15 / thesis_spot_check=7 / ctp=9 (D 段)
--
-- 任何一段不符 → 用 \n RAISE NOTICE 输出反馈给 AI 修.
-- 全 ✅ → 阶段 3 完成, 推阶段 4 ecnu_process_rules.md.
-- =====================================================================
