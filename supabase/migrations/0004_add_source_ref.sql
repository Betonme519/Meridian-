-- =====================================================================
-- Meridian — track requirement / option 加 source_ref 列
-- Migration: 0004_add_source_ref
-- Created:   2026-05-16
-- Reference: docs/CURRENT_TASK.md 排队 10 task #3
--            docs/ecnu_rules_digest_{A,B,C,D}.md (来源字段格式范例)
--            docs/TRACK_SCHEMA.md §3.3 / §3.4
--
-- 目的:
--   track_requirement / track_option 各加 source_ref text NULL,
--   存可追溯的"原始规则来源", 格式自由字符串 (典型: "文件名 §章节").
--   AI 输出 citations 时引用; UI hover 显示.
--   给 0005_seed_ecnu_2023 (排队 10 task #4) 录入 INSERT 用.
--
-- 改动:
--   - track_requirement ADD COLUMN IF NOT EXISTS source_ref text  (可空)
--   - track_option      ADD COLUMN IF NOT EXISTS source_ref text  (可空)
--   - COMMENT ON COLUMN 说明字段用途
--
-- 不动:
--   - RLS policies (track_requirement_select_public / track_option_select_public 沿用)
--   - trigger (trg_track_requirement_updated_at / trg_track_option_updated_at 沿用)
--   - 现有索引 / CHECK 约束 / UNIQUE 约束 / 其他列
--
-- 当前数据状态: track_requirement / track_option 表为空 (0002/0003 之后无 seed).
-- 跑法: Supabase Dashboard SQL Editor 整片粘贴 → Run. 幂等可重跑.
-- =====================================================================


-- =====================================================================
-- § 1  track_requirement.source_ref
-- =====================================================================
ALTER TABLE track_requirement
  ADD COLUMN IF NOT EXISTS source_ref text;

COMMENT ON COLUMN track_requirement.source_ref IS
  '原始规则来源, 自由字符串, 典型格式 "文件名 §章节" (如 "ecnu_rules_digest_A.md §A1-6"). AI 输出 citations 时引用, UI hover 显示. 可空.';


-- =====================================================================
-- § 2  track_option.source_ref
-- =====================================================================
ALTER TABLE track_option
  ADD COLUMN IF NOT EXISTS source_ref text;

COMMENT ON COLUMN track_option.source_ref IS
  '原始规则来源, 自由字符串. 通常与所属 requirement 的 source_ref 相同, 但允许 option 级更精确 (如某门课对应分值表中具体一行). 可空.';
