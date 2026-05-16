-- =====================================================================
-- Meridian — ECNU 2023 级本科生培养路径 seed SQL（A 段试点）
-- Migration: 0005_seed_ecnu_2023  (pilot: digest A 段 only)
-- Created:   2026-05-16
-- Reference: docs/ecnu-digests/ecnu_rules_digest_A.md  (digest v2 source of truth)
--            docs/track_kind_taxonomy.md               (12 档 canonical kind)
--            docs/TRACK_SCHEMA.md                       (五张表结构)
--
-- 范围（本次试点）:
--   - 1 个 track (华东师范大学 2023 级 / scope_level='school' / 全校通用)
--   - 5 个 track_category (A1 学籍管理 / A2 毕业资格 / A3 学士学位 / A4 成绩学分认定 / A5 课程考核)
--   - 23 个 track_requirement (A 段落地为 track_requirement 的条款; prompt 类不入库, 进阶段 4)
--
-- 跑通试点后, 才推 B/C/D/E 段(共 4 个 category 段 + ~180 条 requirement).
--
-- 师范生 track 颗粒度 (2026-05-16 拍板): 单一 college='师范学院'.
--   - 师范生独有规则放 E4 段, scope_level='college', college='师范学院'.
--   - 本试点先不录师范生 track, 只录全校通用 track.
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
  -- track + category ids 串变量
  v_track_id uuid;
  v_cat_a1_id uuid;
  v_cat_a2_id uuid;
  v_cat_a3_id uuid;
  v_cat_a4_id uuid;
  v_cat_a5_id uuid;
BEGIN

  -- =====================================================================
  -- § 1  track  (华师大 2023 级 全校通用)
  -- =====================================================================
  SELECT id INTO v_track_id FROM track
    WHERE school = '华东师范大学'
      AND year = 2023
      AND scope_level = 'school'
      AND college IS NULL
      AND major IS NULL;

  IF v_track_id IS NULL THEN
    INSERT INTO track (school, year, scope_level, name, version, total_credits, description)
    VALUES (
      '华东师范大学',
      2023,
      'school',
      '华东师范大学 2023 级本科生通用毕业路径',
      '2025-modify',
      NULL,  -- 全校通用 track 不强制总学分 (各专业培养方案差异), 由 E 段进入或专业 track 时填
      '华东师范大学 2023 级及以后本科生通用毕业路径. 涵盖学籍管理 / 毕业资格 / 学位授予 / 成绩学分认定 / 课程考核 / 学业规则 / 特殊计划 / 过程类规则 / 培养方案. 数据源: 2025 年本科生手册 + 2025 年本科生学习指南.'
    )
    RETURNING id INTO v_track_id;
  ELSE
    -- 已存在: 更新元数据 (幂等重跑场景)
    UPDATE track
      SET name = '华东师范大学 2023 级本科生通用毕业路径',
          version = '2025-modify',
          description = '华东师范大学 2023 级及以后本科生通用毕业路径. 涵盖学籍管理 / 毕业资格 / 学位授予 / 成绩学分认定 / 课程考核 / 学业规则 / 特殊计划 / 过程类规则 / 培养方案. 数据源: 2025 年本科生手册 + 2025 年本科生学习指南.'
      WHERE id = v_track_id;
  END IF;


  -- =====================================================================
  -- § 2  track_category × 5  (A 段 5 个主题分类)
  -- =====================================================================

  -- A1 学籍管理
  SELECT id INTO v_cat_a1_id FROM track_category WHERE track_id = v_track_id AND code = 'A1';
  IF v_cat_a1_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (
      v_track_id, 'A1', '学籍管理', 11,
      '华师本〔2025〕78号《华东师范大学本科生学籍管理规定 (2025年修订)》派生规则: 入学注册 / 学制最长年限 / 休学复学 / 退学情形 / 毕业结业肄业三档. 9 条 track_requirement.'
    )
    RETURNING id INTO v_cat_a1_id;
  ELSE
    UPDATE track_category
      SET title = '学籍管理', description = '华师本〔2025〕78号《华东师范大学本科生学籍管理规定 (2025年修订)》派生规则: 入学注册 / 学制最长年限 / 休学复学 / 退学情形 / 毕业结业肄业三档. 9 条 track_requirement.'
      WHERE id = v_cat_a1_id;
  END IF;

  -- A2 毕业资格审核
  SELECT id INTO v_cat_a2_id FROM track_category WHERE track_id = v_track_id AND code = 'A2';
  IF v_cat_a2_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (
      v_track_id, 'A2', '毕业资格审核', 12,
      '华师本〔2025〕71号《华东师范大学本科生毕业资格审核工作细则》派生规则: 三档结果 (毕业/结业/肄业) / 提前毕业 3 年最少修读. 2 条 track_requirement.'
    )
    RETURNING id INTO v_cat_a2_id;
  ELSE
    UPDATE track_category
      SET title = '毕业资格审核', description = '华师本〔2025〕71号《华东师范大学本科生毕业资格审核工作细则》派生规则: 三档结果 (毕业/结业/肄业) / 提前毕业 3 年最少修读. 2 条 track_requirement.'
      WHERE id = v_cat_a2_id;
  END IF;

  -- A3 学士学位授予
  SELECT id INTO v_cat_a3_id FROM track_category WHERE track_id = v_track_id AND code = 'A3';
  IF v_cat_a3_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (
      v_track_id, 'A3', '学士学位授予', 13,
      '华师本〔2025〕48号《华东师范大学全日制本科学士学位授予工作细则 (2025年修订)》派生规则: 学位申请条件 / GPA ≥ 2.0 / 处分期不可申请 / 撤销学位. 4 条 track_requirement.'
    )
    RETURNING id INTO v_cat_a3_id;
  ELSE
    UPDATE track_category
      SET title = '学士学位授予', description = '华师本〔2025〕48号《华东师范大学全日制本科学士学位授予工作细则 (2025年修订)》派生规则: 学位申请条件 / GPA ≥ 2.0 / 处分期不可申请 / 撤销学位. 4 条 track_requirement.'
      WHERE id = v_cat_a3_id;
  END IF;

  -- A4 成绩学分认定
  SELECT id INTO v_cat_a4_id FROM track_category WHERE track_id = v_track_id AND code = 'A4';
  IF v_cat_a4_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (
      v_track_id, 'A4', '成绩及学分认定', 14,
      '华师本〔2025〕76号《华东师范大学本科生成绩及学分认定工作细则》派生规则: 认定上限 40% / 认定原则 (同次仅 1 次、高代低、不替代已获) / 记载方式. 3 条 track_requirement.'
    )
    RETURNING id INTO v_cat_a4_id;
  ELSE
    UPDATE track_category
      SET title = '成绩及学分认定', description = '华师本〔2025〕76号《华东师范大学本科生成绩及学分认定工作细则》派生规则: 认定上限 40% / 认定原则 (同次仅 1 次、高代低、不替代已获) / 记载方式. 3 条 track_requirement.'
      WHERE id = v_cat_a4_id;
  END IF;

  -- A5 课程考核
  SELECT id INTO v_cat_a5_id FROM track_category WHERE track_id = v_track_id AND code = 'A5';
  IF v_cat_a5_id IS NULL THEN
    INSERT INTO track_category (track_id, code, title, order_index, description)
    VALUES (
      v_track_id, 'A5', '课程考核', 15,
      '华师本〔2025〕79号《华东师范大学本科生课程考核管理办法》派生规则: 考核资格 (缺课/缺交>1/3) / 缓考申请期限 / 不予补考情形 / 补考范围 / 考核违纪. 5 条 track_requirement.'
    )
    RETURNING id INTO v_cat_a5_id;
  ELSE
    UPDATE track_category
      SET title = '课程考核', description = '华师本〔2025〕79号《华东师范大学本科生课程考核管理办法》派生规则: 考核资格 (缺课/缺交>1/3) / 缓考申请期限 / 不予补考情形 / 补考范围 / 考核违纪. 5 条 track_requirement.'
      WHERE id = v_cat_a5_id;
  END IF;


  -- =====================================================================
  -- § 3  track_requirement × 23  (digest A 落地为 track_requirement 的条款)
  --       prompt 类条款 (A1-4 / A1-7 / A1-8 / A1-11 / A2-3 / A2-4 / A2-5 /
  --       A3-4 / A3-5 / A3-6 / A4-1 / A4-4 / A5-1 / A5-6) 不入此表,
  --       进阶段 4 ecnu_process_rules.md.
  -- =====================================================================

  -- 一次性插入 + ON CONFLICT 幂等更新 (UNIQUE (category_id, code))

  -- A1 学籍管理: 9 条
  INSERT INTO track_requirement
    (track_id, category_id, code, title, order_index, kind, threshold, description, source_ref, metadata)
  VALUES

    -- A1-1 学制与最长学习年限
    (v_track_id, v_cat_a1_id, 'A1-1', '学制与最长学习年限', 1, 'time_limit', 6,
     '本科专业标准学习年限(学制)为 4 年, 最长学习年限(含休学和保留学籍)为 6 年, 自获得普通高等学校学籍起算.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第十五条',
     '{"unit":"year","direction":"upper","standard":4}'::jsonb),

    -- A1-2 新生入学逾期 → 放弃资格
    (v_track_id, v_cat_a1_id, 'A1-2', '新生入学逾期 → 放弃资格', 2, 'time_limit', 2,
     '新生持录取通知书按规定期限到校; 未请假/请假未获批准/请假期满逾期 2 周未到校注册的, 视为放弃入学资格.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第八条',
     '{"unit":"week","direction":"deadline","consequence":"forfeit_admission"}'::jsonb),

    -- A1-3 保留入学资格
    (v_track_id, v_cat_a1_id, 'A1-3', '保留入学资格', 3, 'time_limit', 2,
     '新生可在报到日期前申请保留入学资格 → 应征参军至退役后 2 年; 其他情况保留 1 年; 最迟保留期满前 1 周申请入学.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第十条 / 第十一条',
     '{"unit":"year","scope":"admission_hold","branches":{"enlistment":2,"other":1}}'::jsonb),

    -- A1-5 学期注册 grace
    (v_track_id, v_cat_a1_id, 'A1-5', '学期注册 grace (春秋两学期)', 4, 'time_limit', 2,
     '春秋两学期学生须在学校规定时间内办理注册手续; 因故不能如期注册的应申请暂缓注册, 暂缓期限一般不超过 2 周; 休学/保留学籍/未缴学费/其他不符合注册条件的不予注册.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第十三条 / 第十四条',
     '{"unit":"week","scope":"registration_grace"}'::jsonb),

    -- A1-6 选课前置（已注册才能选课）
    (v_track_id, v_cat_a1_id, 'A1-6', '选课前置 (已注册才能选课)', 5, 'status_gate', NULL,
     '未注册者不予选课; 已注册的学生应按培养方案、在学部院系指导下自主修读课程; GPA 作综合评价指标.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第十六条',
     '{"gate":"registered","required_for":"course_selection"}'::jsonb),

    -- A1-9 休学规则
    (v_track_id, v_cat_a1_id, 'A1-9', '休学规则 (≤2 年 / 创业不计 / 应征不计)', 6, 'time_limit', 2,
     '休学最小单位为 1 学期, 累计不超过 2 年; 休学创业经审核通过, 休学年限不计入最长学习年限, 累计仍不超过 2 年; 应征参军保留学籍至退役后 2 年, 不计入最长学习年限.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第二十九条—第三十一条',
     '{"unit":"year","scope":"leave_total_cap","exemptions":["entrepreneur","enlistment"]}'::jsonb),

    -- A1-10 退学情形 (7 条触发)
    (v_track_id, v_cat_a1_id, 'A1-10', '退学情形 (7 条触发, 含学业成绩未达学校要求)', 7, 'warning_threshold', 10,
     '学生有 7 种情形可予以退学, 含: (1) 学业成绩未达学校要求 (除第一学年秋季学期外, 单个长学期获得学分低于培养方案总学分的 10%, 且累计获得学分低于总学分的 10% × 长学期数); (2) 学习年限内未能毕业或结业; (3) 休学/保留学籍期满未提复学; (4) 患病无法继续学习; (5) 未经批准连续两周未参加教学活动; (6) 超过期限未注册又未办暂缓注册; (7) 其他.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第三十四条',
     '{"unit":"percent_of_total_credits","per_semester_min":10,"cumulative_formula":"10% × N_semesters","consequence":"dropout","first_fall_excluded":true,"all_triggers":["credit_gap","year_limit_unmet","leave_expired_no_resume","illness_unfit","2_weeks_unexcused_absence","registration_overdue","other"]}'::jsonb),

    -- A1-12 毕业/结业/肄业三档
    (v_track_id, v_cat_a1_id, 'A1-12', '毕业 / 结业 / 肄业 三档基础条款', 8, 'status_gate', NULL,
     '毕业: 学习年限内完成培养方案要求, 成绩合格、获得相应学分并达到毕业要求 → 毕业证书; 结业: 学分达培养方案总学分 90% 及以上 → 结业证书 (在最长学习年限内可申请返校补修); 肄业: 学满 1 年以上、所获学分达总学分 10% 的退学学生 → 肄业证书; 写实性学习证明: 未达肄业条件; 取消学籍: 不出具任何证明.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第三十七条—第三十九条',
     '{"tiers":[{"status":"毕业","pct":100},{"status":"结业","pct":90},{"status":"肄业","pct":10,"duration_min":"1_year"},{"status":"写实证明","pct":"<10%"}],"blocked_when":"revoked_enrollment"}'::jsonb),

    -- A1-13 学历学位证书撤销 (学术不端)
    (v_track_id, v_cat_a1_id, 'A1-13', '学历学位证书撤销 (学术不端)', 9, 'status_gate', NULL,
     '以作弊、剽窃、抄袭等学术不端行为或其他不正当手段获得学历证书/学位证书的, 依法予以撤销; 被撤销的证书已注册的, 学校予以注销并报教育行政部门宣布无效. 辅修专业相关证书参照执行.',
     '华东师范大学2025年本科生手册.md §本科生学籍管理规定 第四十二条',
     '{"gate":"academic_integrity","consequence":"revoke_certificate"}'::jsonb),

    -- A2 毕业资格审核: 2 条
    -- A2-1 三档结果 (毕业/结业/肄业)
    (v_track_id, v_cat_a2_id, 'A2-1', '毕业资格审核三档结果', 1, 'status_gate', NULL,
     '毕业、结业以审核毕业资格时学生绑定的专业培养方案要求为准: 毕业 = 学习年限内完成专业培养方案规定全部课程、成绩合格、获得相应学分并达到毕业要求; 结业 = 未达毕业要求但所获学分达培养方案规定总学分的 90% 及以上; 肄业 = 学满 1 年以上、所获学分达总学分 10% 的退学学生.',
     '华东师范大学2025年本科生手册.md §本科生毕业资格审核工作细则 第四条 (一)(二)(三)',
     '{"tiers":[{"status":"毕业","criterion":"all_courses_done + credits_met"},{"status":"结业","credit_pct":90},{"status":"肄业","credit_pct":10,"duration_min":"1_year"},{"status":"写实证明","criterion":"otherwise"}]}'::jsonb),

    -- A2-2 提前毕业 (一般应修满 3 年)
    (v_track_id, v_cat_a2_id, 'A2-2', '提前毕业 (一般应修满 3 年 / 提前 1 学期申请)', 2, 'time_limit', 3,
     '预计早于标准学习年限完成培养方案的, 一般应在本校修读满 3 年. 学生应提前 1 个学期向所在学部院系提出申请, 经审核报本科生院备案. 后因故无法按期可在毕业资格审核前申请撤销提前毕业.',
     '华东师范大学2025年本科生手册.md §本科生毕业资格审核工作细则 第五条',
     '{"unit":"year","direction":"lower","scope":"early_graduation_min_residency","apply_advance":"1_semester"}'::jsonb),

    -- A3 学士学位授予: 4 条
    -- A3-1 学位申请基本条件
    (v_track_id, v_cat_a3_id, 'A3-1', '学士学位申请基本条件', 1, 'status_gate', NULL,
     '在学校接受本科教育, 通过规定的课程考核或者修满相应学分, 通过毕业论文或毕业设计等毕业环节审查, 达到《中华人民共和国学位法》规定的学士学位申请人基本条件, 且学业要求满足 A3-2 GPA 阈值条件之一.',
     '华东师范大学2025年本科生手册.md §全日制本科学士学位授予工作细则 第四条',
     '{"gate":"degree_prereq","checks":["course_exam_passed","thesis_passed","law_basic"]}'::jsonb),

    -- A3-2 GPA 阈值 (含留学生分支)
    (v_track_id, v_cat_a3_id, 'A3-2', '学位 GPA 阈值 (本科 2.0 / 特定地区班 1.8 / 留学生达毕业即可)', 2, 'gpa_threshold', 2.0,
     '申请学士学位需 GPA 满足下列条件之一: 全日制本科毕业生 GPA ≥ 2.0; 特定地区班和预科特定学生群体毕业生 GPA ≥ 1.8; 来华留学本科毕业生应达到毕业条件即可.',
     '华东师范大学2025年本科生手册.md §全日制本科学士学位授予工作细则 第四条 (一)(二)(三)',
     '{"scope":"degree_apply","scale":"4.0+","branches":{"regular":{"gpa_min":2.0},"special_region":{"gpa_min":1.8},"international":{"gpa_min":null,"criterion":"meet_graduation_only"}}}'::jsonb),

    -- A3-3 处分期间不可申请学位
    (v_track_id, v_cat_a3_id, 'A3-3', '处分期间不可申请学位 (期满解除后申请)', 3, 'status_gate', NULL,
     '学位申请人在攻读该学位过程中因学术不端行为受到警告/严重警告/记过/留校察看等违纪处分的, 应当在处分期满解除处分后按程序申请学位.',
     '华东师范大学2025年本科生手册.md §全日制本科学士学位授予工作细则 第五条',
     '{"gate":"discipline_clear","blocked_states":["warning","severe_warning","demerit","probation"],"release_condition":"sentence_expired"}'::jsonb),

    -- A3-7 撤销学位
    (v_track_id, v_cat_a3_id, 'A3-7', '撤销学位 (学术不端 / 顶替入学 / 其他严重违法)', 4, 'status_gate', NULL,
     '学位申请人/学位获得者有以下情形, 经学校学位评定委员会决议不授予学位或撤销学位: (一) 学位论文或实践成果存在代写、剽窃、伪造等学术不端行为; (二) 盗用、冒用他人身份顶替入学; (三) 其他严重违法行为.',
     '华东师范大学2025年本科生手册.md §全日制本科学士学位授予工作细则 第八条',
     '{"gate":"degree_revoke_triggers","triggers":["thesis_misconduct","identity_fraud","other_serious_violation"]}'::jsonb),

    -- A4 成绩及学分认定: 3 条
    -- A4-2 认定上限 40%
    (v_track_id, v_cat_a4_id, 'A4-2', '学分认定上限 (≤ 培养方案总学分 40%)', 1, 'gpa_threshold', 40,
     '申请认定的成绩及学分应满足: (一) 已获得学分方可用于申请认定; (二) 累计认定学分数一般不超过在读培养方案总学分的 40%; (三) 学生赴外校交流学习的选课方案或学习计划应提前经所在学部院系审核通过.',
     '华东师范大学2025年本科生手册.md §本科生成绩及学分认定工作细则 第三条',
     '{"unit":"percent_of_total_credits","scope":"credit_recognition_cap","direction":"upper"}'::jsonb),

    -- A4-3 认定原则 (7 条)
    (v_track_id, v_cat_a4_id, 'A4-3', '成绩学分认定 7 条原则', 2, 'assessment_rule', NULL,
     '认定原则: (一) 同一次学习经历仅受理 1 次认定申请; (二) 更高教学要求/内容/学时数的课程可替代较低同类; (三) 被认定学分总数不超过实际修读学分; (四) 已获得学分的本校课程原则上不可被替代; (五) 学分核算基准按本校学分与学时对应关系; (六) 境外高校所获学分不可认定为思想政治理论课程学分; (七) 成绩及学分认定完成后不再修改.',
     '华东师范大学2025年本科生手册.md §本科生成绩及学分认定工作细则 第四条',
     '{"scope":"credit_recognition_rules","once_per_experience":true,"higher_replaces_lower":true,"no_replace_existing":true,"overseas_excluded_categories":["political_theory"]}'::jsonb),

    -- A4-5 记载方式
    (v_track_id, v_cat_a4_id, 'A4-5', '成绩学分认定记载方式', 3, 'score_scheme', NULL,
     '经认定后的记载方式: (一) 外校修读课程予以标注 "*"; (二) 多门课程认定为一门课程的, 课程总评记为 P; (三) 经认定为公共课程和通识教育模块课程的, 记录成绩和学分, 不记课程绩点; (四) 经认定为学科基础课程和专业教育课程的, 记录成绩和学分; 课程绩点的计分方式由学生所在学部院系决定.',
     '华东师范大学2025年本科生手册.md §本科生成绩及学分认定工作细则 第七条',
     '{"scope":"credit_recognition_grading","external_mark":"*","multi_to_one_grade":"P","general_no_gpa":true,"professional_gpa_by_dept":true}'::jsonb),

    -- A5 课程考核: 5 条
    -- A5-2 考核资格 (缺课/缺交 > 1/3 取消)
    (v_track_id, v_cat_a5_id, 'A5-2', '考核资格 (缺课/缺交累计 > 1/3 → 取消)', 1, 'assessment_rule', NULL,
     '学生缺课学时或缺交作业次数累计超过教学规定要求三分之一 (1/3) 的, 取消该课程考核资格. 确有特殊情况的, 由学生所在院系与开课单位协商一致后确认是否给予考核资格或缓考资格, 报本科生院备案.',
     '华东师范大学2025年本科生手册.md §本科生课程考核管理办法 第十一条',
     '{"scope":"exam_eligibility","check":"absence_or_missed_assignment","max_fraction":"1/3","consequence":"disqualify"}'::jsonb),

    -- A5-3 缓考申请 (开考前 2 天)
    (v_track_id, v_cat_a5_id, 'A5-3', '缓考申请 (开考前 2 天 / 突发病 2 工作日内)', 2, 'time_limit', 2,
     '因考核冲突、患病或其他情况不能按时参加的, 最迟应在开考前 2 天向所在院系申请缓考. 突发疾病或事故的应在事发后的 2 个工作日内补交申请, 并提供证明材料 (病历或病假单, 二级甲等以上医院). 未办理缓考申请或申请未批准的视为缺考.',
     '华东师范大学2025年本科生手册.md §本科生课程考核管理办法 第十二条',
     '{"unit":"day","scope":"defer_exam_apply","direction":"before_exam","emergency_window":"2_workdays_after"}'::jsonb),

    -- A5-4 不予补考 (4 情形)
    (v_track_id, v_cat_a5_id, 'A5-4', '不予补考 4 情形 (缺考/违纪/取消资格/缓考不合格)', 3, 'assessment_rule', NULL,
     '课程考核不合格的学生可申请补考或重修. 但以下情况不予补考: (1) 缺考; (2) 考核违纪; (3) 取消考核资格; (4) 缓考不合格.',
     '华东师范大学2025年本科生手册.md §本科生课程考核管理办法 第十三条',
     '{"scope":"resit_eligibility","blocked_states":["absent","misconduct","disqualified","defer_failed"]}'::jsonb),

    -- A5-5 补考范围
    (v_track_id, v_cat_a5_id, 'A5-5', '补考范围 (限必修+专选; 体育/通识/实践/考查/暑期不设)', 4, 'assessment_rule', NULL,
     '补考、缓考限必修课程和专业选修课程; 公共体育课程、通识教育课程、实践实习类课程及考查类型课程不设补考; 暑期学期课程不设缓考和补考.',
     '华东师范大学2025年本科生手册.md §本科生课程考核管理办法 第十四条',
     '{"scope":"resit_course_scope","eligible_categories":["required","major_elective"],"excluded_categories":["pe_public","general_education","practice","audit","summer_term"]}'::jsonb),

    -- A5-7 考核违纪 → 成绩无效 + 处分
    (v_track_id, v_cat_a5_id, 'A5-7', '考核违纪 → 该课成绩无效 + 纪律处分', 5, 'assessment_rule', NULL,
     '学生在课程考核中应严格遵守考核纪律及学术诚信, 如有违反该课程考核成绩记为无效, 并按《华东师范大学学生违纪处分办法》给予相应纪律处分.',
     '华东师范大学2025年本科生手册.md §本科生课程考核管理办法 第七章 / 学籍管理规定 §第二十一条交叉印证',
     '{"scope":"exam_misconduct","consequence":["grade_void","discipline"]}'::jsonb)

  -- ON CONFLICT 处理 (幂等重跑: 更新内容到最新)
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
  RAISE NOTICE '✅ 0005 试点 A 段录入完成. track_id=% / category 5 个 / requirement 23 个.', v_track_id;

END $$;


-- =====================================================================
-- 验证片段 (跑完上面 DO 块后单独跑这几行检查):
--
-- SELECT scope_level, school, year, name FROM track
--   WHERE school='华东师范大学' AND year=2023;
-- → 应 1 行: school / 2023 / '华东师范大学 2023 级本科生通用毕业路径'
--
-- SELECT code, title, order_index FROM track_category
--   WHERE track_id=(SELECT id FROM track WHERE school='华东师范大学' AND year=2023 AND scope_level='school')
--   ORDER BY order_index;
-- → 应 5 行: A1/A2/A3/A4/A5
--
-- SELECT category_id, code, kind, threshold, jsonb_pretty(metadata) FROM track_requirement
--   WHERE track_id=(SELECT id FROM track WHERE school='华东师范大学' AND year=2023 AND scope_level='school')
--   ORDER BY code;
-- → 应 23 行: A1-1, A1-2, A1-3, A1-5, A1-6, A1-9, A1-10, A1-12, A1-13,
--             A2-1, A2-2,
--             A3-1, A3-2, A3-3, A3-7,
--             A4-2, A4-3, A4-5,
--             A5-2, A5-3, A5-4, A5-5, A5-7
--
-- SELECT kind, count(*) FROM track_requirement
--   WHERE track_id=(SELECT id FROM track WHERE school='华东师范大学' AND year=2023 AND scope_level='school')
--   GROUP BY kind ORDER BY kind;
-- → 应:
--     assessment_rule   5
--     gpa_threshold     2
--     score_scheme      1
--     status_gate       7
--     time_limit        7
--     warning_threshold 1
--   (合计 23)
--
-- 详细验证段见 0005_verify.sql (待写)
-- =====================================================================
