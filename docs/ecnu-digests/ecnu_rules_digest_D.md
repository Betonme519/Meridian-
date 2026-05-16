# ECNU 规则 digest · 批 D · 过程类（v2 重写）

> 生成日期：2026-05-16
> 数据源：`docs/华师大规则文件pdf/华东师范大学2025年本科生手册.md`（PDF codex 敏感词清洗版，**source of truth**）
> 旧版（基于 23 份旧 md）已归档：`docs/ecnu-digests/_archive/ecnu_rules_digest_D.md`
> 范围：6 篇校规 —— 注册 / 休学复学 / 实习 / 毕业论文工作指导 / 毕业论文抽检 / 创新训练 CTP
> 4 字段：规则中文 / 原文片段 / 来源 / 落地（track_requirement 或 prompt）
> 标 🎯 = 关键阈值，结构化重点
> 落地行 kind 用 [track_kind_taxonomy.md](../track_kind_taxonomy.md) 的 12 档 canonical kind
> 6 项设计决策见 [ecnu_rules_digest_A.md](ecnu_rules_digest_A.md) 末尾「设计决策」段，本份沿用

---

## D1 · 本科生注册工作实施细则（华师教〔2021〕132号）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科生注册工作实施细则（行 1194-1222）

### D1-1 · 新生入学注册（与 A1-2 一致）🎯
- 规则：新生应持录取通知书按规定期限到校办理入学手续。**因故不能按期入学者应于规定的报到日期前向管理院系提交书面申请并附有关证明材料，办理请假手续**。**请假期限一般不得超过两周**。除因不可抗力等正当事由外，**未请假、请假未获批准或请假期满逾期两周而不到校注册的，视为放弃入学资格**。
- 原文：「请假期限一般不得超过两周。除因不可抗力等正当事由外，未请假、请假未获批准或请假期满逾期两周而不到校注册的，视为放弃入学资格。」
- 来源：§一
- 落地：prompt（cross-link 到 A1-2，避免重复 INSERT）

### D1-2 · 学期注册（含缴费）🎯🎯
- 规则：**每学期开学时学生应当按学校规定办理注册手续，含报到和缴纳学费**。因故不能如期报到者应**事先履行请假手续**，**请假期限一般不得超过两周**。**家庭经济困难的学生可以向学生资助管理中心申请办理绿色通道缓缴学费手续后予以注册**。
- 原文：「每学期开学时，学生应当按学校规定办理注册手续，含报到和缴纳学费。因故不能如期报到者，应事先履行请假手续，请假期限一般不得超过两周。家庭经济困难的学生可以向学生资助管理中心申请办理绿色通道缓缴学费手续后予以注册。」
- 来源：§三
- 落地：track_requirement(kind=`time_limit`, threshold=2, metadata={ unit:"week", direction:"deadline", scope:"semester_registration_grace", requires:["report","pay_tuition"], green_channel:"financial_aid" })

### D1-3 · 异地实习仍须注册
- 规则：**异地实习学生仍需办理注册手续**。学生应按学期安排正常开展实习并向管理院系报告到岗情况，**管理院系核实学生情况后进行代报到**。
- 原文：「异地实习，学生仍需办理注册手续。学生应按照学期安排正常开展实习并向管理院系报告到岗情况，管理院系核实学生情况后进行代报到。」
- 来源：§四
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"remote_internship_registration", proxy_by_department:true })

### D1-4 · 休学保留学籍不注册
- 规则：**休学和保留学籍期间，学生不需办理注册手续**，但**参加联合培养项目的学生仍应缴纳我校学费**。
- 原文：「休学和保留学籍期间，学生不需办理注册手续，但参加联合培养项目的学生仍应缴纳我校学费。」
- 来源：§五
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ scope:"leave_no_registration", exception:"joint_program_still_pays_fee" })

### D1-5 · 延长修业期注册规则 🎯
- 规则：**延长修业期的学生应在课程修读的学期正常办理注册手续**，**无课程修读的学期应办理休学手续**。
- 原文：「延长修业期的学生应在课程修读的学期正常办理注册手续，无课程修读的学期应办理休学手续。」
- 来源：§六
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"extended_period_registration", with_courses:"normal_registration", without_courses:"must_apply_leave" })

### D1-6 · 未注册统计与处理 🎯🎯
- 规则：**每学期第三周**，教务处对未注册学生名单进行汇总，经管理院系核实，**对于未请假、请假未准或请假期满逾期两周以上（含两周）**，除因不可抗力等正当事由以外，**依据学生学业完成情况，作退学、结业或毕业处理**。
- 原文：「每学期第三周，教务处对未注册学生名单进行汇总，经管理院系核实，对于未请假、请假未准或请假期满逾期两周以上（含两周），除因不可抗力等正当事由以外，依据学生学业完成情况，作退学、结业或毕业处理。」
- 来源：§八
- 落地：track_requirement(kind=`warning_threshold`, threshold=2, metadata={ stage:"registration_overdue", check_week:3, overdue_threshold_weeks:2, consequence_options:["dropout","completion","graduation"], based_on:"academic_status" })

---

## D2 · 本科生休学与复学工作细则（华师本〔2025〕75号）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科生休学与复学工作细则（行 1508-1576）

### D2-1 · 休学时间单位 🎯🎯（与 A1-9 一致）
- 规则：**休学时间以 1 学期为最小单位**，**休学时长累计不得超过 2 年**，起讫时间以本科生院核定为准。
- 原文：「休学时间以1学期为最小单位，休学时长累计不得超过2年,起讫时间以本科生院核定为准。」
- 来源：§第三条
- 落地：prompt（cross-link 到 A1-9 主负责）

### D2-2 · 应当休学情形（4 条触发）🎯
- 规则：学生有下列情况之一者，**应办理休学**：
  - (一) **停课治疗、休养时间超过一学期三分之一（1/3）的**；
  - (二) **请假时间超过一学期三分之一（1/3）的**；
  - (三) 因其他原因无法在校学习的；
  - (四) 学校认为应当休学的。
- 原文：「（一）停课治疗、休养时间超过一学期三分之一的;(二)请假时间超过一学期三分之一的；(三)因其他原因无法在校学习的；（四）学校认为应当休学的。」
- 来源：§第四条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ scope:"mandatory_leave_triggers", triggers:[{ rule:"treatment_time > 1/3_of_semester" },{ rule:"leave_time > 1/3_of_semester" },{ rule:"other_cannot_study" },{ rule:"school_decision" }] })

### D2-3 · 休学申请材料 🎯
- 规则：学生申请休学应提交申请并提供证明材料，**经所在学部院系审核后报本科生院审批备案**：
  - (一) **因病申请休学的，须提供二级甲等以上医院提供的证明**；
  - (二) 因私出国出境学习、实习申请休学的，须提供录取通知；
  - (三) 其他原因申请休学的，须提供事由材料；**可视情况要求补充成年家属知情同意的意见**。
- 原文：见 §第五条 (一)(二)(三)
- 来源：§第五条
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ scope:"leave_application_evidence", branches:{ illness:"hospital_level_2A_plus_certificate", overseas_private:"acceptance_letter", other:"reason_material_optional_family_consent" }, approval_chain:["department","undergrad_office"] })

### D2-4 · 应征参军保留学籍 🎯🎯（与 A1-9 + C9-4 cross-link）
- 规则：**学生应征参加中国人民解放军（含中国人民武装警察部队）**，**予以保留入学资格或保留学籍**。**保留学籍可至退役后 2 年**，**保留学籍时长不计入学习年限**。
- 学生**参加学校认定的跨校联合培养项目**，**予以保留学籍**。**保留学籍时长计入最长学习年限**。
- 原文：「学生应征参加中国人民解放军（含中国人民武装警察部队），予以保留入学资格或保留学籍。保留学籍可至退役后2年，保留学籍时长不计入学习年限。」
- 来源：§第七条
- 落地：prompt（与 A1-9 + A1-3 cross-link，单一 INSERT 已在 A 段）

### D2-5 · 休学离校时点 🎯
- 规则：**休学学生最迟应在休学起算的 1 周内办理手续并离校**。**休学期间，保留学生学籍，不予注册，不享受在校学习学生待遇**。**因病休学学生的医药费按国家及当地的有关规定处理**。
- 原文：「休学学生最迟应在休学起算的1周内办理手续并离校。休学期间，保留学生学籍，不予注册，不享受在校学习学生待遇。因病休学学生的医药费按国家及当地的有关规定处理。」
- 来源：§第九条 / 第十条
- 落地：track_requirement(kind=`time_limit`, threshold=1, metadata={ unit:"week", direction:"deadline", scope:"leave_departure_window", post_leave_status:["preserved_enrollment","no_registration","no_student_benefits"] })

### D2-6 · 复学申请时点 🎯🎯
- 规则：**学生最迟应在休学（含保留学籍）期满前 1 周提交复学申请**，**经所在学部院系审核后报本科生院备案，经复查合格方可复学注册**：
  - (一) **因病休学的须提供二级甲等以上医院诊断证明**，**复查合格者方可复学**。**复查不合格者应继续休学或退学**；
  - (二) **退伍学生复学同时报武装部审核备案**；
  - (三) **留学生复学同时报国际教育中心审核备案**。
- 原文：见 §第十一条
- 来源：§第十一条
- 落地：track_requirement(kind=`time_limit`, threshold=1, metadata={ unit:"week", direction:"before_leave_expiry", scope:"resume_apply_deadline", branches:{ illness:"hospital_certificate_required", veteran:"armed_forces_dept_filing", international:"intl_education_center_filing" }, illness_recheck_fail:"continue_leave_or_dropout" })

### D2-7 · 创业休学（与 A1-9 cross-link）🎯🎯
- 规则：**因创业休学的学生符合以下条件者，经审核通过，休学年限不计入最长学习年限，但累计不得超过 2 年**：
  - (一) **主持项目获得"上海市大学生创业基金资助"或获得风险投资超过 50 万元人民币（或等值外币）**；
  - (二) **以股东身份深入参与企业运营，且企业规模不低于 300 万、所持股份超过 20%（可技术入股）**；
  - (三) 能提供与上述条件同等效力证明材料的。
- 原文：见 §第十二条
- 来源：§第十二条
- 落地：track_requirement(kind=`program_rule`, threshold=2, metadata={ scope:"entrepreneur_leave", excluded_from_max_years:true, cap_years:2, qualifying_conditions:[{ funding:"shanghai_fund_or_VC_500k" },{ shareholder:"revenue_3m_share_20pct" },{ equivalent_evidence:true }] })

### D2-8 · 留学生服兵役 ⚠️
- 规则：**留学生服兵役**，经国际教育中心审核通过，**休学年限不计入最长学习年限，累计不得超过 2 年**。
- 原文：「留学生服兵役，经国际教育中心审核通过，休学年限不计入最长学习年限，累计不得超过2年。」
- 来源：§第十三条
- 落地：track_requirement(kind=`time_limit`, threshold=2, metadata={ scope:"international_military_service_leave", excluded_from_max_years:true, cap_years:2, approval:"intl_education_center" })

### D2-9 · 逾期未复学处理 🎯🎯
- 规则：**休学期满，逾期未办理复学的，根据学生学业完成情况，按毕业、结业或退学处理**。
- 原文：「休学期满，逾期未办理复学的，根据学生学业完成情况，按毕业、结业或退学处理。」
- 来源：§第十四条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ scope:"leave_expired_no_resume", outcomes:["graduation","completion","dropout"], based_on:"academic_status" })

---

## D3 · 本科实习工作管理办法（华师教〔2023〕43号，2023 年修订）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科实习工作管理办法（2023年修订）（行 2152-2256）

### D3-1 · 实习教学三类型 🎯
- 规则：按照本科实习教学目标分为**认识实习、专业实习和毕业实习**三类：
  - **认识实习**：学生由学校组织到实习地点参观、观摩和体验，形成对专业的初步认识的活动。**一般在本科一、二年级实施**（**师范生教育见习等归为认识实习**）；
  - **专业实习**：学生具有一定专业知识后，通过运用专业知识解决特定问题。**一般在本科二、三、四年级实施**；
  - **毕业实习**：学生具备一定实践岗位工作能力后，在专业人员指导下，辅助或相对独立参与实际工作的活动。**一般在本科四年级实施**（**师范生教育实习和教育研习等归为毕业实习**）。
- 原文：见 §第三条
- 来源：§第三条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"internship", scope:"types", types:[{ name:"recognition", year_range:[1,2], includes_normal:"教育见习" },{ name:"professional", year_range:[2,4] },{ name:"graduation", year_range:[4,4], includes_normal:["教育实习","教育研习"] }] })

### D3-2 · 实习教学组织形式 🎯
- 规则：本科实习教学**组织形式有集中实习、分散实习**，**提倡和鼓励由学部（院系）统一组织安排、专业教师带队的集中实习**。对于分散实习，应加强过程性管理和指导，严格要求和监督。
- 原文：「本科实习教学组织形式有集中实习、分散实习，提倡和鼓励由学部（院系）统一组织安排、专业教师带队的集中实习。」
- 来源：§第四条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"internship", scope:"organization_form", forms:["concentrated_school_led","dispersed"], preferred:"concentrated" })

### D3-3 · 集中实习指导师生比 🎯🎯
- 规则：**集中实习指导教师与实习学生的比例原则上不低于 1:30**，分散实习也应当安排校内教师跟踪指导。
- 原文：「集中实习指导教师与实习学生的比例原则上不低于1:30，分散实习也应当安排校内教师跟踪指导。」
- 来源：§第十六条
- 落地：track_requirement(kind=`assessment_rule`, threshold=30, metadata={ module:"internship", scope:"advisor_ratio", min_ratio:"1:30", applicable_to:"concentrated_internship", dispersed_must_have_school_advisor:true })

### D3-4 · 实习成绩评定 🎯
- 规则：**实习成绩应根据学生的工作态度、出勤情况、实习日志、实习作业、实习单位评价以及考核成绩等予以综合评定**，**考核形式可多样化**，学部（院系）应制定实习成绩考核标准。
- 原文：「实习成绩应根据学生的工作态度、出勤情况、实习日志、实习作业、实习单位评价以及考核成绩等予以综合评定，考核形式可多样化，学部（院系）应制定实习成绩考核标准。」
- 来源：§第二十五条
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ module:"internship", scope:"grade_evaluation", factors:["attitude","attendance","journal","assignment","org_eval","exam_score"], assessment_format_flexible:true })

### D3-5 · 分散实习造假处理 🎯
- 规则：**对分散实习的学生应严格考核制度**，除对其实习报告进行评阅外，还可组织答辩。**若有提交虚假证明、虚假报告的，一经发现按违纪处理，实习成绩以不及格计，需重修实习学分**。
- 原文：「对分散实习的学生应严格考核制度，除对其实习报告进行评阅外，还可组织答辩。若有提交虚假证明、虚假报告的，一经发现按违纪处理，实习成绩以不及格计，需重修实习学分。」
- 来源：§第二十六条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"internship", scope:"dispersed_fraud", consequence:["discipline","fail_grade","retake_required"] })

### D3-6 · 实习重修阈值 🎯🎯
- 规则：**实习考核不及格者**或**在实习期间请假、缺课的时间达总实习时间 1/3 以上者**，应当**重修实习学分**。
- 原文：「实习考核不及格者或在实习期间请假、缺课的时间达总实习时间1/3以上者，应当重修实习学分。」
- 来源：§第二十七条
- 落地：track_requirement(kind=`warning_threshold`, threshold=null, metadata={ module:"internship", scope:"retake_trigger", triggers:[{ rule:"grade_fail" },{ rule:"leave_or_absence >= 1/3_of_total_time" }], consequence:"retake_credit" })

### D3-7 · 档案保存
- 规则：**各学部（院系）应当按学期做好实习档案建设**，实习结束后及时归档，**学部（院系）存档不少于四年**。
- 原文：「各学部（院系）应当按学期做好实习档案建设...学部 (院系)存档不少于四年。」
- 来源：§第二十八条
- 落地：prompt（档案管理）

---

## D4 · 本科毕业论文（设计）工作指导意见（华师教〔2021〕207号）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科毕业论文（设计）工作指导意见（行 1914-2066）

### D4-1 · 抄袭检测全员 🎯
- 规则：使用**"大学生论文抄袭检测系统"对所有毕业论文进行检测**，**组织校外专家对部分院系的毕业论文进行抽查**。对存在质量问题的论文，要求各学部（院系）进一步加强督促、教师进一步加强指导、学生继续加工修改。
- 原文：「使用"大学生论文抄袭检测系统"对所有毕业论文进行检测，组织校外专家对部分院系的毕业论文进行抽查。」
- 来源：§毕业论文的组织与安排 (一) 2
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ module:"thesis", scope:"plagiarism_check", coverage:"all", external_spot_check:true })

### D4-2 · 时间安排（第七学期完成 + 离校前一周结束）🎯
- 规则：**毕业论文的选题、指导教师的配备、工作计划及日程安排等工作必须在第七学期结束前完成**。时间安排上可采取开设选修课与论文撰写交叉进行的方式，也可采用集中撰写的方式。**毕业论文工作必须在每年毕业生离校前一个星期全部结束**。
- 原文：「毕业论文的选题、指导教师的配备、工作计划及日程安排等工作必须在第七学期结束前完成。」「毕业论文工作必须在每年毕业生离校前一个星期全部结束。」
- 来源：§毕业论文的组织与安排 (四)
- 落地：track_requirement(kind=`time_limit`, threshold=7, metadata={ module:"thesis", scope:"timeline", topic_advisor_deadline:"semester_7_end", final_completion:"1_week_before_graduate_leave" })

### D4-3 · 选题原则
- 规则：选题原则：
  - (一) 确保论文的学科专业性特点；
  - (二) 深度、难度与可行性相结合；
  - (三) **一人一题，注重创造性**；
  - (四) 师范专业学生，**教育科学研究方面的论文应保持一定的比例**；
  - (五) 在应用型专业中，**可以用毕业设计代替毕业论文**；
  - (六) **应组织毕业论文开题答辩小组对开题报告进行审议**，通过后方可进入撰写阶段。
- 原文：见 §二、毕业论文的选题
- 来源：§二
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"thesis", scope:"topic_principles", one_student_one_topic:true, applied_majors_can_use_design:true, requires_proposal_defense:true })

### D4-4 · 指导教师资质 + 工作量 🎯
- 规则：**毕业论文指导教师应具有中级及以上技术职称**。
- **教师指导一篇毕业论文，可计不超过 15 学时的毕业论文教学工作量**；**每位导师指导论文的工作总量累计不超过 60 学时/届**。
- **每位导师指导学生数最多不能超过 6 名/届**。
- 原文：「毕业论文指导教师应具有中级及以上技术职称。」「每位导师指导学生数最多不能超过 6 名/届。」
- 来源：§三、毕业论文的指导 (一) 5
- 落地：track_requirement(kind=`assessment_rule`, threshold=6, metadata={ module:"thesis", scope:"advisor_constraints", min_rank:"intermediate", max_per_thesis_hours:15, max_per_advisor_per_year_hours:60, max_students_per_year:6 })

### D4-5 · 论文字数与格式 🎯
- 规则：毕业论文格式应规范，必须由**封面、目录、正文**（包括中外文题名、中外文摘要、中外文关键词、正文、参考文献、致谢和附录）三部分构成；
  - **文科类专业论文正文字数应在 8000 字以上**；
  - **理科类、音乐、美术等专业在 5000 字以上**；
  - **工科类专业由学部（院系）确定**；
  - **中、外文摘要一般为 300 ～ 500 字**；
  - 参考文献和注释必须符合学术论文的格式要求；
  - **论文主体撰写过程要求参考两篇以上外文文献**。
- 原文：见 §三、 (二) 4
- 来源：§三 (二) 4
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ module:"thesis", scope:"format", word_count:{ humanities_min:8000, science_arts_min:5000, engineering:"by_dept" }, abstract_range:[300,500], foreign_refs_min:2 })

### D4-6 · 答辩小组组成 🎯
- 规则：**答辩小组至少应由三位教师组成**，**组长应由具有副高级及以上技术职称的教师担任**，**其中一位可以是指导教师**。
- 原文：「答辩小组至少应由三位教师组成，组长应由具有副高级及以上技术职称的教师担任，其中一位可以是指导教师。」
- 来源：§四、 (一)
- 落地：track_requirement(kind=`assessment_rule`, threshold=3, metadata={ module:"thesis", scope:"defense_panel", min_size:3, leader_rank:"associate_prof_plus", advisor_can_be_member:true })

### D4-7 · 成绩评定方式 🎯
- 规则：论文的成绩评定采用 **"五级记分制"（即优、良、中、及格、不及格）**。**每篇论文在指导教师初评后须经至少 1 名其他教师交叉评阅并撰写评语**，最后由论文答辩小组评定成绩。
- 原文：「论文的成绩评定采用"五级记分制"（即优、良、中、及格、不及格）。每篇论文在指导教师初评后，须经至少1名其他教师交叉评阅并撰写评语，最后由论文答辩小组评定成绩。」
- 来源：§四、 (三)
- 落地：track_requirement(kind=`score_scheme`, threshold=null, metadata={ module:"thesis", scope:"grade_scale", levels:["优","良","中","及格","不及格"], min_cross_review:1 })

### D4-8 · 优秀比例 🎯🎯
- 规则：**优秀毕业论文必须进行系级以上答辩**，可请校外专家参加。应严格掌握评分标准，**成绩为优的论文一般不应超过论文总数的 20%**。
- 原文：「优秀毕业论文必须进行系级以上答辩，可请校外专家参加。应严格掌握评分标准，成绩为优的论文一般不应超过论文总数的 20%。」
- 来源：§四、 (四)
- 落地：track_requirement(kind=`gpa_threshold`, threshold=20, metadata={ module:"thesis", scope:"excellence_cap", cap_pct:20, requires:"system_level_defense" })

### D4-9 · 未通过补答辩 + 重修 🎯🎯🎯
- 规则：**对于毕业论文答辩未通过的学生**，**给予学生三个月时间对毕业论文进行补充完善**，**参加由院系统一组织的补答辩**，**补答辩仅限一次**，**通过成绩记做"补考及格"**，**补答辩不通过的须重修**，**延期至 12 月可再次申请答辩**。
- 原文：「对于毕业论文答辩未通过的学生，给予学生三个月时间对毕业论文进行补充完善，参加由院系统一组织的补答辩，补答辩仅限一次，通过成绩记做"补考及格"，补答辩不通过的须重修，延期至 12 月可再次申请答辩。」
- 来源：§四、 (四)
- 落地：track_requirement(kind=`assessment_rule`, threshold=3, metadata={ module:"thesis", scope:"resit_defense", grace_months:3, max_resit:1, resit_pass_grade:"makeup_pass", retake_after_resit_fail:true, retake_defense_by:"december" })

### D4-10 · 中途放弃毕业论文 🎯
- 规则：对于**中途放弃毕业论文的学生**：
  - **若已完成中期汇报**，则可由院系、学生选择**补考或者重修**；
  - **若未完成中期汇报**，则**一律延期至下一学年开展毕业论文工作**，本学期毕业论文成绩**记做"缺考"**。
- 原文：「对于中途放弃毕业论文的学生，若已完成中期汇报，则可由院系、学生选择补考或者重修；若未完成中期汇报，则一律延期至下一学年开展毕业论文工作，本学期毕业论文成绩记做"缺考"。」
- 来源：§四、 (四)
- 落地：track_requirement(kind=`warning_threshold`, threshold=null, metadata={ module:"thesis", scope:"abandon_thesis", branches:[{ condition:"midterm_completed", options:["makeup","retake"] },{ condition:"midterm_not_completed", consequence:"defer_to_next_year", grade:"absent" }] })

### D4-11 · 不予答辩情形 🎯
- 规则：经答辩委员会与指导教师认定，学生凡有以下情况者答辩委员会**不受理其答辩**：
  - 1. 在规定时间内未按时完成毕业论文；
  - 2. 指导教师初评成绩不合格，或论文交叉评阅成绩不合格；
  - 3. **因任何原因累计缺勤时间超过毕业论文工作总时间的 1/3**；
  - 4. 校外专家论文评审结果为"不合格"。
- 原文：见 §四、 (五)
- 来源：§四、 (五)
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"thesis", scope:"defense_blocked_states", triggers:["late_submission","initial_review_fail","cross_review_fail","absence_over_1/3","external_expert_fail"] })

### D4-12 · 重复率检测处理 🎯🎯
- 规则：**"文字复制比"超过 30% 的毕业论文**处理：
  - 1. **重度重合（重合比 ≥ 50%）**：**取消该次答辩资格**，调查诚信教育并进行相应处分，**延期六个月后再次申请答辩**；
  - 2. **中度重合（30% ≤ 重合比 < 50%）**：由学部院系教学委员会审核：
    - 结论"合格"且重合是合理引用 → 正常参加答辩；
    - 结论"整改" → 学生联系导师修改，一周内提交复检；**复检 < 30% 可参加答辩，但成绩只能为"中"及以下**；
  - 3. **不合格 / 整改后复检仍中度重合 / 校外专家"不合格"**：取消该次答辩资格，**本学期成绩"不及格"**，给予三个月补答辩期，**补答辩通过记"补考及格"，不通过须重修**。
- 原文：见 §四、 (六) 1-3
- 来源：§四、 (六)
- 落地：track_requirement(kind=`warning_threshold`, threshold=30, metadata={ module:"thesis", scope:"plagiarism_consequences", tiers:[{ threshold:"<30%", action:"normal" },{ threshold:">=30% & <50%", action:"committee_review", possible_outcomes:["pass","rewrite_within_1_week","fail"] },{ threshold:">=50%", action:"cancel_defense", discipline:"required", defer_months:6 }] })

### D4-13 · 学术不端处分 🎯🎯
- 规则：学生违纪情况之一者，**毕业论文成绩一律以"不及格"计，必须重修**：
  - 1. **抄袭他人毕业论文**（认定为"剽窃、抄袭、侵占他人学术成果"）；
  - 2. **论文数据和资料造假**（认定为"伪造科研数据、资料、文献、注释，或者捏造事实、编造虚假研究成果"）；
  - 3. **请人或雇人代写论文**（认定为"买卖论文、由他人代写"）。
- 原文：见 §五、 (二) 1-3
- 来源：§五、 (二)
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"thesis", scope:"misconduct_consequences", triggers:["plagiarism","data_fabrication","ghost_writing"], consequence:["fail_grade","mandatory_retake","discipline"] })

### D4-14 · 知识产权
- 规则：**毕业论文的知识产权归学校所有**。**学生的毕业论文若需发表，需征得指导教师的同意**，**且应以华东师范大学为第一署名单位**。
- 原文：「毕业论文的知识产权归学校所有。学生的毕业论文若需发表，需征得指导教师的同意，且应以华东师范大学为第一署名单位。」
- 来源：§六、 (一)
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"thesis", scope:"ip_ownership", owner:"school", publish_requires:["advisor_consent","ecnu_first_unit"] })

### D4-15 · 存档期限
- 规则：**纸质存档材料保存不少于 4 年，电子版资料原则上应永久保存**。除涉密等特殊情况外，**院系保管的毕业论文应准许本校师生查阅**。
- 原文：「各学部（院系）负责下设专业毕业论文所有相关资料的保管，纸质存档材料保存不少于4年，电子版资料原则上应永久保存。」
- 来源：§六、 (三)
- 落地：prompt（档案管理）

### D4-16 · 创新成果替代毕业论文 🎯🎯🎯
- 规则：**本科生以项目负责人身份获得"互联网+"大学生创新创业大赛上海市铜奖及以上**或**"挑战杯"课外学术作品竞赛上海市二等奖及以上奖项**，**提供参赛作品与获奖证明可代替毕业论文**。**具体管理办法**由各学部（院系）教学委员会在此原则上制定（参见 D5）。
- 原文：「本科生以项目负责人身份获得"互联网+"大学生创新创业大赛上海市铜奖及以上或"挑战杯"课外学术作品竞赛上海市二等奖及以上奖项，提供参赛作品与获奖证明可代替毕业论文。」
- 来源：§六、 (五)
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"thesis", scope:"competition_substitute", eligible_competitions:[{ name:"互联网+", award_min:"shanghai_bronze" },{ name:"挑战杯_课外", award_min:"shanghai_second" }], role:"project_leader", evidence:["work","certificate"] })

---

## D5 · 本科毕业论文（设计）抽检实施办法（华师教〔2024〕65号，2024 年修订）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科毕业论文（设计）抽检实施办法（2024年修订）（行 2072-2144）

> 旧版含 D4 抽检相关条款，本次按 source 切分独立成 D5 段。

### D5-1 · 抽检频次 🎯
- 规则：**学校抽检每年进行两次，抽检覆盖学校全部本科专业**。
- 原文：「学校抽检每年进行两次，抽检覆盖学校全部本科专业。」
- 来源：§第五条
- 落地：track_requirement(kind=`program_rule`, threshold=2, metadata={ module:"thesis_spot_check", scope:"frequency", times_per_year:2, coverage:"all_majors" })

### D5-2 · 评议要素（5 维度）🎯
- 规则：抽检重点考察**选题意义、写作安排、逻辑构建、专业能力、学术规范**等评议要素：

| 评议要素 | 观察点摘要 |
|---|---|
| 选题意义 | 政治方向 + 选题目的（前沿/相关现实问题）+ 理论或实际应用价值 |
| 写作安排 | 研究综述（文献掌握）+ 进度安排（工作量饱满、按时完成） |
| 逻辑构建 | 内容组织（基本概念严谨、论证合理、论据真实）+ 逻辑结构（完整层次分明） |
| 专业能力 | 专业知识掌握 + 分析能力 + 研究新意 |
| 学术规范 | **不存在抄袭、剽窃、伪造、篡改、买卖、代写（含 AI 生成）等学术不端**；**AI 生成图文须标注**；格式规范 |

- 原文：见手册 §第六条 + table
- 来源：§第六条
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ module:"thesis_spot_check", scope:"review_dimensions", dimensions:["topic","writing","logic","ability","integrity"], AI_generation_must_label:true, source:"§第六条" })

### D5-3 · 评议结果两档 🎯
- 规则：专家按 **"合格"和"不合格"**两档评议本科毕业论文。**评议为"不合格"的本科毕业论文需给出修改意见**。**专家评议为"不合格"的本科毕业论文，认定为"存在问题毕业论文"**。
- 原文：「专家按照"合格"和"不合格"两档评议本科毕业论文，评议为"不合格"的本科毕业论文需给出修改意见。」
- 来源：§第十二条
- 落地：track_requirement(kind=`score_scheme`, threshold=null, metadata={ module:"thesis_spot_check", scope:"verdict_scheme", levels:["合格","不合格"], fail_must_provide_revision_notes:true })

### D5-4 · 抽检比例 🎯🎯
- 规则：
  - **答辩前进行第一次学校抽检**：**按随机抽取方式，以 10% 比例分专业确定抽检论文名单**，随机匹配校外同行专家评议。**抽检对象为通过重复率检测的本科毕业论文及相关材料（隐去作者、指导教师等信息）**；
  - **答辩后进行第二次学校抽检**：按重点抽取方式确定抽检论文名单。**抽检对象为各专业本科毕业论文答辩成绩排名靠后的本科毕业论文、上一年度上海市教委抽检认定为"存在问题毕业论文"所在专业的本科毕业论文**。
- 原文：见 §第十三条 / 第十四条
- 来源：§第十三条 / 第十四条
- 落地：track_requirement(kind=`gpa_threshold`, threshold=10, metadata={ module:"thesis_spot_check", scope:"sampling_strategy", first_round:{ timing:"before_defense", method:"random", pct:10, source:"after_plagiarism_check" }, second_round:{ timing:"after_defense", method:"targeted", source:["low_defense_score","previous_year_problematic_majors"] }, blind_review:true })

### D5-5 · 不合格处理 🎯🎯
- 规则：
  - **第一次学校抽检评议为"不合格"** → **取消该次答辩资格**，需按专家意见修改论文，**延期三个月再次申请**。答辩前由教务处再送同行专家复评，**评议为"不合格"视为补答辩不通过须重修**；
  - **第二次学校抽检评议为"不合格"** → **需按专家意见修改论文**，修改后的论文质量由指导教师与学部（院系）负责把关。
- 原文：见 §第十五条
- 来源：§第十五条
- 落地：track_requirement(kind=`assessment_rule`, threshold=3, metadata={ module:"thesis_spot_check", scope:"fail_consequences", first_round_fail:{ action:"cancel_defense", defer_months:3, recheck:"by_expert_pre_defense", recheck_fail:"retake" }, second_round_fail:{ action:"revise", quality_owner:"advisor_and_dept" } })

### D5-6 · 申诉时效 🎯
- 规则：学生及指导教师对抽检结果或专家意见存在异议，**须在获知结果后 5 个工作日内向学部（院系）提出申诉**。**学部（院系）组织专家对申诉材料进行评议，评议通过则签报教务处**。**教务处重新聘请专家评审，评审结果作为本次评审的最终结果，不再接受申诉**。
- 原文：见 §第十六条
- 来源：§第十六条
- 落地：track_requirement(kind=`time_limit`, threshold=5, metadata={ module:"thesis_spot_check", scope:"appeal_window", workdays:5, anchor:"result_notification", final_round_uncontestable:true })

### D5-7 · 抽检后果（院系级 + 专业级）🎯🎯
- 规则：**对抽检中出现"存在问题毕业论文"或涉嫌学术不端行为的学部（院系）**，**记入学部（院系）人才培养负面清单**，**提高其抽检比例**：
  - **连续 2 年抽检均有"存在问题毕业论文"，或比例较高 / 篇数较多的学部（院系）**：**全校通报、减少招生计划、质量约谈、限期整改**；
  - **连续 3 年抽检存在问题较多的本科专业**：**视为不能保证培养质量，责令其暂停招生**；
  - 抽检结果作为本科专业建设与调整、本科招生计划分配、**直升推免的研究生计划分配**、本科教学绩效分配等方面的重要参考依据；
  - 抽检结果作为指导教师评奖评优、职称评定、教学类项目申报、绩效考核的参考依据；
  - **学术不端行为查实**：**在校学生按违纪处分办法处理**；**已毕业学生依法撤销已授予学位，并撤销学位证书**。
- 原文：见 §第十八条 (二)-(七)
- 来源：§第十八条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"thesis_spot_check", scope:"institutional_consequences", consecutive_2_years:["school_notification","reduce_admission","quality_meeting","rectification"], consecutive_3_years:"suspend_admission", student_misconduct:["discipline","revoke_degree"], affects:["admission_plan","recommendation_quota","performance_award"] })

---

## D6 · 本科生创新训练计划项目管理办法（华师本〔2025〕85号）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科生创新训练计划项目管理办法（行 2480-2570）

### D6-1 · 项目分级（4 级）🎯
- 规则：本办法适用于本校大学生创新训练体系所含的各类项目，包括：
  - **本科生创新训练培育项目**（"培育项目"，校内孵化）；
  - **国家大学生创新训练计划项目**（"国创"）；
  - **上海市大学生创新训练计划项目**（"市创"）；
  - **校级大学生创新训练计划项目**（"校创"）。
- **国创、市创、校创项目均从培育项目中产生**，培育项目实行项目立项申报制。
- 原文：「本办法适用于本校大学生创新训练体系所含的各类项目，其中包括本科生创新训练培育项目（以下简称"培育项目"）、国家大学生创新训练计划项目（以下简称"国创"）、上海市大学生创新训练计划项目（以下简称"市创"）、校级大学生创新训练计划项目（以下简称"校创"）。」「国创、市创、校创项目均从培育项目中产生，培育项目实行项目立项申报制。」
- 来源：§第二条 / 第四条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"ctp", scope:"project_levels", levels:["培育","国创","市创","校创"], pipeline:"培育 → 国创/市创/校创" })

### D6-2 · 项目分类（3 类）
- 规则：除学校自定特色专项以外，项目主要分为以下三类：**创新训练项目、创业训练项目、创业实践项目**。
  - **创新训练项目**：本科生个人或团队在导师指导下，自主完成创新性研究项目设计、研究条件准备和项目实施、研究报告撰写和成果（学术）交流等工作；
  - **创业训练项目**：本科生团队在导师指导下，通过编制商业计划书、开展可行性研究、模拟企业运行、参加企业实践、撰写创业报告等工作；
  - **创业实践项目**：本科生团队在学校导师和企业导师共同指导下，提出具有市场前景的创新性产品或者服务，以此为基础开展创业实践活动。
- 原文：见 §第四条 (一)(二)(三)
- 来源：§第四条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"ctp", scope:"project_types", types:["innovation_training","entrepreneur_training","entrepreneur_practice"] })

### D6-3 · 申报条件（团队 + 导师）🎯🎯
- 规则：
  - **团队人数不超过 5 人**，**项目负责人仅限 1 人**。鼓励跨学科、跨专业、跨年级学生协同创新；
  - **每位学生同一学年原则上只能主持 1 个项目**；
  - **指导教师一般应具有博士学位或中级以上职称**，**允许聘请校外指导教师联合参与指导项目**；
  - **教师以第一指导教师身份指导项目，原则上每年不超过 2 项**。
- 原文：见 §第八条 (一)(二)
- 来源：§第八条
- 落地：track_requirement(kind=`program_rule`, threshold=5, metadata={ module:"ctp", scope:"application_constraints", team_max:5, leader_count:1, per_student_per_year_max_leadership:1, advisor_min_qualification:"phd_or_intermediate_plus", advisor_per_year_first_max:2, external_advisor_allowed:true })

### D6-4 · 项目研究时长 🎯🎯
- 规则：**项目研究时间原则上不超过 1 年**（**国创、市创项目研究时间最长不超过 2 年**），**完成时间不迟于学生毕业时间**。
- 原文：「项目研究时间原则上不超过1年（国创、市创项目研究时间最长不超过2年），完成时间不迟于学生毕业时间。」
- 来源：§第八条 (四)
- 落地：track_requirement(kind=`time_limit`, threshold=1, metadata={ module:"ctp", scope:"duration", default_max_years:1, national_shanghai_max_years:2, must_complete_before_graduation:true })

### D6-5 · 结项率挂钩名额 🎯🎯
- 规则：综合考虑各学部（院系）历年立项数、学生规模、学科特点、管理成效等因素，确定培育项目及国创、市创、校创名额分配方案：
  - **同批次项目结项率低于 85% 的，在下一年度减少名额分配指标**；
  - **同批次结项率低于 60% 的，在下一年度不给予分配名额指标**。
- 原文：「同批次项目结项率低于85%的，在下一年度减少名额分配指标；同批次结项率低于60%的，在下一年度不给予分配名额指标。」
- 来源：§第七条
- 落地：track_requirement(kind=`warning_threshold`, threshold=85, metadata={ module:"ctp", scope:"completion_rate_link_quota", reduce_threshold:85, zero_quota_threshold:60, applicable_to:"department_quota_next_year" })

### D6-6 · 答辩与优秀率 🎯🎯
- 规则：**学部（院系）自行组织专家对项目进行答辩评审**。**各院系可根据实际验收情况评定优秀项目**，**优秀率一般不超过结题项目数的 20%**。**未能按时提交结题材料或未达到结题验收标准的项目，责令限期整改或终止项目运行**。
- 原文：「学部（院系）自行组织专家对项目进行答辩评审。各院系可根据实际验收情况评定优秀项目，优秀率一般不超过结题项目数的20%。未能按时提交结题材料或未达到结题验收标准的项目，责令限期整改或终止项目运行。」
- 来源：§第十条
- 落地：track_requirement(kind=`gpa_threshold`, threshold=20, metadata={ module:"ctp", scope:"acceptance_excellence_cap", excellence_cap_pct:20, defense_by:"department_experts", late_or_substandard:"rectify_or_terminate" })

### D6-7 · 项目延期 🎯
- 规则：**因特殊原因未能按时结题的项目，需向学校提起书面申请，详细说明延期理由**。**项目延期结题不得超过计划执行周期 1 年**，**且应在项目负责人毕业前完成**。
- 原文：「因特殊原因未能按时结题的项目，需向学校提起书面申请，详细说明延期理由。项目延期结题不得超过计划执行周期1年，且应在项目负责人毕业前完成。」
- 来源：§第十一条
- 落地：track_requirement(kind=`time_limit`, threshold=1, metadata={ module:"ctp", scope:"extension_cap", extension_max_years:1, must_complete_before_leader_graduation:true, requires_written_application:true })

### D6-8 · 项目放弃后冷冻期 🎯
- 规则：**项目结题验收前，项目负责人一般不能作为负责人继续申报新项目**。**如学生自行放弃或者项目被学部（院系）终止，从放弃或者被终止之日起 1 年内，项目负责人一般不得作为负责人申请新项目**。
- 原文：「在项目结题验收前，项目负责人一般不能作为负责人继续申报新项目。如学生自行放弃或者项目被学部（院系）终止，从放弃或者被终止之日起1年内，项目负责人一般不得作为负责人申请新项目。」
- 来源：§第十三条
- 落地：track_requirement(kind=`time_limit`, threshold=1, metadata={ module:"ctp", scope:"reapply_cooldown", cooldown_years:1, anchor:"abandon_or_termination_date" })

### D6-9 · 经费上限 🎯
- 规则：经费上限：
  - **培育项目阶段资助经费不超过 1500 元/项**；
  - **国创项目资助经费不超过 10000 元/项**；
  - **市创项目资助经费不超过 7000 元/项**；
  - **校创项目资助经费不超过 5000 元/项**。
- 原文：「培育项目阶段资助经费不超过1500元／项。国创项目资助经费不超过10000元／项，市创项目资助经费不超过7000元／项，校创项目资助经费不超过5000元/项。」
- 来源：§第十六条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"ctp", scope:"funding_caps", currency:"CNY", caps:{ "培育":1500, "国创":10000, "市创":7000, "校创":5000 } })

### D6-10 · 结题后创新创业学分（cross-link C6-5）🎯
- 规则：**项目通过结题验收后，项目负责人及项目成员可根据学校有关规定获得相应创新创业学分**（参 [C6-5](ecnu_rules_digest_C.md#c6-5-项目级别认定标准-)）。
- 原文：「项目通过结题验收后，项目负责人及项目成员可根据学校有关规定获得相应创新创业学分。」
- 来源：§第二十二条
- 落地：prompt（cross-link 到 C6-5）

---

## 与阶段 4 `ecnu_process_rules.md` 的边界

以下条款留指引 + prompt，由阶段 4 收编精炼版：

- D1-1 新生入学注册（已在 A1-2）/ D2-4 应征参军保留学籍（已在 A1-9）/ D3-7 实习档案保存 / D4-15 毕业论文存档期限 / D6-10 CTP 结题学分（已在 C6-5）
