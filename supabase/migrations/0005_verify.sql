-- =====================================================================
-- Meridian — 0005 试点 A 段 验证
-- Migration verify: 0005_verify
-- Created:   2026-05-16
--
-- 每段都是【单行 SQL】, 用户可单独选中某段全文一次粘贴跑.
-- Supabase SQL Editor 会自动加 LIMIT 100, 不影响 GROUP BY / 简单 SELECT.
-- =====================================================================


-- ===== § 1  track 表 (期望 1 行) =====
SELECT id, school, year, scope_level, name FROM track WHERE school = '华东师范大学' AND year = 2023;


-- ===== § 2  track_category (期望 5 行: A1/A2/A3/A4/A5) =====
SELECT code, title, order_index FROM track_category WHERE track_id IN (SELECT id FROM track WHERE school = '华东师范大学' AND year = 2023 AND scope_level = 'school') ORDER BY order_index;


-- ===== § 3  track_requirement 总数 (期望 23) =====
SELECT count(*) AS total_requirements FROM track_requirement WHERE track_id IN (SELECT id FROM track WHERE school = '华东师范大学' AND year = 2023 AND scope_level = 'school');


-- ===== § 4  按 kind 分组 (期望 6 档共 23 行) =====
SELECT kind, count(*) AS n FROM track_requirement WHERE track_id IN (SELECT id FROM track WHERE school = '华东师范大学' AND year = 2023 AND scope_level = 'school') GROUP BY kind ORDER BY kind;


-- ===== § 5  按 category 分组 (期望 5 档: A1=9 / A2=2 / A3=4 / A4=3 / A5=5) =====
SELECT c.code, count(r.id) AS n FROM track_category c LEFT JOIN track_requirement r ON r.category_id = c.id WHERE c.track_id IN (SELECT id FROM track WHERE school = '华东师范大学' AND year = 2023 AND scope_level = 'school') GROUP BY c.code ORDER BY c.code;


-- ===== § 6  source_ref 命中检查 (期望 23 行都有非空 source_ref) =====
SELECT count(*) AS missing_source_ref FROM track_requirement WHERE source_ref IS NULL OR source_ref = '';


-- ===== § 7  metadata 命中检查 (期望 23 行都有非空 metadata) =====
SELECT count(*) AS empty_metadata FROM track_requirement WHERE metadata = '{}'::jsonb;


-- ===== § 8  抽样: A1-10 退学情形 (检查 jsonb_pretty 渲染) =====
SELECT code, kind, threshold, jsonb_pretty(metadata) AS metadata_pretty FROM track_requirement WHERE code = 'A1-10';


-- =====================================================================
-- 期望结果总览:
--   § 1: 1 行 (华东师范大学 / 2023 / school / 通用毕业路径)
--   § 2: 5 行 (A1 学籍管理 / A2 毕业资格 / A3 学士学位 / A4 成绩学分认定 / A5 课程考核)
--   § 3: 1 行 → total_requirements = 23
--   § 4: 6 行:
--          assessment_rule   5
--          gpa_threshold     2
--          score_scheme      1
--          status_gate       7
--          time_limit        7
--          warning_threshold 1
--   § 5: 5 行: A1=9 / A2=2 / A3=4 / A4=3 / A5=5
--   § 6: 1 行 → missing_source_ref = 0
--   § 7: 1 行 → empty_metadata = 0
--   § 8: 1 行 (A1-10 metadata 应含 unit/per_semester_min/cumulative_formula/all_triggers 等 key)
--
-- 任何一段不符 → 0005 试点未通过, 反馈给 AI 修.
-- 全 ✅ → 推 B/C/D/E 段.
-- =====================================================================
