-- =====================================================================
-- Meridian — ECNU 2023 级本科生培养路径 seed SQL（全段）
-- Migration: 0005_seed_ecnu_2023
-- Created:   2026-05-16
-- Reference: docs/ecnu-digests/ecnu_rules_digest_{A,B,C,D,E}.md  (digest v2 source of truth)
--            docs/track_kind_taxonomy.md                          (12 档 canonical kind)
--            docs/TRACK_SCHEMA.md                                  (五张表结构)
--
-- 范围:
--   - 2 个 track:
--       1. 华东师范大学 2023 级全校通用 (scope_level='school')
--       2. 华东师范大学 师范学院 (scope_level='college', college='师范学院')
--   - 30 个 track_category (A1-A5 + B1-B6 + C1-C9 + D1-D6 + E1-E3 + E4)
--   - 198 个 track_requirement:
--       A 段 23 (学籍/毕业/学位/学分认定/课程考核)
--       B 段 48 (选课/成绩/学业预警/考勤/体测/学费)
--       C 段 56 (辅修/双学位/强基/个性化/转专业/创新创业/竞赛/微专业/推免)
--       D 段 49 (注册/休复学/实习/毕业论文/抽检/创新训练CTP)
--       E 全校 14 (本科教育目标 + 公共必修 + 通识教育)
--       E 师范 8 (师范生培养，挂 师范学院 track)
--
-- prompt 类条款（不入此表，进阶段 4 ecnu_process_rules.md）共 39 条:
--   A: A1-4/7/8/11, A2-3/4/5, A3-4/5/6, A4-1/4, A5-1/6 (14)
--   B: B1-1, B2-14, B3-2, B3-5, B5-2/7/10, B6-2/12 (9)
--   C: C2-8, C4-2, C5-3/6/8, C6-9, C7-5, C8-2, C9-6 (9)
--   D: D1-1, D2-1/4, D3-7, D4-15, D6-10 (6)
--   E: E1-1 (1)
--
-- 跑法: Supabase Dashboard SQL Editor 整片粘贴 → Run.
--      失败回滚整个 DO 块, 修完重跑即可 (本文件幂等).
--
-- 依赖:
--   - 0001 (set_updated_at trigger 函数)
--   - 0002 (5 张表结构)
--   - 0003 (scope_level + college)
--   - 0004 (source_ref)
--   - 0006 (kind 扩 12 档 + metadata jsonb)
-- =====================================================================


DO $$
DECLARE
  -- track ids
  v_school_track_id uuid;
  v_normal_track_id uuid;

  -- A 段 category ids (5)
  v_cat_a1_id uuid;
  v_cat_a2_id uuid;
  v_cat_a3_id uuid;
  v_cat_a4_id uuid;
  v_cat_a5_id uuid;

  -- B 段 category ids (6)
  v_cat_b1_id uuid;
  v_cat_b2_id uuid;
  v_cat_b3_id uuid;
  v_cat_b4_id uuid;
  v_cat_b5_id uuid;
  v_cat_b6_id uuid;

  -- C 段 category ids (9)
  v_cat_c1_id uuid;
  v_cat_c2_id uuid;
  v_cat_c3_id uuid;
  v_cat_c4_id uuid;
  v_cat_c5_id uuid;
  v_cat_c6_id uuid;
  v_cat_c7_id uuid;
  v_cat_c8_id uuid;
  v_cat_c9_id uuid;

  -- D 段 category ids (6)
  v_cat_d1_id uuid;
  v_cat_d2_id uuid;
  v_cat_d3_id uuid;
  v_cat_d4_id uuid;
  v_cat_d5_id uuid;
  v_cat_d6_id uuid;

  -- E 全校 category ids (3)
  v_cat_e1_id uuid;
  v_cat_e2_id uuid;
  v_cat_e3_id uuid;

  -- E 师范 category id (1)
  v_cat_e4_id uuid;
BEGIN

  -- =====================================================================
  -- § 1  track × 2  (华师大 2023 级 全校通用 + 师范学院)
  -- =====================================================================

  -- 1a. 全校通用 track (scope_level='school')
  SELECT id INTO v_school_track_id FROM track
    WHERE school = '华东师范大学'
      AND year = 2023
      AND scope_level = 'school'
      AND college IS NULL
      AND major IS NULL;

  IF v_school_track_id IS NULL THEN
    INSERT INTO track (school, year, scope_level, name, version, total_credits, description)
    VALUES (
      '华东师范大学',
      2023,
      'school',
      '华东师范大学 2023 级本科生通用毕业路径',
      '2025-modify',
      NULL,
      '华东师范大学 2023 级及以后本科生通用毕业路径. 涵盖学籍管理 / 毕业资格 / 学位授予 / 成绩学分认定 / 课程考核 / 学业规则 / 特殊计划 / 过程类规则 / 培养方案. 数据源: 2025 年本科生手册 + 2025 年本科生学习指南.'
    )
    RETURNING id INTO v_school_track_id;
  ELSE
    UPDATE track
      SET name = '华东师范大学 2023 级本科生通用毕业路径',
          version = '2025-modify',
          description = '华东师范大学 2023 级及以后本科生通用毕业路径. 涵盖学籍管理 / 毕业资格 / 学位授予 / 成绩学分认定 / 课程考核 / 学业规则 / 特殊计划 / 过程类规则 / 培养方案. 数据源: 2025 年本科生手册 + 2025 年本科生学习指南.'
      WHERE id = v_school_track_id;
  END IF;

  -- 1b. 师范学院 track (scope_level='college', college='师范学院')
  SELECT id INTO v_normal_track_id FROM track
    WHERE school = '华东师范大学'
      AND year = 2023
      AND scope_level = 'college'
      AND college = '师范学院'
      AND major IS NULL;

  IF v_normal_track_id IS NULL THEN
    INSERT INTO track (school, year, scope_level, college, name, version, total_credits, description)
    VALUES (
      '华东师范大学',
      2023,
      'college',
      '师范学院',
      '华东师范大学 师范学院 2023 级师范生培养路径',
      '2025-modify',
      NULL,
      '华东师范大学 师范学院 2023 级师范生培养路径 (scope=college). 含师范生三类型 / 公费师范生 / 国家优师专项 / 师范生课程结构 / 教师教育板块 ≥21 学分 / 实践教学 / 双导师制. 数据源: 2025 年本科生学习指南 §四 师范生培养.'
    )
    RETURNING id INTO v_normal_track_id;
  ELSE
    UPDATE track
      SET name = '华东师范大学 师范学院 2023 级师范生培养路径',
          version = '2025-modify',
          description = '华东师范大学 师范学院 2023 级师范生培养路径 (scope=college). 含师范生三类型 / 公费师范生 / 国家优师专项 / 师范生课程结构 / 教师教育板块 ≥21 学分 / 实践教学 / 双导师制. 数据源: 2025 年本科生学习指南 §四 师范生培养.'
      WHERE id = v_normal_track_id;
  END IF;


  -- =====================================================================
  -- § 2  track_category × 30
  --   全校 track 挂 29 个 (A1-A5 + B1-B6 + C1-C9 + D1-D6 + E1-E3)
  --   师范学院 track 挂 1 个 (E4)
  -- =====================================================================

  -- ---- A 段 (5) ----
  SELECT id INTO v_cat_a1_id FROM track_category WHERE track_id = v_school_track_id AND code = 'A1';
  IF v_cat_a1_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'A1', '学籍管理', 11,
      '华师本〔2025〕78号《华东师范大学本科生学籍管理规定 (2025年修订)》派生规则: 入学注册 / 学制最长年限 / 休学复学 / 退学情形 / 毕业结业肄业三档. 9 条 track_requirement.')
    RETURNING id INTO v_cat_a1_id;
  ELSE
    UPDATE track_category SET title = '学籍管理',
      description = '华师本〔2025〕78号《华东师范大学本科生学籍管理规定 (2025年修订)》派生规则: 入学注册 / 学制最长年限 / 休学复学 / 退学情形 / 毕业结业肄业三档. 9 条 track_requirement.'
      WHERE id = v_cat_a1_id;
  END IF;

  SELECT id INTO v_cat_a2_id FROM track_category WHERE track_id = v_school_track_id AND code = 'A2';
  IF v_cat_a2_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'A2', '毕业资格审核', 12,
      '华师本〔2025〕71号《华东师范大学本科生毕业资格审核工作细则》派生规则: 三档结果 (毕业/结业/肄业) / 提前毕业 3 年最少修读. 2 条 track_requirement.')
    RETURNING id INTO v_cat_a2_id;
  ELSE
    UPDATE track_category SET title = '毕业资格审核',
      description = '华师本〔2025〕71号《华东师范大学本科生毕业资格审核工作细则》派生规则: 三档结果 (毕业/结业/肄业) / 提前毕业 3 年最少修读. 2 条 track_requirement.'
      WHERE id = v_cat_a2_id;
  END IF;

  SELECT id INTO v_cat_a3_id FROM track_category WHERE track_id = v_school_track_id AND code = 'A3';
  IF v_cat_a3_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'A3', '学士学位授予', 13,
      '华师本〔2025〕48号《华东师范大学全日制本科学士学位授予工作细则 (2025年修订)》派生规则: 学位申请条件 / GPA ≥ 2.0 / 处分期不可申请 / 撤销学位. 4 条 track_requirement.')
    RETURNING id INTO v_cat_a3_id;
  ELSE
    UPDATE track_category SET title = '学士学位授予',
      description = '华师本〔2025〕48号《华东师范大学全日制本科学士学位授予工作细则 (2025年修订)》派生规则: 学位申请条件 / GPA ≥ 2.0 / 处分期不可申请 / 撤销学位. 4 条 track_requirement.'
      WHERE id = v_cat_a3_id;
  END IF;

  SELECT id INTO v_cat_a4_id FROM track_category WHERE track_id = v_school_track_id AND code = 'A4';
  IF v_cat_a4_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'A4', '成绩及学分认定', 14,
      '华师本〔2025〕76号《华东师范大学本科生成绩及学分认定工作细则》派生规则: 认定上限 40% / 认定原则 (同次仅 1 次、高代低、不替代已获) / 记载方式. 3 条 track_requirement.')
    RETURNING id INTO v_cat_a4_id;
  ELSE
    UPDATE track_category SET title = '成绩及学分认定',
      description = '华师本〔2025〕76号《华东师范大学本科生成绩及学分认定工作细则》派生规则: 认定上限 40% / 认定原则 (同次仅 1 次、高代低、不替代已获) / 记载方式. 3 条 track_requirement.'
      WHERE id = v_cat_a4_id;
  END IF;

  SELECT id INTO v_cat_a5_id FROM track_category WHERE track_id = v_school_track_id AND code = 'A5';
  IF v_cat_a5_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'A5', '课程考核', 15,
      '华师本〔2025〕79号《华东师范大学本科生课程考核管理办法》派生规则: 考核资格 (缺课/缺交>1/3) / 缓考申请期限 / 不予补考情形 / 补考范围 / 考核违纪. 5 条 track_requirement.')
    RETURNING id INTO v_cat_a5_id;
  ELSE
    UPDATE track_category SET title = '课程考核',
      description = '华师本〔2025〕79号《华东师范大学本科生课程考核管理办法》派生规则: 考核资格 (缺课/缺交>1/3) / 缓考申请期限 / 不予补考情形 / 补考范围 / 考核违纪. 5 条 track_requirement.'
      WHERE id = v_cat_a5_id;
  END IF;

  -- ---- B 段 (6) ----
  SELECT id INTO v_cat_b1_id FROM track_category WHERE track_id = v_school_track_id AND code = 'B1';
  IF v_cat_b1_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'B1', '选课退课和免听免修', 21,
      '华师本〔2025〕70号《选课退课和免听免修工作细则》: 三轮选课 / 注册前置 / 选课量 25 学分建议 / 期中退课 / 免听免修条件 + 流程. 6 条 track_requirement.')
    RETURNING id INTO v_cat_b1_id;
  ELSE
    UPDATE track_category SET title = '选课退课和免听免修',
      description = '华师本〔2025〕70号《选课退课和免听免修工作细则》: 三轮选课 / 注册前置 / 选课量 25 学分建议 / 期中退课 / 免听免修条件 + 流程. 6 条 track_requirement.'
      WHERE id = v_cat_b1_id;
  END IF;

  SELECT id INTO v_cat_b2_id FROM track_category WHERE track_id = v_school_track_id AND code = 'B2';
  IF v_cat_b2_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'B2', '本科生成绩管理', 22,
      '华师本〔2025〕77号《本科生成绩管理办法》: 三/十级制 / A 等比例 / P/F 8 学分上限 / GPA 公式 / 加权平均分 / 附录 1 名次比例表 + 附录 2 等级绩点表 / 成绩复查. 14 条 track_requirement.')
    RETURNING id INTO v_cat_b2_id;
  ELSE
    UPDATE track_category SET title = '本科生成绩管理',
      description = '华师本〔2025〕77号《本科生成绩管理办法》: 三/十级制 / A 等比例 / P/F 8 学分上限 / GPA 公式 / 加权平均分 / 附录 1 名次比例表 + 附录 2 等级绩点表 / 成绩复查. 14 条 track_requirement.'
      WHERE id = v_cat_b2_id;
  END IF;

  SELECT id INTO v_cat_b3_id FROM track_category WHERE track_id = v_school_track_id AND code = 'B3';
  IF v_cat_b3_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'B3', '本科生学业预警', 23,
      '华师本〔2025〕74号《本科生学业预警工作细则》: 预警线 14% / 退学线 10% / 学分计算规则 / 第一次试读 / 第二次试读三条件 8%. 5 条 track_requirement.')
    RETURNING id INTO v_cat_b3_id;
  ELSE
    UPDATE track_category SET title = '本科生学业预警',
      description = '华师本〔2025〕74号《本科生学业预警工作细则》: 预警线 14% / 退学线 10% / 学分计算规则 / 第一次试读 / 第二次试读三条件 8%. 5 条 track_requirement.'
      WHERE id = v_cat_b3_id;
  END IF;

  SELECT id INTO v_cat_b4_id FROM track_category WHERE track_id = v_school_track_id AND code = 'B4';
  IF v_cat_b4_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'B4', '本科生考勤', 24,
      '华师教〔2021〕130号《本科生考勤细则》: 旷课定义 / 学时折算 / 高水平运动员 + 艺术特长生 / 旷课 10 学时处分 / 请假权限分级 / 累计请假 1/3 上限. 6 条 track_requirement.')
    RETURNING id INTO v_cat_b4_id;
  ELSE
    UPDATE track_category SET title = '本科生考勤',
      description = '华师教〔2021〕130号《本科生考勤细则》: 旷课定义 / 学时折算 / 高水平运动员 + 艺术特长生 / 旷课 10 学时处分 / 请假权限分级 / 累计请假 1/3 上限. 6 条 track_requirement.'
      WHERE id = v_cat_b4_id;
  END IF;

  SELECT id INTO v_cat_b5_id FROM track_category WHERE track_id = v_school_track_id AND code = 'B5';
  IF v_cat_b5_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'B5', '体质健康测试', 25,
      '华师教〔2022〕205号《本科生体质健康测试工作实施办法》: 适用范围 / 评分构成 120 分 / 等级 / 补测 / 毕业公式 50%×2 / 评优 60 分门槛 / 毕业 50 分门槛 (2023 级起). 7 条 track_requirement.')
    RETURNING id INTO v_cat_b5_id;
  ELSE
    UPDATE track_category SET title = '体质健康测试',
      description = '华师教〔2022〕205号《本科生体质健康测试工作实施办法》: 适用范围 / 评分构成 120 分 / 等级 / 补测 / 毕业公式 50%×2 / 评优 60 分门槛 / 毕业 50 分门槛 (2023 级起). 7 条 track_requirement.'
      WHERE id = v_cat_b5_id;
  END IF;

  SELECT id INTO v_cat_b6_id FROM track_category WHERE track_id = v_school_track_id AND code = 'B6';
  IF v_cat_b6_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'B6', '学分制收费', 26,
      '华师教〔2023〕218号《本科生学分制收费管理办法 (2023 年修订)》: 适用 2023 级起 / 校际交流 / 转专业 + 双学位收费 / 超额学分 165 元 + 留学生 300 元 / 期中退课退费 / 离校结算公式 / 毕业生 10 学分免补 / 公费师范生免学费 / 未缴 → 不予注册. 10 条 track_requirement.')
    RETURNING id INTO v_cat_b6_id;
  ELSE
    UPDATE track_category SET title = '学分制收费',
      description = '华师教〔2023〕218号《本科生学分制收费管理办法 (2023 年修订)》: 适用 2023 级起 / 校际交流 / 转专业 + 双学位收费 / 超额学分 165 元 + 留学生 300 元 / 期中退课退费 / 离校结算公式 / 毕业生 10 学分免补 / 公费师范生免学费 / 未缴 → 不予注册. 10 条 track_requirement.'
      WHERE id = v_cat_b6_id;
  END IF;

  -- ---- C 段 (9) ----
  SELECT id INTO v_cat_c1_id FROM track_category WHERE track_id = v_school_track_id AND code = 'C1';
  IF v_cat_c1_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'C1', '辅修专业修读', 31,
      '华师教〔2024〕14号《本科辅修专业修读管理办法 (2024 年修订)》: 适用 2024 级起 / 总学分 30-36 / 修读资格 / 报名时点 / 学费 / 补考重修 / 冲突处理 (免听不免考每学期 1 门) / 最长年限 = 主修最长 / 学位授予条件 / 证书发放 3 档. 10 条 track_requirement.')
    RETURNING id INTO v_cat_c1_id;
  ELSE
    UPDATE track_category SET title = '辅修专业修读',
      description = '华师教〔2024〕14号《本科辅修专业修读管理办法 (2024 年修订)》: 适用 2024 级起 / 总学分 30-36 / 修读资格 / 报名时点 / 学费 / 补考重修 / 冲突处理 (免听不免考每学期 1 门) / 最长年限 = 主修最长 / 学位授予条件 / 证书发放 3 档. 10 条 track_requirement.'
      WHERE id = v_cat_c1_id;
  END IF;

  SELECT id INTO v_cat_c2_id FROM track_category WHERE track_id = v_school_track_id AND code = 'C2';
  IF v_cat_c2_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'C2', '双学士学位项目', 32,
      '华师教〔2022〕125号《双学士学位复合型人才培养项目管理办法》: 学制 4 年最长 6 年 / 总学分约 180 / 动态进出 / 日常管理归属 / 退出学分处理 / 学位授予条件 / 未达条件回退. 7 条 track_requirement.')
    RETURNING id INTO v_cat_c2_id;
  ELSE
    UPDATE track_category SET title = '双学士学位项目',
      description = '华师教〔2022〕125号《双学士学位复合型人才培养项目管理办法》: 学制 4 年最长 6 年 / 总学分约 180 / 动态进出 / 日常管理归属 / 退出学分处理 / 学位授予条件 / 未达条件回退. 7 条 track_requirement.'
      WHERE id = v_cat_c2_id;
  END IF;

  SELECT id INTO v_cat_c3_id FROM track_category WHERE track_id = v_school_track_id AND code = 'C3';
  IF v_cat_c3_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'C3', '强基计划', 33,
      '⚠️ 强基计划独立办法在新 PDF 未收录, 基于手册 + 指南散见条款重写 4 条: 转专业例外 (规定范围内) / 阶段性考核 + 动态进出 / 本研衔接转段 / 推免专项通道. 4 条 track_requirement.')
    RETURNING id INTO v_cat_c3_id;
  ELSE
    UPDATE track_category SET title = '强基计划',
      description = '⚠️ 强基计划独立办法在新 PDF 未收录, 基于手册 + 指南散见条款重写 4 条: 转专业例外 (规定范围内) / 阶段性考核 + 动态进出 / 本研衔接转段 / 推免专项通道. 4 条 track_requirement.'
      WHERE id = v_cat_c3_id;
  END IF;

  SELECT id INTO v_cat_c4_id FROM track_category WHERE track_id = v_school_track_id AND code = 'C4';
  IF v_cat_c4_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'C4', '个性化培养', 34,
      '指南 §06 + §二、更多机会 / 2.个性化培养: 申请条件 (特殊专长 + 现方案不足) / 拔尖学生个性化选课 ≥ 24 学分. 2 条 track_requirement.')
    RETURNING id INTO v_cat_c4_id;
  ELSE
    UPDATE track_category SET title = '个性化培养',
      description = '指南 §06 + §二、更多机会 / 2.个性化培养: 申请条件 (特殊专长 + 现方案不足) / 拔尖学生个性化选课 ≥ 24 学分. 2 条 track_requirement.'
      WHERE id = v_cat_c4_id;
  END IF;

  SELECT id INTO v_cat_c5_id FROM track_category WHERE track_id = v_school_track_id AND code = 'C5';
  IF v_cat_c5_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'C5', '本科生转专业', 35,
      '华师本〔2025〕73号《本科生转专业工作细则》: 三类型 (一般/学分修读/卓越选拔) / 不予办理情形 / 转入计划 15% 下限 / 学分修读 ≥ 2 门 / 卓越学院 + 参军退伍 + 创业休学 不受计划数限制 / 双学位退出 ≠ 转专业 / 转入年级 + 学费. 8 条 track_requirement.')
    RETURNING id INTO v_cat_c5_id;
  ELSE
    UPDATE track_category SET title = '本科生转专业',
      description = '华师本〔2025〕73号《本科生转专业工作细则》: 三类型 (一般/学分修读/卓越选拔) / 不予办理情形 / 转入计划 15% 下限 / 学分修读 ≥ 2 门 / 卓越学院 + 参军退伍 + 创业休学 不受计划数限制 / 双学位退出 ≠ 转专业 / 转入年级 + 学费. 8 条 track_requirement.'
      WHERE id = v_cat_c5_id;
  END IF;

  SELECT id INTO v_cat_c6_id FROM track_category WHERE track_id = v_school_track_id AND code = 'C6';
  IF v_cat_c6_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'C6', '创新创业学分认定', 36,
      '华师教〔2022〕146号《本科生创新创业学分认定管理办法》: 2021 级起施行 / 6 类来源 / 冲抵劳动与创造模块 ≤ 2 学分 / 累计 > 8 → A / 项目级别分值表 / 竞赛三档奖项表 / 论文专利著作分值表 / 自主创业 / 弄虚作假取消学分. 9 条 track_requirement (含 3 张分值表 metadata).')
    RETURNING id INTO v_cat_c6_id;
  ELSE
    UPDATE track_category SET title = '创新创业学分认定',
      description = '华师教〔2022〕146号《本科生创新创业学分认定管理办法》: 2021 级起施行 / 6 类来源 / 冲抵劳动与创造模块 ≤ 2 学分 / 累计 > 8 → A / 项目级别分值表 / 竞赛三档奖项表 / 论文专利著作分值表 / 自主创业 / 弄虚作假取消学分. 9 条 track_requirement (含 3 张分值表 metadata).'
      WHERE id = v_cat_c6_id;
  END IF;

  SELECT id INTO v_cat_c7_id FROM track_category WHERE track_id = v_school_track_id AND code = 'C7';
  IF v_cat_c7_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'C7', '学科竞赛创新成果奖励', 37,
      '华师教〔2022〕67号《本科生学科竞赛与创新成果奖励办法》(奖金, 与 C6 学分认定并行): 奖励范围 A 类省部级+ / A 类竞赛奖金表 (国际/国家/省部级 × 特/一/二/三等) / 学术论文奖金表 / 专利 2000 元. 4 条 track_requirement.')
    RETURNING id INTO v_cat_c7_id;
  ELSE
    UPDATE track_category SET title = '学科竞赛创新成果奖励',
      description = '华师教〔2022〕67号《本科生学科竞赛与创新成果奖励办法》(奖金, 与 C6 学分认定并行): 奖励范围 A 类省部级+ / A 类竞赛奖金表 (国际/国家/省部级 × 特/一/二/三等) / 学术论文奖金表 / 专利 2000 元. 4 条 track_requirement.'
      WHERE id = v_cat_c7_id;
  END IF;

  SELECT id INTO v_cat_c8_id FROM track_category WHERE track_id = v_school_track_id AND code = 'C8';
  IF v_cat_c8_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'C8', '微专业 + 卓越学院', 38,
      '指南 §二、更多机会 / 07 卓越学院 + 09 微专业: 微专业 10-16 学分 5-8 门 / 卓越学院 = 拔尖 2.0 + 5 个实验班 + 强基 / 加入方式 (拔尖二次选拔 / 强基高考) / 拔尖学生特殊待遇. 4 条 track_requirement.')
    RETURNING id INTO v_cat_c8_id;
  ELSE
    UPDATE track_category SET title = '微专业 + 卓越学院',
      description = '指南 §二、更多机会 / 07 卓越学院 + 09 微专业: 微专业 10-16 学分 5-8 门 / 卓越学院 = 拔尖 2.0 + 5 个实验班 + 强基 / 加入方式 (拔尖二次选拔 / 强基高考) / 拔尖学生特殊待遇. 4 条 track_requirement.'
      WHERE id = v_cat_c8_id;
  END IF;

  SELECT id INTO v_cat_c9_id FROM track_category WHERE track_id = v_school_track_id AND code = 'C9';
  IF v_cat_c9_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'C9', '推免管理', 39,
      '华师教〔2023〕127号《推荐优秀应届本科毕业生免试攻读研究生工作管理办法 (2023 年修订)》: 基本资格 (GPA ≥ 2.8 + 排除留学生/二学位/公费师范生) / 名额分配 5 因素 / 综合成绩公式 (学业 70/80% + 素质加分 ≤ 30/20) / 素质加分 7 项上限表 / 特殊审核小组 / 双学位推免 / 取消资格 4 触发 / 推免后限制. 8 条 track_requirement.')
    RETURNING id INTO v_cat_c9_id;
  ELSE
    UPDATE track_category SET title = '推免管理',
      description = '华师教〔2023〕127号《推荐优秀应届本科毕业生免试攻读研究生工作管理办法 (2023 年修订)》: 基本资格 (GPA ≥ 2.8 + 排除留学生/二学位/公费师范生) / 名额分配 5 因素 / 综合成绩公式 (学业 70/80% + 素质加分 ≤ 30/20) / 素质加分 7 项上限表 / 特殊审核小组 / 双学位推免 / 取消资格 4 触发 / 推免后限制. 8 条 track_requirement.'
      WHERE id = v_cat_c9_id;
  END IF;

  -- ---- D 段 (6) ----
  SELECT id INTO v_cat_d1_id FROM track_category WHERE track_id = v_school_track_id AND code = 'D1';
  IF v_cat_d1_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'D1', '本科生注册', 41,
      '华师教〔2021〕132号《本科生注册工作实施细则》: 学期注册 (含缴费) 2 周 grace / 异地实习仍须注册 / 休学不注册 / 延长修业期注册规则 / 未注册第三周统计 + 退/结/毕处理. 5 条 track_requirement.')
    RETURNING id INTO v_cat_d1_id;
  ELSE
    UPDATE track_category SET title = '本科生注册',
      description = '华师教〔2021〕132号《本科生注册工作实施细则》: 学期注册 (含缴费) 2 周 grace / 异地实习仍须注册 / 休学不注册 / 延长修业期注册规则 / 未注册第三周统计 + 退/结/毕处理. 5 条 track_requirement.'
      WHERE id = v_cat_d1_id;
  END IF;

  SELECT id INTO v_cat_d2_id FROM track_category WHERE track_id = v_school_track_id AND code = 'D2';
  IF v_cat_d2_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'D2', '本科生休学与复学', 42,
      '华师本〔2025〕75号《本科生休学与复学工作细则》: 应当休学 4 触发 (治疗/请假 > 1/3) / 休学申请材料 (因病二级甲等以上医院) / 离校 1 周内 / 复学 1 周前申请 / 创业休学不计入最长年限 / 留学生服兵役 / 逾期未复学按毕/结/退处理. 7 条 track_requirement.')
    RETURNING id INTO v_cat_d2_id;
  ELSE
    UPDATE track_category SET title = '本科生休学与复学',
      description = '华师本〔2025〕75号《本科生休学与复学工作细则》: 应当休学 4 触发 (治疗/请假 > 1/3) / 休学申请材料 (因病二级甲等以上医院) / 离校 1 周内 / 复学 1 周前申请 / 创业休学不计入最长年限 / 留学生服兵役 / 逾期未复学按毕/结/退处理. 7 条 track_requirement.'
      WHERE id = v_cat_d2_id;
  END IF;

  SELECT id INTO v_cat_d3_id FROM track_category WHERE track_id = v_school_track_id AND code = 'D3';
  IF v_cat_d3_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'D3', '本科实习', 43,
      '华师教〔2023〕43号《本科实习工作管理办法 (2023 年修订)》: 三类型 (认识/专业/毕业) / 两组织形式 (集中/分散) / 集中实习指导师生比 1:30 / 成绩多维评定 / 分散实习造假处理 / 重修阈值 (不及格或缺 ≥ 1/3). 6 条 track_requirement.')
    RETURNING id INTO v_cat_d3_id;
  ELSE
    UPDATE track_category SET title = '本科实习',
      description = '华师教〔2023〕43号《本科实习工作管理办法 (2023 年修订)》: 三类型 (认识/专业/毕业) / 两组织形式 (集中/分散) / 集中实习指导师生比 1:30 / 成绩多维评定 / 分散实习造假处理 / 重修阈值 (不及格或缺 ≥ 1/3). 6 条 track_requirement.'
      WHERE id = v_cat_d3_id;
  END IF;

  SELECT id INTO v_cat_d4_id FROM track_category WHERE track_id = v_school_track_id AND code = 'D4';
  IF v_cat_d4_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'D4', '本科毕业论文工作指导', 44,
      '华师教〔2021〕207号《本科毕业论文 (设计) 工作指导意见》: 抄袭检测全员 / 第七学期结束前完成选题 / 选题原则 / 指导教师资质 + 工作量 (≤ 6 名/届) / 字数 (文 ≥ 8000 理 ≥ 5000) / 答辩组 ≥ 3 人 / 五级记分 + 至少 1 名交叉评阅 / 优秀率 ≤ 20% / 未通过 3 个月补答辩 / 中途放弃分支 / 不予答辩 4 触发 / 重复率 30%/50% 处理 / 学术不端处分 / 知识产权归学校 / 创新成果替代毕业论文. 15 条 track_requirement.')
    RETURNING id INTO v_cat_d4_id;
  ELSE
    UPDATE track_category SET title = '本科毕业论文工作指导',
      description = '华师教〔2021〕207号《本科毕业论文 (设计) 工作指导意见》: 抄袭检测全员 / 第七学期结束前完成选题 / 选题原则 / 指导教师资质 + 工作量 (≤ 6 名/届) / 字数 (文 ≥ 8000 理 ≥ 5000) / 答辩组 ≥ 3 人 / 五级记分 + 至少 1 名交叉评阅 / 优秀率 ≤ 20% / 未通过 3 个月补答辩 / 中途放弃分支 / 不予答辩 4 触发 / 重复率 30%/50% 处理 / 学术不端处分 / 知识产权归学校 / 创新成果替代毕业论文. 15 条 track_requirement.'
      WHERE id = v_cat_d4_id;
  END IF;

  SELECT id INTO v_cat_d5_id FROM track_category WHERE track_id = v_school_track_id AND code = 'D5';
  IF v_cat_d5_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'D5', '本科毕业论文抽检', 45,
      '华师教〔2024〕65号《本科毕业论文 (设计) 抽检实施办法 (2024 年修订)》: 每年 2 次覆盖全专业 / 5 维度评议 (含 AI 生成标注) / 合格/不合格 2 档 / 答辩前 10% 随机 + 答辩后重点抽 / 不合格三个月延期补答辩 / 申诉 5 工作日 / 院系级 + 专业级后果 (连 2/3 年). 7 条 track_requirement.')
    RETURNING id INTO v_cat_d5_id;
  ELSE
    UPDATE track_category SET title = '本科毕业论文抽检',
      description = '华师教〔2024〕65号《本科毕业论文 (设计) 抽检实施办法 (2024 年修订)》: 每年 2 次覆盖全专业 / 5 维度评议 (含 AI 生成标注) / 合格/不合格 2 档 / 答辩前 10% 随机 + 答辩后重点抽 / 不合格三个月延期补答辩 / 申诉 5 工作日 / 院系级 + 专业级后果 (连 2/3 年). 7 条 track_requirement.'
      WHERE id = v_cat_d5_id;
  END IF;

  SELECT id INTO v_cat_d6_id FROM track_category WHERE track_id = v_school_track_id AND code = 'D6';
  IF v_cat_d6_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'D6', '本科生创新训练计划 CTP', 46,
      '华师本〔2025〕85号《本科生创新训练计划项目管理办法》: 4 级项目 (培育/国创/市创/校创) / 3 类 (创新/创业训练/创业实践) / 团队 ≤ 5 人 / 1 个/学年负责人 / 项目时长 1-2 年 / 结项率 < 85% 减名额 < 60% 零名额 / 优秀率 ≤ 20% / 延期 ≤ 1 年 / 放弃 1 年冷冻期 / 经费上限 (培育 1500 / 国创 10000 / 市创 7000 / 校创 5000). 9 条 track_requirement.')
    RETURNING id INTO v_cat_d6_id;
  ELSE
    UPDATE track_category SET title = '本科生创新训练计划 CTP',
      description = '华师本〔2025〕85号《本科生创新训练计划项目管理办法》: 4 级项目 (培育/国创/市创/校创) / 3 类 (创新/创业训练/创业实践) / 团队 ≤ 5 人 / 1 个/学年负责人 / 项目时长 1-2 年 / 结项率 < 85% 减名额 < 60% 零名额 / 优秀率 ≤ 20% / 延期 ≤ 1 年 / 放弃 1 年冷冻期 / 经费上限 (培育 1500 / 国创 10000 / 市创 7000 / 校创 5000). 9 条 track_requirement.'
      WHERE id = v_cat_d6_id;
  END IF;

  -- ---- E 全校段 (3) ----
  SELECT id INTO v_cat_e1_id FROM track_category WHERE track_id = v_school_track_id AND code = 'E1';
  IF v_cat_e1_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'E1', '本科教育目标与培养方案', 51,
      '指南 §一、培养方案 / 01-03: 培养方案 9 部分构成 / 2025 级 4 大课程结构 (公共必修约 40 + 通识 8 + 学科基础 by_dept + 专业教育 by_dept). 2 条 track_requirement.')
    RETURNING id INTO v_cat_e1_id;
  ELSE
    UPDATE track_category SET title = '本科教育目标与培养方案',
      description = '指南 §一、培养方案 / 01-03: 培养方案 9 部分构成 / 2025 级 4 大课程结构 (公共必修约 40 + 通识 8 + 学科基础 by_dept + 专业教育 by_dept). 2 条 track_requirement.'
      WHERE id = v_cat_e1_id;
  END IF;

  SELECT id INTO v_cat_e2_id FROM track_category WHERE track_id = v_school_track_id AND code = 'E2';
  IF v_cat_e2_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'E2', '公共必修课程及学分构成', 52,
      '指南 §一、培养方案 / 04 公共必修 (约 40 学分): 思政 17 / 大学英语 8 (A/B/C/D 分级) / 计算机 0|3|5 非师范 + 4 师范 / 公共体育 4 / 国情教育 3 / 劳动教育 2 / 心理健康 2 / 通识必修 (劳动 + 心理) 4. 8 条 track_requirement.')
    RETURNING id INTO v_cat_e2_id;
  ELSE
    UPDATE track_category SET title = '公共必修课程及学分构成',
      description = '指南 §一、培养方案 / 04 公共必修 (约 40 学分): 思政 17 / 大学英语 8 (A/B/C/D 分级) / 计算机 0|3|5 非师范 + 4 师范 / 公共体育 4 / 国情教育 3 / 劳动教育 2 / 心理健康 2 / 通识必修 (劳动 + 心理) 4. 8 条 track_requirement.'
      WHERE id = v_cat_e2_id;
  END IF;

  SELECT id INTO v_cat_e3_id FROM track_category WHERE track_id = v_school_track_id AND code = 'E3';
  IF v_cat_e3_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_school_track_id, 'E3', '通识教育课程', 53,
      '指南 §一、培养方案 / 05 通识教育 (8 学分): 3 模块 (人类思维与学科史论 / 经典阅读 / 模块课程) / 强基拔尖 ≥ 1 学分思维 + ≥ 2 学分经典 / 模块课程 6 大模块 (文化审美必修 2 学分). 4 条 track_requirement.')
    RETURNING id INTO v_cat_e3_id;
  ELSE
    UPDATE track_category SET title = '通识教育课程',
      description = '指南 §一、培养方案 / 05 通识教育 (8 学分): 3 模块 (人类思维与学科史论 / 经典阅读 / 模块课程) / 强基拔尖 ≥ 1 学分思维 + ≥ 2 学分经典 / 模块课程 6 大模块 (文化审美必修 2 学分). 4 条 track_requirement.'
      WHERE id = v_cat_e3_id;
  END IF;

  -- ---- E 师范段 (1, 挂师范学院 track) ----
  SELECT id INTO v_cat_e4_id FROM track_category WHERE track_id = v_normal_track_id AND code = 'E4';
  IF v_cat_e4_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (v_normal_track_id, 'E4', '师范生培养', 61,
      '指南 §四 师范生培养: 师范生三类型 (自费/公费/优师) / 公费师范生 6 年服务承诺 + 6 年免学费 / 国家优师 6 年定向县中小学任教 + 4 年免学费 / 课程 4-5 板块 / 教师教育 ≥ 21 学分 / 实践教学 (六个一工程) / 见习 + 实习 + 研习时间安排 / 双导师制. 8 条 track_requirement.')
    RETURNING id INTO v_cat_e4_id;
  ELSE
    UPDATE track_category SET title = '师范生培养',
      description = '指南 §四 师范生培养: 师范生三类型 (自费/公费/优师) / 公费师范生 6 年服务承诺 + 6 年免学费 / 国家优师 6 年定向县中小学任教 + 4 年免学费 / 课程 4-5 板块 / 教师教育 ≥ 21 学分 / 实践教学 (六个一工程) / 见习 + 实习 + 研习时间安排 / 双导师制. 8 条 track_requirement.'
      WHERE id = v_cat_e4_id;
  END IF;


  -- =====================================================================
  -- § 3  track_requirement × 198  (分 6 段 INSERT, 每段一个 ON CONFLICT 块)
  -- =====================================================================

  -- ---- A 段 23 条 (学籍/毕业资格/学位/学分认定/课程考核) ----
  INSERT INTO track_requirement
    (track_id, category_id, code, title, order_index, kind, threshold, description, source_ref, metadata)
  VALUES
    (v_school_track_id, v_cat_a1_id, 'A1-1', '学制与最长学习年限', 1, 'time_limit', 6,
     '本科专业标准学习年限(学制)为 4 年, 最长学习年限(含休学和保留学籍)为 6 年, 自获得普通高等学校学籍起算.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第十五条',
     '{"unit":"year","direction":"upper","standard":4}'::jsonb),
    (v_school_track_id, v_cat_a1_id, 'A1-2', '新生入学逾期 → 放弃资格', 2, 'time_limit', 2,
     '新生持录取通知书按规定期限到校; 未请假/请假未获批准/请假期满逾期 2 周未到校注册的, 视为放弃入学资格.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第八条',
     '{"unit":"week","direction":"deadline","consequence":"forfeit_admission"}'::jsonb),
    (v_school_track_id, v_cat_a1_id, 'A1-3', '保留入学资格', 3, 'time_limit', 2,
     '新生可在报到日期前申请保留入学资格 → 应征参军至退役后 2 年; 其他情况保留 1 年; 最迟保留期满前 1 周申请入学.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第十条 / 第十一条',
     '{"unit":"year","scope":"admission_hold","branches":{"enlistment":2,"other":1}}'::jsonb),
    (v_school_track_id, v_cat_a1_id, 'A1-5', '学期注册 grace (春秋两学期)', 4, 'time_limit', 2,
     '春秋两学期学生须在学校规定时间内办理注册手续; 因故不能如期注册的应申请暂缓注册, 暂缓期限一般不超过 2 周; 休学/保留学籍/未缴学费/其他不符合注册条件的不予注册.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第十三条 / 第十四条',
     '{"unit":"week","scope":"registration_grace"}'::jsonb),
    (v_school_track_id, v_cat_a1_id, 'A1-6', '选课前置 (已注册才能选课)', 5, 'status_gate', NULL,
     '未注册者不予选课; 已注册的学生应按培养方案、在学部院系指导下自主修读课程; GPA 作综合评价指标.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第十六条',
     '{"gate":"registered","required_for":"course_selection"}'::jsonb),
    (v_school_track_id, v_cat_a1_id, 'A1-9', '休学规则 (≤2 年 / 创业不计 / 应征不计)', 6, 'time_limit', 2,
     '休学最小单位为 1 学期, 累计不超过 2 年; 休学创业经审核通过, 休学年限不计入最长学习年限, 累计仍不超过 2 年; 应征参军保留学籍至退役后 2 年, 不计入最长学习年限.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第二十九条—第三十一条',
     '{"unit":"year","scope":"leave_total_cap","exemptions":["entrepreneur","enlistment"]}'::jsonb),
    (v_school_track_id, v_cat_a1_id, 'A1-10', '退学情形 (7 条触发, 含学业成绩未达学校要求)', 7, 'warning_threshold', 10,
     '学生有 7 种情形可予以退学, 含: (1) 学业成绩未达学校要求 (除第一学年秋季学期外, 单个长学期获得学分低于培养方案总学分的 10%, 且累计获得学分低于总学分的 10% × 长学期数); (2) 学习年限内未能毕业或结业; (3) 休学/保留学籍期满未提复学; (4) 患病无法继续学习; (5) 未经批准连续两周未参加教学活动; (6) 超过期限未注册又未办暂缓注册; (7) 其他.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第三十四条',
     '{"unit":"percent_of_total_credits","per_semester_min":10,"cumulative_formula":"10% × N_semesters","consequence":"dropout","first_fall_excluded":true,"all_triggers":["credit_gap","year_limit_unmet","leave_expired_no_resume","illness_unfit","2_weeks_unexcused_absence","registration_overdue","other"]}'::jsonb),
    (v_school_track_id, v_cat_a1_id, 'A1-12', '毕业 / 结业 / 肄业 三档基础条款', 8, 'status_gate', NULL,
     '毕业: 学习年限内完成培养方案要求, 成绩合格、获得相应学分并达到毕业要求 → 毕业证书; 结业: 学分达培养方案总学分 90% 及以上 → 结业证书 (在最长学习年限内可申请返校补修); 肄业: 学满 1 年以上、所获学分达总学分 10% 的退学学生 → 肄业证书; 写实性学习证明: 未达肄业条件; 取消学籍: 不出具任何证明.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第三十七条—第三十九条',
     '{"tiers":[{"status":"毕业","pct":100},{"status":"结业","pct":90},{"status":"肄业","pct":10,"duration_min":"1_year"},{"status":"写实证明","pct":"<10%"}],"blocked_when":"revoked_enrollment"}'::jsonb),
    (v_school_track_id, v_cat_a1_id, 'A1-13', '学历学位证书撤销 (学术不端)', 9, 'status_gate', NULL,
     '以作弊、剽窃、抄袭等学术不端行为或其他不正当手段获得学历证书/学位证书的, 依法予以撤销; 被撤销的证书已注册的, 学校予以注销并报教育行政部门宣布无效. 辅修专业相关证书参照执行.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第四十二条',
     '{"gate":"academic_integrity","consequence":"revoke_certificate"}'::jsonb),

    (v_school_track_id, v_cat_a2_id, 'A2-1', '毕业资格审核三档结果', 1, 'status_gate', NULL,
     '毕业、结业以审核毕业资格时学生绑定的专业培养方案要求为准: 毕业 = 学习年限内完成专业培养方案规定全部课程、成绩合格、获得相应学分并达到毕业要求; 结业 = 未达毕业要求但所获学分达培养方案规定总学分的 90% 及以上; 肄业 = 学满 1 年以上、所获学分达总学分 10% 的退学学生.',
     '华东师范大学2025年本科生手册.md §本科生毕业资格审核工作细则 第四条 (一)(二)(三)',
     '{"tiers":[{"status":"毕业","criterion":"all_courses_done + credits_met"},{"status":"结业","credit_pct":90},{"status":"肄业","credit_pct":10,"duration_min":"1_year"},{"status":"写实证明","criterion":"otherwise"}]}'::jsonb),
    (v_school_track_id, v_cat_a2_id, 'A2-2', '提前毕业 (一般应修满 3 年 / 提前 1 学期申请)', 2, 'time_limit', 3,
     '预计早于标准学习年限完成培养方案的, 一般应在本校修读满 3 年. 学生应提前 1 个学期向所在学部院系提出申请, 经审核报本科生院备案. 后因故无法按期可在毕业资格审核前申请撤销提前毕业.',
     '华东师范大学2025年本科生手册.md §本科生毕业资格审核工作细则 第五条',
     '{"unit":"year","direction":"lower","scope":"early_graduation_min_residency","apply_advance":"1_semester"}'::jsonb),

    (v_school_track_id, v_cat_a3_id, 'A3-1', '学士学位申请基本条件', 1, 'status_gate', NULL,
     '在学校接受本科教育, 通过规定的课程考核或者修满相应学分, 通过毕业论文或毕业设计等毕业环节审查, 达到《中华人民共和国学位法》规定的学士学位申请人基本条件, 且学业要求满足 A3-2 GPA 阈值条件之一.',
     '华东师范大学2025年本科生手册.md §全日制本科学士学位授予工作细则 第四条',
     '{"gate":"degree_prereq","checks":["course_exam_passed","thesis_passed","law_basic"]}'::jsonb),
    (v_school_track_id, v_cat_a3_id, 'A3-2', '学位 GPA 阈值 (本科 2.0 / 特定地区班 1.8 / 留学生达毕业即可)', 2, 'gpa_threshold', 2.0,
     '申请学士学位需 GPA 满足下列条件之一: 全日制本科毕业生 GPA ≥ 2.0; 特定地区班和预科特定学生群体毕业生 GPA ≥ 1.8; 来华留学本科毕业生应达到毕业条件即可.',
     '华东师范大学2025年本科生手册.md §全日制本科学士学位授予工作细则 第四条 (一)(二)(三)',
     '{"scope":"degree_apply","scale":"4.0+","branches":{"regular":{"gpa_min":2.0},"special_region":{"gpa_min":1.8},"international":{"gpa_min":null,"criterion":"meet_graduation_only"}}}'::jsonb),
    (v_school_track_id, v_cat_a3_id, 'A3-3', '处分期间不可申请学位 (期满解除后申请)', 3, 'status_gate', NULL,
     '学位申请人在攻读该学位过程中因学术不端行为受到警告/严重警告/记过/留校察看等违纪处分的, 应当在处分期满解除处分后按程序申请学位.',
     '华东师范大学2025年本科生手册.md §全日制本科学士学位授予工作细则 第五条',
     '{"gate":"discipline_clear","blocked_states":["warning","severe_warning","demerit","probation"],"release_condition":"sentence_expired"}'::jsonb),
    (v_school_track_id, v_cat_a3_id, 'A3-7', '撤销学位 (学术不端 / 顶替入学 / 其他严重违法)', 4, 'status_gate', NULL,
     '学位申请人/学位获得者有以下情形, 经学校学位评定委员会决议不授予学位或撤销学位: (一) 学位论文或实践成果存在代写、剽窃、伪造等学术不端行为; (二) 盗用、冒用他人身份顶替入学; (三) 其他严重违法行为.',
     '华东师范大学2025年本科生手册.md §全日制本科学士学位授予工作细则 第八条',
     '{"gate":"degree_revoke_triggers","triggers":["thesis_misconduct","identity_fraud","other_serious_violation"]}'::jsonb),

    (v_school_track_id, v_cat_a4_id, 'A4-2', '学分认定上限 (≤ 培养方案总学分 40%)', 1, 'gpa_threshold', 40,
     '申请认定的成绩及学分应满足: (一) 已获得学分方可用于申请认定; (二) 累计认定学分数一般不超过在读培养方案总学分的 40%; (三) 学生赴外校交流学习的选课方案或学习计划应提前经所在学部院系审核通过.',
     '华东师范大学2025年本科生手册.md §本科生成绩及学分认定工作细则 第三条',
     '{"unit":"percent_of_total_credits","scope":"credit_recognition_cap","direction":"upper"}'::jsonb),
    (v_school_track_id, v_cat_a4_id, 'A4-3', '成绩学分认定 7 条原则', 2, 'assessment_rule', NULL,
     '认定原则: (一) 同一次学习经历仅受理 1 次认定申请; (二) 更高教学要求/内容/学时数的课程可替代较低同类; (三) 被认定学分总数不超过实际修读学分; (四) 已获得学分的本校课程原则上不可被替代; (五) 学分核算基准按本校学分与学时对应关系; (六) 境外高校所获学分不可认定为思想政治理论课程学分; (七) 成绩及学分认定完成后不再修改.',
     '华东师范大学2025年本科生手册.md §本科生成绩及学分认定工作细则 第四条',
     '{"scope":"credit_recognition_rules","once_per_experience":true,"higher_replaces_lower":true,"no_replace_existing":true,"overseas_excluded_categories":["political_theory"]}'::jsonb),
    (v_school_track_id, v_cat_a4_id, 'A4-5', '成绩学分认定记载方式', 3, 'score_scheme', NULL,
     '经认定后的记载方式: (一) 外校修读课程予以标注 "*"; (二) 多门课程认定为一门课程的, 课程总评记为 P; (三) 经认定为公共课程和通识教育模块课程的, 记录成绩和学分, 不记课程绩点; (四) 经认定为学科基础课程和专业教育课程的, 记录成绩和学分; 课程绩点的计分方式由学生所在学部院系决定.',
     '华东师范大学2025年本科生手册.md §本科生成绩及学分认定工作细则 第七条',
     '{"scope":"credit_recognition_grading","external_mark":"*","multi_to_one_grade":"P","general_no_gpa":true,"professional_gpa_by_dept":true}'::jsonb),

    (v_school_track_id, v_cat_a5_id, 'A5-2', '考核资格 (缺课/缺交累计 > 1/3 → 取消)', 1, 'assessment_rule', NULL,
     '学生缺课学时或缺交作业次数累计超过教学规定要求三分之一 (1/3) 的, 取消该课程考核资格. 确有特殊情况的, 由学生所在院系与开课单位协商一致后确认是否给予考核资格或缓考资格, 报本科生院备案.',
     '华东师范大学2025年本科生手册.md §本科生课程考核管理办法 第十一条',
     '{"scope":"exam_eligibility","check":"absence_or_missed_assignment","max_fraction":"1/3","consequence":"disqualify"}'::jsonb),
    (v_school_track_id, v_cat_a5_id, 'A5-3', '缓考申请 (开考前 2 天 / 突发病 2 工作日内)', 2, 'time_limit', 2,
     '因考核冲突、患病或其他情况不能按时参加的, 最迟应在开考前 2 天向所在院系申请缓考. 突发疾病或事故的应在事发后的 2 个工作日内补交申请, 并提供证明材料 (病历或病假单, 二级甲等以上医院). 未办理缓考申请或申请未批准的视为缺考.',
     '华东师范大学2025年本科生手册.md §本科生课程考核管理办法 第十二条',
     '{"unit":"day","scope":"defer_exam_apply","direction":"before_exam","emergency_window":"2_workdays_after"}'::jsonb),
    (v_school_track_id, v_cat_a5_id, 'A5-4', '不予补考 4 情形 (缺考/违纪/取消资格/缓考不合格)', 3, 'assessment_rule', NULL,
     '课程考核不合格的学生可申请补考或重修. 但以下情况不予补考: (1) 缺考; (2) 考核违纪; (3) 取消考核资格; (4) 缓考不合格.',
     '华东师范大学2025年本科生手册.md §本科生课程考核管理办法 第十三条',
     '{"scope":"resit_eligibility","blocked_states":["absent","misconduct","disqualified","defer_failed"]}'::jsonb),
    (v_school_track_id, v_cat_a5_id, 'A5-5', '补考范围 (限必修+专选; 体育/通识/实践/考查/暑期不设)', 4, 'assessment_rule', NULL,
     '补考、缓考限必修课程和专业选修课程; 公共体育课程、通识教育课程、实践实习类课程及考查类型课程不设补考; 暑期学期课程不设缓考和补考.',
     '华东师范大学2025年本科生手册.md §本科生课程考核管理办法 第十四条',
     '{"scope":"resit_course_scope","eligible_categories":["required","major_elective"],"excluded_categories":["pe_public","general_education","practice","audit","summer_term"]}'::jsonb),
    (v_school_track_id, v_cat_a5_id, 'A5-7', '考核违纪 → 该课成绩无效 + 纪律处分', 5, 'assessment_rule', NULL,
     '学生在课程考核中应严格遵守考核纪律及学术诚信, 如有违反该课程考核成绩记为无效, 并按《华东师范大学学生违纪处分办法》给予相应纪律处分.',
     '华东师范大学2025年本科生手册.md §本科生课程考核管理办法 第七章 / 学籍管理规定 §第二十一条交叉印证',
     '{"scope":"exam_misconduct","consequence":["grade_void","discipline"]}'::jsonb)

  ON CONFLICT (category_id, code) DO UPDATE SET
    title       = EXCLUDED.title,
    order_index = EXCLUDED.order_index,
    kind        = EXCLUDED.kind,
    threshold   = EXCLUDED.threshold,
    description = EXCLUDED.description,
    source_ref  = EXCLUDED.source_ref,
    metadata    = EXCLUDED.metadata,
    updated_at  = now();


  -- ---- B 段 48 条 (选课退课/成绩管理/学业预警/考勤/体测/学费) ----
  INSERT INTO track_requirement
    (track_id, category_id, code, title, order_index, kind, threshold, description, source_ref, metadata)
  VALUES
    -- B1 选课退课和免听免修 (6 条)
    (v_school_track_id, v_cat_b1_id, 'B1-2', '选课前置 (先注册后选课)', 1, 'status_gate', NULL,
     '学生应先注册, 后选课. 未注册者不予选课. 未选课不能获得课程成绩及相应学分.',
     '华东师范大学2025年本科生手册.md §选课退课和免听免修工作细则 第四条',
     '{"gate":"registered","required_for":"course_selection","missing_consequence":"no_grade_no_credit"}'::jsonb),
    (v_school_track_id, v_cat_b1_id, 'B1-3', '学期选课量建议 (25 学分 / 下限 = 预警线)', 2, 'assessment_rule', 25,
     '秋季学期和春季学期单一学期的学生选课量建议 25 学分左右; 双学位项目、卓越学院学生可适量增加; 除毕业学年、参加校外交流等情况外, 单一学期学生选课量一般不得低于学籍预警学分数.',
     '华东师范大学2025年本科生手册.md §选课退课和免听免修工作细则 第五条',
     '{"scope":"semester_credit_load","suggested":25,"lower_bound":"warning_threshold_credits","exemptions":["graduation_year","exchange"],"increase_allowed":["double_degree","honors_college"]}'::jsonb),
    (v_school_track_id, v_cat_b1_id, 'B1-4', '期中退课 (按 B6 缴学费)', 3, 'assessment_rule', NULL,
     '选课结束后, 学生可在期中退课期间申请退课, 经任课教师、学生所在院系批准的终止课程修读及考核; 学生办理期中退课的应按学分制收费办法 (B6 段) 缴纳学费.',
     '华东师范大学2025年本科生手册.md §选课退课和免听免修工作细则 第六条 / 第八条',
     '{"scope":"mid_term_withdraw","approval":["instructor","department"],"fee_rule_ref":"B6"}'::jsonb),
    (v_school_track_id, v_cat_b1_id, 'B1-5', '免听免修不可申请的课程 + 学生类型', 4, 'assessment_rule', NULL,
     '思想政治教育课、军事理论课、开课单位规定的课程一般不可申请免听或免修. 学业预警、试读的学生不可申请免听或免修.',
     '华东师范大学2025年本科生手册.md §选课退课和免听免修工作细则 第九条',
     '{"scope":"waiver_blocked","blocked_courses":["political_theory","military_theory","department_designated"],"blocked_students":["academic_warning","probation"]}'::jsonb),
    (v_school_track_id, v_cat_b1_id, 'B1-6', '免听条件 + 流程 (开课后第 2 周内申请)', 5, 'time_limit', 2,
     '可免听课程范围内, 学生最迟应在开课后第 2 周内向任课教师申请免听; 申请未获批准擅自缺课的视为旷课; 获准免听后学生仍须提交作业并参加考核, 缺交作业次数累计 > 1/3 取消考核资格.',
     '华东师范大学2025年本科生手册.md §选课退课和免听免修工作细则 第十条 / 第十一条',
     '{"unit":"week","direction":"deadline","scope":"waive_listening_apply","post_grant_obligations":{"submit_assignments":true,"attend_exam":true,"max_missed":"1/3"}}'::jsonb),
    (v_school_track_id, v_cat_b1_id, 'B1-7', '免修条件 + 流程 (开课后第 2 周内申请)', 6, 'time_limit', 2,
     '可免修课程范围内, 学业优异或学有特长能达课程教学优秀水平的可申请免修 (开课单位规定不得免修除外); 最迟应在开课后第 2 周内向开课单位申请; 获准免修后无须参加修读和考核, 成绩等级记为最高等级, 如计绩点按最高绩点记.',
     '华东师范大学2025年本科生手册.md §选课退课和免听免修工作细则 第十二条 / 第十三条',
     '{"unit":"week","direction":"deadline","scope":"waive_modify_apply","criterion":"excellent_level","post_grant_grade":"max_level","post_grant_gpa":"max_point"}'::jsonb),

    -- B2 本科生成绩管理 (14 条)
    (v_school_track_id, v_cat_b2_id, 'B2-1', '记分方式总览 (三级 / 十级 / 百分制)', 1, 'score_scheme', NULL,
     '课程成绩的记分方式可采用等级制或百分制. 等级制包含三级制 (A 优秀 / P 及格 / F 不及格) 和十级制 (A / A- / B+ / B / B- / C+ / C / C- / D 补考及格 / F 不及格).',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 第十条 (1)(2)',
     '{"scope":"grade_scheme_top","schemes":["3_level","10_level","percentile"],"3_level_levels":["A","P","F"],"10_level_levels":["A","A-","B+","B","B-","C+","C","C-","D","F"]}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-2', 'A 等级比例上限 (三级 40% / 十级 30%-40%)', 2, 'assessment_rule', NULL,
     '三级制等级 A 的比例一般不超过 40%; 十级制等级 A 的比例一般不超过 30%, 等级 A 和 A- 的比例合计一般不超过 40%.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 第十条 (1)(2)',
     '{"scope":"A_grade_cap","caps":{"3_level":{"A":0.40},"10_level":{"A":0.30,"A_plus_Aminus":0.40}}}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-3', '荣誉课程 / 卓越学院班特殊规则 (A+ / 删 C / 自定 A 比例)', 3, 'assessment_rule', NULL,
     '荣誉课程和面向卓越学院单独开班的课程选用十级制的, 可增设等级 A+, 可删减 C 档, 等级 A 档比例由开课单位制订具体方案, 报本科生院审核通过后实施.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 第十条 (3)',
     '{"scope":"honors_excellence_grade_override","applicable_to":["honors_course","excellence_college_section"],"allow_add":"A+","allow_remove":"C_tier","A_cap_by_department":true}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-4', '缓考/重修/免修不计入等级比例', 4, 'assessment_rule', NULL,
     '缓考、重修、免修的成绩不计入等级比例.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 第十条 (4)',
     '{"scope":"grade_cap_exclusion","excluded":["defer","retake","waive"]}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-5', '课程类型与记分方式映射', 5, 'assessment_rule', NULL,
     '思维训练类课程、实习实践类课程、十人以下教学班应选用等级制; 通识教育课程、经本科生院审定的公共必修课程应采用三级制.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 第十一条',
     '{"scope":"course_to_scheme_mapping","level_required":["thinking_training","practice","small_class_under_10"],"3_level_required":["general_education","public_required_audited"]}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-6', 'P/F 累计上限 8 学分 (每学期 ≤ 1 门 / 考核前 2 周申请)', 6, 'assessment_rule', 8,
     '除已采用三级制记分课程外, 在校期间学生可累计选择不超过 8 学分课程, 以 P (及格) / F (不及格) 方式记分且不计绩点. 每名学生每学期至多选择 1 门课程, 在课程期末考核之前 2 周提出申请, 申请即通过. 本专业学科基础课、非实践类专业必修课和部分限定课程一般不选用 P/F 方式.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 第十二条',
     '{"scope":"PF_credit_cap","total_cap":8,"per_semester_cap":1,"apply_deadline":"2_weeks_before_exam","excluded_categories":["major_basic","major_required_non_practical","designated"],"gpa_excluded":true}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-7', '课程总评等级 (百分制 ≥ 60 按名次比例转十级)', 7, 'score_scheme', NULL,
     '课程总评采用等级制记载: 三级制 (含 P/F)、十级制记分方式 → 等级直接记为课程总评; 百分制记分方式 → 课程成绩 60 分以下记为 F; 60 分及以上由电脑排序按名次比例转化为等级 (相同成绩取相同等级, 见附录 1); 荣誉课程和卓越学院单独开班课程的总评比例由开课单位制订.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 第十三条',
     '{"scope":"final_grade_mapping","<60":"F",">=60":"rank_to_level","honors_override":true}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-8', '课程绩点 (考核不合格 / 三级制不计绩点)', 8, 'assessment_rule', NULL,
     '课程绩点按附录 2 "课程总评与课程绩点的对应关系" 计算. 考核不合格、三级制 (含 P/F 方式) 记分的课程不计绩点.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 第十四条',
     '{"scope":"gpa_excluded_courses","excluded":["failed","3_level","PF"]}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-9', '补考/缓考/重修/免修课程总评记载', 9, 'score_scheme', NULL,
     '补考不计平时成绩, 补考通过总评 D 绩点 1.0, 不通过 F 绩点 0; 缓考计平时成绩按原教学班对照, 缓考未通过不予补考; 重修标记 C, 总评和绩点对应当次课程中非重修学生相同 (或最接近) 总评和绩点; 免修课程总评记最高等级、绩点最高绩点; 无考核资格/缺考/考核违纪 F 绩点 0.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 第十五条',
     '{"scope":"special_grade_records","makeup_pass":{"grade":"D","gpa":1.0},"makeup_fail":{"grade":"F","gpa":0},"defer":"original_class_match","retake":{"marker":"C","grade":"matching_non_retake_peer"},"waive":{"grade":"max_level","gpa":"max_point"},"disqualified_or_absent_or_misconduct":{"grade":"F","gpa":0}}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-10', 'GPA 计算公式 (Σ 绩点 × 学分 / Σ 学分)', 10, 'score_scheme', NULL,
     '平均学分绩点 = Σ(成绩绩点 × 课程学分) / Σ 课程学分. 学分绩点为课程学分乘以课程所得绩点; 重修课程绩点就近计算 1 次; 考核不通过课程不计入.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 第十六条',
     '{"scope":"gpa_formula","formula":"sum(grade_point * credit) / sum(credit)","retake_count":1,"failed_excluded":true}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-11', '加权平均分 (仅百分制)', 11, 'score_scheme', NULL,
     '加权平均分 = Σ(百分制成绩 × 课程学分) / Σ 课程学分. 仅百分制记分课程计算; 重修课程成绩就近计算 1 次; 考核不通过课程和非百分制课程不计入.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 第十六条',
     '{"scope":"weighted_avg_formula","formula":"sum(percentile_score * credit) / sum(credit)","scope_courses":"percentile_only","retake_count":1,"excluded":["failed","non_percentile"]}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-12', '附录 1 · 百分制名次比例 → 十级等级表', 12, 'score_scheme', NULL,
     '百分制 ≥ 60 分课程按名次比例 (M = 名次 / 总人数) 转十级等级: A (M≤30%) / A- (30-40%) / B+ (40-50%) / B (50-70%) / B- (70-80%) / C+ (80-85%) / C (85-95%) / C- (95-100%) / D (补考及格) / F (不及格). 相同成绩 (保留 1 位小数) 取相同等级.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 附录 1',
     '{"scope":"percentile_to_level_table","source":"附录1","table":[["A","M<=30%"],["A-","30%<M<=40%"],["B+","40%<M<=50%"],["B","50%<M<=70%"],["B-","70%<M<=80%"],["C+","80%<M<=85%"],["C","85%<M<=95%"],["C-","95%<M<=100%"],["D","makeup_pass"],["F","fail"]],"note":"rank/total, ties get same level"}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-13', '附录 2 · 课程总评 → 课程绩点表', 13, 'score_scheme', NULL,
     '等级 → 绩点对应 (关键点位): A+ 4.3 / A 4.0 / A- 3.7+0.3×... / B+ 3.3+0.4×... / B 3.0+0.3×... / B- 2.7+0.3×... / C+ 2.3+0.4×... / C 2.0+0.3×... / C- 1.7+0.3×... / D 1.0 / F 0. 区间内按 (S - level_min) / (next_level_min - level_min) 线性插值, 精确到小数点后一位.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 附录 2',
     '{"scope":"level_to_gpa_table","source":"附录2","anchor_points":{"A+":4.3,"A":4.0,"D":1.0,"F":0},"linear_formula":"x.y_base + range * (S - level_min) / (next_level_min - level_min)","precision":1}'::jsonb),
    (v_school_track_id, v_cat_b2_id, 'B2-15', '成绩复查 (学期前 4 周 / 仅限 1 次)', 14, 'time_limit', 4,
     '学生对课程成绩有异议的, 可向开课单位申请复查. 复查申请应当在春季、秋季学期前 4 周内提出, 复查仅限 1 次. 确系有误的, 由任课教师提交更正申请.',
     '华东师范大学2025年本科生手册.md §本科生成绩管理办法 第二十条',
     '{"unit":"week","direction":"deadline","scope":"grade_review_apply","max_times":1,"anchor":"semester_start"}'::jsonb),

    -- B3 本科生学业预警 (5 条)
    (v_school_track_id, v_cat_b3_id, 'B3-1', '预警线 (累计学分 < 14% × 学期数 / GPA < 学位线 / 其他)', 1, 'warning_threshold', 14,
     '学生学业成绩出现以下情况之一者达预警线: (一) 自入学起累计获得学分低于培养方案规定总学分的 14% × 长学期数; (二) 平均学分绩点 GPA 低于学士学位授予条件 (参 A3-2 本科 2.0 / 特定地区班 1.8); (三) 其他可能导致无法毕业的情况.',
     '华东师范大学2025年本科生手册.md §本科生学业预警工作细则 第三条',
     '{"stage":"warning","triggers":[{"rule":"cumulative_credit_pct < 14% × N_semesters"},{"rule":"gpa < degree_apply_threshold","ref":"A3-2"},{"rule":"other_grad_risk"}]}'::jsonb),
    (v_school_track_id, v_cat_b3_id, 'B3-3', '学业预警学分计算规则', 2, 'assessment_rule', NULL,
     '学业预警及退学试读的学分计算: (一) 学生应获总学分数以绑定培养方案为准, 尚未完成大类分流的按所在大类中总学分最少的专业计算; (二) 暑期短学期所获学分可计入当学年春季学期; (三) 单个学期所获学分包含当学期修读所有课程, 各学期累计中重修课程学分仅计算 1 次; (四) 休学学期不纳入计算.',
     '华东师范大学2025年本科生手册.md §本科生学业预警工作细则 第五条',
     '{"scope":"credit_count_rules","total_basis":"bound_plan_or_lowest_in_cluster","summer_to_spring":true,"retake_count":1,"leave_excluded":true}'::jsonb),
    (v_school_track_id, v_cat_b3_id, 'B3-4', '第一次退学线 → 试读 (学制内仅限 1 次)', 3, 'status_gate', NULL,
     '标准学习年限 (学制) 内, 学业成绩第一次达到退学线的学生可申请试读. 试读原则上仅限一次. 学生延期且未达到最长学习年限, 不因学业成绩作退学处理.',
     '华东师范大学2025年本科生手册.md §本科生学业预警工作细则 第七条',
     '{"stage":"probation_first","trigger":"first_dropout_line","limit":1,"exemption":"extended_within_max_years"}'::jsonb),
    (v_school_track_id, v_cat_b3_id, 'B3-6', '试读结果 (高于线解除 / 低于线退学或二试)', 4, 'status_gate', NULL,
     '试读学期结束: 学生学业成绩高于退学线的解除试读; 学生学业成绩低于退学线的且未满足第二次试读三条件的, 应予退学处理.',
     '华东师范大学2025年本科生手册.md §本科生学业预警工作细则 第十条',
     '{"stage":"probation_resolve","outcomes":[{"condition":"above_dropout_line","result":"release_probation"},{"condition":"below_dropout_line && !second_probation_eligible","result":"dropout"}]}'::jsonb),
    (v_school_track_id, v_cat_b3_id, 'B3-7', '第二次退学线三条件 (有效学分 ≥ 8% × 学期数)', 5, 'status_gate', 8,
     '学业成绩第二次低于退学线的, 如学生同时满足以下三个条件且所在学部院系认为学生可完成学业并为学生配备学业导师的可第二次申请试读: (一) 学生累计所获有效学分数不低于培养方案总学分的 8% × 修读学期数; (二) 经综合评估学生能够完成培养方案; (三) 家庭正确认识学生学业并充分支持. 试读获批 1 学期, 未批退学.',
     '华东师范大学2025年本科生手册.md §本科生学业预警工作细则 第十一条',
     '{"stage":"probation_second","all_conditions_required":true,"conditions":[{"rule":"valid_credits >= 8% × N_semesters"},{"rule":"plan_feasible_eval"},{"rule":"family_support"}],"extra":"advisor_assigned","limit":1}'::jsonb),

    -- B4 本科生考勤 (6 条)
    (v_school_track_id, v_cat_b4_id, 'B4-1', '旷课定义 (无请假 / 请假未批 / 请假期满擅自缺席)', 1, 'assessment_rule', NULL,
     '学生应按时参加培养方案规定的课程和各种教育教学环节, 不得迟到、早退. 因故不能参加者必须履行请假手续. 凡未经请假、请假未获批准或请假期满擅自缺席课程学习者均以旷课论处.',
     '华东师范大学2025年本科生手册.md §本科生考勤细则 §一',
     '{"scope":"truancy_definition","conditions":["no_leave","leave_denied","leave_expired"]}'::jsonb),
    (v_school_track_id, v_cat_b4_id, 'B4-2', '旷课学时折算 (论文/天 3 学时 / 实习/天 4 学时)', 2, 'assessment_rule', NULL,
     '旷课按实际授课时数计算学时. 毕业论文 (毕业设计) 的旷课学时每天按 3 学时计算; 教育实习、野外实习、专业实习等实习课程旷课学时每天按 4 学时计算; 非节假日离校未请假擅自离校者按每天 4 学时计算.',
     '华东师范大学2025年本科生手册.md §本科生考勤细则 §二 / §三',
     '{"scope":"truancy_hour_conversion","default":"actual_hours","thesis_per_day":3,"internship_per_day":4,"unauthorized_leave_per_day":4}'::jsonb),
    (v_school_track_id, v_cat_b4_id, 'B4-3', '高水平运动员 + 艺术特长生 (一次训练赛 3 学时)', 3, 'assessment_rule', NULL,
     '高水平运动员须参加学校高水平运动队的常规训练和学校组织的比赛和体育活动, 无故不参加训练和比赛的作旷课处理, 一次训练和比赛折合 3 学时; 艺术特长生须参加学校艺术团的训练和学校组织的演出比赛, 无故不参加作旷课处理, 一次训练和比赛折合 3 学时.',
     '华东师范大学2025年本科生手册.md §本科生考勤细则 §四 / §五',
     '{"scope":"special_student_truancy","applicable_to":["high_level_athlete","art_specialty"],"per_session":3,"trigger":"unexcused_absence_from_training_or_competition"}'::jsonb),
    (v_school_track_id, v_cat_b4_id, 'B4-4', '旷课处分阈值 (学期 ≥ 10 学时纪律处分 / 连续 2 周退学)', 4, 'warning_threshold', 10,
     '一学期累计旷课达到 10 学时以上的, 将按《华东师范大学学生违纪处分办法》给予相应纪律处分. 连续两周无故不参加学校规定的教育教学活动者作退学处理 (与 A1-10 第 5 项一致).',
     '华东师范大学2025年本科生手册.md §本科生考勤细则 §六',
     '{"stage":"truancy_consequence","thresholds":[{"level":"disciplinary","trigger":"semester_truancy_hours >= 10"},{"level":"dropout","trigger":"continuous_2_weeks_unexcused","cross_ref":"A1-10(5)"}]}'::jsonb),
    (v_school_track_id, v_cat_b4_id, 'B4-5', '请假权限分级 (≤ 5 天院系 / > 5 天教务处)', 5, 'assessment_rule', 5,
     '学生请假除急病或紧急事故以外须事先填写请假单, 经辅导员签署意见送管理院系办理手续. 请假五天以内 (含五天) 者由管理院系审批; 请假五天以上者由管理院系报教务处审批.',
     '华东师范大学2025年本科生手册.md §本科生考勤细则 §七',
     '{"scope":"leave_approval_authority","<=5_days":"department",">5_days":"academic_affairs","emergency_exempt":true}'::jsonb),
    (v_school_track_id, v_cat_b4_id, 'B4-6', '请假累计上限 (≤ 学期 1/3 / 毕业班可延)', 6, 'assessment_rule', NULL,
     '累计请假期限原则上不超过学期的 1/3. 对于仅有毕业论文 (毕业设计) 的毕业班学生, 因顶岗实习、开展毕业论文等正当事由需要超出 1/3 的, 经专业院系评估预期能够顺利完成学业的情况下, 请假期限可结合学生管理院系意见并在保证安全的前提下予以延长.',
     '华东师范大学2025年本科生手册.md §本科生考勤细则 §七',
     '{"scope":"leave_total_cap","default_cap":"1/3_of_semester","exemption":{"scope":"graduation_year_thesis_only","reasons":["internship","thesis_work"],"requires":"department_eval"}}'::jsonb),

    -- B5 本科生体质健康测试 (7 条)
    (v_school_track_id, v_cat_b5_id, 'B5-1', '体测适用范围 (全体本科生 / 留学生免测 / 休学免测)', 1, 'status_gate', NULL,
     '本办法适用于华东师范大学全体普通全日制本科生. 留学生、符合《标准》要求申请免测并审核通过的学生予以免测; 学生休学 (保留学籍) 期间免于测试, 但在国内高校交流学习的学生一般应提供在交流学校体质健康测试的成绩.',
     '华东师范大学2025年本科生手册.md §本科生体质健康测试工作实施办法 第三条',
     '{"scope":"fitness_test_applicable","included":"all_undergraduate","exempted":["international","approved_exempt","on_leave"],"exchange_in_china_must_provide_score":true}'::jsonb),
    (v_school_track_id, v_cat_b5_id, 'B5-3', '体测评分构成 (满分 120 = 标准 100 + 附加 20)', 2, 'score_scheme', NULL,
     '《标准》学年总分由标准分与附加分之和构成满分 120 分. 标准分满分 100 分由各单项指标得分与权重乘积之和组成; 附加分满分 20 分根据实测成绩确定 (对成绩超过 100 分的加分指标加分). 加分指标: 男生引体向上和 1000 米跑; 女生 1 分钟仰卧起坐和 800 米跑; 各指标加分幅度均为 10 分.',
     '华东师范大学2025年本科生手册.md §本科生体质健康测试工作实施办法 第四条 (一) 2',
     '{"scope":"fitness_score_structure","total_cap":120,"standard_cap":100,"bonus_cap":20,"bonus_indicators":{"male":["pull_up","1000m"],"female":["sit_up_1min","800m"]},"per_indicator_max":10}'::jsonb),
    (v_school_track_id, v_cat_b5_id, 'B5-4', '体测等级评定 (优 ≥ 90 / 良 80-89.9 / 及格 60-79.9 / 不及格 ≤ 59.9)', 3, 'gpa_threshold', NULL,
     '根据学生学年总分评定等级: 优秀 90.0 分及以上; 良好 80.0 - 89.9 分; 及格 60.0 - 79.9 分; 不及格 59.9 分及以下.',
     '华东师范大学2025年本科生手册.md §本科生体质健康测试工作实施办法 第四条 (二) 1',
     '{"scope":"fitness_grade_scale","levels":[{"name":"优秀","min":90.0},{"name":"良好","min":80.0,"max":89.9},{"name":"及格","min":60.0,"max":79.9},{"name":"不及格","max":59.9}]}'::jsonb),
    (v_school_track_id, v_cat_b5_id, 'B5-5', '体测补测 (本学年准 1 次 / 仍不及格学年不及格)', 4, 'assessment_rule', 1,
     '测试成绩评定不及格者在本学年准予补测一次, 补测仍不及格则学年成绩评定为不及格.',
     '华东师范大学2025年本科生手册.md §本科生体质健康测试工作实施办法 第四条 (二) 1',
     '{"scope":"fitness_makeup","max_times":1,"fail_consequence":"final_fail"}'::jsonb),
    (v_school_track_id, v_cat_b5_id, 'B5-6', '体测毕业成绩公式 (毕业当年 50% + 其他年均 50%)', 5, 'gpa_threshold', NULL,
     '学生毕业时的成绩和等级, 按毕业当学年总分的 50% 与其他学年总分平均得分的 50% 之和进行评定.',
     '华东师范大学2025年本科生手册.md §本科生体质健康测试工作实施办法 第四条 (二) 2',
     '{"scope":"fitness_grad_score_formula","formula":"final_year * 0.50 + avg(other_years) * 0.50"}'::jsonb),
    (v_school_track_id, v_cat_b5_id, 'B5-8', '体测评优门槛 (≥ 60 分 / 2023 级起施行)', 6, 'gpa_threshold', 60,
     '测试成绩评定达到 60 分及以上者方可参加评优与评奖 (自 2023 级本科新生开始施行). 2023 级之前的本科生仍按原有办法执行. 确实丧失运动能力、被免予执行《标准》的学生仍可参加评优与评奖.',
     '华东师范大学2025年本科生手册.md §本科生体质健康测试工作实施办法 第六条 1',
     '{"scope":"fitness_award_eligibility","since_cohort":2023,"threshold":60,"exemption":"disabled_exempted"}'::jsonb),
    (v_school_track_id, v_cat_b5_id, 'B5-9', '体测毕业门槛 (< 50 分按结业/肄业 / 2023 级起施行)', 7, 'gpa_threshold', 50,
     '学生毕业时, 体质健康测试成绩达不到 50 分者按结业或肄业处理, 自 2023 级本科新生开始施行.',
     '华东师范大学2025年本科生手册.md §本科生体质健康测试工作实施办法 第六条 2',
     '{"scope":"fitness_grad_threshold","since_cohort":2023,"fail_threshold":50,"consequence":"degraded_to_completion_or_yebi"}'::jsonb),

    -- B6 学分制收费 (10 条)
    (v_school_track_id, v_cat_b6_id, 'B6-1', '学分制收费适用范围 (2023 级起 / 2022 级及前按旧办法)', 1, 'status_gate', NULL,
     '本办法适用于华东师范大学全日制本科学生. 本办法从 2023 年入学的本科生、预科生开始执行. 2022 年及以前入学学生按原《学分制收费管理办法》(华师财〔2011〕2号) 规定执行.',
     '华东师范大学2025年本科生手册.md §本科生学分制收费管理办法 第二条 / 第二十二条',
     '{"scope":"tuition_applicable","since_cohort":2023,"pre_2023_uses_old_rules":"华师财[2011]2号"}'::jsonb),
    (v_school_track_id, v_cat_b6_id, 'B6-3', '校际交流学费 (按本校预收 / 协议优先)', 2, 'assessment_rule', NULL,
     '学生在学期间参加校际交流项目的应按本办法第五条标准缴纳预收学费. 从外校转入我校的学分作为学费结算的计量对象. 交流项目有特别规定的, 以该项目的协议书规定的收费标准和办法为准.',
     '华东师范大学2025年本科生手册.md §本科生学分制收费管理办法 第六条',
     '{"scope":"exchange_program_fee","default":"home_school_rate","credit_settle_basis":"transferred_in","special_program_override":"per_agreement"}'::jsonb),
    (v_school_track_id, v_cat_b6_id, 'B6-4', '转专业 / 双学位收费 (转后按新 / 双按第一主修)', 3, 'tuition', NULL,
     '转专业学生在转专业前按原专业的预收标准缴纳学费, 转专业后按转入专业的预收标准缴纳学费; 双学士学位项目学生按第一主修专业的预收标准缴纳学费.',
     '华东师范大学2025年本科生手册.md §本科生学分制收费管理办法 第七条',
     '{"scope":"transfer_double_degree_fee","transfer":"pre_old_post_new","double_degree":"first_major"}'::jsonb),
    (v_school_track_id, v_cat_b6_id, 'B6-5', '超额学分单价 (165 元 普通 / 300 元 留学生)', 4, 'tuition', NULL,
     '按学分收费时实行统一标准收取超额学分的学费. 现行学分收费标准: 普通全日制学生 165 元/学分; 留学生 300 元/学分.',
     '华东师范大学2025年本科生手册.md §本科生学分制收费管理办法 第八条',
     '{"scope":"overage_credit_unit_price","regular":165,"international":300,"currency":"CNY","unit":"per_credit"}'::jsonb),
    (v_school_track_id, v_cat_b6_id, 'B6-6', '期中退课退费 (按 B6-5 缴 / 不计入离校结算)', 5, 'tuition', NULL,
     '学生期中退课, 对所退课程按本办法第八条标准缴纳学费. 期中退课的学分不再计入离校学费结算.',
     '华东师范大学2025年本科生手册.md §本科生学分制收费管理办法 第九条',
     '{"scope":"mid_term_withdraw_fee","rate_ref":"B6-5","excluded_from_final_settlement":true}'::jsonb),
    (v_school_track_id, v_cat_b6_id, 'B6-7', '中途离校结算公式 (退/补 = 预收 × 学期/2 - 已缴)', 6, 'tuition', NULL,
     '转学、退学、结业、肄业等未取得毕业资格离校的学生按以下标准结算: 应退 (补) 费用 = 专业的学费预收标准 × 实际修读学期 / 2 − 已缴纳学费. 计算结果为负数学校退还相应学费, 结果为正数学生补缴相应学费.',
     '华东师范大学2025年本科生手册.md §本科生学分制收费管理办法 第十一条',
     '{"scope":"early_leave_settlement","formula":"(annual_rate * actual_semesters / 2) - paid","positive_means_owe":true,"negative_means_refund":true,"applicable_to":["transfer_out","dropout","completion","incompletion"]}'::jsonb),
    (v_school_track_id, v_cat_b6_id, 'B6-8', '毕业生超修结算 (10 学分免补 / 卓越学院免结算)', 7, 'tuition', 10,
     '除卓越学院毕业学生外, 其余毕业学生离校时按以下标准结算: 应退 (补) 费用的学分数 = 学生实际修读的学分总数 (包括转换学分、重修学分、不及格课程学分) − 学生培养方案规定的应修学分数; 结果为 10 学分以内 (含) 不用补缴; 超出 10 学分的部分由学生按 B6-5 标准补缴相应的学费.',
     '华东师范大学2025年本科生手册.md §本科生学分制收费管理办法 第十二条',
     '{"scope":"graduation_overage_settlement","excluded":["excellence_college"],"formula":"actual_credits - required_credits","free_buffer":10,"rate_ref":"B6-5","included_credit_types":["converted","retake","failed"]}'::jsonb),
    (v_school_track_id, v_cat_b6_id, 'B6-9', '转入学分免结算 (插班生/重高考/研究生先修)', 8, 'tuition', NULL,
     '插班生等从外校转入的学生以及重新高考被我校录取在原所在院校获得并经认定转入我校的学分不纳入学费结算. 提前修读研究生课程的学分不纳入学费结算.',
     '华东师范大学2025年本科生手册.md §本科生学分制收费管理办法 第十三条',
     '{"scope":"settlement_excluded_credits","excluded":["transferred_in","reapplied_recognized","graduate_advance"]}'::jsonb),
    (v_school_track_id, v_cat_b6_id, 'B6-10', '公费师范生 + 优师计划 (标准学年免学费 / 超额按 B6-5)', 9, 'tuition', NULL,
     '公费师范生和优师计划学生执行如下标准: 学校免收标准修业年限内的学费; 超出标准修业年限后, 实际修读课程学分按 B6-5 标准在离校时缴纳学费; 期中退课按 B6-6 缴费.',
     '华东师范大学2025年本科生手册.md §本科生学分制收费管理办法 第十五条',
     '{"scope":"government_funded_teacher_track","applicable_to":["public_normal","priority_teacher"],"free_within":"standard_years","overage_rate_ref":"B6-5"}'::jsonb),
    (v_school_track_id, v_cat_b6_id, 'B6-11', '未缴学费 → 不予注册 + 不能选课', 10, 'status_gate', NULL,
     '未按学校规定缴纳学费的学生不予注册, 也不享有在籍学生的选课等相关权利.',
     '华东师范大学2025年本科生手册.md §本科生学分制收费管理办法 第十九条',
     '{"gate":"tuition_paid","missing_consequence":["no_registration","no_course_selection"]}'::jsonb)

  ON CONFLICT (category_id, code) DO UPDATE SET
    title       = EXCLUDED.title,
    order_index = EXCLUDED.order_index,
    kind        = EXCLUDED.kind,
    threshold   = EXCLUDED.threshold,
    description = EXCLUDED.description,
    source_ref  = EXCLUDED.source_ref,
    metadata    = EXCLUDED.metadata,
    updated_at  = now();


  -- ---- C 段 56 条 (辅修/双学位/强基/个性化/转专业/创新创业/竞赛/微专业/推免) ----
  INSERT INTO track_requirement
    (track_id, category_id, code, title, order_index, kind, threshold, description, source_ref, metadata)
  VALUES
    -- C1 辅修专业修读 (10 条)
    (v_school_track_id, v_cat_c1_id, 'C1-1', '辅修适用范围 (2024 级起 / 旧办法保留)', 1, 'status_gate', NULL,
     '本办法适用于 2024 年及以后招生的辅修专业, 2023 年以前的仍按原规定执行.',
     '华东师范大学2025年本科生手册.md §本科辅修专业修读管理办法 §适用范围',
     '{"scope":"minor_program_applicable","since_admission_year":2024,"pre_2024":"old_rules"}'::jsonb),
    (v_school_track_id, v_cat_c1_id, 'C1-2', '辅修专业总学分 (30-36 / ≥ 4 学期)', 2, 'program_rule', NULL,
     '辅修专业课程体系聚焦相同主修专业的专业必修课程, 确有必要的可设置毕业论文 (或毕业设计) 要求. 总学分在 30-36 学分. 培养方案规定课程至少安排在 4 学期完成.',
     '华东师范大学2025年本科生手册.md §本科辅修专业修读管理办法 第二条',
     '{"module":"minor","credit_range":[30,36],"min_semesters":4,"optional_thesis":true}'::jsonb),
    (v_school_track_id, v_cat_c1_id, 'C1-3', '辅修修读资格 (全日制 + 主修学有余力 + 跨专业类)', 3, 'program_rule', NULL,
     '申请修读辅修专业的学生需具备: (一) 具有华东师范大学及有合作关系学校学籍的全日制在校本科生; (二) 主修专业学习成绩优良、学有余力; (三) 辅修专业应与主修专业归属不同的专业类; (四) 辅修专业开设院系制定的其它条件.',
     '华东师范大学2025年本科生手册.md §本科辅修专业修读管理办法 第三条',
     '{"module":"minor","scope":"apply_conditions","required":["full_time_undergraduate","good_academic_standing","cross_major_class","department_specific"]}'::jsonb),
    (v_school_track_id, v_cat_c1_id, 'C1-4', '辅修报名时点与录取原则', 4, 'program_rule', NULL,
     '学生一般可在第 2 学期进行辅修专业报名. 录取原则: 本校优先、主修专业绩点优先、跨专业优先.',
     '华东师范大学2025年本科生手册.md §本科辅修专业修读管理办法 第四条',
     '{"module":"minor","apply_semester":2,"selection_priority":["home_school","main_gpa","cross_major"]}'::jsonb),
    (v_school_track_id, v_cat_c1_id, 'C1-5', '辅修学费规则 (试听 2 周 / 按 B6 标准)', 5, 'tuition', 2,
     '辅修专业学生每学期初根据院系开课计划学分总数自行缴纳学费, 收费标准参照相同主修专业按 B6 段执行. 初次修读可试听两周, 不满意者可退课; 两周后继续修读的需按期缴费, 逾期不缴的教务处做退籍退课处理.',
     '华东师范大学2025年本科生手册.md §本科辅修专业修读管理办法 第六条',
     '{"module":"minor","trial_period_weeks":2,"fee_rate_ref":"B6","late_consequence":"forced_withdrawal"}'::jsonb),
    (v_school_track_id, v_cat_c1_id, 'C1-6', '辅修补考重修 (40-59 分可补考 / 缺考可重修)', 6, 'assessment_rule', NULL,
     '辅修专业课程考核成绩在 40-59 分的学生可以参加补考; 因病、课程考试冲突等可以申请缓考. 补考不及格及缺考学生允许重修, 学生需按要求重新选课并缴费.',
     '华东师范大学2025年本科生手册.md §本科辅修专业修读管理办法 第八条',
     '{"module":"minor","resit_score_range":[40,59],"defer_reasons":["illness","schedule_conflict"],"retake_allowed_after":["resit_fail","absent"]}'::jsonb),
    (v_school_track_id, v_cat_c1_id, 'C1-7', '辅修冲突处理 (每学期 ≤ 1 门免听不免考 / 主修替代)', 7, 'program_rule', 1,
     '辅修修读期内, 如遇辅修课程与主修课程上课时间冲突、师范学生外地教学实习等正常教学安排, 经任课教师与开课院系同意, 每学期可申请最多 1 门辅修专业课程 "免听不免考"; 本校学生在主修专业修读的课程经开课院系认定, 可以替代辅修专业同类课程; 两类情形均应缴纳辅修专业相应课程学费.',
     '华东师范大学2025年本科生手册.md §本科辅修专业修读管理办法 第九条',
     '{"module":"minor","conflict_waiver_per_semester":1,"main_to_minor_substitution":true,"fee_still_charged":true}'::jsonb),
    (v_school_track_id, v_cat_c1_id, 'C1-8', '辅修最长修读年限 (= 主修最长 6 年)', 8, 'time_limit', 6,
     '原则上学生应在主修专业修读期间完成辅修专业规定的全部课程, 辅修专业最长学习年限至主修专业最长学习年限 (含休学) 止 (即主修 6 年内, 参 A1-1).',
     '华东师范大学2025年本科生手册.md §本科辅修专业修读管理办法 第十条',
     '{"module":"minor","unit":"year","direction":"upper","scope":"minor_max_years","anchor":"main_program_max","cross_ref":"A1-1"}'::jsonb),
    (v_school_track_id, v_cat_c1_id, 'C1-9', '辅修学位授予条件 (与主修同审 / 获主修学位)', 9, 'status_gate', NULL,
     '辅修专业毕业资格审查与主修专业毕业资格审查同时进行. 符合下列条件者可申请授予辅修学位: (一) 具有华东师范大学学籍的本科生; (二) 获得主修专业学士学位; (三) 在主修专业最长学习年限内达到辅修专业毕业要求.',
     '华东师范大学2025年本科生手册.md §本科辅修专业修读管理办法 第十一条',
     '{"module":"minor","scope":"minor_degree_prereq","required":["ecnu_enrollment","main_degree_obtained","minor_grad_req_met_within_main_max"],"simultaneous_audit":true}'::jsonb),
    (v_school_track_id, v_cat_c1_id, 'C1-10', '辅修证书发放 3 档场景', 10, 'status_gate', NULL,
     '本校学生: (一) 主修修读年限内同时达到主修和辅修要求 → 辅修学位注明在主修学位证书中不单独发放; (二) 达到主修但未达辅修 → 可申请延长年限继续修辅修, 最长年限内达到则注明在主修证书, 若学生要求提前取得主修毕业证书和学位证书, 辅修转为发放辅修专业证书 (无学位); (三) 达到辅修但未达主修 → 不提前发放辅修学位证书, 最长年限内达主修则注明, 未达则辅修不单独发放学士学位证书, 转为辅修专业证书. 外校学生达到辅修要求发辅修专业证书.',
     '华东师范大学2025年本科生手册.md §本科辅修专业修读管理办法 第十三条 / 第十四条',
     '{"module":"minor","scope":"minor_cert_logic","scenarios":[{"case":"both_met","result":"degree_in_main_cert","standalone":false},{"case":"main_only_met_extended","result":"degree_in_main_cert_after_extend"},{"case":"main_met_minor_unmet_proceed","result":"minor_program_certificate"},{"case":"minor_met_main_unmet","result":"hold_then_certificate_or_minor_program"}],"external_student":"minor_program_cert_or_transcript"}'::jsonb),

    -- C2 双学士学位 (7 条)
    (v_school_track_id, v_cat_c2_id, 'C2-1', '双学位学制 (4 年 / 最长 6 年)', 1, 'time_limit', 6,
     '双学士学位项目的学制为 4 年, 最长修读年限不超过 6 年 (含休学).',
     '华东师范大学2025年本科生手册.md §双学士学位复合型人才培养项目管理办法 第三条',
     '{"module":"double_degree","unit":"year","direction":"upper","standard":4,"max_with_leave":6}'::jsonb),
    (v_school_track_id, v_cat_c2_id, 'C2-2', '双学位培养方案总学分 (约 180)', 2, 'program_rule', 180,
     '双学士学位培养方案原则上总学分保持在 180 学分左右, 应体现两个专业的核心培养要求, 在课程、考核、实习实践等培养环节充分体现出跨学科、复合型、创新性、高质量.',
     '华东师范大学2025年本科生手册.md §双学士学位复合型人才培养项目管理办法 第五条',
     '{"module":"double_degree","scope":"total_credits","approx":180,"requires_cross_discipline":true}'::jsonb),
    (v_school_track_id, v_cat_c2_id, 'C2-3', '双学位动态进出 (高考招生 + 校内补选 / 学期末退出)', 3, 'program_rule', NULL,
     '双学士学位项目通过高考招收学生, 实行动态进出机制: 退出可申请参加对口拔尖班遴选/转专业/院系劝退, 学生退出项目后转至招生专业普通班级, 原则上退出工作在每学期或每学年末进行; 补入除高考招生外项目提供校内补选机会, 工作流程参照转专业工作, 同一招生专业的学生进入项目不占用学生转专业机会、不走系统申报通道.',
     '华东师范大学2025年本科生手册.md §双学士学位复合型人才培养项目管理办法 第六条',
     '{"module":"double_degree","scope":"dynamic_in_out","entry":["gaokao","internal_supplement"],"exit":["self_apply","department_dismissal","top_class_transfer","major_transfer"],"exit_timing":"semester_or_year_end","internal_entry_no_transfer_quota":true}'::jsonb),
    (v_school_track_id, v_cat_c2_id, 'C2-4', '双学位日常管理归属 (招生专业)', 4, 'program_rule', NULL,
     '双学士学位项目学生的日常管理原则上归属招生专业.',
     '华东师范大学2025年本科生手册.md §双学士学位复合型人才培养项目管理办法 第七条',
     '{"module":"double_degree","scope":"admin_attribution","default":"admission_major"}'::jsonb),
    (v_school_track_id, v_cat_c2_id, 'C2-5', '双学位退出后学分处理 (如实记载 + 学分转换)', 5, 'program_rule', NULL,
     '学生因转专业或其他原因退出双学士学位项目, 已修读课程的成绩和学分如实记载, 学分转换按学校学分转换相关规定执行.',
     '华东师范大学2025年本科生手册.md §双学士学位复合型人才培养项目管理办法 第八条',
     '{"module":"double_degree","scope":"exit_credit_handling","preserve_grades":true,"conversion_per_rules":true}'::jsonb),
    (v_school_track_id, v_cat_c2_id, 'C2-6', '双学位授予条件 (达培养方案 + 双方学位条件 / 单证双注)', 6, 'status_gate', NULL,
     '达到双学士学位培养方案规定的课程、学分和毕业要求可授予毕业证书; 同时符合双方学士学位授予条件的学生可申请授予双学士学位. 双学士学位只发放一本学位证书, 所授两个学位在证书中予以注明.',
     '华东师范大学2025年本科生手册.md §双学士学位复合型人才培养项目管理办法 第九条 / 第十条',
     '{"module":"double_degree","scope":"degree_prereq","required":["plan_complete","both_degree_conditions_met"],"cert":"single_cert_dual_notation"}'::jsonb),
    (v_school_track_id, v_cat_c2_id, 'C2-7', '双学位未达条件回退 (延期或回退单学位)', 7, 'status_gate', NULL,
     '未达到双学士学位授予条件的学生可: 根据学籍管理规定申请延期; 或按照双学士学位中招生专业的普通班级培养方案进行毕业审核和学位审核, 如达到该方向的学士学位授予条件可申请授予相应的 (单) 学士学位.',
     '华东师范大学2025年本科生手册.md §双学士学位复合型人才培养项目管理办法 第十一条',
     '{"module":"double_degree","scope":"fallback_options","options":[{"name":"延期","ref":"A2-3"},{"name":"回退单学位","basis":"admission_major_regular_class"}]}'::jsonb),

    -- C3 强基计划 (4 条 / ⚠️ 新 PDF 未独立办法 散见 4 条)
    (v_school_track_id, v_cat_c3_id, 'C3-1', '强基计划转专业例外 (仅规定范围内)', 1, 'program_rule', NULL,
     '强基计划学生属于"以特殊招生形式录取的"群体, 仅在规定允许的范围和条件下申请转专业. (与外语类保送生、定向生、艺体类、体育特长生、公费师范生等同列)',
     '华东师范大学2025年本科生手册.md §转专业工作细则 第五条 (一)',
     '{"module":"strong_base","scope":"transfer_restriction","allowed":"within_designated_scope_only"}'::jsonb),
    (v_school_track_id, v_cat_c3_id, 'C3-2', '强基阶段性考核 + 动态进出', 2, 'program_rule', NULL,
     '强基计划通过高考招生, 实施阶段性考核和动态进出机制: 未通过考核的学生退出; 空出名额由综合素质优秀、认同强基计划培养理念的学生补入. 阶段性考核和进出办法由强基计划所在专业制定, 报本科生院备案后实施.',
     '华东师范大学2025年本科生学习指南.md §二、更多机会 / 07 卓越学院 / 四、如何加入',
     '{"module":"strong_base","scope":"dynamic_in_out","entry":"gaokao","exit":"fail_phase_eval","replacement":"high_comprehensive_quality","rules_by_program":true}'::jsonb),
    (v_school_track_id, v_cat_c3_id, 'C3-3', '强基本研衔接转段', 3, 'status_gate', NULL,
     '强基计划学生完成规定的本科阶段有关课程, 达到转段要求后可申请直接转段进入研究生培养阶段. 第 3-4 学年可以提前选修研究生阶段课程、提早选定研究方向和联络导师.',
     '华东师范大学2025年本科生学习指南.md §二、更多机会 / 07 卓越学院 / 5. 本研贯通培养',
     '{"module":"strong_base","scope":"undergrad_to_grad_transition","gate":"phase_requirements_met","optional":"select_grad_courses_year_3_4"}'::jsonb),
    (v_school_track_id, v_cat_c3_id, 'C3-4', '强基推免转段独立通道', 4, 'program_rule', NULL,
     '转段进入本校研究生培养的强基计划学生, 推免名额由教育部以专项形式下达, 在校推免工作领导小组、研究生招生工作领导小组领导下由各强基计划转段工作小组制定转段工作细则并具体实施. 推荐条件、转段考核及接收按教育部和学校有关规定执行.',
     '华东师范大学2025年本科生手册.md §推免管理办法 第八条 / 第二十二条',
     '{"module":"strong_base","scope":"reserved_grad_quota","quota_source":"MoE_dedicated","body":"strong_base_transition_team","rules_per":"MoE_and_school"}'::jsonb),

    -- C4 个性化培养 (2 条)
    (v_school_track_id, v_cat_c4_id, 'C4-1', '个性化培养申请条件', 1, 'program_rule', NULL,
     '具备特殊专长或个性化培养需求, 且现有专业培养方案或项目无法充分满足学术兴趣、知识需求或发展目标 (如需要夯实跨学科基础、构建特色知识体系等), 已经找到明确发展方向、具备自主规划能力的学生可申请.',
     '华东师范大学2025年本科生学习指南.md §06/如何申请制订个性化培养方案',
     '{"module":"personalized","scope":"apply_conditions","required":["special_expertise_or_need","existing_plan_inadequate","clear_direction"]}'::jsonb),
    (v_school_track_id, v_cat_c4_id, 'C4-3', '拔尖学生个性化选课学分 (≥ 24 学分)', 2, 'program_rule', 24,
     '学校为拔尖学生设置更具挑战性的培养方案, 培养方案充分留白, 个性化选课学分一般不低于 24 学分. 鼓励"一生一案", 学生可根据个人发展需要申请定制个性化培养方案, 通过院系审核和学校备案后予以实施.',
     '华东师范大学2025年本科生学习指南.md §二、更多机会 / 2.个性化培养',
     '{"module":"personalized","scope":"top_student_personal_credits","min_credits":24,"applicable_to":"top_class_or_excellence"}'::jsonb),

    -- C5 本科生转专业 (8 条)
    (v_school_track_id, v_cat_c5_id, 'C5-1', '转专业三类型 (一般春季 / 学分修读秋季 / 卓越选拔)', 1, 'program_rule', NULL,
     '转专业类型包括: (一) 一般类型转专业 (春季学期, 综合考核); (二) 学分修读类型转专业 (秋季学期, 达到指定课程修读要求); (三) 卓越学院选拔转专业.',
     '华东师范大学2025年本科生手册.md §本科生转专业工作细则 第四条',
     '{"module":"major_transfer","scope":"transfer_types","types":[{"name":"general","semester":"spring","criterion":"comprehensive_eval"},{"name":"credit_based","semester":"fall","criterion":"designated_courses"},{"name":"excellence_selection","trigger":"excellence_college_select"}]}'::jsonb),
    (v_school_track_id, v_cat_c5_id, 'C5-2', '转专业不予办理情形 (4 类禁止 / 第四学年 / 已转过)', 2, 'status_gate', NULL,
     '除下列情形外学生均可申请转专业: (一) 国家或学校招生规定对转专业有禁止性或限制性规定的 (外语类保送生、定向生、艺体类、体育特长生、强基计划、公费师范生等仅在规定范围内); (二) 自入学起已进入第四学年; (三) 已有过转学经历.',
     '华东师范大学2025年本科生手册.md §本科生转专业工作细则 第五条',
     '{"module":"major_transfer","scope":"blocked_states","blocked_groups":["foreign_lang_recommended","designated_admission","arts_sports","sports_specialty","strong_base","public_normal"],"blocked_year":4,"blocked_history":"already_transferred"}'::jsonb),
    (v_school_track_id, v_cat_c5_id, 'C5-4', '转入计划数下限 (≥ 招生数 15%)', 3, 'program_rule', 15,
     '学部院系向本科生院提交转入计划数 (当年一般类型和学分修读类型总和). 专业转入计划数一般不低于该专业当年招生人数的 15%. 确因客观条件限制的可适当降低转入计划数.',
     '华东师范大学2025年本科生手册.md §本科生转专业工作细则 第七条',
     '{"module":"major_transfer","scope":"transfer_quota_floor","min_pct_of_annual_admission":15,"downward_adjustable":true}'::jsonb),
    (v_school_track_id, v_cat_c5_id, 'C5-5', '学分修读类型最少课程数 (≥ 2 门专业课)', 4, 'program_rule', 2,
     '组织学分修读类型转专业, 学部院系应提前公布转入条件, 指定不少于 2 门专业课程, 明确课程修读要求. 学部院系将考核结果登录教务系统.',
     '华东师范大学2025年本科生手册.md §本科生转专业工作细则 第八条 (三)',
     '{"module":"major_transfer","scope":"credit_based_min_courses","min_courses":2,"type":"major_courses"}'::jsonb),
    (v_school_track_id, v_cat_c5_id, 'C5-7', '卓越学院转专业不受计划数限制', 5, 'program_rule', NULL,
     '涉及卓越学院转专业, 根据卓越学院相关管理规定开展, 不受专业计划数限制.',
     '华东师范大学2025年本科生手册.md §本科生转专业工作细则 第九条',
     '{"module":"major_transfer","scope":"excellence_college_exemption","quota_limit_waived":true}'::jsonb),
    (v_school_track_id, v_cat_c5_id, 'C5-9', '参军退伍 + 创业休学不受计划数限制', 6, 'program_rule', NULL,
     '参军退伍学生和认定为创业休学学生申请转专业不受专业计划数限制, 应符合国家相关规定和招生考试相关规定. 学生复学时向本科生院提出申请, 由转入单位组织考核, 考核通过后学生转入该专业.',
     '华东师范大学2025年本科生手册.md §本科生转专业工作细则 第十一条',
     '{"module":"major_transfer","scope":"quota_exempt_groups","exempt_groups":["veteran","entrepreneur_leave"],"apply_at":"return_from_leave"}'::jsonb),
    (v_school_track_id, v_cat_c5_id, 'C5-10', '双学位退出 ≠ 转专业', 7, 'program_rule', NULL,
     '双学士学位项目学生退出至录取专业, 由该专业所在单位审核, 不归入转专业.',
     '华东师范大学2025年本科生手册.md §本科生转专业工作细则 第十二条',
     '{"module":"major_transfer","scope":"double_degree_exit_excluded","not_counted_as_transfer":true}'::jsonb),
    (v_school_track_id, v_cat_c5_id, 'C5-11', '转入年级 + 学费 (院系判定 / 按转入专业 / 毕业学期结算)', 8, 'program_rule', NULL,
     '学生转入年级由转入院系根据学生学业情况确定, 按转入年级专业培养方案修读. 提前完成培养方案的可申请提前毕业 (参 A2-2). 转专业学生应按照转入专业的学费标准缴纳学费, 在毕业学期进行学费结算 (参 B6-4).',
     '华东师范大学2025年本科生手册.md §本科生转专业工作细则 第十四条 / 第十五条',
     '{"module":"major_transfer","scope":"post_transfer_rules","grade_by_dept_judgment":true,"plan_by_target_year":true,"fee_ref":"B6-4","early_graduation_allowed":true}'::jsonb),

    -- C6 创新创业学分认定 (9 条)
    (v_school_track_id, v_cat_c6_id, 'C6-1', '创新创业学分适用范围 (2021 级起 + 2020 级菁英/强基)', 1, 'status_gate', NULL,
     '本办法自 2021 级本科生开始执行, 同时也适用于 2020 级菁英班和强基班学生, 具体条款由教务处负责解释.',
     '华东师范大学2025年本科生手册.md §本科生创新创业学分认定管理办法 第十四条',
     '{"module":"innovation","scope":"applicable","since_cohort":2021,"also_applicable":["2020_top_class","2020_strong_base"]}'::jsonb),
    (v_school_track_id, v_cat_c6_id, 'C6-2', '创新创业学分 6 类来源', 2, 'program_rule', NULL,
     '创新创业学分获得途径包括: 参加大学生创新创业训练计划项目; 竞赛获奖; 公开发表学术论文; 获得专利授权; 公开出版著作; 自主创业或深入参与企业经营活动.',
     '华东师范大学2025年本科生手册.md §本科生创新创业学分认定管理办法 第二条',
     '{"module":"innovation","scope":"credit_sources","channels":["training_project","competition_award","paper","patent","book","entrepreneurship"]}'::jsonb),
    (v_school_track_id, v_cat_c6_id, 'C6-3', '创新创业冲抵规则 (劳动与创造模块 ≤ 2 学分)', 3, 'program_rule', 2,
     '创新创业学分不等同于培养方案中的课程学分, 仅可用于冲抵培养方案中"劳动与创造"模块的必修学分, 最高不超过 2 学分.',
     '华东师范大学2025年本科生手册.md §本科生创新创业学分认定管理办法 第三条',
     '{"module":"innovation","scope":"credit_substitution","max_credits":2,"target_module":"劳动与创造","not_equivalent_to_course_credit":true}'::jsonb),
    (v_school_track_id, v_cat_c6_id, 'C6-4', '创新创业累加规则 (> 8 学分记 A / 仅冲抵 1 次)', 4, 'score_scheme', 8,
     '不同类别的创新创业学分可累加. 创新创业学分累计超过 8 学分者成绩记录为 "A", 其他记录为 "P". 创新创业学分仅能抵充一次, 抵充后成绩不得更改.',
     '华东师范大学2025年本科生手册.md §本科生创新创业学分认定管理办法 第四条',
     '{"module":"innovation","scope":"credit_aggregation","A_threshold":8,"P_default":true,"single_use":true,"immutable_after_substitution":true}'::jsonb),
    (v_school_track_id, v_cat_c6_id, 'C6-5', '创新创业项目级别认定 (国创 3/1.5 / 市创 2/1 / 校创 1/0.5)', 5, 'program_rule', NULL,
     '学生参加大学生创新创业训练计划项目并通过结题验收按以下标准认定学分: 国家级 项目负责人 3, 项目主要成员 1.5; 上海市级 2 / 1; 校级 1 / 0.5. 项目主要成员仅认定第二至五名 (包含第五名) 的本科生.',
     '华东师范大学2025年本科生手册.md §本科生创新创业学分认定管理办法 第五条',
     '{"module":"innovation","scope":"project_credit_table","table":{"national":{"leader":3,"member":1.5},"shanghai":{"leader":2,"member":1},"school":{"leader":1,"member":0.5}},"member_range":"2_to_5_undergrad_only","precondition":"completion_verified"}'::jsonb),
    (v_school_track_id, v_cat_c6_id, 'C6-6', '创新创业竞赛获奖分值 (顶级三赛事 / A 类 / B 类 × 4 档奖)', 6, 'program_rule', NULL,
     '省部级及以上级别学科类和创新创业类竞赛获奖按以下标准认定学分 (三档赛事 × 4 档奖项 × 国际国家/省部级): 顶级三赛事 (互联网+ / 挑战杯学术 / 挑战杯创业) 国际国家 8/6/4/2 省部级 4/3/2/1; A 类 6/5/4/3 与 3/2.5/2/1.5; B 类 5/4/3/2 与 2.5/2/1.5/1. 团队赛主要成员前五 (含研究生) 0.5 系数; 特等奖视同第一等次; 鼓励奖参与奖不予认定; 同作品多赛取最高; 竞赛清单参照华东师范大学本科生学科竞赛清单获奖当年版本.',
     '华东师范大学2025年本科生手册.md §本科生创新创业学分认定管理办法 第六条',
     '{"module":"innovation","scope":"competition_credit_table","source":"§第六条","tiers":["top_3_events","A_class","B_class"],"award_levels":["1st","2nd","3rd","4th"],"scope_levels":["intl_national","provincial"],"team_leader_full":true,"team_member_coef":0.5,"member_cap":"top_5_incl_grad","top_award_eq_1st":true,"only_award_excluded":true,"multi_award_take_max":true,"list_year_specific":true}'::jsonb),
    (v_school_track_id, v_cat_c6_id, 'C6-7', '创新创业论文/专利/著作分值表', 7, 'program_rule', NULL,
     '以华东师范大学为第一完成单位公开发表学术论文、获得知识产权或公开出版著作按标准认定学分 (一作 / 二三四作 a/b/c): 论文 中科院一区/CCF-A 8/6/5/4, 中科院二区/SSCI/CCF-B/A&HCI 6/5/4/3, 中科院三区/CSSCI/CSCD/北大核心/CCF-C/EI 5/4/3/2, 重要国际会议 4/3/2/1; 知识产权 发明专利 8/6/5/4, 实用新型 4/3/2/1, 软著 2/1/0.5/0, 外观 2/1/0.5/0; 著作 专著 6/5/4/0, 译著 4/3/2/0, 教材 4/3/2/0. 导师一作学生二作视学生为一作; 共同一作平均分配; 四作以后不计学分.',
     '华东师范大学2025年本科生手册.md §本科生创新创业学分认定管理办法 第七条',
     '{"module":"innovation","scope":"publication_ip_credit_table","source":"§第七条","first_unit_required":"ECNU","advisor_first_student_second_treated_as_first":true,"joint_first_split_avg":true,"cap_author_rank":4,"table_categories":["paper","ip","book"],"evidence_required":true}'::jsonb),
    (v_school_track_id, v_cat_c6_id, 'C6-8', '创新创业自主创业分值 (4 分 / 2 分两档)', 8, 'program_rule', NULL,
     '学生自主创业或深度参与企业经营活动按以下标准认定学分: (1) 所持项目获得上海市大学生科技创业基金资助或获得风险投资超过 50 万元人民币 (或等值外币) 4 分; (2) 以股东身份深入参与企业运营且企业年度营业额不低于 300 万、所持股份不低于 20% (可技术入股) 2 分.',
     '华东师范大学2025年本科生手册.md §本科生创新创业学分认定管理办法 第八条',
     '{"module":"innovation","scope":"entrepreneur_credit","tiers":[{"name":"shanghai_fund_or_VC_50w","points":4},{"name":"shareholder_300w_revenue_20pct_share","points":2}]}'::jsonb),
    (v_school_track_id, v_cat_c6_id, 'C6-10', '创新创业弄虚作假处理 (取消学分 + 学术不端处分)', 9, 'status_gate', NULL,
     '审核过程中, 学生应主动配合提供齐备的证明材料, 材料不满足要求的不予记录和认定. 对弄虚作假者取消其已获得的学分; 对有学术不端行为者按学校相关学术诚信管理办法予以处理.',
     '华东师范大学2025年本科生手册.md §本科生创新创业学分认定管理办法 第十二条',
     '{"module":"innovation","scope":"fraud_consequence","on_fraud":"revoke_all_credits","on_academic_misconduct":"per_integrity_rules"}'::jsonb),

    -- C7 学科竞赛创新成果奖励 (4 条 / 奖金, 与 C6 学分并行)
    (v_school_track_id, v_cat_c7_id, 'C7-1', '竞赛奖励范围 (A 类省部级+ / 高水平论文 / 发明专利)', 1, 'program_rule', NULL,
     '奖励范围为全日制本科生在读期间在学校公布的 A 类学科竞赛中获得省部级以上奖项、发表高水平学术论文或获得发明专利授权.',
     '华东师范大学2025年本科生手册.md §本科生学科竞赛与创新成果奖励办法 第一条',
     '{"module":"award","scope":"award_eligibility","categories":["A_class_competition_provincial_plus","high_level_paper","invention_patent"]}'::jsonb),
    (v_school_track_id, v_cat_c7_id, 'C7-2', 'A 类竞赛奖金表 (国际 10000-2500 / 国家 8000-1200 / 省部级 2500-300)', 2, 'program_rule', NULL,
     'A 类学科竞赛奖励金额 (元/项): 国际级 特/一/二/三 10000/8000/5000/2500; 国家级 8000/5000/2500/1200; 省部级 2500/1200/600/300. 获奖单位需为华东师范大学; 一次参赛多次评奖或同作品在同比赛不同级别赛事中获奖按最高一次性奖励; 学校有议决的以议决为准; 不同表述的换算执行.',
     '华东师范大学2025年本科生手册.md §本科生学科竞赛与创新成果奖励办法 第二条',
     '{"module":"award","scope":"competition_cash_award","source":"§第二条","currency":"CNY","scope_levels":["intl","national","provincial"],"award_levels":["special","1st","2nd","3rd"],"take_max":true,"unit_must_be_ECNU":true,"special_decree_override":true}'::jsonb),
    (v_school_track_id, v_cat_c7_id, 'C7-3', '学术论文奖金表 (中科院一区/CCF-A 5000 / 二区 2000 / 三区 1000 / 中文核心 500)', 3, 'program_rule', NULL,
     '学术论文必须以华东师范大学为第一署名单位且为我校本科生作为第一作者或通讯作者公开发表的, 奖励标准 (以最高检索级别为准): 中科院一区/CCF-A 5000; 中科院二区/CCF-B/EI/SSCI 2000; 中科院三区/CCF-C/CSSCI 1000; 中文核心期刊/国际学术会议 500. 中文核心以北京大学图书馆出版的全国中文核心期刊要目总览 (每四年更新) 为准.',
     '华东师范大学2025年本科生手册.md §本科生学科竞赛与创新成果奖励办法 第三条',
     '{"module":"award","scope":"paper_cash_award","source":"§第三条","currency":"CNY","first_unit_required":"ECNU","role_required":["first_author","corresponding_author"],"take_highest_index":true,"reference":"北大全国中文核心期刊要目总览_4_year_update"}'::jsonb),
    (v_school_track_id, v_cat_c7_id, 'C7-4', '发明专利奖金 (2000 元 / 仅发明 / 第一发明人 / ECNU 专利权人)', 4, 'program_rule', 2000,
     '本科生以第一发明人获得发明专利 (不包括外观专利、实用新型专利) 授权的, 且专利权人为华东师范大学的, 奖励 2000 元.',
     '华东师范大学2025年本科生手册.md §本科生学科竞赛与创新成果奖励办法 第四条',
     '{"module":"award","scope":"patent_cash_award","currency":"CNY","amount":2000,"invention_only":true,"excluded":["appearance","utility_model"],"role":"first_inventor","owner_must_be":"ECNU"}'::jsonb),

    -- C8 微专业 + 卓越学院 (4 条)
    (v_school_track_id, v_cat_c8_id, 'C8-1', '微专业学分范围 (10-16 学分 / 5-8 门课)', 1, 'program_rule', NULL,
     '学校从 2022 年起启动微专业人才培养项目以满足复合型人才培养以及学生的个性化发展和多样化需求. 微专业一般包含 5～8 门课程, 总学分在 10～16 学分左右. 学校面向校内外学生、社会公众开放微专业招生.',
     '华东师范大学2025年本科生学习指南.md §二、更多机会 / 09 微专业人才培养项目',
     '{"module":"micro_program","scope":"credit_range","credit_range":[10,16],"course_range":[5,8],"since_year":2022,"open_to":["ecnu_student","external_student","public"]}'::jsonb),
    (v_school_track_id, v_cat_c8_id, 'C8-3', '卓越学院结构 (拔尖 2.0 + 5 个实验班 + 强基)', 2, 'program_rule', NULL,
     '卓越学院下辖: 拔尖计划 2.0 (教育部基础学科拔尖学生培养计划基地); 5 个校级卓越人才培养改革实验班 (孟宪承班 / 拔尖外语双语双科 / 陈彪如班 / 博望班 / 体育与健康卓越); 强基计划 (通过高考招生, 参 C3 段).',
     '华东师范大学2025年本科生学习指南.md §二、更多机会 / 07 卓越学院 / 三、校级卓越人才培养改革实验班',
     '{"module":"excellence_college","scope":"structure","components":["top_class_2.0","5_pilot_classes","strong_base"],"pilot_classes":["孟宪承","拔尖外语双语双科","陈彪如","博望","体健卓越"]}'::jsonb),
    (v_school_track_id, v_cat_c8_id, 'C8-4', '卓越学院加入方式 (拔尖内部二次选拔 / 强基高考)', 3, 'program_rule', NULL,
     '动态进出机制: 拔尖计划 2.0 + 校级卓越实验班 - 校内二次选拔招生, 依据各学科特点实行滚动选拔、动态进出, 由院系制定选拔、考核标准和程序并公开 (曾完成中学生英才计划各项学习任务并获结业证书的学生可优先进入拔尖计划 2.0); 强基计划 - 通过高考招生 (详见 C3 段).',
     '华东师范大学2025年本科生学习指南.md §二、更多机会 / 07 卓越学院 / 四、如何加入',
     '{"module":"excellence_college","scope":"entry_mechanism","top_class_method":"internal_secondary_selection","strong_base_method":"gaokao_only","rolling_selection":true,"priority_for_high_school_top_program":true}'::jsonb),
    (v_school_track_id, v_cat_c8_id, 'C8-5', '拔尖学生特殊待遇 (大师 / 个性化 / 进阶训练 / 本研贯通)', 4, 'program_rule', NULL,
     '拔尖学生享受: 大师引领 (院士/长江/教学名师/杰青/优青等担任导师或任课, 允许双导师); 个性化培养 (小班/过程性评价/全英文/项目式, 个性化选课 ≥ 24 学分 参 C4-3); 进阶式学术训练 (大一到大四); 本研贯通培养 (更高推免比例, 第 3-4 学年可选研究生课程, 强基达转段要求可直转 参 C3-3).',
     '华东师范大学2025年本科生学习指南.md §二、更多机会 / 1-5',
     '{"module":"excellence_college","scope":"top_student_benefits","benefits":["dual_advisor_allowed","small_class","english_teaching","personal_credit_min_24","tiered_research_training","higher_recommendation_rate","grad_course_year_3_4","strong_base_direct_transition"]}'::jsonb),

    -- C9 推免管理 (8 条)
    (v_school_track_id, v_cat_c9_id, 'C9-1', '推免基本资格 (GPA ≥ 2.8 / 排除留学生 / 不直接工作不出境)', 1, 'gpa_threshold', 2.8,
     '所有推免生应满足: (一) 纳入国家普通本科招生计划录取, 未曾计入历年应毕业本科生范围、未曾参与过推免环节的应届毕业生 (不属于留学生、第二学士学位、公费师范生、优师计划等序列); (二) 品行表现优良/遵纪守法/积极向上/身心健康/综合素质好; (三) 学习成绩良好, 平均绩点 GPA 不低于 2.8 (高水平运动员和高级别体育赛事世界冠军可适当降低); (四) 具有学术研究兴趣、潜质; (五) 本科毕业后不直接参加工作或赴境外留学. 思想品德考核不合格者不得推荐和录取; 受过纪律处分的学生处分已解除可申请, 未解除不纳入.',
     '华东师范大学2025年本科生手册.md §推荐优秀应届本科毕业生免试攻读研究生工作管理办法 第九条',
     '{"scope":"recommendation_eligibility","required":["national_plan_admission","first_time_applicant","not_special_group"],"excluded_groups":["international","second_bachelor","public_normal","priority_teacher"],"gpa_min":2.8,"athlete_exemption":true,"after_grad_constraint":"no_work_no_overseas","discipline":"clear_required"}'::jsonb),
    (v_school_track_id, v_cat_c9_id, 'C9-2', '推免名额分配考虑因素 (5 维度)', 2, 'program_rule', NULL,
     '各单位的推免名额综合考虑以下因素分配: (一) 应届本科毕业生的规模 (不含留学生、二学位、公费师范生、优师计划等); (二) 入选基础学科拔尖学生培养计划 2.0 基地等具有彰显度的本科教育改革项目; (三) 上一年度推免指标完成情况; (四) 上一届毕业生境内考研录取率和境外升学率; (五) 服务国家发展战略和重大需求、对学校人才培养和其他学科发展的支撑情况.',
     '华东师范大学2025年本科生手册.md §推免管理办法 第六条',
     '{"module":"recommendation","scope":"quota_allocation","factors":["graduate_scale","top_program_2.0_recognition","previous_year_completion","previous_year_grad_rates","strategic_support"]}'::jsonb),
    (v_school_track_id, v_cat_c9_id, 'C9-3', '推免综合成绩公式 (学业 70/80% + 素质加分 ≤ 30/20 - 扣分 ≥ 5)', 3, 'gpa_threshold', NULL,
     '综合成绩由学业成绩 + 素质加分 - 扣分共同确定: 学业成绩按课程的原始绩点或成绩计算折算为百分制, 艺体类专业 70% / 其他专业 80% 权重计入; 素质加分 (科研/竞赛/创新创业/志愿服务/国际组织实习/参军/艺术) 艺体类专业上限 30 分、其他专业上限 20 分; 扣分由各单位根据处分情形等制定, 扣分不得低于 5 分.',
     '华东师范大学2025年本科生手册.md §推免管理办法 第十条 (二)(三)4',
     '{"module":"recommendation","scope":"composite_score_formula","academic_weight":{"arts_sports":0.70,"others":0.80},"quality_bonus_cap":{"arts_sports":30,"others":20},"penalty_min":5}'::jsonb),
    (v_school_track_id, v_cat_c9_id, 'C9-4', '推免素质加分 7 项上限表 (科研 10 / 竞赛 10 / 创新 6 / ...)', 4, 'program_rule', NULL,
     '素质加分各单项指标上限: 科研成果 ≤ 10 (核心期刊独立/一作); 学科竞赛获奖 ≤ 10 (全国赛或相当级别国际赛三等以上); 创新创业 ≤ 6 (校级以上 CTP 结题 / 重要双创竞赛); 其他学术成果 ≤ 5 (著作译著/发明专利/软著); 志愿服务 ≤ 1 (校级以上一线突出); 国际组织实习 ≤ 3 (主要政府间国际组织 ≥ 3 个月); 艺术素养 ≤ 2 (学校艺术团 + 大型活动突出不超过 4 人). 同项目符合不同类别就高计一次; 学生与直系亲属合作不纳入加分.',
     '华东师范大学2025年本科生手册.md §推免管理办法 第十条 (三)1',
     '{"module":"recommendation","scope":"quality_bonus_caps","caps":{"research":10,"competition":10,"innovation":6,"other_academic":5,"volunteer":1,"intl_org":3,"art":2},"take_max_once":true,"family_collab_excluded":true}'::jsonb),
    (v_school_track_id, v_cat_c9_id, 'C9-5', '推免特殊审核 (≥ 5 人副高+ / 公开答辩 / 录音录像)', 5, 'assessment_rule', 5,
     '各单位应组成不少于 5 人且具有相关学科副教授以上职称的专家审核小组, 对科研成果、学科竞赛获奖、创新创业、著作译著、发明专利等学术科研创新类素质加分项目进行审核鉴定, 排除抄袭、造假、冒名、有名无实等情况, 并组织一定范围的公开答辩. 对学生提交的多篇科研成果实行代表作评价. 同一项目符合不同类别加分情况就高计一次. 社会质疑较多的赛事、刊物从严审核. 答辩全程录音录像, 答辩结果公开公示.',
     '华东师范大学2025年本科生手册.md §推免管理办法 第十一条',
     '{"module":"recommendation","scope":"special_review","panel_min":5,"panel_qualification":"associate_prof_plus","public_defense":true,"representative_eval":true,"record_audio_video":true}'::jsonb),
    (v_school_track_id, v_cat_c9_id, 'C9-7', '双学士学位推免 (招生专业主导 + 合作院系参与排名)', 6, 'program_rule', NULL,
     '双学士学位复合型人才培养项目的推免工作细则由联合培养院系共同制定, 由招生专业院系牵头组织与实施综合排名, 联合培养院系参与实施综合排名.',
     '华东师范大学2025年本科生手册.md §推免管理办法 第十条 (五)',
     '{"module":"recommendation","scope":"double_degree_special","led_by":"admission_major_dept","co_audit_by":"partner_dept"}'::jsonb),
    (v_school_track_id, v_cat_c9_id, 'C9-8', '推免取消资格 4 触发 (后续处分 / 无法毕业 / 信息造假 / 利益回避)', 7, 'status_gate', NULL,
     '已经获得推免资格的学生, 如有下列情况之一者学校将取消其推免资格: (一) 被确定推免后受刑事或违纪处分者; (二) 不能如期毕业, 或不能获得学士学位者; (三) 提交的信息不真实、不准确, 存在舞弊情形的; (四) 未按规定报备声明回避关系且影响到推免过程和结果公平公正的.',
     '华东师范大学2025年本科生手册.md §推免管理办法 第十八条',
     '{"module":"recommendation","scope":"revoke_triggers","triggers":["post_award_discipline","cannot_graduate_or_no_degree","fraud_in_application","conflict_of_interest_undeclared"]}'::jsonb),
    (v_school_track_id, v_cat_c9_id, 'C9-9', '推免后限制 (退出就业计划 / 不出境留学 / 不开证明)', 8, 'program_rule', NULL,
     '经学校审定获得推免资格的学生不再列入就业计划, 不应再申请境外高校留学. 学校自推免工作完成之日起不再向推免生提供用于境外留学的在读证明和就业协议.',
     '华东师范大学2025年本科生手册.md §推免管理办法 第十七条',
     '{"module":"recommendation","scope":"post_award_restrictions","excluded_from":["employment_plan","overseas_study"],"no_certificate_for":["overseas_proof","employment_contract"]}'::jsonb)

  ON CONFLICT (category_id, code) DO UPDATE SET
    title       = EXCLUDED.title,
    order_index = EXCLUDED.order_index,
    kind        = EXCLUDED.kind,
    threshold   = EXCLUDED.threshold,
    description = EXCLUDED.description,
    source_ref  = EXCLUDED.source_ref,
    metadata    = EXCLUDED.metadata,
    updated_at  = now();


  -- ---- D 段 49 条 (注册/休复学/实习/毕业论文/抽检/创新训练CTP) ----
  INSERT INTO track_requirement
    (track_id, category_id, code, title, order_index, kind, threshold, description, source_ref, metadata)
  VALUES
    -- D1 本科生注册 (5 条)
    (v_school_track_id, v_cat_d1_id, 'D1-2', '学期注册 (含缴费 / 2 周 grace / 绿色通道)', 1, 'time_limit', 2,
     '每学期开学时学生应当按学校规定办理注册手续, 含报到和缴纳学费. 因故不能如期报到者应事先履行请假手续, 请假期限一般不得超过两周. 家庭经济困难的学生可以向学生资助管理中心申请办理绿色通道缓缴学费手续后予以注册.',
     '华东师范大学2025年本科生手册.md §本科生注册工作实施细则 §三',
     '{"unit":"week","direction":"deadline","scope":"semester_registration_grace","requires":["report","pay_tuition"],"green_channel":"financial_aid"}'::jsonb),
    (v_school_track_id, v_cat_d1_id, 'D1-3', '异地实习仍须注册 (院系代报到)', 2, 'assessment_rule', NULL,
     '异地实习学生仍需办理注册手续. 学生应按学期安排正常开展实习并向管理院系报告到岗情况, 管理院系核实学生情况后进行代报到.',
     '华东师范大学2025年本科生手册.md §本科生注册工作实施细则 §四',
     '{"scope":"remote_internship_registration","proxy_by_department":true}'::jsonb),
    (v_school_track_id, v_cat_d1_id, 'D1-4', '休学保留学籍不注册 (联合培养例外)', 3, 'status_gate', NULL,
     '休学和保留学籍期间, 学生不需办理注册手续, 但参加联合培养项目的学生仍应缴纳我校学费.',
     '华东师范大学2025年本科生手册.md §本科生注册工作实施细则 §五',
     '{"scope":"leave_no_registration","exception":"joint_program_still_pays_fee"}'::jsonb),
    (v_school_track_id, v_cat_d1_id, 'D1-5', '延长修业期注册规则 (有课正常 / 无课须休学)', 4, 'assessment_rule', NULL,
     '延长修业期的学生应在课程修读的学期正常办理注册手续, 无课程修读的学期应办理休学手续.',
     '华东师范大学2025年本科生手册.md §本科生注册工作实施细则 §六',
     '{"scope":"extended_period_registration","with_courses":"normal_registration","without_courses":"must_apply_leave"}'::jsonb),
    (v_school_track_id, v_cat_d1_id, 'D1-6', '未注册第三周统计 + 退/结/毕处理', 5, 'warning_threshold', 2,
     '每学期第三周, 教务处对未注册学生名单进行汇总, 经管理院系核实, 对于未请假、请假未准或请假期满逾期两周以上 (含两周), 除因不可抗力等正当事由以外, 依据学生学业完成情况作退学、结业或毕业处理.',
     '华东师范大学2025年本科生手册.md §本科生注册工作实施细则 §八',
     '{"stage":"registration_overdue","check_week":3,"overdue_threshold_weeks":2,"consequence_options":["dropout","completion","graduation"],"based_on":"academic_status"}'::jsonb),

    -- D2 本科生休学与复学 (7 条)
    (v_school_track_id, v_cat_d2_id, 'D2-2', '应当休学情形 (4 触发 / 治疗 > 1/3 / 请假 > 1/3)', 1, 'status_gate', NULL,
     '学生有下列情况之一者应办理休学: (一) 停课治疗、休养时间超过一学期三分之一 (1/3) 的; (二) 请假时间超过一学期三分之一 (1/3) 的; (三) 因其他原因无法在校学习的; (四) 学校认为应当休学的.',
     '华东师范大学2025年本科生手册.md §本科生休学与复学工作细则 第四条',
     '{"scope":"mandatory_leave_triggers","triggers":[{"rule":"treatment_time > 1/3_of_semester"},{"rule":"leave_time > 1/3_of_semester"},{"rule":"other_cannot_study"},{"rule":"school_decision"}]}'::jsonb),
    (v_school_track_id, v_cat_d2_id, 'D2-3', '休学申请材料 (因病二级甲等以上 / 出境录取 / 其他材料)', 2, 'assessment_rule', NULL,
     '学生申请休学应提交申请并提供证明材料, 经所在学部院系审核后报本科生院审批备案: (一) 因病申请休学的须提供二级甲等以上医院提供的证明; (二) 因私出国出境学习、实习申请休学的须提供录取通知; (三) 其他原因申请休学的须提供事由材料 (可视情况要求补充成年家属知情同意的意见).',
     '华东师范大学2025年本科生手册.md §本科生休学与复学工作细则 第五条',
     '{"scope":"leave_application_evidence","branches":{"illness":"hospital_level_2A_plus_certificate","overseas_private":"acceptance_letter","other":"reason_material_optional_family_consent"},"approval_chain":["department","undergrad_office"]}'::jsonb),
    (v_school_track_id, v_cat_d2_id, 'D2-5', '休学离校时点 (1 周内 / 不予注册 / 不享受学生待遇)', 3, 'time_limit', 1,
     '休学学生最迟应在休学起算的 1 周内办理手续并离校. 休学期间保留学生学籍, 不予注册, 不享受在校学习学生待遇. 因病休学学生的医药费按国家及当地的有关规定处理.',
     '华东师范大学2025年本科生手册.md §本科生休学与复学工作细则 第九条 / 第十条',
     '{"unit":"week","direction":"deadline","scope":"leave_departure_window","post_leave_status":["preserved_enrollment","no_registration","no_student_benefits"]}'::jsonb),
    (v_school_track_id, v_cat_d2_id, 'D2-6', '复学申请时点 (期满前 1 周 / 因病二级甲等证明)', 4, 'time_limit', 1,
     '学生最迟应在休学 (含保留学籍) 期满前 1 周提交复学申请, 经所在学部院系审核后报本科生院备案, 经复查合格方可复学注册: (一) 因病休学的须提供二级甲等以上医院诊断证明, 复查合格者方可复学, 复查不合格者应继续休学或退学; (二) 退伍学生复学同时报武装部审核备案; (三) 留学生复学同时报国际教育中心审核备案.',
     '华东师范大学2025年本科生手册.md §本科生休学与复学工作细则 第十一条',
     '{"unit":"week","direction":"before_leave_expiry","scope":"resume_apply_deadline","branches":{"illness":"hospital_certificate_required","veteran":"armed_forces_dept_filing","international":"intl_education_center_filing"},"illness_recheck_fail":"continue_leave_or_dropout"}'::jsonb),
    (v_school_track_id, v_cat_d2_id, 'D2-7', '创业休学条件 (不计最长年限 / 累计 ≤ 2 年 / 3 触发)', 5, 'program_rule', 2,
     '因创业休学的学生符合以下条件者经审核通过, 休学年限不计入最长学习年限但累计不得超过 2 年: (一) 主持项目获得"上海市大学生创业基金资助"或获得风险投资超过 50 万元人民币 (或等值外币); (二) 以股东身份深入参与企业运营且企业规模不低于 300 万、所持股份超过 20% (可技术入股); (三) 能提供与上述条件同等效力证明材料的.',
     '华东师范大学2025年本科生手册.md §本科生休学与复学工作细则 第十二条',
     '{"scope":"entrepreneur_leave","excluded_from_max_years":true,"cap_years":2,"qualifying_conditions":[{"funding":"shanghai_fund_or_VC_500k"},{"shareholder":"revenue_3m_share_20pct"},{"equivalent_evidence":true}]}'::jsonb),
    (v_school_track_id, v_cat_d2_id, 'D2-8', '留学生服兵役 (不计最长 / ≤ 2 年 / 国际教育中心审核)', 6, 'time_limit', 2,
     '留学生服兵役经国际教育中心审核通过, 休学年限不计入最长学习年限, 累计不得超过 2 年.',
     '华东师范大学2025年本科生手册.md §本科生休学与复学工作细则 第十三条',
     '{"scope":"international_military_service_leave","excluded_from_max_years":true,"cap_years":2,"approval":"intl_education_center"}'::jsonb),
    (v_school_track_id, v_cat_d2_id, 'D2-9', '逾期未复学处理 (毕/结/退按学业状况)', 7, 'status_gate', NULL,
     '休学期满, 逾期未办理复学的, 根据学生学业完成情况按毕业、结业或退学处理.',
     '华东师范大学2025年本科生手册.md §本科生休学与复学工作细则 第十四条',
     '{"scope":"leave_expired_no_resume","outcomes":["graduation","completion","dropout"],"based_on":"academic_status"}'::jsonb),

    -- D3 本科实习 (6 条)
    (v_school_track_id, v_cat_d3_id, 'D3-1', '实习三类型 (认识 / 专业 / 毕业)', 1, 'program_rule', NULL,
     '本科实习教学分三类: 认识实习 (一、二年级实施, 师范生教育见习归此); 专业实习 (二、三、四年级实施); 毕业实习 (四年级实施, 师范生教育实习和教育研习归此).',
     '华东师范大学2025年本科生手册.md §本科实习工作管理办法 (2023 年修订) 第三条',
     '{"module":"internship","scope":"types","types":[{"name":"recognition","year_range":[1,2],"includes_normal":"教育见习"},{"name":"professional","year_range":[2,4]},{"name":"graduation","year_range":[4,4],"includes_normal":["教育实习","教育研习"]}]}'::jsonb),
    (v_school_track_id, v_cat_d3_id, 'D3-2', '实习两组织形式 (集中带队 / 分散指导)', 2, 'program_rule', NULL,
     '本科实习教学组织形式有集中实习、分散实习, 提倡和鼓励由学部 (院系) 统一组织安排、专业教师带队的集中实习. 对于分散实习应加强过程性管理和指导, 严格要求和监督.',
     '华东师范大学2025年本科生手册.md §本科实习工作管理办法 (2023 年修订) 第四条',
     '{"module":"internship","scope":"organization_form","forms":["concentrated_school_led","dispersed"],"preferred":"concentrated"}'::jsonb),
    (v_school_track_id, v_cat_d3_id, 'D3-3', '集中实习指导师生比 (≥ 1:30 / 分散须校内跟踪)', 3, 'assessment_rule', 30,
     '集中实习指导教师与实习学生的比例原则上不低于 1:30, 分散实习也应当安排校内教师跟踪指导.',
     '华东师范大学2025年本科生手册.md §本科实习工作管理办法 (2023 年修订) 第十六条',
     '{"module":"internship","scope":"advisor_ratio","min_ratio":"1:30","applicable_to":"concentrated_internship","dispersed_must_have_school_advisor":true}'::jsonb),
    (v_school_track_id, v_cat_d3_id, 'D3-4', '实习成绩多维综合评定 (态度 / 出勤 / 日志 / 作业 / 单位评价 / 考核)', 4, 'assessment_rule', NULL,
     '实习成绩应根据学生的工作态度、出勤情况、实习日志、实习作业、实习单位评价以及考核成绩等予以综合评定, 考核形式可多样化, 学部 (院系) 应制定实习成绩考核标准.',
     '华东师范大学2025年本科生手册.md §本科实习工作管理办法 (2023 年修订) 第二十五条',
     '{"module":"internship","scope":"grade_evaluation","factors":["attitude","attendance","journal","assignment","org_eval","exam_score"],"assessment_format_flexible":true}'::jsonb),
    (v_school_track_id, v_cat_d3_id, 'D3-5', '分散实习造假处理 (违纪 + 不及格 + 重修)', 5, 'status_gate', NULL,
     '对分散实习的学生应严格考核制度, 除对其实习报告进行评阅外还可组织答辩. 若有提交虚假证明、虚假报告的, 一经发现按违纪处理, 实习成绩以不及格计, 需重修实习学分.',
     '华东师范大学2025年本科生手册.md §本科实习工作管理办法 (2023 年修订) 第二十六条',
     '{"module":"internship","scope":"dispersed_fraud","consequence":["discipline","fail_grade","retake_required"]}'::jsonb),
    (v_school_track_id, v_cat_d3_id, 'D3-6', '实习重修阈值 (不及格 / 缺 ≥ 1/3)', 6, 'warning_threshold', NULL,
     '实习考核不及格者或在实习期间请假、缺课的时间达总实习时间 1/3 以上者, 应当重修实习学分.',
     '华东师范大学2025年本科生手册.md §本科实习工作管理办法 (2023 年修订) 第二十七条',
     '{"module":"internship","scope":"retake_trigger","triggers":[{"rule":"grade_fail"},{"rule":"leave_or_absence >= 1/3_of_total_time"}],"consequence":"retake_credit"}'::jsonb),

    -- D4 本科毕业论文 (15 条)
    (v_school_track_id, v_cat_d4_id, 'D4-1', '毕业论文抄袭检测 (全员检测 + 校外抽查)', 1, 'assessment_rule', NULL,
     '使用 "大学生论文抄袭检测系统" 对所有毕业论文进行检测, 组织校外专家对部分院系的毕业论文进行抽查. 对存在质量问题的论文要求各学部 (院系) 进一步加强督促、教师进一步加强指导、学生继续加工修改.',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §一 (一) 2',
     '{"module":"thesis","scope":"plagiarism_check","coverage":"all","external_spot_check":true}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-2', '毕业论文时间安排 (第七学期完成选题 / 离校前一周结束)', 2, 'time_limit', 7,
     '毕业论文的选题、指导教师的配备、工作计划及日程安排等工作必须在第七学期结束前完成. 毕业论文工作必须在每年毕业生离校前一个星期全部结束.',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §一 (四)',
     '{"module":"thesis","scope":"timeline","topic_advisor_deadline":"semester_7_end","final_completion":"1_week_before_graduate_leave"}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-3', '毕业论文选题原则 (一人一题 / 应用型可设计代论文 / 开题答辩)', 3, 'program_rule', NULL,
     '选题原则: (一) 确保论文的学科专业性特点; (二) 深度、难度与可行性相结合; (三) 一人一题, 注重创造性; (四) 师范专业学生, 教育科学研究方面的论文应保持一定的比例; (五) 在应用型专业中, 可以用毕业设计代替毕业论文; (六) 应组织毕业论文开题答辩小组对开题报告进行审议, 通过后方可进入撰写阶段.',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §二',
     '{"module":"thesis","scope":"topic_principles","one_student_one_topic":true,"applied_majors_can_use_design":true,"requires_proposal_defense":true}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-4', '毕业论文指导教师资质 + 工作量 (≤ 6 名/届 / ≤ 60 学时)', 4, 'assessment_rule', 6,
     '毕业论文指导教师应具有中级及以上技术职称. 教师指导一篇毕业论文可计不超过 15 学时的毕业论文教学工作量; 每位导师指导论文的工作总量累计不超过 60 学时/届. 每位导师指导学生数最多不能超过 6 名/届.',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §三 (一) 5',
     '{"module":"thesis","scope":"advisor_constraints","min_rank":"intermediate","max_per_thesis_hours":15,"max_per_advisor_per_year_hours":60,"max_students_per_year":6}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-5', '毕业论文格式 (文 ≥ 8000 / 理音美 ≥ 5000 / 摘要 300-500 / ≥ 2 篇外文)', 5, 'assessment_rule', NULL,
     '毕业论文格式应规范, 必须由封面、目录、正文三部分构成: 文科类专业论文正文字数应在 8000 字以上; 理科类、音乐、美术等专业在 5000 字以上; 工科类专业由学部 (院系) 确定; 中、外文摘要一般为 300 ～ 500 字; 论文主体撰写过程要求参考两篇以上外文文献.',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §三 (二) 4',
     '{"module":"thesis","scope":"format","word_count":{"humanities_min":8000,"science_arts_min":5000,"engineering":"by_dept"},"abstract_range":[300,500],"foreign_refs_min":2}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-6', '毕业论文答辩小组 (≥ 3 人 / 组长副高+)', 6, 'assessment_rule', 3,
     '答辩小组至少应由三位教师组成, 组长应由具有副高级及以上技术职称的教师担任, 其中一位可以是指导教师.',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §四 (一)',
     '{"module":"thesis","scope":"defense_panel","min_size":3,"leader_rank":"associate_prof_plus","advisor_can_be_member":true}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-7', '毕业论文成绩评定 (五级记分 / 至少 1 名交叉评阅)', 7, 'score_scheme', NULL,
     '论文的成绩评定采用 "五级记分制" (即优、良、中、及格、不及格). 每篇论文在指导教师初评后须经至少 1 名其他教师交叉评阅并撰写评语, 最后由论文答辩小组评定成绩.',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §四 (三)',
     '{"module":"thesis","scope":"grade_scale","levels":["优","良","中","及格","不及格"],"min_cross_review":1}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-8', '毕业论文优秀率 (≤ 20% / 须系级以上答辩)', 8, 'gpa_threshold', 20,
     '优秀毕业论文必须进行系级以上答辩, 可请校外专家参加. 应严格掌握评分标准, 成绩为优的论文一般不应超过论文总数的 20%.',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §四 (四)',
     '{"module":"thesis","scope":"excellence_cap","cap_pct":20,"requires":"system_level_defense"}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-9', '毕业论文未通过补答辩 (3 个月 / 限 1 次 / 不通过重修)', 9, 'assessment_rule', 3,
     '对于毕业论文答辩未通过的学生, 给予学生三个月时间对毕业论文进行补充完善, 参加由院系统一组织的补答辩, 补答辩仅限一次, 通过成绩记做 "补考及格", 补答辩不通过的须重修, 延期至 12 月可再次申请答辩.',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §四 (四)',
     '{"module":"thesis","scope":"resit_defense","grace_months":3,"max_resit":1,"resit_pass_grade":"makeup_pass","retake_after_resit_fail":true,"retake_defense_by":"december"}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-10', '中途放弃毕业论文 (已中期 → 补考/重修 / 未中期 → 延期 + 缺考)', 10, 'warning_threshold', NULL,
     '对于中途放弃毕业论文的学生: 若已完成中期汇报, 则可由院系、学生选择补考或者重修; 若未完成中期汇报, 则一律延期至下一学年开展毕业论文工作, 本学期毕业论文成绩记做 "缺考".',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §四 (四)',
     '{"module":"thesis","scope":"abandon_thesis","branches":[{"condition":"midterm_completed","options":["makeup","retake"]},{"condition":"midterm_not_completed","consequence":"defer_to_next_year","grade":"absent"}]}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-11', '毕业论文不予答辩 4 触发 (未按时 / 初评/交叉评不合格 / 缺勤 ≥ 1/3 / 校外不合格)', 11, 'status_gate', NULL,
     '经答辩委员会与指导教师认定, 学生凡有以下情况者答辩委员会不受理其答辩: 1. 在规定时间内未按时完成毕业论文; 2. 指导教师初评成绩不合格或论文交叉评阅成绩不合格; 3. 因任何原因累计缺勤时间超过毕业论文工作总时间的 1/3; 4. 校外专家论文评审结果为 "不合格".',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §四 (五)',
     '{"module":"thesis","scope":"defense_blocked_states","triggers":["late_submission","initial_review_fail","cross_review_fail","absence_over_1/3","external_expert_fail"]}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-12', '毕业论文重复率处理 (30%/50% 两档 / 整改 / 延期)', 12, 'warning_threshold', 30,
     '文字复制比超过 30% 的毕业论文处理: 1. 重度重合 (重合比 ≥ 50%) 取消该次答辩资格, 调查诚信教育并进行相应处分, 延期六个月后再次申请答辩; 2. 中度重合 (30% ≤ 重合比 < 50%) 由学部院系教学委员会审核, 合格且合理引用 → 正常答辩; 整改 → 一周内复检, < 30% 可答辩但成绩只能为"中"及以下; 3. 不合格 / 整改后复检仍中度重合 / 校外专家不合格 → 取消该次答辩资格, 本学期成绩 "不及格", 给予三个月补答辩期, 补答辩通过记 "补考及格", 不通过须重修.',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §四 (六)',
     '{"module":"thesis","scope":"plagiarism_consequences","tiers":[{"threshold":"<30%","action":"normal"},{"threshold":">=30% & <50%","action":"committee_review","possible_outcomes":["pass","rewrite_within_1_week","fail"]},{"threshold":">=50%","action":"cancel_defense","discipline":"required","defer_months":6}]}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-13', '毕业论文学术不端 (抄袭 / 数据造假 / 代写 → 不及格 + 重修)', 13, 'status_gate', NULL,
     '学生违纪情况之一者, 毕业论文成绩一律以 "不及格" 计, 必须重修: 1. 抄袭他人毕业论文 (认定为剽窃、抄袭、侵占他人学术成果); 2. 论文数据和资料造假 (认定为伪造科研数据、资料、文献、注释, 或者捏造事实、编造虚假研究成果); 3. 请人或雇人代写论文 (认定为买卖论文、由他人代写).',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §五 (二)',
     '{"module":"thesis","scope":"misconduct_consequences","triggers":["plagiarism","data_fabrication","ghost_writing"],"consequence":["fail_grade","mandatory_retake","discipline"]}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-14', '毕业论文知识产权 (归学校 / 发表须导师同意 + ECNU 第一署名)', 14, 'program_rule', NULL,
     '毕业论文的知识产权归学校所有. 学生的毕业论文若需发表, 需征得指导教师的同意, 且应以华东师范大学为第一署名单位.',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §六 (一)',
     '{"module":"thesis","scope":"ip_ownership","owner":"school","publish_requires":["advisor_consent","ecnu_first_unit"]}'::jsonb),
    (v_school_track_id, v_cat_d4_id, 'D4-16', '创新成果替代毕业论文 (互联网+ 上海铜 / 挑战杯学术 上海二)', 15, 'program_rule', NULL,
     '本科生以项目负责人身份获得 "互联网+" 大学生创新创业大赛上海市铜奖及以上或 "挑战杯" 课外学术作品竞赛上海市二等奖及以上奖项, 提供参赛作品与获奖证明可代替毕业论文. 具体管理办法由各学部 (院系) 教学委员会在此原则上制定.',
     '华东师范大学2025年本科生手册.md §本科毕业论文工作指导意见 §六 (五)',
     '{"module":"thesis","scope":"competition_substitute","eligible_competitions":[{"name":"互联网+","award_min":"shanghai_bronze"},{"name":"挑战杯_课外","award_min":"shanghai_second"}],"role":"project_leader","evidence":["work","certificate"]}'::jsonb),

    -- D5 本科毕业论文抽检 (7 条)
    (v_school_track_id, v_cat_d5_id, 'D5-1', '抽检频次 (每年 2 次 / 覆盖全专业)', 1, 'program_rule', 2,
     '学校抽检每年进行两次, 抽检覆盖学校全部本科专业.',
     '华东师范大学2025年本科生手册.md §本科毕业论文 (设计) 抽检实施办法 (2024 年修订) 第五条',
     '{"module":"thesis_spot_check","scope":"frequency","times_per_year":2,"coverage":"all_majors"}'::jsonb),
    (v_school_track_id, v_cat_d5_id, 'D5-2', '抽检评议 5 维度 (选题/写作/逻辑/能力/学术规范 含 AI 标注)', 2, 'assessment_rule', NULL,
     '抽检重点考察选题意义、写作安排、逻辑构建、专业能力、学术规范等评议要素. 选题意义: 政治方向 + 选题目的 + 理论或实际应用价值; 写作安排: 研究综述 + 进度安排; 逻辑构建: 内容组织 + 逻辑结构; 专业能力: 专业知识掌握 + 分析能力 + 研究新意; 学术规范: 不存在抄袭/剽窃/伪造/篡改/买卖/代写 (含 AI 生成) 等学术不端, AI 生成图文须标注, 格式规范.',
     '华东师范大学2025年本科生手册.md §本科毕业论文 (设计) 抽检实施办法 (2024 年修订) 第六条',
     '{"module":"thesis_spot_check","scope":"review_dimensions","dimensions":["topic","writing","logic","ability","integrity"],"AI_generation_must_label":true,"source":"§第六条"}'::jsonb),
    (v_school_track_id, v_cat_d5_id, 'D5-3', '抽检评议两档 (合格 / 不合格 / 不合格须给修改意见)', 3, 'score_scheme', NULL,
     '专家按 "合格" 和 "不合格" 两档评议本科毕业论文, 评议为 "不合格" 的本科毕业论文需给出修改意见. 专家评议为 "不合格" 的本科毕业论文认定为 "存在问题毕业论文".',
     '华东师范大学2025年本科生手册.md §本科毕业论文 (设计) 抽检实施办法 (2024 年修订) 第十二条',
     '{"module":"thesis_spot_check","scope":"verdict_scheme","levels":["合格","不合格"],"fail_must_provide_revision_notes":true}'::jsonb),
    (v_school_track_id, v_cat_d5_id, 'D5-4', '抽检策略 (答辩前 10% 随机 / 答辩后重点抽 / 隐名评议)', 4, 'gpa_threshold', 10,
     '答辩前进行第一次学校抽检: 按随机抽取方式, 以 10% 比例分专业确定抽检论文名单, 随机匹配校外同行专家评议. 抽检对象为通过重复率检测的本科毕业论文及相关材料 (隐去作者、指导教师等信息). 答辩后进行第二次学校抽检: 按重点抽取方式确定抽检论文名单, 抽检对象为各专业本科毕业论文答辩成绩排名靠后的本科毕业论文、上一年度上海市教委抽检认定为 "存在问题毕业论文" 所在专业的本科毕业论文.',
     '华东师范大学2025年本科生手册.md §本科毕业论文 (设计) 抽检实施办法 (2024 年修订) 第十三条 / 第十四条',
     '{"module":"thesis_spot_check","scope":"sampling_strategy","first_round":{"timing":"before_defense","method":"random","pct":10,"source":"after_plagiarism_check"},"second_round":{"timing":"after_defense","method":"targeted","source":["low_defense_score","previous_year_problematic_majors"]},"blind_review":true}'::jsonb),
    (v_school_track_id, v_cat_d5_id, 'D5-5', '抽检不合格处理 (一抽延期 3 月 / 二抽专家修改)', 5, 'assessment_rule', 3,
     '第一次学校抽检评议为 "不合格" → 取消该次答辩资格, 需按专家意见修改论文, 延期三个月再次申请. 答辩前由教务处再送同行专家复评, 评议为 "不合格" 视为补答辩不通过须重修. 第二次学校抽检评议为 "不合格" → 需按专家意见修改论文, 修改后的论文质量由指导教师与学部 (院系) 负责把关.',
     '华东师范大学2025年本科生手册.md §本科毕业论文 (设计) 抽检实施办法 (2024 年修订) 第十五条',
     '{"module":"thesis_spot_check","scope":"fail_consequences","first_round_fail":{"action":"cancel_defense","defer_months":3,"recheck":"by_expert_pre_defense","recheck_fail":"retake"},"second_round_fail":{"action":"revise","quality_owner":"advisor_and_dept"}}'::jsonb),
    (v_school_track_id, v_cat_d5_id, 'D5-6', '抽检申诉时效 (5 工作日 / 终评不再受理)', 6, 'time_limit', 5,
     '学生及指导教师对抽检结果或专家意见存在异议须在获知结果后 5 个工作日内向学部 (院系) 提出申诉. 学部 (院系) 组织专家对申诉材料进行评议, 评议通过则签报教务处. 教务处重新聘请专家评审, 评审结果作为本次评审的最终结果, 不再接受申诉.',
     '华东师范大学2025年本科生手册.md §本科毕业论文 (设计) 抽检实施办法 (2024 年修订) 第十六条',
     '{"module":"thesis_spot_check","scope":"appeal_window","workdays":5,"anchor":"result_notification","final_round_uncontestable":true}'::jsonb),
    (v_school_track_id, v_cat_d5_id, 'D5-7', '抽检后果 (连 2 年通报减招 / 连 3 年暂停招生 / 学术不端撤学位)', 7, 'status_gate', NULL,
     '对抽检中出现 "存在问题毕业论文" 或涉嫌学术不端行为的学部 (院系) 记入学部 (院系) 人才培养负面清单, 提高其抽检比例: 连续 2 年抽检均有 "存在问题毕业论文" 或比例较高/篇数较多的学部 (院系) 全校通报、减少招生计划、质量约谈、限期整改; 连续 3 年抽检存在问题较多的本科专业视为不能保证培养质量, 责令其暂停招生; 抽检结果作为本科专业建设与调整、招生计划分配、推免研究生计划分配、教学绩效分配等重要参考; 抽检结果作为指导教师评奖评优、职称评定等参考; 学术不端行为查实: 在校学生按违纪处分办法处理, 已毕业学生依法撤销已授予学位, 并撤销学位证书.',
     '华东师范大学2025年本科生手册.md §本科毕业论文 (设计) 抽检实施办法 (2024 年修订) 第十八条',
     '{"module":"thesis_spot_check","scope":"institutional_consequences","consecutive_2_years":["school_notification","reduce_admission","quality_meeting","rectification"],"consecutive_3_years":"suspend_admission","student_misconduct":["discipline","revoke_degree"],"affects":["admission_plan","recommendation_quota","performance_award"]}'::jsonb),

    -- D6 本科生创新训练计划 CTP (9 条)
    (v_school_track_id, v_cat_d6_id, 'D6-1', 'CTP 项目分级 4 级 (培育 → 国创/市创/校创)', 1, 'program_rule', NULL,
     '本办法适用于本校大学生创新训练体系所含的各类项目, 包括: 本科生创新训练培育项目 (培育项目, 校内孵化); 国家大学生创新训练计划项目 (国创); 上海市大学生创新训练计划项目 (市创); 校级大学生创新训练计划项目 (校创). 国创、市创、校创项目均从培育项目中产生, 培育项目实行项目立项申报制.',
     '华东师范大学2025年本科生手册.md §本科生创新训练计划项目管理办法 第二条 / 第四条',
     '{"module":"ctp","scope":"project_levels","levels":["培育","国创","市创","校创"],"pipeline":"培育 → 国创/市创/校创"}'::jsonb),
    (v_school_track_id, v_cat_d6_id, 'D6-2', 'CTP 项目分类 3 类 (创新训练 / 创业训练 / 创业实践)', 2, 'program_rule', NULL,
     '除学校自定特色专项以外, 项目主要分为以下三类: 创新训练项目 (本科生个人或团队在导师指导下自主完成创新性研究项目设计、研究条件准备和项目实施、研究报告撰写和成果交流); 创业训练项目 (本科生团队在导师指导下, 通过编制商业计划书、开展可行性研究、模拟企业运行、参加企业实践、撰写创业报告); 创业实践项目 (本科生团队在学校导师和企业导师共同指导下提出具有市场前景的创新性产品或者服务).',
     '华东师范大学2025年本科生手册.md §本科生创新训练计划项目管理办法 第四条',
     '{"module":"ctp","scope":"project_types","types":["innovation_training","entrepreneur_training","entrepreneur_practice"]}'::jsonb),
    (v_school_track_id, v_cat_d6_id, 'D6-3', 'CTP 申报条件 (≤ 5 人团队 / 1 人/学年负责 / 导师博士或中级+ / 教师每年 ≤ 2 项)', 3, 'program_rule', 5,
     '团队人数不超过 5 人, 项目负责人仅限 1 人. 鼓励跨学科、跨专业、跨年级学生协同创新. 每位学生同一学年原则上只能主持 1 个项目. 指导教师一般应具有博士学位或中级以上职称, 允许聘请校外指导教师联合参与指导项目. 教师以第一指导教师身份指导项目原则上每年不超过 2 项.',
     '华东师范大学2025年本科生手册.md §本科生创新训练计划项目管理办法 第八条 (一)(二)',
     '{"module":"ctp","scope":"application_constraints","team_max":5,"leader_count":1,"per_student_per_year_max_leadership":1,"advisor_min_qualification":"phd_or_intermediate_plus","advisor_per_year_first_max":2,"external_advisor_allowed":true}'::jsonb),
    (v_school_track_id, v_cat_d6_id, 'D6-4', 'CTP 项目研究时长 (默认 ≤ 1 年 / 国市创 ≤ 2 年 / 不晚于毕业)', 4, 'time_limit', 1,
     '项目研究时间原则上不超过 1 年 (国创、市创项目研究时间最长不超过 2 年), 完成时间不迟于学生毕业时间.',
     '华东师范大学2025年本科生手册.md §本科生创新训练计划项目管理办法 第八条 (四)',
     '{"module":"ctp","scope":"duration","default_max_years":1,"national_shanghai_max_years":2,"must_complete_before_graduation":true}'::jsonb),
    (v_school_track_id, v_cat_d6_id, 'D6-5', 'CTP 结项率挂钩名额 (< 85% 减名额 / < 60% 零名额)', 5, 'warning_threshold', 85,
     '综合考虑各学部 (院系) 历年立项数、学生规模、学科特点、管理成效等因素确定培育项目及国创、市创、校创名额分配方案: 同批次项目结项率低于 85% 的, 在下一年度减少名额分配指标; 同批次结项率低于 60% 的, 在下一年度不给予分配名额指标.',
     '华东师范大学2025年本科生手册.md §本科生创新训练计划项目管理办法 第七条',
     '{"module":"ctp","scope":"completion_rate_link_quota","reduce_threshold":85,"zero_quota_threshold":60,"applicable_to":"department_quota_next_year"}'::jsonb),
    (v_school_track_id, v_cat_d6_id, 'D6-6', 'CTP 答辩与优秀率 (≤ 20% / 院系专家答辩 / 未达标整改或终止)', 6, 'gpa_threshold', 20,
     '学部 (院系) 自行组织专家对项目进行答辩评审. 各院系可根据实际验收情况评定优秀项目, 优秀率一般不超过结题项目数的 20%. 未能按时提交结题材料或未达到结题验收标准的项目, 责令限期整改或终止项目运行.',
     '华东师范大学2025年本科生手册.md §本科生创新训练计划项目管理办法 第十条',
     '{"module":"ctp","scope":"acceptance_excellence_cap","excellence_cap_pct":20,"defense_by":"department_experts","late_or_substandard":"rectify_or_terminate"}'::jsonb),
    (v_school_track_id, v_cat_d6_id, 'D6-7', 'CTP 项目延期 (≤ 1 年 / 不晚于负责人毕业 / 须书面申请)', 7, 'time_limit', 1,
     '因特殊原因未能按时结题的项目需向学校提起书面申请, 详细说明延期理由. 项目延期结题不得超过计划执行周期 1 年, 且应在项目负责人毕业前完成.',
     '华东师范大学2025年本科生手册.md §本科生创新训练计划项目管理办法 第十一条',
     '{"module":"ctp","scope":"extension_cap","extension_max_years":1,"must_complete_before_leader_graduation":true,"requires_written_application":true}'::jsonb),
    (v_school_track_id, v_cat_d6_id, 'D6-8', 'CTP 项目放弃冷冻期 (1 年内不能作为负责人申报新项目)', 8, 'time_limit', 1,
     '项目结题验收前, 项目负责人一般不能作为负责人继续申报新项目. 如学生自行放弃或者项目被学部 (院系) 终止, 从放弃或者被终止之日起 1 年内, 项目负责人一般不得作为负责人申请新项目.',
     '华东师范大学2025年本科生手册.md §本科生创新训练计划项目管理办法 第十三条',
     '{"module":"ctp","scope":"reapply_cooldown","cooldown_years":1,"anchor":"abandon_or_termination_date"}'::jsonb),
    (v_school_track_id, v_cat_d6_id, 'D6-9', 'CTP 经费上限 (培育 1500 / 国创 10000 / 市创 7000 / 校创 5000)', 9, 'program_rule', NULL,
     '经费上限: 培育项目阶段资助经费不超过 1500 元/项; 国创项目资助经费不超过 10000 元/项; 市创项目资助经费不超过 7000 元/项; 校创项目资助经费不超过 5000 元/项.',
     '华东师范大学2025年本科生手册.md §本科生创新训练计划项目管理办法 第十六条',
     '{"module":"ctp","scope":"funding_caps","currency":"CNY","caps":{"培育":1500,"国创":10000,"市创":7000,"校创":5000}}'::jsonb)

  ON CONFLICT (category_id, code) DO UPDATE SET
    title       = EXCLUDED.title,
    order_index = EXCLUDED.order_index,
    kind        = EXCLUDED.kind,
    threshold   = EXCLUDED.threshold,
    description = EXCLUDED.description,
    source_ref  = EXCLUDED.source_ref,
    metadata    = EXCLUDED.metadata,
    updated_at  = now();


  -- ---- E 全校段 14 条 (本科教育目标 + 公共必修 + 通识教育) ----
  INSERT INTO track_requirement
    (track_id, category_id, code, title, order_index, kind, threshold, description, source_ref, metadata)
  VALUES
    -- E1 本科教育目标与培养方案 (2 条)
    (v_school_track_id, v_cat_e1_id, 'E1-2', '培养方案构成 (9 部分 / 毕业审核依据)', 1, 'program_rule', NULL,
     '专业培养方案内容包括: 指导思想; 培养目标; 毕业要求与培养目标关系矩阵; 课程体系学分构成及修读建议; 专业核心课程; 课程体系; 课程设置与毕业要求的关系矩阵; 养成教育方案; 阅读推荐书目. 培养方案规定了学生需要修读的课程、完成的养成教育活动及修读要求, 是同学们规划本科阶段学习的主要依据, 也是学校毕业审核的重要依据.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 02',
     '{"scope":"plan_structure","components":["guiding_principles","goals","goal_requirement_matrix","credit_structure","core_courses","course_system","course_requirement_matrix","cultivation_education","reading_list"],"basis_for":["student_planning","graduation_audit"]}'::jsonb),
    (v_school_track_id, v_cat_e1_id, 'E1-3', '培养方案 4 大课程结构 (公共必修约 40 / 通识 8 / 学科基础 by_dept / 专业教育 by_dept)', 2, 'credits', NULL,
     '2025 级本科培养方案课程设置分为 4 大结构: 公共必修课 约 40 学分 (思政 17 + 英语 8 + 计算机 0/3/5 非师范 / 4 师范 + 体育 4 + 国情 3 + 劳动 2 + 心理 2); 通识教育课程 8 学分 (人类思维与学科史论 + 经典阅读 + 模块课程); 学科基础课程 由各专业院系确定; 专业教育课程 由各专业院系确定. 注: 以上为一般要求, 个别专业的培养方案要求与此不同请以专业的培养方案为准.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 03',
     '{"scope":"plan_top_structure","structures":[{"name":"公共必修","credits":40,"ref":"E2"},{"name":"通识教育","credits":8,"ref":"E3"},{"name":"学科基础","credits":"by_dept"},{"name":"专业教育","credits":"by_dept"}],"specialty_override":true}'::jsonb),

    -- E2 公共必修课程及学分构成 (8 条)
    (v_school_track_id, v_cat_e2_id, 'E2-1', '思想政治理论课 6 门 17 学分', 1, 'all_of', NULL,
     '学生在校期间需修读 "思想政治理论课" 必修课程 6 门, 共 17 学分: 中国近现代史纲要 (3 学分, 第 1 学期); 思想道德与法治 (3 学分, 第 1 学期); 相关思想理论体系概论 (3 学分, 第 2 学期); 相关基础理论课程 (3 学分, 第 3 学期); 相关思想政治理论概论 (3 学分, 第 4 学期); 形势与政策 (2 学分, 不限学期). 个别专业的思想政治理论课要求与此不同请以本专业的培养方案为准.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 04 思想政治理论课程',
     '{"scope":"political_theory_required","total_credits":17,"course_count":6,"courses":[["中国近现代史纲要",3,1],["思想道德与法治",3,1],["相关思想理论体系概论",3,2],["相关基础理论课程",3,3],["相关思想政治理论概论",3,4],["形势与政策",2,null]],"specialty_override":true}'::jsonb),
    (v_school_track_id, v_cat_e2_id, 'E2-2', '大学英语 8 学分 (分级 A/B/C/D / 雅思 7 或托福 94 入 A 班)', 2, 'credits', 8,
     '学生在学期间应修读 8 学分大学英语类课程. 新生进校后须参加大学英语水平测试分级考试, 学校根据分级考试结果安排学生对应 A/B/C/D 班: A 班 (提高班) 通用学术英语听说 (2 学分免修) + 通用学术英语读写 (2 学分免修) + 学术英语写作高级 (2) + 选修 2; B 班 (普通班) 通用学术英语听说 (2) + 通用学术英语读写 (2) + 学术英语写作 (2) + 选修 (2); C 班 (艺术体育专业) 大学英语 I/II + 体育美术音乐艺术英语 I/II; D 班 (零起点) 大学英语预备级 + I/II/III. A 班入读条件: 雅思 7 分及以上 (写作 ≥ 6) 或托福 94 分及以上或达到免修考试要求.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 04 大学英语课程',
     '{"scope":"english_required","credits":8,"level_test_required":true,"classes":{"A":{"entry":"IELTS 7 or TOEFL 94 or waiver_test","credits":8,"waivable":[2,2]},"B":{"entry":"default","credits":8},"C":{"entry":"arts_sports","credits":8},"D":{"entry":"zero_start","credits":8}}}'::jsonb),
    (v_school_track_id, v_cat_e2_id, 'E2-3', '公共计算机课程 (非师范 0/3/5 / 师范 4)', 3, 'credits', NULL,
     '非师范生在校期间需修读 0/3/5 学分的公共计算机课程, 师范生修读 4 学分. 非师范生: 第 0 学期新生计算机第一课, 第 1 学期编程思维与实践 (2 学分必修可免修), 第 2 学期实用人工智能 (1 学分必修可免修), 第 3-6 学期选修 (数据思维与实践 / AI 算法思维与实践 / AI 思维与数字人文 / 数字媒体与 AI 创作实践 2 学分 / 设计思维与综合实践 B 2 学分 / 设计思维与综合实践 A 1 学分可免修). 师范生: 第 0 学期新生计算机第一课, 第 1 学期编程思维与实践 (2 学分必修可免修), 第 2 学期人工智能与智慧教育 (2 学分必修). 免修条件: 编程思维与实践参加 B-PT 测评达免修要求; 实用人工智能 C-AI 测评; 设计思维与综合实践 A 1 学分参加上海市/中国大学生计算机应用能力大赛获优胜奖以上或华师大计算机应用能力大赛入围决赛.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 04 公共计算机课程',
     '{"scope":"computer_required","branches":{"non_normal":{"credit_options":[0,3,5],"required_courses":[{"name":"编程思维与实践","credit":2,"waivable":true},{"name":"实用人工智能","credit":1,"waivable":true}],"elective_pool_3_6":["数据思维与实践","AI算法思维与实践","AI思维与数字人文","数字媒体与AI创作实践","设计思维与综合实践B","设计思维与综合实践A"]},"normal_student":{"credits":4,"required":[{"name":"编程思维与实践","credit":2,"waivable":true},{"name":"人工智能与智慧教育","credit":2,"waivable":false}]}},"waiver_via":"digital_literacy_test"}'::jsonb),
    (v_school_track_id, v_cat_e2_id, 'E2-4', '公共体育 4 学分 (年 1-2 完成 / 慕课挂第 4 学分 / 体育专业免)', 4, 'credits', 4,
     '学生在校期间需修读 4 个学分的大学体育课程, 在第一和第二学年期间修读完毕. 体育类专业学生和高水平运动员不要求修读公共体育课程. 大学体育课程包括理论教学 (线上《体育与健康 (慕课)》) + 实践教学. 课程考核由所选项目课内考核 (40%) + 体能类项目测试 (30%) + 课外活动 (30%) 三方面成绩构成. "慕课" 成绩将与公共体育课程的第 4 个学分挂钩 (即学生在获得第 4 个体育课学分时 "慕课" 仍不合格将要重修该学期的体育课). 学校为不适合参加普通体育课的学生开设体育保健班 (需二级以上医院证明 + 保健申请).',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 04 公共体育课程',
     '{"scope":"pe_required","credits":4,"semesters":"year_1_to_2","excluded_groups":["sports_majors","high_level_athletes"],"grading":{"in_class":0.40,"fitness_test":0.30,"extracurricular":0.30},"mooc_link":"4th_credit","health_class_for_disabled":true}'::jsonb),
    (v_school_track_id, v_cat_e2_id, 'E2-5', '国情教育 3 学分 (军事理论 2 + 国家安全教育 1 / 2024 级起)', 5, 'all_of', NULL,
     '国情教育共分两个模块: 《军事理论》(含军训) 2 学分; 《国家安全教育》1 学分 (自 2024 级开始, 纳入本科生必修课程), 学生须完成线上及线下教学环节并完成考核.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 04 国情教育课程',
     '{"scope":"national_education_required","total_credits":3,"courses":[["军事理论（含军训）",2,"1-2"],["国家安全教育",1,"1-2"]],"since_cohort_for_national_security":2024}'::jsonb),
    (v_school_track_id, v_cat_e2_id, 'E2-6', '劳动教育 2 学分 (4 路径 / 含创新创业冲抵 ≤ 2)', 6, 'credits', 2,
     '学生需修读 2 个学分劳动教育课程方能毕业, 可通过下列途径获得: (1) 修读 "劳动与创造" 模块课程; (2) 修读培养方案中指定的可以冲抵 "劳动与创造" 模块课程学分的专业课程; (3) 参加大学生创新创业训练计划项目、竞赛获奖、公开发表学术论文等进行创新创业学分认定, 冲抵 "劳动与创造" 模块课程学分要求 (参 C6-3, 上限 2 学分); (4) 修读劳动教育线上 MOOC 并参加劳动教育实践.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 04 劳动教育课程',
     '{"scope":"labor_education_required","credits":2,"fulfillment_paths":["labor_creation_module","department_designated_substitute","innovation_credit_substitute_max_2","online_mooc_plus_practice"],"cross_ref":"C6-3"}'::jsonb),
    (v_school_track_id, v_cat_e2_id, 'E2-7', '心理健康 2 学分 (心理学/教育学/师范专业可免)', 7, 'credits', 2,
     '学生在学期间应达到 2 个学分的心理健康要求, 可通过下列途径获得: (1) 修读 "心理健康" 模块课程; (2) 修读专业课程中心理健康融合课程. 心理学类、教育学类及师范专业如有相应心理类课程可不再重复要求.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 04 心理健康课程',
     '{"scope":"mental_health_required","credits":2,"fulfillment_paths":["mental_health_module","integrated_in_major_courses"],"exemption_majors":["psychology","education","normal_majors"]}'::jsonb),
    (v_school_track_id, v_cat_e2_id, 'E2-8', '通识必修 (劳动 + 心理 共 4 学分 / 师范生教育实习可免劳动)', 8, 'credits', 4,
     '劳动与创造 (2 学分) + 心理健康 (2 学分) = 通识必修共 4 学分, 在公共必修课程的 40 学分中: 劳动与创造: 如专业已有相应课程可不重复要求 (师范生教育实习免修等); 心理健康: 心理学类、教育学类及师范专业如有相应心理类课程可不再重复要求.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 03 / §04',
     '{"scope":"general_required_sub","labor":{"credits":2,"normal_student_exemption":"教育实习"},"mental_health":{"credits":2,"exemption_majors":["psychology","education","normal_majors"]}}'::jsonb),

    -- E3 通识教育课程 (4 条)
    (v_school_track_id, v_cat_e3_id, 'E3-1', '通识教育总学分 (8 学分)', 1, 'credits', 8,
     '通识教育课程包含 3 个模块: 人类思维与学科史论 / 经典阅读 / 模块课程. 一般要求修满 8 学分, 具体以专业培养方案为准.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 05',
     '{"scope":"general_education_total","credits":8,"modules":["人类思维与学科史论","经典阅读","模块课程"],"specialty_override":true}'::jsonb),
    (v_school_track_id, v_cat_e3_id, 'E3-2', '人类思维与学科史论 (非本专业 / 强基拔尖 ≥ 1 学分)', 2, 'credits', 1,
     '学生在非本专业课程中修读. 强基、拔尖学生至少必修 1 学分. 鼓励公费师范生修读. 具体参照各专业培养方案. 课程目标: 跨越学科界限, 引导学科交叉融合, 从历史演进维度向学生展示前辈学者在过往研究中如何将灵感转变为理论和实践.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 03 + 05',
     '{"scope":"general_module_thinking","non_major_required":true,"top_class_min_credits":1,"strong_base_min_credits":1,"public_normal_recommended":true}'::jsonb),
    (v_school_track_id, v_cat_e3_id, 'E3-3', '经典阅读 (非本专业 / 强基拔尖 + 公费师范生 ≥ 2 学分 / 中文历史师范免)', 3, 'credits', 2,
     '学生在非本专业课程中修读. 强基、拔尖学生必修 2 学分. 公费师范生必修 2 学分 (汉语言文学、历史学专业公费师范生不做必修要求). 具体请参照各专业的培养方案.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 03',
     '{"scope":"general_module_classics","non_major_required":true,"top_class_min_credits":2,"public_normal_min_credits":2,"public_normal_exemption_majors":["汉语言文学","历史学"]}'::jsonb),
    (v_school_track_id, v_cat_e3_id, 'E3-4', '模块课程 (6 模块 / 文化审美必修 2 学分 / 跨专业选修可冲抵)', 4, 'credits', 2,
     '模块课程下设 6 个模块: 理性、科学与发展; 实践、技术与创新; 思辨、推理与判断; 文化、审美与诠释; 价值、社会与进步; 伦理、教育与沟通. 学生在 "文化、审美与诠释" 系列修读 2 学分 (专业如已有相应艺术课程可不再重复要求). 学生跨专业选修课程学分可以冲抵模块课程学分.',
     '华东师范大学2025年本科生学习指南.md §一、培养方案 / 03 + 05',
     '{"scope":"general_module_thematic","modules_count":6,"modules":["理性、科学与发展","实践、技术与创新","思辨、推理与判断","文化、审美与诠释","价值、社会与进步","伦理、教育与沟通"],"required_module":"文化、审美与诠释","required_credits":2,"art_courses_exemption":true,"cross_major_substitution_allowed":true}'::jsonb)

  ON CONFLICT (category_id, code) DO UPDATE SET
    title       = EXCLUDED.title,
    order_index = EXCLUDED.order_index,
    kind        = EXCLUDED.kind,
    threshold   = EXCLUDED.threshold,
    description = EXCLUDED.description,
    source_ref  = EXCLUDED.source_ref,
    metadata    = EXCLUDED.metadata,
    updated_at  = now();


  -- ---- E 师范段 8 条 (挂 师范学院 track, scope_level='college') ----
  INSERT INTO track_requirement
    (track_id, category_id, code, title, order_index, kind, threshold, description, source_ref, metadata)
  VALUES
    (v_normal_track_id, v_cat_e4_id, 'E4-1', '师范生三类型 (自费 / 公费 / 国家优师 2021 起)', 1, 'status_gate', NULL,
     '华东师范大学招收的师范生有自费师范生和公费师范生两类. 从 2021 年起学校还面向中西部欠发达地区招收定向培养师范生 (国家优师专项师范生): 自费师范生每学年需要支付学费及其他相关费用, 毕业后自由就业或继续升学; 公费师范生 + 国家优师专项师范生享受国家相关公费政策, 但毕业后须履行服务基础教育的义务.',
     '华东师范大学2025年本科生学习指南.md §四、师范生培养 / 02',
     '{"scope_level":"college","scope":"normal_student_types","types":["self_paid","public_funded","priority_teacher_since_2021"],"obligation":{"self_paid":"none","public_funded":"basic_education_service","priority_teacher":"basic_education_service"}}'::jsonb),
    (v_normal_track_id, v_cat_e4_id, 'E4-2', '公费师范生政策 (≥ 6 年服务 / 6 年免学费 / 城镇 → 农村 ≥ 1 年)', 2, 'program_rule', 6,
     '根据《教育部直属师范大学本研衔接师范生公费教育实施办法》(国办发〔2024〕27号): 公费师范生入学前与学校和生源所在地省级教育行政部门签订《本研衔接师范生公费教育协议》; 毕业后一般回生源所在省份定向地 (市、州、盟) 中小学任教, 并承诺从事中小学教育工作 6 年以上; 到城镇学校工作的公费师范生应到农村义务教育学校任教服务至少 1 年; 公费师范生在标准学习期六年内免除学费和住宿费, 补助生活费; 研究生一年级课程学习结束后, 学校根据公费师范生本科以来的综合考核结果进行排序, 公费师范生按排序在生源所在省份相关专业履约任教地范围内进行选择.',
     '华东师范大学2025年本科生学习指南.md §四、师范生培养 / 03',
     '{"scope_level":"college","scope":"public_normal_policy","agreement":"本研衔接公费教育协议","service_years_min":6,"urban_to_rural_min_year":1,"free_within_years":6,"free_items":["tuition","accommodation"],"allowance":"living_stipend","transition_ranking":"after_grad_year_1"}'::jsonb),
    (v_normal_track_id, v_cat_e4_id, 'E4-3', '国家优师专项政策 (≥ 6 年定向县中小学 / 4 年免学费)', 3, 'program_rule', 6,
     '根据《中西部欠发达地区优秀教师定向培养计划》(教师〔2021〕4号): 优师专项师范生入学前与学校、生源所在省份省级教育行政部门及省级乡村振兴工作部门签订协议; 毕业后到生源所在省份定向县中小学履约任教不少于 6 年; 优师专项师范生在标准学习期四年内免除学费和住宿费, 补助生活费.',
     '华东师范大学2025年本科生学习指南.md §四、师范生培养 / 03',
     '{"scope_level":"college","scope":"priority_teacher_policy","service_years_min":6,"service_location":"county_in_origin_province","free_within_years":4,"free_items":["tuition","accommodation"],"allowance":"living_stipend"}'::jsonb),
    (v_normal_track_id, v_cat_e4_id, 'E4-4', '师范生课程结构 (优师 4 板块 / 公费 5 板块 / 四位一体)', 4, 'credits', NULL,
     '国家优师专项师范生课程体系由 4 大板块组成: 公共必修 / 通识教育 / 专业教育 / 教师教育. 本研衔接公费师范生课程体系由 5 大板块组成: 在以上 4 个基础上增加跨学科课程. 采取养成教育、课程教学、实践训练和学术研究 "四位一体" 的培养模式. 本科阶段以通识教育和专业教育为主, 注重培养学生的学科专业素养; 研究生阶段注重培养学生的学科教育研究能力. 第 4 学年完成学士学位论文, 第 6 学年完成教育硕士专业学位论文.',
     '华东师范大学2025年本科生学习指南.md §四、师范生培养 / 04',
     '{"scope_level":"college","scope":"normal_student_curriculum_structure","priority_teacher_blocks":["公共必修","通识教育","专业教育","教师教育"],"public_normal_blocks":["公共必修","通识教育","专业教育","教师教育","跨学科课程"],"pedagogy":"四位一体","year_4_thesis":"bachelor","year_6_thesis":"master_education"}'::jsonb),
    (v_normal_track_id, v_cat_e4_id, 'E4-5', '教师教育板块 ≥ 21 学分 (大二下开始)', 5, 'credits', 21,
     '教师教育板块是师范生特有的课程 (至少 21 学分), 包括: 教育学; 心理学; 学科教学; 教学技能训练; 教学实践. 通识教育和专业教育课程贯穿四年, 教师教育板块课程通常在大二下学期开始.',
     '华东师范大学2025年本科生学习指南.md §四、师范生培养 / 04',
     '{"scope_level":"college","scope":"teacher_education_block","credits_min":21,"components":["pedagogy","psychology","subject_teaching","skill_training","practice"],"starts_at":"semester_4","spans":"year_2_to_4"}'::jsonb),
    (v_normal_track_id, v_cat_e4_id, 'E4-6', '师范生实践教学 (六个一工程 / 教学实训 + 教育实践 + 拓展研究)', 6, 'program_rule', NULL,
     '师范生实践教学环节: 教学实训 (教学设计、教学资源准备、微格实训、演讲实训、课堂控制实训、交互实训、评价实训、教学反思); 教育实践 (校内校外导师联合指导, 涵养师德体验、课堂教学、班级管理、教学研究); 拓展研究 (跨学科实训营、拓展课开发实践、教育+ 研习). "六个一" 提升工程: 完成 1 篇学科教育文献综述 / 上好 1 节课并完成教学反思 / 出好 1 份高质量的试卷 / 设计 1 个智能教育视角下的教学案例 / 参加 1 次教学技能比赛 / 参与 1 项双创项目. 时间安排: 国家优师专项师范生大三年级安排教学见习, 大四第一学期安排教育实习; 本研衔接公费师范生大四年级安排教育见习, 研一第一学期安排教育实习.',
     '华东师范大学2025年本科生学习指南.md §四、师范生培养 / 06',
     '{"scope_level":"college","scope":"normal_practice","components":{"training":"micro_teaching_to_evaluation","practice":"dual_advisor_internship","extension":"cross_disciplinary_camps"},"6_in_1_project":["literature_review","class_with_reflection","high_quality_exam","ai_teaching_case","skill_competition","innovation_project"],"timing":{"priority_teacher":{"observation":"year_3","internship":"year_4_fall"},"public_normal_BMA":{"observation":"year_4","internship":"master_year_1_fall"}}}'::jsonb),
    (v_normal_track_id, v_cat_e4_id, 'E4-7', '师范生教育见习 / 实习 / 研习 (非师范生入实习须 ≥ 8 学分教师教育课程)', 7, 'program_rule', NULL,
     '教育见习: 一般自第 5 学期开始, 由各专业院系具体组织实施, 以主题论坛、学校体验、教学观摩、课堂参与等形式开展, 见习地点为上海的实习基地学校. 课题研习: 通过申报 "本科生创新创业训练培育项目" 进行师范生基础教育改革研究与实践专题研究, 以及专为教师教育类课题研究开设的 "教育+" 研习. 教育实习 (本科师范生必修课程): 为期一学期, 由实习准备、中小学 (幼儿园) 实践和教学反思与补训三个阶段组成. 学生须完成教师教育课程系列中的其他课程并成绩合格方能申请参加教育实习. 中小学 (幼儿园) 实践阶段主要在上海及异地的实习基地学校进行. 非师范生申请教育实习须按要求修读教师教育相关必修课程 (教育学、心理学、学科教学类和教学技能类等课程, 至少 8 学分), 经所在专业学院审核通过后可参加学校统一安排的教育实习.',
     '华东师范大学2025年本科生学习指南.md §四、师范生培养 / 07-09',
     '{"scope_level":"college","scope":"normal_practical_phases","phases":{"observation":{"start_semester":5,"forms":["forum","school_visit","class_observation"]},"research":{"via":"innovation_training_or_education_plus"},"internship":{"duration":"1_semester","prerequisite":"all_teacher_education_courses_passed","stages":["preparation","practice","reflection"]}},"non_normal_join_internship":{"required_credits":8,"course_types":["pedagogy","psychology","subject_teaching","skill_training"]}}'::jsonb),
    (v_normal_track_id, v_cat_e4_id, 'E4-8', '师范生双导师制 (ECNU 学科教育导师 + 中小学一线兼职导师)', 8, 'program_rule', NULL,
     '学校为每个师范生配备了双导师: 华东师大的学科教育专业导师; 来自中小学教育教学实践第一线的兼职导师 (包括教育领域特级教师、实习基地骨干教师等). 以期对师范生提供从课程学习到教学实践的全过程指导.',
     '华东师范大学2025年本科生学习指南.md §四、师范生培养 / 10',
     '{"scope_level":"college","scope":"normal_dual_advisor","advisors":[{"from":"ECNU","role":"academic_education_advisor"},{"from":"K12_school","role":"practical_advisor","may_include":["distinguished_teacher","internship_base_backbone"]}]}'::jsonb)

  ON CONFLICT (category_id, code) DO UPDATE SET
    title       = EXCLUDED.title,
    order_index = EXCLUDED.order_index,
    kind        = EXCLUDED.kind,
    threshold   = EXCLUDED.threshold,
    description = EXCLUDED.description,
    source_ref  = EXCLUDED.source_ref,
    metadata    = EXCLUDED.metadata,
    updated_at  = now();


  -- =====================================================================
  -- § 4  RAISE NOTICE 汇报
  -- =====================================================================
  RAISE NOTICE '✅ 0005 全段录入完成. school_track=% / normal_track=% / 30 category / 198 requirement.', v_school_track_id, v_normal_track_id;

END $$;


-- =====================================================================
-- 验证片段 (见 0005_verify.sql)
-- =====================================================================
