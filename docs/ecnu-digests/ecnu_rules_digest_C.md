# ECNU 规则 digest · 批 C · 特殊计划（v2 重写）

> 生成日期：2026-05-16
> 数据源：`docs/华师大规则文件pdf/华东师范大学2025年本科生手册.md` + `华东师范大学2025年本科生学习指南.md`（PDF codex 敏感词清洗版，**source of truth**）
> 旧版（基于 23 份旧 md）已归档：`docs/ecnu-digests/_archive/ecnu_rules_digest_C.md`
> 范围：9 段 —— 辅修 / 双学位 / 强基 / 个性化培养 / 转专业 / 创新创业学分 / 学科竞赛奖励 / 微专业 + 卓越学院 / 推免
> 4 字段：规则中文 / 原文片段 / 来源 / 落地（track_requirement 或 prompt）
> 标 🎯 = 关键阈值，结构化重点；标 ⚠️ = 待用户拍板 / 信息不全
> 落地行 kind 用 [track_kind_taxonomy.md](../track_kind_taxonomy.md) 的 12 档 canonical kind
> 6 项设计决策见 [ecnu_rules_digest_A.md](ecnu_rules_digest_A.md) 末尾「设计决策」段，本份沿用
>
> **跳过**：本科毕业论文 / 实习 / 创新训练 CTP 等放 D。
> **新增**：C9 推免段（旧 batch 跳过，新 PDF 收录完整办法，是本科毕业关键决策点）。

---

## C1 · 本科辅修专业修读管理办法（华师教〔2024〕14号，2024 年修订）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科辅修专业修读管理办法（2024年修订）（行 2350-2422）

### C1-1 · 适用范围 🎯
- 规则：本办法适用于 **2024 年及以后招生的辅修专业**，**2023 年以前的仍按原规定执行**。
- 原文：「本办法适用于 2024 年及以后招生的辅修专业，2023 年以前的仍按原规定执行。」
- 来源：§适用范围
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ scope:"minor_program_applicable", since_admission_year:2024, pre_2024:"old_rules" })

### C1-2 · 辅修专业总学分 🎯🎯
- 规则：辅修专业课程体系聚焦相同主修专业的专业必修课程，确有必要的可设置毕业论文（或毕业设计）要求。**总学分在 30-36 学分**。**培养方案规定课程至少安排在 4 学期完成**。
- 原文：「辅修专业课程体系聚焦相同主修专业的专业必修课程，确有必要的，可设置毕业论文(或毕业设计)要求,总学分在30-36学分。培养方案规定课程至少安排在4学期完成。」
- 来源：§第二条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"minor", credit_range:[30,36], min_semesters:4, optional_thesis:true })

### C1-3 · 修读资格 🎯
- 规则：申请修读辅修专业的学生需具备以下条件：
  - (一) 具有华东师范大学及有合作关系学校学籍的**全日制在校本科生**；
  - (二) **主修专业学习成绩优良，学有余力**；
  - (三) **辅修专业应与主修专业归属不同的专业类**；
  - (四) 辅修专业开设院系制定的其它条件。
- 原文：「(一)具有华东师范大学及有合作关系学校学籍的全日制在校本科生；(二)主修专业学习成绩优良，学有余力；（三）辅修专业应与主修专业归属不同的专业类；(四)辅修专业开设院系制定的其它条件。」
- 来源：§第三条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"minor", scope:"apply_conditions", required:["full_time_undergraduate","good_academic_standing","cross_major_class","department_specific"] })

### C1-4 · 报名时点与录取原则 🎯
- 规则：
  - 报名安排：**学生一般可在第 2 学期进行辅修专业报名**；
  - 录取原则：**本校优先、主修专业绩点优先、跨专业优先**。
- 原文：「（一）报名安排：学生一般可在第2学期进行辅修专业报名...( 二 ) 录取方式：报名截止后，我校在符合录取条件的学生名单中，按照本校优先、主修专业绩点优先、跨专业优先等原则录取。」
- 来源：§第四条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"minor", apply_semester:2, selection_priority:["home_school","main_gpa","cross_major"] })

### C1-5 · 学费规则
- 规则：辅修专业**学生每学期初根据院系开课计划学分总数自行缴纳学费**，收费标准参照相同主修专业，按 B6 段执行。**初次修读可试听两周，不满意者可退课**，两周后继续修读的需按期缴费，**逾期不缴的，教务处做退籍退课处理**。
- 原文：「获准修读辅修专业的学生，在每学期初根据院系制定开课计划的学分总数自行缴纳辅修专业学费...初次修读辅修专业课程的，可试听两周，不满意者可退课，两周后继续修读的需按期缴费，逾期不缴的，教务处做退籍退课处理。」
- 来源：§第六条
- 落地：track_requirement(kind=`tuition`, threshold=2, metadata={ module:"minor", trial_period_weeks:2, fee_rate_ref:"B6", late_consequence:"forced_withdrawal" })

### C1-6 · 补考与重修 🎯
- 规则：**辅修专业课程考核成绩在 40-59 分的学生可以参加补考**；因病、课程考试冲突等可以申请缓考。**补考不及格及缺考学生允许重修**，学生需按要求重新选课并缴费。
- 原文：「辅修专业课程考核成绩在 40-59 分的学生，可以参加补考。因病、课程考试冲突等可以申请缓考。补考不及格及缺考学生允许重修，学生需按要求重新选课并缴费。」
- 来源：§第八条
- 落地：track_requirement(kind=`assessment_rule`, threshold=null, metadata={ module:"minor", resit_score_range:[40,59], defer_reasons:["illness","schedule_conflict"], retake_allowed_after:["resit_fail","absent"] })

### C1-7 · 冲突处理（免听不免考 + 主修替代）🎯
- 规则：辅修修读期内，如遇辅修课程与主修课程**上课时间冲突**、师范学生外地教学实习等正常教学安排，经任课教师与开课院系同意，**每学期可申请最多 1 门辅修专业课程"免听不免考"**。**本校学生在主修专业修读的课程经开课院系认定，可以替代辅修专业同类课程**，两类情形均应缴纳辅修专业相应课程学费。境内外交流学生可于交流学期申请休学。
- 原文：「学生在学校规定的辅修专业修读期限内，如遇当学期应修的辅修专业课程与主修专业课程存在上课时间冲突...每学期可申请最多1门辅修专业课程"免听不免考"；本校学生在主修专业修读的课程，经开课院系认定，可以替代辅修专业同类课程...」
- 来源：§第九条
- 落地：track_requirement(kind=`program_rule`, threshold=1, metadata={ module:"minor", conflict_waiver_per_semester:1, main_to_minor_substitution:true, fee_still_charged:true })

### C1-8 · 最长修读年限 🎯
- 规则：原则上学生应**在主修专业修读期间完成辅修专业规定的全部课程**，**辅修专业最长学习年限至主修专业最长学习年限（含休学）止**（即主修 6 年内，参 A1-1）。
- 原文：「原则上，学生应在主修专业修读期间完成辅修专业规定的全部课程，辅修专业最长学习年限至主修专业最长学习年限（含休学）止。」
- 来源：§第十条
- 落地：track_requirement(kind=`time_limit`, threshold=6, metadata={ module:"minor", unit:"year", direction:"upper", scope:"minor_max_years", anchor:"main_program_max", cross_ref:"A1-1" })

### C1-9 · 学位授予条件 🎯🎯🎯
- 规则：**辅修专业毕业资格审查与主修专业毕业资格审查同时进行**。符合下列条件者可申请授予辅修学位：
  - (一) 具有华东师范大学学籍的本科生；
  - (二) **获得主修专业学士学位**；
  - (三) 在主修专业最长学习年限内**达到辅修专业毕业要求**。
- 原文：「辅修专业毕业资格审查与主修专业毕业资格审查同时进行，符合下列条件者可申请授予辅修学位。(一)具有华东师范大学学籍的本科生；(二)获得主修专业学士学位；（三）在主修专业最长学习年限内达到辅修专业毕业要求。」
- 来源：§第十一条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"minor", scope:"minor_degree_prereq", required:["ecnu_enrollment","main_degree_obtained","minor_grad_req_met_within_main_max"], simultaneous_audit:true })

### C1-10 · 证书发放（3 档场景）🎯🎯
- 规则：本校学生的证书规则：
  - **(一) 主修修读年限内同时达到主修和辅修要求** → 辅修学位**注明在主修学位证书中，不单独发放**；
  - **(二) 达到主修但未达辅修** → 可申请延长学习年限继续修辅修；最长年限内达到则注明在主修证书；若学生要求提前取得主修毕业证书和学位证书，辅修转为**发放辅修专业证书**（无学位）；
  - **(三) 达到辅修但未达主修** → 不提前发放辅修学位证书；若最长年限内达到主修要求，辅修学位注明在主修证书；若未达主修要求，辅修不单独发放学士学位证书，**转为辅修专业证书**。
- **外校学生**：达到辅修要求发**辅修专业证书**；未达提供成绩证明。
- 原文：见 §第十三条 + 第十四条
- 来源：§第十三条 / 第十四条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"minor", scope:"minor_cert_logic", scenarios:[{ case:"both_met", result:"degree_in_main_cert", standalone:false },{ case:"main_only_met_extended", result:"degree_in_main_cert_after_extend" },{ case:"main_met_minor_unmet_proceed", result:"minor_program_certificate" },{ case:"minor_met_main_unmet", result:"hold_then_certificate_or_minor_program" }], external_student:"minor_program_cert_or_transcript" })

---

## C2 · 双学士学位复合型人才培养项目管理办法（华师教〔2022〕125号）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学双学士学位复合型人才培养项目管理办法（行 2428-2474）+ 学习指南"08/ 双学士学位"（行 1135-1167）

### C2-1 · 学制与最长修读年限 🎯🎯
- 规则：**双学士学位项目的学制为 4 年**，**最长修读年限不超过 6 年（含休学）**。
- 原文：「双学士学位项目的学制为四年，最长修读年限不超过六年（含休学）。」
- 来源：§第三条
- 落地：track_requirement(kind=`time_limit`, threshold=6, metadata={ module:"double_degree", unit:"year", direction:"upper", standard:4, max_with_leave:6 })

### C2-2 · 培养方案总学分 🎯🎯
- 规则：双学士学位培养方案**原则上总学分保持在 180 学分左右**，应体现两个专业的核心培养要求，在课程、考核、实习实践等培养环节充分体现出**跨学科、复合型、创新性、高质量**。
- 原文：「双学士学位培养方案紧扣一流本科人才培养目标，原则上总学分保持在 180 学分左右，应体现两个专业的核心培养要求，在课程、考核、实习实践等培养环节充分体现出跨学科、复合型、创新性、高质量。」
- 来源：§第五条
- 落地：track_requirement(kind=`program_rule`, threshold=180, metadata={ module:"double_degree", scope:"total_credits", approx:180, requires_cross_discipline:true })

### C2-3 · 动态进出机制 🎯
- 规则：双学士学位项目通过**高考招收学生**，**实行动态进出机制**：
  - **退出**：可申请参加对口拔尖班遴选，也可申请转专业；如不能适应可向所在院系申请退出，未能达到要求可由院系劝退。**学生退出项目后转至招生专业普通班级**。**原则上退出工作在每学期或每学年末进行**；
  - **补入**：除高考招生外，**项目提供校内补选机会**，工作流程参照转专业工作。**同一招生专业的学生进入项目不占用学生转专业机会，不走系统申报通道**。
- 原文：「双学士学位项目通过高考招收学生，实行动态进出机制...（一）退出：双学士学位项目学生可以参加对口拔尖班的遴选...原则上退出工作在每学期或每学年末进行。（二）补入：除高考招生外，双学士学位项目提供校内补选机会...」
- 来源：§第六条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"double_degree", scope:"dynamic_in_out", entry:["gaokao","internal_supplement"], exit:["self_apply","department_dismissal","top_class_transfer","major_transfer"], exit_timing:"semester_or_year_end", internal_entry_no_transfer_quota:true })

### C2-4 · 日常管理归属 🎯
- 规则：**双学士学位项目学生的日常管理原则上归属招生专业**。
- 原文：「双学士学位项目学生的日常管理原则上归属招生专业。」
- 来源：§第七条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"double_degree", scope:"admin_attribution", default:"admission_major" })

### C2-5 · 退出后学分处理
- 规则：学生因转专业或其他原因退出双学士学位项目，**已修读课程的成绩和学分如实记载**，学分转换按学校学分转换相关规定执行。
- 原文：「学生因转专业或其他原因退出双学士学位项目，已修读课程的成绩和学分如实记载，学分转换按照学校学分转换相关规定执行。」
- 来源：§第八条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"double_degree", scope:"exit_credit_handling", preserve_grades:true, conversion_per_rules:true })

### C2-6 · 学位授予条件 🎯🎯
- 规则：达到双学士学位培养方案规定的**课程、学分和毕业要求**可授予毕业证书；**同时符合双方学士学位授予条件**的学生可申请授予**双学士学位**。**双学士学位只发放一本学位证书，所授两个学位在证书中予以注明**。
- 原文：「达到双学士学位培养方案规定的课程、学分和毕业要求，可授予毕业证书。同时，符合双方学士学位授予条件的学生，可申请授予双学士学位。」「双学士学位只发放一本学位证书，所授两个学位在证书中予以注明。」
- 来源：§第九条 / 第十条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"double_degree", scope:"degree_prereq", required:["plan_complete","both_degree_conditions_met"], cert:"single_cert_dual_notation" })

### C2-7 · 未达条件的回退路径 🎯
- 规则：**未达到双学士学位授予条件的学生**，可：
  - **根据学籍管理规定申请延期**；
  - 或**按照双学士学位中招生专业的普通班级培养方案进行毕业审核和学位审核**；如达到该方向的学士学位授予条件，**可申请授予相应的（单）学士学位**。
- 原文：「未达到双学士学位授予条件的学生，可以根据学籍管理规定申请延期或者按照双学士学位中招生专业的普通班级培养方案进行毕业审核和学位审核，如达到该方向的学士学位授予条件，可申请授予相应的学士学位。」
- 来源：§第十一条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"double_degree", scope:"fallback_options", options:[{ name:"延期", ref:"A2-3" },{ name:"回退单学位", basis:"admission_major_regular_class" }] })

### C2-8 · 学费按第一主修专业 🎯
- 规则：**双学士学位项目学生按照招生专业的收费标准缴纳学费**（参 B6-4）。
- 原文：「双学士学位项目学生按照招生专业的收费标准缴纳学费。」
- 来源：§第十二条
- 落地：prompt（cross-link 到 B6-4）

---

## C3 · 强基计划 ⚠️

> **⚠️ 新 PDF 中未收录独立的"强基计划学生培养管理办法"**。本段基于以下散见条款重写（手册 1608 / 2832 / 2938 + 指南 1063 / 1077），共 4 条核心规则。完整版 source 待用户后续补充。

来源文件章节：散见于 `华东师范大学2025年本科生手册.md` + `华东师范大学2025年本科生学习指南.md`

### C3-1 · 转专业例外 🎯
- 规则：强基计划学生属于"以特殊招生形式录取的"群体，**仅在规定允许的范围和条件下申请转专业**。
- 原文：「外语类保送生、定向生、艺体类学生、体育特长生、强基计划学生、公费师范生等，仅在规定允许的范围和条件下申请转专业。」
- 来源：手册 §转专业工作细则 第五条 (一)（行 1608）
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"strong_base", scope:"transfer_restriction", allowed:"within_designated_scope_only" })

### C3-2 · 阶段性考核 + 动态进出 🎯🎯
- 规则：强基计划通过**高考招生**，**实施阶段性考核和动态进出机制**：
  - **未通过考核的学生退出**；
  - **空出名额由综合素质优秀、认同强基计划培养理念的学生补入**。
  - **阶段性考核和进出办法由强基计划所在专业制定，报本科生院备案后实施**。
- 原文：「强基计划：通过高考招生，实施阶段性考核和动态进出机制，未通过考核的学生退出，空出名额由综合素质优秀、认同强基计划培养理念的学生补入。阶段性考核和进出办法由强基计划所在专业制定，报本科生院备案后实施。」
- 来源：指南 §第二部分 二、更多机会 / 07 卓越学院 / 四、如何加入卓越学院（行 1077）
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"strong_base", scope:"dynamic_in_out", entry:"gaokao", exit:"fail_phase_eval", replacement:"high_comprehensive_quality", rules_by_program:true })

### C3-3 · 本研衔接转段 🎯🎯
- 规则：强基计划学生**完成规定的本科阶段有关课程，达到转段要求后，可申请直接转段进入研究生培养阶段**。
- 原文：「学校支持拔尖学生继续深造，给予拔尖计划学生更高推免比例，在第3-4学年,学生可以提前选修研究生阶段课程，提早选定研究方向和联络导师。强基计划学生完成规定的本科阶段有关课程，达到转段要求后，可申请直接转段进入研究生培养阶段。」
- 来源：指南 §第二部分 二、更多机会 / 07 卓越学院 / 5. 本研贯通培养（行 1063）
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"strong_base", scope:"undergrad_to_grad_transition", gate:"phase_requirements_met", optional:"select_grad_courses_year_3_4" })

### C3-4 · 推免转段独立通道 🎯
- 规则：**转段进入本校研究生培养的强基计划学生，推免名额由教育部以专项形式下达**，在校推免工作领导小组、研究生招生工作领导小组领导下由**各强基计划转段工作小组制定转段工作细则并具体实施**。**推荐条件、转段考核及接收按教育部和学校有关规定执行**。
- 原文：「转段进入本校研究生培养的强基计划学生，推免名额由教育部以专项形式下达...」「强基计划学生的推荐条件、转段考核及接收，按照教育部和学校有关规定执行。」
- 来源：手册 §推免管理办法 第八条 / 第二十二条（行 2832 / 2938）
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"strong_base", scope:"reserved_grad_quota", quota_source:"MoE_dedicated", body:"strong_base_transition_team", rules_per:"MoE_and_school" })

---

## C4 · 个性化培养

> 新 PDF 中**没有独立的"个性化培养管理办法"**，仅在学习指南"06/如何申请制订个性化培养方案"和"二、更多机会 / 2.个性化培养"两段有制度叙述。本段共 3 条核心规则。

来源文件章节：`华东师范大学2025年本科生学习指南.md` §06/如何申请制订个性化培养方案（行 404-414）+ §二、更多机会 / 2.个性化培养（行 1049-1051）

### C4-1 · 申请条件
- 规则：**具备特殊专长或个性化培养需求**，且**现有专业培养方案或项目无法充分满足**学术兴趣、知识需求或发展目标（如需要夯实跨学科基础、构建特色知识体系等），**已经找到明确发展方向、具备自主规划能力**的学生可申请。
- 原文：「若你具备特殊专长或个性化培养需求，且现有专业培养方案或项目无法充分满足你的学术兴趣、知识需求或发展目标...学校乐于为已经找到明确发展方向、具备自主规划能力的你提供更多机会...」
- 来源：指南 §06
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"personalized", scope:"apply_conditions", required:["special_expertise_or_need","existing_plan_inadequate","clear_direction"] })

### C4-2 · 申请流程
- 规则：**学生根据自身情况提出申请 → 经院系考核审批 → 在老师指导下制订个性化培养方案**。具体申请时间和要求咨询所在院系教务老师。**各院系流程略有不同，以院系实施细则为准**。
- 原文：「具有特殊专长、培养需求的学生，可提出申请，经院系考核审批后，在老师的指导下制订个性化培养方案。」「（各院系流程略有不同，以院系实施细则为准）」
- 来源：指南 §06
- 落地：prompt（院系细则不同，无统一 track_requirement）

### C4-3 · 个性化选课学分（拔尖学生）🎯🎯
- 规则：学校为**拔尖学生**设置更具挑战性的培养方案，培养方案**充分留白**，**个性化选课学分一般不低于 24 学分**。鼓励"一生一案"，**学生可根据个人发展需要申请定制个性化培养方案**，**通过院系审核和学校备案后予以实施**。
- 原文：「学校为拔尖学生设置更具挑战性的培养方案...个性化选课学分一般不低于24学分。鼓励"一生一案",同学们可根据个人发展需要申请定制个性化培养方案，通过院系审核和学校备案后予以实施。」
- 来源：指南 §二、更多机会 / 2.个性化培养（行 1051）
- 落地：track_requirement(kind=`program_rule`, threshold=24, metadata={ module:"personalized", scope:"top_student_personal_credits", min_credits:24, applicable_to:"top_class_or_excellence" })

---

## C5 · 本科生转专业工作细则（华师本〔2025〕73号）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科生转专业工作细则（行 1584-1654）

### C5-1 · 三类转专业 🎯🎯
- 规则：转专业类型包括：
  - (一) **一般类型转专业**：**春季学期进行**，由本科生院组织学部院系集中开展。**学生通过综合考核，达到要求，方可转专业**；
  - (二) **学分修读类型转专业**：由列有转入计划的学部院系组织，**一般在秋季学期进行**。**学生应达到指定课程修读要求**，方可转专业；
  - (三) **卓越学院选拔转专业**：因卓越学院选拔调整专业的属于转专业。
- 原文：「转专业类型包括学校集中组织转专业（以下称一般类型转专业）、基于专业课程学分修读转专业（以下称学分修读类型转专业）和卓越学院选拔转专业。」
- 来源：§第四条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"major_transfer", scope:"transfer_types", types:[{ name:"general", semester:"spring", criterion:"comprehensive_eval" },{ name:"credit_based", semester:"fall", criterion:"designated_courses" },{ name:"excellence_selection", trigger:"excellence_college_select" }] })

### C5-2 · 不予办理情形 🎯🎯
- 规则：**除下列情形外，学生均可申请转专业**：
  - (一) 国家或学校招生规定对转专业有禁止性或限制性规定的，按相关规定执行。**外语类保送生、定向生、艺体类学生、体育特长生、强基计划学生、公费师范生等，仅在规定允许的范围和条件下申请转专业**；
  - (二) **自入学起已进入第四学年**；
  - (三) **已有过转学经历**。
- 原文：「除下列情形外，学生均可申请转专业：( 一 ) 国家或者学校招生规定对转专业有禁止性或限制性规定的...(二)自入学起已进入第四学年；(三)已有过转学经历；」
- 来源：§第五条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"major_transfer", scope:"blocked_states", blocked_groups:["foreign_lang_recommended","designated_admission","arts_sports","sports_specialty","strong_base","public_normal"], blocked_year:4, blocked_history:"already_transferred" })

### C5-3 · 大类内转专业自定
- 规则：**大类分流后，大类内转专业限制条件与工作细则由各学部院系自定**，并报本科生院备案。
- 原文：「大类分流后，大类内转专业限制条件与工作细则由各学部院系自定，并报本科生院备案。」
- 来源：§第六条
- 落地：prompt（院系自定）

### C5-4 · 转入计划数下限 🎯🎯
- 规则：学部院系向本科生院提交转入计划数（当年一般类型和学分修读类型总和）。**专业转入计划数一般不低于该专业当年招生人数的 15%**。**确因客观条件限制的可适当降低**。拟录取人数如超过计划数应及时备案。
- 原文：「学部院系向本科生院提交转入计划数，计划数为当年一般类型和学分修读类型总和...专业转入计划数一般不低于该专业当年招生人数的15%。确因客观条件限制的，可适当降低转入计划数。」
- 来源：§第七条
- 落地：track_requirement(kind=`program_rule`, threshold=15, metadata={ module:"major_transfer", scope:"transfer_quota_floor", min_pct_of_annual_admission:15, downward_adjustable:true })

### C5-5 · 学分修读类型最少课程数 🎯
- 规则：组织学分修读类型转专业，学部院系应提前公布转入条件，**指定不少于 2 门专业课程**，明确课程修读要求。学部院系将考核结果登录教务系统。
- 原文：「组织学分修读类型转专业，学部院系应提前公布转入条件，指定不少于 2 门专业课程，明确课程修读要求。」
- 来源：§第八条 (三)
- 落地：track_requirement(kind=`program_rule`, threshold=2, metadata={ module:"major_transfer", scope:"credit_based_min_courses", min_courses:2, type:"major_courses" })

### C5-6 · 录取流程
- 规则：流程：发布通知（本科生院发转专业通知和专业计划数）→ 报名申请 → 组织考核（**师范专业应设置教师教育能力考核**；**考核过程可查询可追溯，考核结果有书面记录并录入教务系统**）→ 录取公示（学部院系提交拟录取名单 → 本科生院复核公示，**异议核查依规处理**）→ 专业转入（**录取学生于下一学期进入转入专业就读**，按转入专业相应规定管理；未录取学生仍在原专业就读）。
- 原文：「（一）发布通知。本科生院发布转专业通知和专业计划数。（二)报名申请...（三）组织考核...（四）录取公示...( 五 ) 专业转入。转专业录取学生于下一学期进入转入专业就读」
- 来源：§第八条
- 落地：prompt（流程类）

### C5-7 · 卓越学院转专业不受计划数限制 🎯
- 规则：涉及卓越学院转专业，根据卓越学院相关管理规定开展，**不受专业计划数限制**。
- 原文：「涉及卓越学院转专业，根据卓越学院相关管理规定开展，不受专业计划数限制。」
- 来源：§第九条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"major_transfer", scope:"excellence_college_exemption", quota_limit_waived:true })

### C5-8 · 公费师范生转专业按教育部
- 规则：涉及公费师范生转专业，根据《教育部直属师范大学本研衔接师范生公费教育实施办法》施行，**报生源所在省份省级教育行政部门审批**。
- 原文：「涉及公费师范生转专业，根据《教育部直属师范大学本研衔接师范生公费教育实施办法》施行，报生源所在省份省级教育行政部门审批。」
- 来源：§第十条
- 落地：prompt（特殊审批渠道）

### C5-9 · 参军退伍 + 创业休学不受计划数限制 🎯🎯
- 规则：**参军退伍学生**和**认定为创业休学学生**申请转专业**不受专业计划数限制**，应符合国家相关规定和招生考试相关规定。**学生复学时向本科生院提出申请，由转入单位组织考核**，考核通过后学生转入该专业。
- 原文：「参军退伍学生和认定为创业休学学生申请转专业不受专业计划数限制，应符合国家相关规定和招生考试相关规定。学生复学时向本科生院提出申请，由转入单位组织考核，考核通过后，学生转入该专业。」
- 来源：§第十一条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"major_transfer", scope:"quota_exempt_groups", exempt_groups:["veteran","entrepreneur_leave"], apply_at:"return_from_leave" })

### C5-10 · 双学位退出 ≠ 转专业
- 规则：**双学士学位项目学生退出至录取专业**，由该专业所在单位审核，**不归入转专业**。
- 原文：「双学士学位项目学生退出至录取专业，由该专业所在单位审核，不归入转专业。」
- 来源：§第十二条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"major_transfer", scope:"double_degree_exit_excluded", not_counted_as_transfer:true })

### C5-11 · 转入年级 + 学费
- 规则：
  - **学生转入年级由转入院系根据学生学业情况确定**，按转入年级专业培养方案修读。**提前完成培养方案的可申请提前毕业**（参 A2-2）；
  - **转专业学生应按照转入专业的学费标准缴纳学费**，**在毕业学期进行学费结算**（参 B6-4）。
- 原文：「学生转入年级由转入院系根据学生学业情况确定，按转入年级专业培养方案修读。提前完成培养方案的，可申请提前毕业。」「转专业学生应按照转入专业的学费标准缴纳学费，在毕业学期进行学费结算。」
- 来源：§第十四条 / 第十五条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"major_transfer", scope:"post_transfer_rules", grade_by_dept_judgment:true, plan_by_target_year:true, fee_ref:"B6-4", early_graduation_allowed:true })

---

## C6 · 本科生创新创业学分认定管理办法（华师教〔2022〕146号）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科生创新创业学分认定管理办法（行 2576-2658）

### C6-1 · 适用范围 🎯
- 规则：本办法**自 2021 级本科生开始执行**，**同时也适用于 2020 级菁英班和强基班学生**。
- 原文：「本办法自 2021 级本科生开始执行，同时也适用于 2020 级菁英班和强基班学生，具体条款由教务处负责解释。」
- 来源：§第十四条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"innovation", scope:"applicable", since_cohort:2021, also_applicable:["2020_top_class","2020_strong_base"] })

### C6-2 · 学分获得途径
- 规则：创新创业学分获得途径包括：
  - 参加大学生创新创业训练计划项目；
  - 竞赛获奖；
  - 公开发表学术论文；
  - 获得专利授权；
  - 公开出版著作；
  - 自主创业或深入参与企业经营活动。
- 原文：「创新创业学分的获得可以通过多种途径，包括：参加大学生创新创业训练计划项目、竞赛获奖、公开发表学术论文、获得专利授权、公开出版著作，自主创业或者深入参与企业经营活动。」
- 来源：§第二条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"innovation", scope:"credit_sources", channels:["training_project","competition_award","paper","patent","book","entrepreneurship"] })

### C6-3 · 冲抵规则 🎯🎯🎯
- 规则：创新创业学分**不等同于培养方案中的课程学分**，**仅可用于冲抵培养方案中"劳动与创造"模块的必修学分**，**最高不超过 2 学分**。
- 原文：「创新创业学分作为学生参与创新创业训练和实践活动的价值参照，不等同于培养方案中的课程学分，仅可用于冲抵培养方案中的"劳动与创造"模块的必修学分，最高不超过2学分。」
- 来源：§第三条
- 落地：track_requirement(kind=`program_rule`, threshold=2, metadata={ module:"innovation", scope:"credit_substitution", max_credits:2, target_module:"劳动与创造", not_equivalent_to_course_credit:true })

### C6-4 · 累加规则 + 成绩记录 🎯🎯
- 规则：**不同类别的创新创业学分可累加**。**创新创业学分累计超过 8 学分者，成绩记录为"A"**，**其他记录为"P"**。**创新创业学分仅能抵充一次，抵充后成绩不得更改**。
- 原文：「不同类别的创新创业学分可进行累加，创新创业学分累计超过8学分者，成绩记录为"A"，其他记录为"P"。创新创业学分仅能抵充一次，抵充后成绩不得更改。」
- 来源：§第四条
- 落地：track_requirement(kind=`score_scheme`, threshold=8, metadata={ module:"innovation", scope:"credit_aggregation", A_threshold:8, P_default:true, single_use:true, immutable_after_substitution:true })

### C6-5 · 项目级别认定标准 🎯🎯
- 规则：学生参加**大学生创新创业训练计划项目并通过结题验收**，按以下标准认定创新创业学分：

| 项目级别 | 项目负责人 | 项目主要成员 |
|---|---|---|
| 国家大学生创新创业训练计划项目 | 3 | 1.5 |
| 上海市大学生创新创业训练计划项目 | 2 | 1 |
| 校级大学生创新创业训练计划项目 | 1 | 0.5 |

- **项目主要成员仅认定第二至五名（包含第五名）的本科生**。
- 原文：见手册 §第五条 + table
- 来源：§第五条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"innovation", scope:"project_credit_table", table:{ national:{ leader:3, member:1.5 }, shanghai:{ leader:2, member:1 }, school:{ leader:1, member:0.5 } }, member_range:"2_to_5_undergrad_only", precondition:"completion_verified" })

### C6-6 · 竞赛获奖分值 🎯🎯
- 规则：学生在**省部级及以上级别**的学科类和创新创业类竞赛获奖，按以下标准认定创新创业学分（**分三档**：顶级三赛事 / A 类竞赛 / B 类竞赛）：

| 竞赛等级 | 获奖等级 | 国际级/国家级 | 省部级 |
|---|---|---|---|
| 顶级三赛事¹ | 第一等次 | 8 | 4 |
|  | 第二等次 | 6 | 3 |
|  | 第三等次 | 4 | 2 |
|  | 第四等次 | 2 | 1 |
| A 类竞赛 | 第一等次 | 6 | 3 |
|  | 第二等次 | 5 | 2.5 |
|  | 第三等次 | 4 | 2 |
|  | 第四等次 | 3 | 1.5 |
| B 类竞赛 | 第一等次 | 5 | 2.5 |
|  | 第二等次 | 4 | 2 |
|  | 第三等次 | 3 | 1.5 |
|  | 第四等次 | 2 | 1 |

¹ 顶级三赛事 = 中国"互联网+"全国大学生创新创业竞赛、挑战杯全国大学生课外学术科技作品竞赛、挑战杯中国大学生创业计划竞赛。

- 附加规则：
  - **(1) 团队赛**：团队负责人（队长）获得相应等级学分，**其他团队主要成员（前五、研究生计入）赋分 0.5 系数记录分值**；
  - **(2) 特等奖**：设有特等奖的赛事，**特等奖视同为第一等次，与其对应的下一档奖项依次递减**。**第四等次仅指比赛奖项设置有特等奖的赛事**。**鼓励奖、参与奖等不予认定**；
  - **(3) 同作品多赛取最高**：学生以同一作品参加同一竞赛不同级别赛事（或同一竞赛同一级别赛事获多个奖项），**按获得最高分值的获奖结果认定**；
  - **(4) 清单参考**：竞赛类别清单参考《华东师范大学本科生学科竞赛清单》，**根据获奖当年的清单予以认定**。
- 原文：见手册 §第六条 + table + (1)-(4)
- 来源：§第六条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"innovation", scope:"competition_credit_table", source:"§第六条", tiers:["top_3_events","A_class","B_class"], award_levels:["1st","2nd","3rd","4th"], scope_levels:["intl_national","provincial"], team_leader_full:true, team_member_coef:0.5, member_cap:"top_5_incl_grad", top_award_eq_1st:true, only_award_excluded:true, multi_award_take_max:true, list_year_specific:true })

### C6-7 · 论文/专利/著作分值 🎯🎯🎯
- 规则：学生以**华东师范大学为第一完成单位**公开发表学术论文、获得知识产权或公开出版著作，按以下标准认定学分。**第二-四作者分值**用 `a/b/c` 表示第二/三/四作者：

| 成果类别 | 期刊级别 | 第一作者分值 | 第二-四作者分值 |
|---|---|---|---|
| 公开发表学术论文 | 中科院一区、CCF-A 类 | 8 | 6/5/4 |
|  | 中科院二区、SSCI、CCF-B 类、A&HCI | 6 | 5/4/3 |
|  | 中科院三区、CSSCI、CSCD、北大核心、CCF-C 类、EI | 5 | 4/3/2 |
|  | 重要国际学术会议 | 4 | 3/2/1 |
| 知识产权 | 发明专利 | 8 | 6/5/4 |
|  | 实用新型专利 | 4 | 3/2/1 |
|  | 软件著作权 | 2 | 1/0.5/0 |
|  | 外观设计专利 | 2 | 1/0.5/0 |
| 公开出版著作 | 专著 | 6 | 5/4/0 |
|  | 译著 | 4 | 3/2/0 |
|  | 教材 | 4 | 3/2/0 |

- 附加规则：
  - **(1) 导师为第一作者，学生为第二作者时，视学生为第一作者**，其后排名顺次前移。**共同第一作者根据共同作者的数量平均分配分值**。**第四作者以后不计学分**；
  - **(2) 论文佐证**：包括论文封面、目录、正文、封底；国际学术会议证明材料包括会议邀请函、论文录用通知的电子档。**国际学术会议需为所在院系认可的重要学术会议**，参考《华东师范大学国际学术会议分级目录》；
  - **(3) 专利佐证**：发明、实用新型、外观设计专利的证明材料为专利授权证书；软件著作权为软件著作权登记证书；
  - **(4) 著作佐证**：公开出版的著作以收到正式出版物为准，证明材料包括著作封面、目录、版权页。
- 原文：见手册 §第七条 + table + (1)-(4)
- 来源：§第七条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"innovation", scope:"publication_ip_credit_table", source:"§第七条", first_unit_required:"ECNU", advisor_first_student_second_treated_as_first:true, joint_first_split_avg:true, cap_author_rank:4, table_categories:["paper","ip","book"], evidence_required:true })

### C6-8 · 自主创业分值
- 规则：学生**自主创业或深度参与企业经营活动**，按以下标准认定学分：

| 项目内容 | 分值 |
|---|---|
| 所持项目获得**上海市大学生科技创业基金资助**或者获得**风险投资超过 50 万元人民币（或等值外币）** | 4 |
| 以股东身份**深入参与企业运营，企业年度营业额不低于 300 万、所持股份不低于 20%**（可技术入股） | 2 |

- 佐证材料：工商部门注册经营许可证、融资报告、股东出资的证明文件、能证明经营活动的银行流水记录等。
- 原文：见手册 §第八条 + table
- 来源：§第八条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"innovation", scope:"entrepreneur_credit", tiers:[{ name:"shanghai_fund_or_VC_50w", points:4 },{ name:"shareholder_300w_revenue_20pct_share", points:2 }] })

### C6-9 · 录入认定流程
- 规则：**创新创业学分依据本科生创新创业训练与实践信息化管理系统内的成果记录直接转化**。
  - **大学生创新创业训练计划项目和学科竞赛成绩**由相关负责单位指定联系人定期录入系统，**教务处审核通过后生效**；
  - **其他项目**由学生个人在系统内填报并提交佐证材料；证书原件及复印件需交至院系指定负责人处查验，成果经学生所在院系和学校审核后生效。
  - 各学部（院系）需**指定专人**做好学分核验与"劳动与创造"学分转化工作，**学分转化情况需予以公示**，公示无误经教学院长审核后上报教务处。
- 原文：见手册 §第九条—第十一条
- 来源：§第三章
- 落地：prompt（流程类）

### C6-10 · 弄虚作假处理
- 规则：在审核过程中，**学生应主动配合提供齐备的证明材料**，材料不满足要求的不予记录和认定。**对弄虚作假者，取消其已获得的学分**；**对有学术不端行为者，按学校相关学术诚信管理办法予以处理**。
- 原文：「（二）对弄虚作假者，取消其已获得的学分；对有学术不端行为者，按学校相关学术诚信管理办法予以处理。」
- 来源：§第十二条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"innovation", scope:"fraud_consequence", on_fraud:"revoke_all_credits", on_academic_misconduct:"per_integrity_rules" })

---

## C7 · 本科生学科竞赛与创新成果奖励办法（华师教〔2022〕67号）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学本科生学科竞赛与创新成果奖励办法（行 2750-2789）

> 注意：C7 是**奖金**奖励（学校发钱），C6 是**学分**认定（冲抵培养方案学分），两者并行不冲突。

### C7-1 · 奖励范围 🎯
- 规则：奖励范围为**全日制本科生在读期间**在学校公布的 **A 类学科竞赛**中获得**省部级以上奖项**、**发表高水平学术论文**或**获得发明专利授权**。
- 原文：「本办法奖励范围为我校全日制本科生在读期间在学校公布的A类学科竞赛中获得省部级以上奖项、发表高水平学术论文或获得发明专利授权。」
- 来源：§第一条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"award", scope:"award_eligibility", categories:["A_class_competition_provincial_plus","high_level_paper","invention_patent"] })

### C7-2 · A 类学科竞赛奖励金额 🎯🎯
- 规则：A 类学科竞赛奖励金额（单位：元/项）：

| 等级 | 获奖等第 | 奖励金额 |
|---|---|---|
| 国际级 | 特等奖 | 10000 |
|  | 一等奖 | 8000 |
|  | 二等奖 | 5000 |
|  | 三等奖 | 2500 |
| 国家级 | 特等奖 | 8000 |
|  | 一等奖 | 5000 |
|  | 二等奖 | 2500 |
|  | 三等奖 | 1200 |
| 省部级 | 特等奖 | 2500 |
|  | 一等奖 | 1200 |
|  | 二等奖 | 600 |
|  | 三等奖 | 300 |

- 附加规则：
  - **竞赛获奖单位需为华东师范大学**；
  - **一次参赛多次评奖的竞赛项目**，或**同一参赛作品在同一比赛不同级别赛事中获奖**，参赛学生均**按奖励金额最高的成绩进行一次性奖励**；
  - **学校针对部分重要竞赛有相应议决的，奖励标准以议决为准**；
  - **获奖等第不同于以上表述的，根据具体赛事特点及获奖等次换算为上述标准参照执行**。
- 原文：见手册 §第二条 + table
- 来源：§第二条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"award", scope:"competition_cash_award", source:"§第二条", currency:"CNY", scope_levels:["intl","national","provincial"], award_levels:["special","1st","2nd","3rd"], take_max:true, unit_must_be_ECNU:true, special_decree_override:true })

### C7-3 · 学术论文奖励 🎯
- 规则：**学术论文必须以华东师范大学为第一署名单位，且为我校本科生作为第一作者或通讯作者公开发表的学术论文**，奖励标准（以**最高检索级别**为准）：

| 论文级别 | 奖励金额 |
|---|---|
| 中科院一区、CCF-A | 5000 |
| 中科院二区、CCF-B、EI、SSCI | 2000 |
| 中科院三区、CCF-C、CSSCI | 1000 |
| 中文核心期刊、国际学术会议 | 500 |

- 中文核心期刊以**北京大学图书馆出版的《全国中文核心期刊要目总览》（每四年更新一次）**为准。其他级别论文根据论文级别酌情奖励。
- 原文：见手册 §第三条 + table
- 来源：§第三条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"award", scope:"paper_cash_award", source:"§第三条", currency:"CNY", first_unit_required:"ECNU", role_required:["first_author","corresponding_author"], take_highest_index:true, reference:"北大全国中文核心期刊要目总览_4_year_update" })

### C7-4 · 专利奖励 🎯
- 规则：本科生**以第一发明人获得发明专利**（**不包括外观专利、实用新型专利**）授权的，且**专利权人为华东师范大学**的，奖励 **2000 元**。
- 原文：「本科生以第一发明人获得发明专利（不包括外观专利、实用新型专利）授权的，且专利权人为华东师范大学的，奖励2000元。」
- 来源：§第四条
- 落地：track_requirement(kind=`program_rule`, threshold=2000, metadata={ module:"award", scope:"patent_cash_award", currency:"CNY", amount:2000, scope:"invention_only", excluded:["appearance","utility_model"], role:"first_inventor", owner_must_be:"ECNU" })

### C7-5 · 奖励发放
- 规则：**奖励按年度统计并拨付**，统计时间为**自然年**，教务处于**次年统一拨付**至获奖学生。
- 原文：「奖励按年度统计并拨付，统计时间为自然年，教务处于次年统一拨付至获奖学生。」
- 来源：§第五条
- 落地：prompt（发放时点）

---

## C8 · 微专业人才培养项目 + 卓越学院

> 新 PDF 中**没有独立的"微专业管理办法"**和"卓越学院管理办法"，仅在学习指南 §二、更多机会有制度叙述。本段共 5 条核心规则。

来源文件章节：`华东师范大学2025年本科生学习指南.md` §二、更多机会 / 09 微专业人才培养项目（行 1169-1171）+ §二、更多机会 / 07 卓越学院（行 1065-1083）

### C8-1 · 微专业学分范围 🎯🎯
- 规则：微专业**一般包含 5～8 门课程，总学分在 10～16 学分左右**。学校面向**校内外学生、社会公众**开放微专业招生。**自 2022 年起启动**。
- 原文：「学校从2022年起启动了微专业人才培养项目，以满足复合型人才培养以及学生的个性化发展和多样化需求。微专业一般包含5～8门课程，总学分在10～16学分左右。为开放优质教学资源，学校面向校内外学生、社会公众开放微专业招生...」
- 来源：指南 §09 微专业人才培养项目
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"micro_program", scope:"credit_range", credit_range:[10,16], course_range:[5,8], since_year:2022, open_to:["ecnu_student","external_student","public"] })

### C8-2 · 微专业方向（2025 年）⚠️
- 规则：**2025 年新增**："AI+ 金融"、"AI+ 磁共振"、"AI+ 商学"、"AI+ 药学" 等 **4 个"AI+X"微专业**；新增"数学优师教育"、"数学资优教育"、"智能算法与大数据分析"、"软件工程关键技术与人工智能基础" **等 14 个聚焦关键需求微专业**。⚠️ 具体清单每年更新，以本科生院年度发布为准。
- 原文：「2025年新增"AI+金融""AI+ 磁共振""AI+ 商学""AI+ 药学"等 4 个"AI+X"微专业，新增"数学优师教育""数学资优教育""智能算法与大数据分析""软件工程关键技术与人工智能基础"等14个聚焦关键需求微专业...」
- 来源：指南 §09
- 落地：prompt（清单按年变动，结构化无意义）

### C8-3 · 卓越学院结构 🎯
- 规则：卓越学院下辖：
  - **拔尖计划 2.0**（教育部基础学科拔尖学生培养计划基地）；
  - **5 个校级卓越人才培养改革实验班**：孟宪承班（孟宪承书院）/ 拔尖外语人才"双语双科"实验班（外语学院）/ 陈彪如班（经管学院）/ 博望班（国际汉语文化学院）/ 体育与健康卓越人才实验班（体育与健康学院）；
  - **强基计划**（通过高考招生，参 C3 段）。
- 原文：见指南 §三、校级卓越人才培养改革实验班 + table
- 来源：指南 §三 / §四
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"excellence_college", scope:"structure", components:["top_class_2.0","5_pilot_classes","strong_base"], pilot_classes:["孟宪承","拔尖外语双语双科","陈彪如","博望","体健卓越"] })

### C8-4 · 卓越学院加入方式 🎯
- 规则：动态进出机制：
  - **拔尖计划 2.0、校级卓越人才培养改革实验班**：**校内二次选拔招生**，依据各学科特点实行**滚动选拔、动态进出**，由院系制定选拔、考核标准和程序并公开。**曾完成中学生英才计划各项学习任务并获结业证书的学生可优先进入拔尖计划 2.0**；
  - **强基计划**：**通过高考招生**（详见 C3 段）。
- 原文：见指南 §四、如何加入卓越学院
- 来源：指南 §四
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"excellence_college", scope:"entry_mechanism", top_class_method:"internal_secondary_selection", strong_base_method:"gaokao_only", rolling_selection:true, priority_for_high_school_top_program:true })

### C8-5 · 拔尖学生特殊待遇 🎯
- 规则：拔尖学生享受：
  - **大师引领**：邀请院士、长江学者、教学名师、杰青、优青等人才计划获得者担任导师或任课教师；允许跨学科选择导师或申请**双导师**；
  - **个性化培养**：小班化教学、过程性评价、全英文教学、项目式学习；**个性化选课学分一般不低于 24 学分**（参 C4-3）；
  - **进阶式学术训练**：大一到大四的进阶式学术训练计划；
  - **本研贯通培养**：更高推免比例；第 3-4 学年可提前选修研究生课程；**强基计划学生达到转段要求后可申请直接转段进入研究生培养阶段**（参 C3-3）。
- 原文：见指南 §二、更多机会（行 1045-1063）
- 来源：指南 §二、更多机会 / 1-5
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"excellence_college", scope:"top_student_benefits", benefits:["dual_advisor_allowed","small_class","english_teaching","personal_credit_min_24","tiered_research_training","higher_recommendation_rate","grad_course_year_3_4","strong_base_direct_transition"] })

---

## C9 · 推荐优秀应届本科毕业生免试攻读研究生工作管理办法（华师教〔2023〕127号，2023 年修订）

来源文件章节：`华东师范大学2025年本科生手册.md` §华东师范大学推荐优秀应届本科毕业生免试攻读研究生工作管理办法（行 2794-2944）+ 指南 §二、更多机会 / 10 免试直升研究生（行 1173-1204）

> 旧 batch 跳过此办法，但新 PDF 是 source of truth + 推免是本科生毕业出口关键决策点（GPA ≥ 2.8 / 学业 70-80% + 素质加分 / 名额分配等），AI 顾问必须能回答。

### C9-1 · 推免基本资格 🎯🎯🎯
- 规则：所有推免生应满足以下条件：
  - (一) **纳入国家普通本科招生计划录取**，**未曾计入历年应毕业本科生范围、未曾参与过推免环节的应届毕业生**；**不属于留学生、第二学士学位学生、公费师范生、优师专项计划等序列录取的学生**；若属于定向生，须在推免工作开始前提供允许就读研究生的公函；
  - (二) 符合相关领导要求，**品行表现优良、遵纪守法、积极向上、身心健康、综合素质好**；
  - (三) **学习成绩良好，平均绩点（GPA）不低于 2.8**。**高水平运动员和高级别体育赛事世界冠军可适当降低，由校推免工作领导小组审定后执行**；
  - (四) 具有学术研究的兴趣，有较强的学习能力和创新意识，具备作为研究生培养的潜质；
  - (五) **本科毕业后不直接参加工作或赴境外留学**。
- **思想品德考核不合格者不得推荐和录取**。**受过纪律处分的学生，在推免工作开始前处分已解除的可申请；尚未解除处分的不纳入推免范围**。
- 原文：见手册 §第九条
- 来源：§第九条
- 落地：track_requirement(kind=`gpa_threshold`, threshold=2.8, metadata={ scope:"recommendation_eligibility", required:["national_plan_admission","first_time_applicant","not_special_group"], excluded_groups:["international","second_bachelor","public_normal","priority_teacher"], gpa_min:2.8, athlete_exemption:true, after_grad_constraint:"no_work_no_overseas", discipline:"clear_required" })

### C9-2 · 名额分配考虑因素
- 规则：各单位的推免名额，**综合考虑以下因素**进行分配：
  - (一) **应届本科毕业生的规模**（不含留学生、第二学士学位学生、公费师范生、优师专项计划等序列录取的学生）；
  - (二) **入选基础学科拔尖学生培养计划 2.0 基地等具有彰显度的本科教育改革项目**；
  - (三) **上一年度推免指标完成情况**；
  - (四) **上一届毕业生境内考研录取率和境外升学率**；
  - (五) **服务国家发展战略和重大需求、对学校人才培养和其他学科发展的支撑情况**。
- 原文：见手册 §第六条
- 来源：§第六条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"recommendation", scope:"quota_allocation", factors:["graduate_scale","top_program_2.0_recognition","previous_year_completion","previous_year_grad_rates","strategic_support"] })

### C9-3 · 综合成绩公式 🎯🎯
- 规则：综合成绩由 **学业成绩 + 素质加分 - 扣分** 共同确定：
  - **学业成绩**由各单位按课程的原始绩点或成绩计算，**折算为百分制学业成绩**，原则上按 **70%（艺体类专业）/80%（其他专业）**权重计入综合成绩；
  - **素质加分**：科研成果 / 学科竞赛 / 创新创业 / 志愿服务 / 国际组织实习 / 参军入伍 / 艺术素养等；**艺体类专业上限 30 分、其他专业上限 20 分**；
  - **扣分**：各单位根据学生所受处分情形、级别及在学期间表现制定扣分规则，**扣分不得低于 5 分**。
- 原文：见手册 §第十条 (二)(三)4
- 来源：§第十条
- 落地：track_requirement(kind=`gpa_threshold`, threshold=null, metadata={ module:"recommendation", scope:"composite_score_formula", academic_weight:{ arts_sports:0.70, others:0.80 }, quality_bonus_cap:{ arts_sports:30, others:20 }, penalty_min:5 })

### C9-4 · 素质加分项上限（7 类）🎯🎯
- 规则：素质加分各单项指标上限：

| 加分项 | 上限分值 | 范围 |
|---|---|---|
| 科研成果 | ≤10 | 本科阶段核心期刊独立/第一作者论文，代表作评价 |
| 学科竞赛获奖 | ≤10 | 国内权威竞赛（全国赛）或相当级别国际赛事，第三等级以上 |
| 创新创业 | ≤6 | 校级以上大学生创新创业训练项目（结题）/重要双创竞赛 |
| 其他学术成果 | ≤5 | 公开出版的学术性著作 / 译著 / 已授权发明专利、软件著作权 |
| 志愿服务 | ≤1 | 校级以上项目且在一线岗位表现突出 |
| 国际组织实习 | ≤3 | 主要政府间国际组织、≥3 个月、备案 |
| 艺术素养 | ≤2 | 学校艺术团训练 + 大型活动或比赛突出贡献，不超过 4 人 |

- 附加规则：
  - **同一项目符合不同类别加分情况的，原则上就高计一次**；
  - **学生与直系亲属合作的素质项目不纳入加分**，同等条件下可优先考虑；
  - **就高计一次**适用于多个可获加分情形。
- 原文：见手册 §第十条 (三)1
- 来源：§第十条 (三)
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"recommendation", scope:"quality_bonus_caps", caps:{ research:10, competition:10, innovation:6, other_academic:5, volunteer:1, intl_org:3, art:2 }, take_max_once:true, family_collab_excluded:true })

### C9-5 · 特殊审核（科研成果 / 竞赛 / 著作 / 专利 / 创新创业）🎯
- 规则：**各单位应组成不少于 5 人且具有相关学科副教授以上职称的专家审核小组**，对科研成果、学科竞赛获奖、创新创业、著作译著、发明专利等学术科研创新类素质加分项目进行**审核鉴定**，排除抄袭、造假、冒名、有名无实等情况，**并组织一定范围的公开答辩**。
- **对学生提交的多篇科研成果实行代表作评价**，重点聚焦创新质量和个人贡献。
- **对于基于同一项目符合不同类别加分情况的，应加强对成果之间重复度、创新性的考察，原则上就高计一次**。
- **对于社会质疑较多的赛事、刊物，各单位应从严审核**。
- 专家审核小组及每位成员都要给出明确的审核鉴定意见并签字存档，**答辩全程录音录像，答辩结果公开公示**。
- 原文：见手册 §第十一条
- 来源：§第十一条
- 落地：track_requirement(kind=`assessment_rule`, threshold=5, metadata={ module:"recommendation", scope:"special_review", panel_min:5, panel_qualification:"associate_prof_plus", public_defense:true, representative_eval:true, record_audio_video:true })

### C9-6 · 强基计划专项通道（与 C3-4 cross-link）🎯
- 规则：**转段进入本校研究生培养的强基计划学生，推免名额由教育部以专项形式下达**，在校推免工作领导小组、研究生招生工作领导小组领导下由**各强基计划转段工作小组制定转段工作细则并具体实施**（与 [C3-4](#c3-4-推免转段独立通道-) 一致）。
- 原文：「转段进入本校研究生培养的强基计划学生，推免名额由教育部以专项形式下达...」
- 来源：§第八条
- 落地：prompt（cross-link 到 C3-4）

### C9-7 · 双学士学位项目推免 🎯
- 规则：**双学士学位复合型人才培养项目的推免工作细则由联合培养院系共同制定，由招生专业院系牵头组织与实施综合排名，联合培养院系参与实施综合排名**。
- 原文：「双学士学位复合型人才培养项目的推免工作细则由联合培养院系共同制定，由招生专业院系牵头组织与实施综合排名，联合培养院系参与实施综合排名。」
- 来源：§第十条 (五)
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"recommendation", scope:"double_degree_special", led_by:"admission_major_dept", co_audit_by:"partner_dept" })

### C9-8 · 取消推免资格情形 🎯🎯
- 规则：已经获得推免资格的学生，**如有下列情况之一者学校将取消其推免资格**：
  - (一) **被确定推免后，受刑事或违纪处分者**；
  - (二) **不能如期毕业，或不能获得学士学位者**；
  - (三) **提交的信息不真实、不准确，存在舞弊情形的**；
  - (四) **未按规定报备声明回避关系且影响到推免过程和结果公平公正的**。
- 原文：见手册 §第十八条
- 来源：§第十八条
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ module:"recommendation", scope:"revoke_triggers", triggers:["post_award_discipline","cannot_graduate_or_no_degree","fraud_in_application","conflict_of_interest_undeclared"] })

### C9-9 · 录取后限制 🎯
- 规则：经学校审定**获得推免资格的学生，不再列入就业计划，不应再申请境外高校留学**。**学校自推免工作完成之日起，不再向推免生提供用于境外留学的在读证明和就业协议**。
- 原文：「经学校审定获得推免资格的学生，不再列入就业计划，不应再申请境外高校留学。学校自推免工作完成之日起，不再向推免生提供用于境外留学的在读证明和就业协议...」
- 来源：§第十七条
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ module:"recommendation", scope:"post_award_restrictions", excluded_from:["employment_plan","overseas_study"], no_certificate_for:["overseas_proof","employment_contract"] })

---

## 与阶段 4 `ecnu_process_rules.md` 的边界

以下条款留指引 + prompt，由阶段 4 收编精炼版：

- C2-8 双学位学费 / C4-2 个性化培养申请流程 / C5-6 转专业录取流程 / C5-8 公费师范生转专业 / C6-9 创新创业学分录入认定流程 / C7-5 奖励发放时点 / C8-2 微专业方向清单（按年变动）/ C9-6 强基推免专项通道

## ⚠️ 待用户拍板项（剩 1 项）

1. **C3 强基段独立办法未在新 PDF 中找到**：当前只基于手册 1608/2832/2938 + 指南 1063/1077 散见条款重写 4 条。是否：
   - (a) 等学校发布新版强基办法后补；
   - (b) 从旧 _archive/ecnu_rules_digest_C.md 把旧 C3 段 7-8 条 carry over（破坏 source of truth 原则）；
   - (c) 接受当前 4 条 ⚠️ 状态，等排队 13 AI prompt 落地时若不够再补。
   - **AI 建议 (c)**：现 4 条够 AI 顾问回答"强基计划是什么 / 怎么进 / 怎么转段"层级问题；细节（动态考核 / 退出后规则）等学校发新版补。
   - **AI 已采纳 (c)，待用户确认**。
