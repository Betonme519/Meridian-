# ECNU 规则 digest · 批 B · 学业规则类（v2 重写）

> 生成日期：2026-05-16
> 数据源：`docs/华师大规则文件pdf/华东师范大学2025年本科生手册.md`（PDF codex 敏感词清洗版，**source of truth**）
> 旧版（基于 23 份旧 md）已归档：`docs/ecnu-digests/_archive/ecnu_rules_digest_B.md`
> 范围：6 篇校规 —— 选课退课和免听免修 / 成绩管理 / 学业预警 / 考勤 / 体质健康测试 / 学分制收费
> 4 字段：规则中文 / 原文片段 / 来源 / 落地（track_requirement 或 prompt）
> 标 🎯 = 关键阈值，结构化重点
> 落地行 kind 用 [track_kind_taxonomy.md](../track_kind_taxonomy.md) 的 12 档 canonical kind
> 6 项设计决策见 [ecnu_rules_digest_A.md](ecnu_rules_digest_A.md) 末尾「设计决策」段，本份沿用

---

## B1 · 选课退课和免听免修工作细则（华师本〔2025〕70号）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科生选课退课和免听免修工作细则（行 1228-1262）

### B1-1 · 三轮选课制 🎯
- 规则：本科生院负责统筹选课退课工作。**秋季学期、春季学期课程设置三轮选课，暑期学期课程设置两轮选课**。
- 原文：「本科生院负责统筹选课退课工作。秋季学期、春季学期课程设置三轮选课，暑期学期课程设置两轮选课。」
- 来源：§第二条
- 落地：prompt（学校组织层面）

### B1-2 · 选课前置（先注册后选课）🎯
- 规则：学生应**先注册，后选课**。**未注册者不予选课**。**未选课不能获得课程成绩及相应学分**。
- 原文：「学生应先注册，后选课。未注册者不予选课。未选课不能获得课程成绩及相应学分。」
- 来源：§第四条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ gate:"registered", required_for:"course_selection", missing_consequence:"no_grade_no_credit" })

### B1-3 · 学期选课量建议 🎯🎯
- 规则：秋季学期和春季学期单一学期的学生选课量建议 **25 学分左右**，双学位项目、卓越学院学生等可适量增加。**除毕业学年、参加校外交流等情况外，单一学期学生选课量一般不得低于学籍预警学分数**。
- 原文：「秋季学期和春季学期单一学期的学生选课量建议25学分左右，双学位项目、卓越学院学生等可适量增加。除毕业学年、参加校外交流等情况外，单一学期学生选课量一般不得低于学籍预警学分数。」
- 来源：§第五条
- 落地：track_requirement(kind=`assessment_rule`, threshold=25, metadata={ scope:"semester_credit_load", suggested:25, lower_bound:"warning_threshold_credits", exemptions:["graduation_year","exchange"], increase_allowed:["double_degree","honors_college"] })

### B1-4 · 期中退课 🎯
- 规则：选课结束后，**学生可在期中退课期间申请退课**，经任课教师、学生所在院系批准的，**终止课程修读及考核**。**学生办理期中退课的应按学分制收费办法缴纳学费**（详见 B6 段）。
- 原文：「选课期间，学生登录学校选课系统自行选课或退课，并对结果负责。选课结束后，学生可在期中退课期间申请退课，经任课教师、学生所在院系批准的，终止课程修读及考核。」「学生办理期中退课的，应按照《华东师范大学学分制收费管理办法》缴纳学费。」
- 来源：§第六条 / 第八条
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"mid_term_withdraw", approval:["instructor","department"], fee_rule_ref:"B6" })

### B1-5 · 免听免修不可申请的课程 + 学生类型 🎯
- 规则：以下**不可申请免听或免修**：
  - **课程类型**：思想政治教育课、军事理论课、开课单位规定的课程；
  - **学生类型**：**学业预警、试读的学生**。
- 原文：「思想政治教育课、军事理论课和开课单位规定的课程一般不可申请免听或免修。学业预警、试读的学生不可申请免听或免修。」
- 来源：§第九条
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"waiver_blocked", blocked_courses:["political_theory","military_theory","department_designated"], blocked_students:["academic_warning","probation"] })

### B1-6 · 免听条件 + 流程 🎯
- 规则：可免听课程范围内，**学生最迟应在开课后的第 2 周内向任课教师申请免听**，经任课教师审核同意可予免听。
  - 申请未获批准擅自缺课的，**视为旷课**。
  - 获准免听后，**学生仍须完成提交课程作业并参加课程考核**。
  - **缺交作业次数累计超过教学规定数三分之一（1/3）的，取消该课程考核资格**。无故不参加考核的，不予补考。
- 原文：「学生最迟应在开课后的第 2 周内，向任课教师申请免听。」「获准免听后，学生仍须完成提交课程作业并参加课程考核。缺交作业次数累计超过教学规定数三分之一的，取消该课程考核资格。」
- 来源：§第十条 / 第十一条
- 落地：track_requirement(kind=`time_limit`, threshold=2, metadata={ unit:"week", direction:"deadline", scope:"waive_listening_apply", post_grant_obligations:{ submit_assignments:true, attend_exam:true, max_missed:"1/3" } })

### B1-7 · 免修条件 + 流程 🎯
- 规则：可免修课程范围内，**学生学业优异或学有特长，能够达到所选课程教学要求优秀水平**的可申请免修（开课单位规定不得免修的课程除外）。**学生最迟应在开课后的第 2 周内向开课单位申请免修**，经开课单位考核或审核通过的可予免修。
  - 申请未获批准擅自缺课的，**视为旷课**。
  - 获准免修后，**无须参加课程修读和课程考核**。**该门课程成绩由开课单位录入审核，本科生院复核发布**。**等级记为最高等级**。如该课程计绩点，**绩点记最高绩点**。
- 原文：「学生学业优异或学有特长，能够达到所选课程教学要求优秀水平的，可申请免修。」「该门课程成绩由开课单位录入审核，本科生院复核发布。等级记为最高等级。如该课程计绩点，绩点记最高绩点。」
- 来源：§第十二条 / 第十三条
- 落地：track_requirement(kind=`time_limit`, threshold=2, metadata={ unit:"week", direction:"deadline", scope:"waive_modify_apply", criterion:"excellent_level", post_grant_grade:"max_level", post_grant_gpa:"max_point" })

---

## B2 · 本科生成绩管理办法（华师本〔2025〕77号）

来源文件章节：`华东师范大学2025年本科生手册.md` §本科生成绩管理办法（行 1270-1402）

### B2-1 · 记分方式总览 🎯
- 规则：课程成绩的记分方式可采用**等级制或百分制**。等级制包含**三级制和十级制**。
  - **三级制**：A（优秀）、P（及格）、F（不及格）。
  - **十级制**：A、A-、B+、B、B-、C+、C、C-、D（补考及格）、F（不及格）。
- 原文：「课程成绩的记分方式可采用等级制或百分制。等级制包含三级制和十级制。(1) 三级制为 A（优秀）、P（及格）、F（不及格）。(2)十级制为 A、A-、B+、B、B-、C+、C、C-、D（补考及格）、F（不及格）。」
- 来源：§第二章 / 第十条 (1)(2)
- 落地：track_requirement(kind=`score_scheme`, threshold=null, metadata={ scope:"grade_scheme_top", schemes:["3_level","10_level","percentile"], "3_level_levels":["A","P","F"], "10_level_levels":["A","A-","B+","B","B-","C+","C","C-","D","F"] })

### B2-2 · A 等级比例上限 🎯🎯
- 规则：
  - **三级制等级 A 的比例一般不超过 40%**；
  - **十级制等级 A 的比例一般不超过 30%**，**等级 A 和 A- 的比例合计一般不超过 40%**。
- 原文：「(1) 三级制为 A（优秀）、P（及格）、F（不及格）。等级 A 的比例一般不超过40%。(2)十级制为...等级 A 的比例一般不超过 30%，等级 A 和 A- 的比例合计一般不超过 40%。」
- 来源：§第二章 / 第十条 (1)(2)
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"A_grade_cap", caps:{ "3_level":{ A:0.40 }, "10_level":{ A:0.30, A_plus_Aminus:0.40 } } })

### B2-3 · 荣誉课程 / 卓越学院班特殊规则 🎯
- 规则：荣誉课程和**面向卓越学院单独开班的课程**选用十级制的，**可增设等级 A+**，**可删减 C 档**，**等级 A 档比例由开课单位制订具体方案**，报本科生院审核通过后在选课系统课程大纲中公布并实施。
- 原文：「(3) 荣誉课程和面向卓越学院单独开班的课程选用十级制的，可增设等级 A+，可删减 C 档，等级 A 档比例由开课单位制订具体方案，报本科生院审核通过后，在选课系统课程大纲中公布并实施。」
- 来源：§第二章 / 第十条 (3)
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"honors_excellence_grade_override", applicable_to:["honors_course","excellence_college_section"], allow_add:"A+", allow_remove:"C_tier", A_cap_by_department:true })

### B2-4 · 缓考重修免修不计入等级比例
- 规则：**缓考、重修、免修的成绩不计入等级比例**。
- 原文：「(4)缓考、重修、免修的成绩不计入等级比例。」
- 来源：§第二章 / 第十条 (4)
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"grade_cap_exclusion", excluded:["defer","retake","waive"] })

### B2-5 · 课程类型与记分方式映射 🎯
- 规则：开课单位和任课教师应综合考虑课程类别、特点和内容等选用合适的成绩记分方式：
  - **思维训练类课程、实习实践类课程、十人以下的教学班应选用等级制**；
  - **通识教育课程、经本科生院审定的公共必修课程应采用三级制**。
- 原文：「思维训练类课程、实习实践类课程、十人以下的教学班应选用等级制。通识教育课程、经本科生院审定的公共必修课程应采用三级制。」
- 来源：§第二章 / 第十一条
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"course_to_scheme_mapping", level_required:["thinking_training","practice","small_class_under_10"], "3_level_required":["general_education","public_required_audited"] })

### B2-6 · P/F 累计上限 🎯🎯
- 规则：除已采用三级制记分课程外，在校期间学生可**累计选择不超过 8 学分课程，以 P（及格）/F（不及格）方式记分且不计绩点**。
  - **每名学生每学期至多选择 1 门课程**，在课程**期末考核之前 2 周提出申请**，申请即通过。
  - 本专业学科基础课、非实践类专业必修课和部分限定课程，**一般不选用 P/F 方式**。
- 原文：「在校期间学生可累计选择不超过 8 学分课程，以 P（及格）/F（不及格）方式记分且不计绩点。」「每名学生每学期至多选择 1 门课程，在课程期末考核之前2周提出申请，申请即通过。」
- 来源：§第二章 / 第十二条
- 落地:track_requirement(kind=`assessment_rule`, threshold=8, metadata={ scope:"PF_credit_cap", total_cap:8, per_semester_cap:1, apply_deadline:"2_weeks_before_exam", excluded_categories:["major_basic","major_required_non_practical","designated"], gpa_excluded:true })

### B2-7 · 课程总评等级（百分制 → 十级转换）🎯
- 规则：课程总评采用等级制记载：
  - 三级制（含 P/F）、十级制记分方式 → 等级直接记为课程总评；
  - 百分制记分方式 → **课程成绩 60 分以下记为 F**；**60 分及以上由电脑排序按名次比例转化为等级**。相同成绩（保留 1 位小数）取相同等级。具体见附录 1。
  - **荣誉课程和卓越学院单独开班课程的总评比例由开课单位制订**。
- 原文：「(1)课程成绩的记分方式为三级制（含P/F方式）、十级制的，等级直接记为课程总评。(2)课程成绩的记分方式为百分制的，由百分制成绩转化为十级制等级，记为课程总评。课程成绩60分以下的，记为F；课程成绩60分及以上的，由电脑排序，按名次比例转化为等级。相同成绩(保留1位小数）取相同等级。」
- 来源：§第二章 / 第十三条
- 落地：track_requirement(kind=`score_scheme`, threshold=null, metadata={ scope:"final_grade_mapping", "<60":"F", ">=60":"rank_to_level", honors_override:true })

### B2-8 · 课程绩点（考核不合格 / 三级制不计绩点）🎯
- 规则：课程绩点按附录 2「课程总评与课程绩点的对应关系」计算。**考核不合格、三级制（含 P/F 方式）记分的课程不计绩点**。
- 原文：「第十四条课程绩点按照本办法附录2"课程总评与课程绩点的对应关系"计算。考核不合格、三级制（含P/F方式）记分的课程不计绩点。」
- 来源：§第二章 / 第十四条
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"gpa_excluded_courses", excluded:["failed","3_level","PF"] })

### B2-9 · 补考/缓考/重修/免修课程总评记载 🎯🎯
- 规则：
  - **补考不计算平时成绩**。补考通过的课程总评为 **D，课程绩点为 1.0**；补考未通过课程总评为 **F，课程绩点为 0**。
  - **缓考计算平时成绩**。课程总评和课程绩点对照原教学班成绩计算，**缓考未通过的不予补考**。
  - **重修课程标记（C），课程总评和课程绩点对应当次课程中非重修学生相同（或最接近）课程总评和课程绩点确定**。单独开设的重修班课程按该课程上一次考核中相同成绩对应的课程总评和课程绩点确定。
  - **免修课程的课程总评记为该课程最高等级，如计算绩点按最高绩点记**。
  - **无考核资格、缺考、考核违纪的，课程总评记为 F，课程绩点记为 0**。
- 原文：「(1)补考不计算平时成绩。补考通过的，课程总评为D，课程绩点为1.0；补考未通过，课程总评为F，课程绩点为0。(2) 缓考计算平时成绩...(3) 重修课程标记（C）...(4) 免修课程的课程总评记为该课程最高等级，如计算绩点，按最高绩点记。(5)无考核资格、缺考、考核违纪的，课程总评记为F，课程绩点记为0。」
- 来源：§第二章 / 第十五条
- 落地：track_requirement(kind=`score_scheme`, threshold=null, metadata={ scope:"special_grade_records", makeup_pass:{ grade:"D", gpa:1.0 }, makeup_fail:{ grade:"F", gpa:0 }, defer:"original_class_match", retake:{ marker:"C", grade:"matching_non_retake_peer" }, waive:{ grade:"max_level", gpa:"max_point" }, disqualified_or_absent_or_misconduct:{ grade:"F", gpa:0 } })

### B2-10 · GPA 计算公式 🎯🎯🎯
- 规则：**平均学分绩点 = Σ(成绩绩点 × 课程学分) / Σ 课程学分**。
  - 学分绩点为课程学分乘以课程所得绩点；
  - **重修课程绩点就近计算 1 次**；
  - **考核不通过课程不计入**。
- 原文：「平均学分绩点计算办法：学分绩点为课程学分乘以课程所得绩点。平均学分绩点为学分绩点之和除以总学分数。重修课程绩点就近计算1次，考核不通过课程不计入。」「平均学分绩点 = Σ(成绩绩点 × 课程学分) / Σ 课程学分」
- 来源：§第二章 / 第十六条
- 落地：track_requirement(kind=`score_scheme`, threshold=null, metadata={ scope:"gpa_formula", formula:"sum(grade_point * credit) / sum(credit)", retake_count:1, failed_excluded:true })

### B2-11 · 加权平均分（仅百分制）🎯
- 规则：**加权平均分 = Σ(百分制成绩 × 课程学分) / Σ 课程学分**。
  - 加权成绩为课程学分乘以课程所得百分制成绩；
  - **仅百分制记分课程计算加权平均分**；
  - **重修课程成绩就近计算 1 次**；
  - **考核不通过课程不计入，非百分制课程不计入**。
- 原文：「加权平均分计算办法：仅百分制记分课程计算加权平均分。加权成绩为课程学分乘以课程所得百分制成绩。加权平均分为加权成绩之和除以总学分数。重修课程成绩就近计算1次，考核不通过课程不计入，非百分制课程不计入。」
- 来源：§第二章 / 第十六条
- 落地：track_requirement(kind=`score_scheme`, threshold=null, metadata={ scope:"weighted_avg_formula", formula:"sum(percentile_score * credit) / sum(credit)", scope_courses:"percentile_only", retake_count:1, excluded:["failed","non_percentile"] })

### B2-12 · 附录 1 · 课程总评与百分制名次比例对应表 🎯
- 规则：百分制 ≥ 60 分课程，按名次比例（M = 名次 / 总人数）转换十级等级：

| 课程总评 | 百分制名次比例 (M) |
|---|---|
| A | M ≤ 30% |
| A- | 30% < M ≤ 40% |
| B+ | 40% < M ≤ 50% |
| B | 50% < M ≤ 70% |
| B- | 70% < M ≤ 80% |
| C+ | 80% < M ≤ 85% |
| C | 85% < M ≤ 95% |
| C- | 95% < M ≤ 100% |
| D | 补考及格 |
| F | 不及格 |

- 原文：见附录 1（行 1392 HTML table）
- 来源：§附录 1
- 落地：track_requirement(kind=`score_scheme`, threshold=null, metadata={ scope:"percentile_to_level_table", source:"附录1", table:[["A","M<=30%"],["A-","30%<M<=40%"],["B+","40%<M<=50%"],["B","50%<M<=70%"],["B-","70%<M<=80%"],["C+","80%<M<=85%"],["C","85%<M<=95%"],["C-","95%<M<=100%"],["D","makeup_pass"],["F","fail"]], note:"rank/total, ties get same level" })

### B2-13 · 附录 2 · 课程总评与课程绩点对应表 🎯
- 规则：等级 → 绩点对应（关键点位）：

| 课程总评 | 课程绩点 |
|---|---|
| A+ | 4.3 |
| A | 4.0 |
| A- | 3.7 + 0.3 ×(S - A-min)/(Amin - A-min) |
| B+ | 3.3 + 0.4 ×(S - B+min)/(A-min - B+min) |
| B | 3.0 + 0.3 ×(S - Bmin)/(B+min - Bmin) |
| B- | 2.7 + 0.3 ×(S - B-min)/(Bmin - B-min) |
| C+ | 2.3 + 0.4 ×(S - C+min)/(B-min - C+min) |
| C | 2.0 + 0.3 ×(S - Cmin)/(C+min - Cmin) |
| C- | 1.7 + 0.3 ×(S - C-min)/(Cmin - C-min) |
| D | 1.0 |
| F | 0 |

- 注：S 为学生成绩，xmin 为对应等级最低成绩。**课程绩点精确到小数点后一位**。
- 原文：见附录 2（行 1400 HTML table）
- 来源：§附录 2
- 落地：track_requirement(kind=`score_scheme`, threshold=null, metadata={ scope:"level_to_gpa_table", source:"附录2", anchor_points:{ "A+":4.3, A:4.0, D:1.0, F:0 }, linear_formula:"x.y_base + range × (S - level_min) / (next_level_min - level_min)", precision:1 })

### B2-14 · 成绩录入时限
- 规则：任课教师应于**课程考核结束后的 5 个工作日内**完成课程成绩评定和录入；**补考（含缓考）结束后的 3 个工作日内**完成成绩评定和录入。
- 原文：「任课教师负责课程成绩评定和录入，应于课程考核结束后的5 个工作日内完成课程成绩评定和录入，补考（含缓考）结束后的 3 个工作日内完成成绩评定和录入。」
- 来源：§第四章 成绩管理 / 第十九条
- 落地：prompt（教师侧时限）

### B2-15 · 成绩复查 🎯
- 规则：学生对课程成绩有异议的，可向开课单位申请复查。**复查申请应当在春季、秋季学期前 4 周内提出，复查仅限 1 次**。确系有误的，由任课教师提交更正申请。
- 原文：「复查申请应当在春季、秋季学期前4周内提出，复查仅限1次。」
- 来源：§第四章 / 第二十条
- 落地：track_requirement(kind=`time_limit`, threshold=4, metadata={ unit:"week", direction:"deadline", scope:"grade_review_apply", max_times:1, anchor:"semester_start" })

---

## B3 · 本科生学业预警工作细则（华师本〔2025〕74号）

来源文件章节：`华东师范大学2025年本科生手册.md` §本科生学业预警工作细则（行 1742-1810）

### B3-1 · 预警线（3 条触发）🎯🎯🎯
- 规则：学生学业成绩出现以下情况之一者，学业成绩**达到预警线**：
  - (一) **自入学起，累计获得学分低于培养方案规定总学分的 14% × 长学期数**；
  - (二) **平均学分绩点（GPA）低于学士学位授予条件**（参 A3-2，本科 GPA<2.0 / 特定地区班 <1.8）；
  - (三) 其他可能导致无法毕业的情况。
- 原文：「学生学业成绩出现以下情况之一者，学业成绩达到预警线：( 一 )自入学起，累计获得学分低于培养方案规定总学分的14% 长学期数；(二)平均学分绩点（GPA）低于学士学位授予条件；(三)其他可能导致无法毕业的情况。」
- 来源：§第三条
- 落地：track_requirement(kind=`warning_threshold`, threshold=14, metadata={ stage:"warning", triggers:[{ rule:"cumulative_credit_pct < 14% × N_semesters" },{ rule:"gpa < degree_apply_threshold", ref:"A3-2" },{ rule:"other_grad_risk" }] })

### B3-2 · 退学线（重申 A1-10 + 学分计算见 B3-3）🎯🎯
- 规则：**除第一学年秋季学期外，学生在单个长学期获得学分低于培养方案规定总学分的 10%，且累计获得学分低于总学分的 10% × 长学期数，学业成绩达到退学线**。详见 [A1-10](ecnu_rules_digest_A.md#a1-10-退学情形7-条触发-)。学分计算规则见 [B3-3](#b3-3-学分计算规则)。
- 原文：「除第一学年秋季学期外，学生在单个长学期获得学分低于培养方案规定总学分的10%，且累计获得学分低于总学分的10%*长学期数，学业成绩达到退学线。」
- 来源：§第四条
- 落地：prompt（cross-link 到 A1-10 作主负责，学分计算见 B3-3）

### B3-3 · 学分计算规则 🎯
- 规则：学业预警及退学试读的学分计算如下：
  - (一) **学生应获总学分数以绑定培养方案为准**；尚未完成大类分流的，**按所在大类中总学分最少的专业计算**；
  - (二) **暑期短学期所获学分可计入当学年春季学期**；
  - (三) **单个学期所获学分包含当学期修读所有课程**；各学期累计获得学分中，**重修课程学分仅计算 1 次**；
  - (四) **休学学期不纳入计算**。
- 原文：「( 一 ) 学生应获总学分数以绑定培养方案为准...(二)暑期短学期所获学分可计入当学年春季学期；( 三 ) 单个学期所获学分包含当学期修读所有课程，各学期累计获得学分中，重修课程学分仅计算1次；（四）休学学期不纳入计算。」
- 来源：§第五条
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"credit_count_rules", total_basis:"bound_plan_or_lowest_in_cluster", summer_to_spring:true, retake_count:1, leave_excluded:true })

### B3-4 · 第一次退学线 → 试读 🎯
- 规则：标准学习年限（学制）内，**学业成绩第一次达到退学线**的学生**可申请试读**。**试读原则上仅限一次**。**学生延期且未达到最长学习年限，不因学业成绩作退学处理**。
- 原文：「标准学习年限（学制）内，学业成绩第一次达到退学线的学生可申请试读。试读原则上仅限一次。学生延期且未达到最长学习年限，不因学业成绩作退学处理。」
- 来源：§第七条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ stage:"probation_first", trigger:"first_dropout_line", limit:1, exemption:"extended_within_max_years" })

### B3-5 · 试读流程（5 步）
- 规则：试读申请流程：
  - (一) 学期初，各学部院系**复核学业成绩达到退学线学生名单**并反馈学生；
  - (二) 在规定期限内，学生向所在学部院系提交试读申请，**申请应附详细学习规划**，学生明确承诺遵守学校的相关规定。**逾期未提交试读申请的予以退学处理**；
  - (三) 学部院系**综合评估学生学业状况、试读规划**并将审核意见报本科生院备案审批。**如学生存在旷考、违纪行为、违法犯罪行为或其他不适宜在校学习等情形的可否决试读申请**；
  - (四) 试读申请获批准的，学生可**试读 1 学期**；未获批准的予以退学处理；
  - (五) 学校将退学的决定送达学生。**无法联系到本人的，由本科生院在官方网站发布公告 1 周**，公告结束视为决定已送达。
- 原文：「( 一 )学期初，各学部院系复核学业成绩达到退学线学生名单并反馈学生；（二）在规定期限内，学生可向所在学部院系提交试读申请，申请应附详细学习规划...」
- 来源：§第八条
- 落地：prompt（流程类）

### B3-6 · 试读结果 🎯🎯
- 规则：**试读学期结束**：
  - 学生**学业成绩高于退学线的，解除试读**；
  - 学生**学业成绩低于退学线的，且未满足第十一条三条件的，应予退学处理**。
- 原文：「试读学期结束，学生学业成绩高于退学线的，解除试读；学生学业成绩低于退学线的，且未满足第十一条的，应予退学处理。」
- 来源：§第十条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ stage:"probation_resolve", outcomes:[{ condition:"above_dropout_line", result:"release_probation" },{ condition:"below_dropout_line && !second_probation_eligible", result:"dropout" }] })

### B3-7 · 第二次退学线三条件 🎯🎯🎯
- 规则：**学业成绩第二次低于退学线**的，如学生**同时满足以下三个条件**，且所在学部院系认为学生可完成学业，并**为学生配备学业导师**的，**可第二次申请试读**：
  - (一) **学生累计所获有效学分数不低于培养方案总学分的 8% × 修读学期数**；
  - (二) 经综合评估学生能够完成培养方案；
  - (三) 家庭正确认识学生学业并充分支持。
- 试读申请获批准的，学生可试读 1 学期；未获批准的予以退学处理。
- 原文：「学业成绩第二次低于退学线的，如学生同时满足以下三个条件，且所在学部院系认为学生可完成学业，并为学生配备学业导师的，可第二次申请试读。( 一 )学生累计所获有效学分数不低于培养方案总学分的8% 修读学期数；(二)经综合评估学生能够完成培养方案；(三)家庭正确认识学生学业并充分支持。」
- 来源：§第十一条
- 落地：track_requirement(kind=`status_gate`, threshold=8, metadata={ stage:"probation_second", all_conditions_required:true, conditions:[{ rule:"valid_credits >= 8% × N_semesters" },{ rule:"plan_feasible_eval" },{ rule:"family_support" }], extra:"advisor_assigned", limit:1 })

---

## B4 · 本科生考勤细则（华师教[2021]130号）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科生考勤细则（行 3279-3305）

### B4-1 · 旷课定义
- 规则：学生应按时参加培养方案规定的课程和各种教育教学环节，**不得迟到、早退**。**因故不能参加者必须履行请假手续**。**凡未经请假、请假未获批准或请假期满擅自缺席课程学习者均以旷课论处**。
- 原文：「学生应按时参加培养方案规定的课程和各种教育教学环节...凡未经请假、请假未获批准或请假期满，擅自缺席课程学习者，均以旷课论处。」
- 来源：§一
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"truancy_definition", conditions:["no_leave","leave_denied","leave_expired"] })

### B4-2 · 旷课学时折算 🎯
- 规则：**旷课按实际授课时数计算学时**。
  - **毕业论文（毕业设计）的旷课学时，每天按 3 学时计算**；
  - **教育实习、野外实习、专业实习等实习课程旷课学时，每天按 4 学时计算**；
  - **非节假日离校未请假擅自离校者，按每天 4 学时计算**。
- 原文：「旷课按实际授课时数计算学时。毕业论文（毕业设计）的旷课学时，每天按 3 学时计算；教育实习、野外实习、专业实习等实习课程旷课学时，每天按4学时计算。」「无论是否有课程学习，学生在非节假日离校应履行请假手续，未请假而擅自离校者，按每天旷课4学时计算。」
- 来源：§二 / §三
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"truancy_hour_conversion", default:"actual_hours", thesis_per_day:3, internship_per_day:4, unauthorized_leave_per_day:4 })

### B4-3 · 高水平运动员 + 艺术特长生 🎯
- 规则：
  - **高水平运动员**须参加学校高水平运动队的常规训练和学校组织的比赛和体育活动。**无故不参加训练和比赛的作旷课处理，一次训练和比赛折合 3 学时**；
  - **艺术特长生**须参加学校艺术团的训练和学校组织的演出、比赛，**无故不参加训练和比赛作旷课处理，一次训练和比赛折合 3 学时**。
- 原文：「高水平运动员须参加学校高水平运动队的常规训练和学校组织的比赛和体育活动。无故不参加训练和比赛的，作旷课处理，一次训练和比赛折合3学时。」「艺术特长生须参加学校艺术团的训练和学校组织的演出、比赛，无故不参加训练和比赛，作旷课处理，一次训练和比赛折合3学时。」
- 来源：§四 / §五
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"special_student_truancy", applicable_to:["high_level_athlete","art_specialty"], per_session:3, trigger:"unexcused_absence_from_training_or_competition" })

### B4-4 · 旷课处分阈值 🎯🎯🎯
- 规则：
  - **一学期累计旷课达到 10 学时以上的**，将按《华东师范大学学生违纪处分办法》给予相应纪律处分；
  - **连续两周无故不参加学校规定的教育教学活动者，作退学处理**（与 A1-10 第（五）项一致）。
- 原文：「一学期累计旷课达到 10 学时以上的，将按照《华东师范大学学生违纪处分办法》给予相应纪律处分。连续两周无故不参加学校规定的教育教学活动者，作退学处理。」
- 来源：§六
- 落地：track_requirement(kind=`warning_threshold`, threshold=10, metadata={ stage:"truancy_consequence", thresholds:[{ level:"disciplinary", trigger:"semester_truancy_hours >= 10" },{ level:"dropout", trigger:"continuous_2_weeks_unexcused", cross_ref:"A1-10(5)" }] })

### B4-5 · 请假权限分级 🎯
- 规则：学生请假，除急病或紧急事故以外，须事先填写请假单，经辅导员签署意见，送管理院系办理手续。
  - **请假五天以内（含五天）者，由管理院系审批**；
  - **请假五天以上者，由管理院系报教务处审批**。
- 原文：「请假五天以内（含五天）者，由管理院系审批；请假五天以上者，由管理院系报教务处审批。」
- 来源：§七
- 落地：track_requirement(kind=`assessment_rule`, threshold=5, metadata={ scope:"leave_approval_authority", "<=5_days":"department", ">5_days":"academic_affairs", emergency_exempt:true })

### B4-6 · 请假累计上限 🎯🎯
- 规则：**累计请假期限原则上不超过学期的 1/3**。
  - 对于**仅有毕业论文（毕业设计）的毕业班学生**，因顶岗实习、开展毕业论文（毕业设计）等正当事由需要**超出 1/3** 的，经专业院系评估，预期能够顺利完成学业的情况下，**请假期限可根据学生情况、结合学生管理院系意见并在保证安全的前提下予以延长**。
- 原文：「累计请假期限原则上不超过学期的1/3。对于仅有毕业论文（毕业设计）的毕业班学生，因顶岗实习、开展毕业论文（毕业设计)等正当事由需要超出 1/3 的...请假期限可根据学生情况、结合学生管理院系意见并在保证安全的前提下予以延长。」
- 来源：§七
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"leave_total_cap", default_cap:"1/3_of_semester", exemption:{ scope:"graduation_year_thesis_only", reasons:["internship","thesis_work"], requires:"department_eval" } })

---

## B5 · 本科生体质健康测试工作实施办法（华师教[2022]205号）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科生体质健康测试工作实施办法（行 3335-3389）

### B5-1 · 适用范围
- 规则：本办法适用于华东师范大学**全体普通全日制本科生**。**留学生、符合《标准》要求申请免测并审核通过的学生予以免测**；学生**休学（保留学籍）期间免于测试**，但**在国内高校交流学习的学生一般应提供在交流学校体质健康测试的成绩**。来我校交流学习的学生可参加我校组织的体质健康测试。
- 原文：「本办法适用于华东师范大学全体普通全日制本科生。留学生、符合《标准》要求申请免测并审核通过的学生予以免测；学生休学 (保留学籍)期间免于测试...」
- 来源：§第三条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ scope:"fitness_test_applicable", included:"all_undergraduate", exempted:["international","approved_exempt","on_leave"], exchange_in_china_must_provide_score:true })

### B5-2 · 测试项目
- 规则：《标准》从**身体形态、身体机能和身体素质**等方面综合评定。
  - **室内项目**：身高、体重、肺活量、立定跳远、坐位体前屈；
  - **室外项目**：男生 50 米、1000 米、引体向上；女生 50 米、800 米、1 分钟仰卧起坐。
- 原文：「室内项目：身高、体重、肺活量、立定跳远、坐位体前屈。室外项目：男生：50米、1000米、引体向上；女生：50米、800米、1分钟仰卧起坐。」
- 来源：§第四条 (一) 1
- 落地：prompt（项目清单，结构化无 actionable 价值）

### B5-3 · 评分构成 🎯
- 规则：**学年总分由标准分与附加分之和构成，满分 120 分**。
  - **标准分满分 100 分**，由各单项指标得分与权重乘积之和组成；
  - **附加分满分 20 分**，根据实测成绩确定（对成绩超过 100 分的加分指标加分）；
  - 加分指标：**男生引体向上和 1000 米跑**；**女生 1 分钟仰卧起坐和 800 米跑**；各指标加分幅度均为 10 分。
- 原文：「《标准》的学年总分由标准分与附加分之和构成，满分为120分。标准分满分100分...附加分满分20分...加分指标为男生引体向上和 1000 米跑，女生 1 分钟仰卧起坐和 800 米跑，各指标加分幅度均为10分。」
- 来源：§第四条 (一) 2
- 落地：track_requirement(kind=`score_scheme`, threshold=null, metadata={ scope:"fitness_score_structure", total_cap:120, standard_cap:100, bonus_cap:20, bonus_indicators:{ male:["pull_up","1000m"], female:["sit_up_1min","800m"] }, per_indicator_max:10 })

### B5-4 · 等级评定 🎯🎯
- 规则：根据学生学年总分评定等级：
  - **优秀**：90.0 分及以上；
  - **良好**：80.0 ～ 89.9 分；
  - **及格**：60.0 ～ 79.9 分；
  - **不及格**：59.9 分及以下。
- 原文：「根据学生学年总分评定等级：90.0 分及以上为优秀，80.0 ～ 89.9 分为良好，60.0～79.9分为及格，59.9分及以下为不及格。」
- 来源：§第四条 (二) 1
- 落地：track_requirement(kind=`gpa_threshold`, threshold=null, metadata={ scope:"fitness_grade_scale", levels:[{ name:"优秀", min:90.0 },{ name:"良好", min:80.0, max:89.9 },{ name:"及格", min:60.0, max:79.9 },{ name:"不及格", max:59.9 }] })

### B5-5 · 补测 🎯
- 规则：**测试成绩评定不及格者在本学年准予补测一次**，**补测仍不及格则学年成绩评定为不及格**。
- 原文：「测试成绩评定不及格者，在本学年准予补测一次，补测仍不及格，则学年成绩评定为不及格。」
- 来源：§第四条 (二) 1
- 落地：track_requirement(kind=`assessment_rule`, threshold=1, metadata={ scope:"fitness_makeup", max_times:1, fail_consequence:"final_fail" })

### B5-6 · 毕业成绩公式 🎯🎯
- 规则：**学生毕业时的成绩和等级，按毕业当学年总分的 50% 与其他学年总分平均得分的 50% 之和进行评定**。
- 原文：「学生毕业时的成绩和等级，按毕业当学年总分的 50% 与其他学年总分平均得分的50%之和进行评定。」
- 来源：§第四条 (二) 2
- 落地：track_requirement(kind=`gpa_threshold`, threshold=null, metadata={ scope:"fitness_grad_score_formula", formula:"final_year × 0.50 + avg(other_years) × 0.50" })

### B5-7 · 免测申请
- 规则：**学生因病或残疾可向学校提交暂缓或免予执行《标准》的申请**，经**二级甲等及以上医院证明，体育与健康学院核准**，可暂缓或免予执行《标准》，并填写《免予执行 ＜ 国家学生体质健康标准 ＞ 申请表》；毕业时《标准》成绩**注明免测**，存入学生档案。
- 原文：「学生因病或残疾可向学校提交暂缓或免予执行《标准》的申请，经二级甲等及以上医院证明，体育与健康学院核准...毕业时《标准》成绩注明免测，存入学生档案。」
- 来源：§第四条 (二) 3
- 落地：prompt（流程类）

### B5-8 · 评优门槛 🎯🎯
- 规则：**测试成绩评定达到 60 分及以上者方可参加评优与评奖**（自 **2023 级本科新生**开始施行）。
  - 2023 级之前的本科生仍按照原有办法执行；
  - 确实丧失运动能力、被免予执行《标准》的学生仍可参加评优与评奖。
- 原文：「学生测试成绩评定达到 60 分及以上者，方可参加评优与评奖，自 2023 级本科新生开始施行。2023 级之前的本科生仍按照原有办法执行。确实丧失运动能力、被免予执行《标准》的学生，仍可参加评优与评奖。」
- 来源：§第六条 1
- 落地：track_requirement(kind=`gpa_threshold`, threshold=60, metadata={ scope:"fitness_award_eligibility", since_cohort:2023, threshold:60, exemption:"disabled_exempted" })

### B5-9 · 毕业门槛 🎯🎯🎯
- 规则：**学生毕业时，体质健康测试成绩达不到 50 分者按结业或肄业处理**，自 **2023 级本科新生**开始施行。
- 原文：「学生毕业时，体质健康测试成绩达不到50分者按结业或肄业处理，自2023级本科新生开始施行。」
- 来源：§第六条 2
- 落地：track_requirement(kind=`gpa_threshold`, threshold=50, metadata={ scope:"fitness_grad_threshold", since_cohort:2023, fail_threshold:50, consequence:"degraded_to_完结业_or_肄业" })

### B5-10 · 弄虚作假处理
- 规则：学生在《标准》测试过程中如有**虚开病历、冒名顶替**等弄虚作假行为，按《华东师范大学学生违纪处分办法》处理。
- 原文：「学生在《标准》测试过程中如有虚开病历、冒名顶替等弄虚作假行为，按照《华东师范大学学生违纪处分办法》处理。」
- 来源：§第七条
- 落地：prompt

---

## B6 · 本科生学分制收费管理办法（华师教〔2023〕218号，2023 年修订）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科生学分制收费管理办法（2023年修订）（行 3445-3505）

### B6-1 · 适用范围 🎯
- 规则：本办法适用于华东师范大学**全日制本科学生**。本办法从 **2023 年入学的本科生、预科生开始执行**。**2022 年及以前入学学生按照原《学分制收费管理办法》（华师财[2011]2号）规定执行**。
- 原文：「本办法适用于华东师范大学全日制本科学生。」「本办法从 2023 年入学的本科生、预科生开始执行。2022年及以前入学学生按照原《华东师范大学学分制收费管理办法》（华师财[2011]2号）规定执行。」
- 来源：§第二条 / §第二十二条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ scope:"tuition_applicable", since_cohort:2023, pre_2023_uses_old_rules:"华师财[2011]2号" })

### B6-2 · 学费按入学年度预收标准
- 规则：每门课程对应的学分以本科培养方案为核算依据。**学校不同专业的学费预收标准按照学生入学年度学校公布的预收标准执行**。
- 原文：「每门课程对应的学分以本科培养方案为核算依据。」「学校不同专业的学费预收标准按照学生入学年度学校公布的预收标准执行。」
- 来源：§第四条 / 第五条
- 落地：prompt（按年度公布表）

### B6-3 · 校际交流
- 规则：学生在学期间参加校际交流项目的，**应按本办法第五条标准缴纳预收学费**。**从外校转入我校的学分作为学费结算的计量对象**。**交流项目有特别规定的，以该项目的协议书规定的收费标准和办法为准**。
- 原文：「学生在学期间参加校际交流项目的，应按照本办法第五条标准缴纳预收学费。从外校转入我校的学分作为学费结算的计量对象。交流项目有特别规定的，以该项目的协议书规定的收费标准和办法为准。」
- 来源：§第六条
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"exchange_program_fee", default:"home_school_rate", credit_settle_basis:"transferred_in", special_program_override:"per_agreement" })

### B6-4 · 转专业 / 双学位收费 🎯
- 规则：
  - **转专业学生在转专业前按原专业预收标准缴纳学费，转专业后按转入专业的预收标准缴纳学费**；
  - **双学士学位项目学生按第一主修专业的预收标准缴纳学费**。
- 原文：「转专业学生在转专业前按照原专业的预收标准缴纳学费，在转专业后按照转入专业的预收标准缴纳学费。双学士学位项目学生按照第一主修专业的预收标准缴纳学费。」
- 来源：§第七条
- 落地：track_requirement(kind=`tuition`, threshold=null, metadata={ scope:"transfer_double_degree_fee", transfer:"pre_old_post_new", double_degree:"first_major" })

### B6-5 · 超额学分单价 🎯🎯
- 规则：按学分收费时实行统一标准收取超额学分的学费。**现行学分收费标准**：
  - **普通全日制学生 165 元/学分**；
  - **留学生 300 元/学分**。
- 原文：「按学分收费时，实行统一标准收取超额学分的学费。现行学分收费标准为普通全日制学生165元/学分；留学生300元/学分。」
- 来源：§第八条
- 落地：track_requirement(kind=`tuition`, threshold=null, metadata={ scope:"overage_credit_unit_price", regular:165, international:300, currency:"CNY", unit:"per_credit" })

### B6-6 · 期中退课退费
- 规则：**学生期中退课，对所退课程按本办法第八条标准缴纳学费**。**期中退课的学分不再计入离校学费结算**。
- 原文：「学生期中退课，对所退课程按本办法第八条标准缴纳学费。期中退课的学分不再计入离校学费结算。」
- 来源：§第九条
- 落地：track_requirement(kind=`tuition`, threshold=null, metadata={ scope:"mid_term_withdraw_fee", rate_ref:"B6-5", excluded_from_final_settlement:true })

### B6-7 · 中途离校结算公式 🎯🎯
- 规则：**转学、退学、结业、肄业等未取得毕业资格离校的学生**，按以下标准结算：
  - **应退（补）费用 = 专业的学费预收标准 × 实际修读学期 / 2 − 已缴纳学费**；
  - 计算结果为**负数**：学校退还相应学费；
  - 计算结果为**正数**：学生补缴相应学费。
- 原文：「转学、退学、结业、肄业等未取得毕业资格离校的学生，按照以下标准进行学费结算：应退（补）费用=专业的学费预收标准*实际修读学期/2一已缴纳学费。」
- 来源：§第十一条
- 落地：track_requirement(kind=`tuition`, threshold=null, metadata={ scope:"early_leave_settlement", formula:"(annual_rate × actual_semesters / 2) - paid", positive_means_owe:true, negative_means_refund:true, applicable_to:["transfer_out","dropout","completion","incompletion"] })

### B6-8 · 毕业生超修结算 🎯🎯
- 规则：**除卓越学院毕业学生外**，其余毕业学生离校时按以下标准结算：
  - **应退（补）费用的学分数 = 学生实际修读的学分总数（包括转换学分、重修学分、不及格课程学分）− 学生培养方案规定的应修学分数**；
  - **结果为 10 学分以内（含）不用补缴**；
  - **超出 10 学分的部分由学生按 B6-5 标准补缴相应的学费**。
- 原文：「除卓越学院毕业学生外，其余毕业学生离校时按照以下标准进行学费结算：应退（补）费用的学分数=学生实际修读的学分总数（包括转换学分、重修学分、不及格课程学分）－学生培养方案规定的应修学分数，结果为 10 学分以内（含）不用补缴，超出 10 学分的部分由学生按本办法第八条标准补缴相应的学费。」
- 来源：§第十二条
- 落地：track_requirement(kind=`tuition`, threshold=10, metadata={ scope:"graduation_overage_settlement", excluded:["excellence_college"], formula:"actual_credits - required_credits", free_buffer:10, rate_ref:"B6-5", included_credit_types:["converted","retake","failed"] })

### B6-9 · 转入学分免结算
- 规则：**插班生等从外校转入的学生以及重新高考被我校录取在原所在院校获得并经认定转入我校的学分，不纳入学费结算**。**提前修读研究生课程的学分，不纳入学费结算**。
- 原文：「插班生等从外校转入的学生以及重新高考被我校录取，在原所在院校获得并经认定转入我校的学分，不纳入学费结算。提前修读研究生课程的学分，不纳入学费结算。」
- 来源：§第十三条
- 落地：track_requirement(kind=`tuition`, threshold=null, metadata={ scope:"settlement_excluded_credits", excluded:["transferred_in","reapplied_recognized","graduate_advance"] })

### B6-10 · 公费师范生 + 优师计划 🎯
- 规则：**公费师范生和优师计划学生**：
  - **学校免收标准修业年限内的学费**；
  - **超出标准修业年限后，实际修读课程学分按 B6-5 标准在离校时缴纳学费**；
  - 期中退课按 B6-6 缴费。
- 原文：「公费师范生和优师计划学生，执行如下标准：学校免收标准修业年限内的学费；超出标准修业年限后，实际修读课程学分按本办法第八条标准在离校时缴纳学费；期中退课按本办法第九条缴费。」
- 来源：§第十五条
- 落地：track_requirement(kind=`tuition`, threshold=null, metadata={ scope:"government_funded_teacher_track", applicable_to:["public_normal","priority_teacher"], free_within:"standard_years", overage_rate_ref:"B6-5" })

### B6-11 · 未缴学费 → 不予注册 🎯
- 规则：**未按学校规定缴纳学费的学生，不予注册，也不享有在籍学生的选课等相关权利**。
- 原文：「未按学校规定缴纳学费的学生，不予注册，也不享有在籍学生的选课等相关权利。」
- 来源：§第十九条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ gate:"tuition_paid", missing_consequence:["no_registration","no_course_selection"] })

### B6-12 · 困难学生绿色通道
- 规则：**家庭经济困难的学生可以向所在院系申请，报学生（研究生）工作处批准，办理"绿色通道"学费缓缴手续后注册**。
- 原文：「家庭经济困难的学生，可以向所在院系申请，报学生（研究生）工作处批准，办理"绿色通道"学费缓缴手续后注册。」
- 来源：§第二十条
- 落地：prompt（学生侧救济流程）

---

## 与阶段 4 `ecnu_process_rules.md` 的边界

以下条款留指引 + prompt，由阶段 4 `ecnu_process_rules.md` 收编精炼版：

- B2-14 成绩录入时限 / B3-5 试读流程 / B5-7 免测申请流程 / B5-10 弄虚作假处理 / B6-2 学费按入学年度预收标准 / B6-12 绿色通道
