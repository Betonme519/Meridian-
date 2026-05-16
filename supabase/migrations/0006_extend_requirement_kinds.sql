-- =====================================================================
-- Meridian — track_requirement.kind 扩档 + metadata jsonb
-- Migration: 0006_extend_requirement_kinds
-- Created:   2026-05-16
-- Reference: docs/TRACK_SCHEMA.md §1 D-track-8 (2026-05-16 决策)
--            docs/track_kind_taxonomy.md (12 档 canonical kind 归并方案)
--            docs/AI_MEMORY.md §9 2026-05-16
--
-- 背景:
--   0002 schema 给 track_requirement.kind 限定 4 档 (count|credits|one_of|all_of),
--   是"修课要求"语义. 但跑排队 10 task #4 (0005_seed_ecnu_2023) 时, 4 份 ECNU digest
--   共 99 条 track_requirement 候选用了 98 个自由 kind 标签 (time_limit / gpa_threshold /
--   warning_threshold / ...), 全部不兼容 4 档.
--   归并方案见 docs/track_kind_taxonomy.md: 99 条 → 8 个新 canonical kind + 4 个现有.
--
-- 改动:
--   - DROP track_requirement_kind_chk → CHECK 扩到 12 档枚举
--   - ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb (存细节 JSON)
--   - DROP track_requirement_threshold_chk → 改为 threshold / metadata / all_of 三选一
--     (旧规则: kind!='all_of' 时 threshold 必填. 新规则: 还可以靠 metadata 非空替代)
--   - COMMENT ON COLUMN 说明 metadata 用途
--
-- 不动:
--   - 现有 4 档 (count|credits|one_of|all_of) 语义不变, 0005 修课段仍用
--   - track_option 不加 metadata (本批不需要; 真用到再扩)
--   - RLS / trigger / 索引 / 其他列 / UNIQUE 约束
--
-- metadata 没加 CHECK 约束: 自由 jsonb, 应用层 (排队 13 zod) 守 schema.
-- 不加索引: metadata 不参与 join / where, AI 按 id 读 row 拿 metadata.
--
-- 当前数据状态: track_requirement 表为空 (0002/0003/0004 后无 seed).
-- 跑法: Supabase Dashboard SQL Editor 整片粘贴 → Run. 幂等可重跑.
-- =====================================================================


-- =====================================================================
-- § 1  扩 kind CHECK 到 12 档 (4 现有 + 8 新)
-- =====================================================================
ALTER TABLE track_requirement DROP CONSTRAINT IF EXISTS track_requirement_kind_chk;
ALTER TABLE track_requirement ADD CONSTRAINT track_requirement_kind_chk
  CHECK (kind IN (
    -- 0002 现有 4 档: "修课要求"语义
    'count',              -- 从下属 option 至少修 N 门
    'credits',            -- 累计学分 ≥ N
    'one_of',             -- 必选 1 门
    'all_of',             -- 全部必修
    -- 0006 新加 8 档: "学校规则"语义 (canonical kind, 详见 track_kind_taxonomy.md)
    'time_limit',         -- 时间约束 (年限 / 期限 / 时点)
    'gpa_threshold',      -- GPA / 体测 / 论文分数门槛
    'status_gate',        -- 学籍 / 学位 / 项目状态门槛
    'warning_threshold',  -- 学业预警 / 试读 / 退学线
    'assessment_rule',    -- 考核 / 考勤 / 补考 / 答辩
    'score_scheme',       -- 五级 / P/F / 百分制映射 / 加权公式
    'tuition',            -- 学费 / 超额 / 中途结算
    'program_rule'        -- 项目级规则 (辅修/双学位/强基/CTP/论文/实习/转专业等, 靠 metadata.module 区分)
  ));


-- =====================================================================
-- § 2  加 metadata jsonb 列 (存细节, NOT NULL DEFAULT '{}')
-- =====================================================================
ALTER TABLE track_requirement
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN track_requirement.metadata IS
  '规则细节, 自由形态 jsonb. 典型 keys: time_limit→{unit,direction}, gpa_threshold→{scope,scale}, status_gate→{tiers:[{name,pct}]}, warning_threshold→{trigger,action}, program_rule→{module,...}. 应用层 (排队 13 zod) 守 schema, DB 不加 CHECK. 默认 ''{}''::jsonb.';


-- =====================================================================
-- § 3  放宽 threshold CHECK: threshold 或 metadata 二选一即可
--   旧规则 (0002): kind!='all_of' 时 threshold 必填
--   新规则: kind!='all_of' 时, threshold 或 metadata 至少一个非空
-- =====================================================================
ALTER TABLE track_requirement DROP CONSTRAINT IF EXISTS track_requirement_threshold_chk;
ALTER TABLE track_requirement ADD CONSTRAINT track_requirement_threshold_chk
  CHECK (
    kind = 'all_of'
    OR threshold IS NOT NULL
    OR metadata <> '{}'::jsonb
  );
