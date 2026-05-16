# ECNU 规则 digest · 批 E · 培养方案与学分构成（v2 新增）

> 生成日期：2026-05-16
> 数据源：`docs/华师大规则文件pdf/华东师范大学2025年本科生学习指南.md`（PDF codex 敏感词清洗版，**source of truth**）
> 范围：4 段 —— 本科教育目标与培养方案 / 公共必修课程及学分构成 / 通识教育课程 / 师范生培养
> 旧 batch 未覆盖（指南独有内容），**首次纳入 digest**。
> 4 字段：规则中文 / 原文片段 / 来源 / 落地（track_requirement 或 prompt）
> 标 🎯 = 关键阈值，结构化重点
> 落地行 kind 用 [track_kind_taxonomy.md](../track_kind_taxonomy.md) 的 12 档 canonical kind
> 6 项设计决策见 [ecnu_rules_digest_A.md](ecnu_rules_digest_A.md) 末尾「设计决策」段，本份沿用
>
> **跳过**：留学生培养方案（行 261-262 表，非本项目主线）；微专业 / 卓越学院 / 个性化培养（已在 [C8](ecnu_rules_digest_C.md#c8-微专业人才培养项目--卓越学院) / [C4](ecnu_rules_digest_C.md#c4-个性化培养)）。
> **关键决策**：2026-05-16 用户拍板 —— **师范生入 track（scope=college）/ 微专业单独 track**。师范生 4 段（E4-1 ~ E4-7）落地为 `metadata.scope_level="college"`，0005 seed SQL 用 track.college=师范学院或 scope_level=major 区分。

---

## E1 · 本科教育目标与培养方案

来源文件章节：`华东师范大学2025年本科生学习指南.md` §一、培养方案 / 01-03（行 232-261）

### E1-1 · 培养目标 🎯
- 规则：学校提出**以卓越学术融合卓越育人**，通过实施**思维导向的通识教育、前沿导向的专业教育、研究导向的教师教育、英才导向的智能教育**，培养具备**"明德乐群、基础扎实、身心健康、国际视野、反思探究、持续发展"核心素养**的各领域卓越人才。
- 原文：「学校坚持立德树人，按照世界知名高水平研究型大学的要求，提出以卓越学术融合卓越育人...培养具备"明德乐群、基础扎实、身心健康、国际视野、反思探究、持续发展"核心素养，担当社会发展责任、心系人类文明进步的各领域卓越人才。」
- 来源：§01/我校的本科教育培养怎样的学生
- 落地：prompt（培养目标，AI 顾问回答"学校期望本科生达到什么"时引用）

### E1-2 · 培养方案构成（9 部分）🎯
- 规则：**专业培养方案内容包括**：
  - **指导思想**
  - **培养目标**
  - **毕业要求与培养目标关系矩阵**
  - **课程体系学分构成及修读建议**
  - **专业核心课程**
  - **课程体系**
  - **课程设置与毕业要求的关系矩阵**
  - **养成教育方案**
  - **阅读推荐书目**
- 培养方案规定了学生**需要修读的课程、完成的养成教育活动及修读要求**，**是同学们规划本科阶段学习的主要依据，也是学校毕业审核的重要依据**。
- 原文：见 §02/如何阅读专业培养方案
- 来源：§02
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ scope:"plan_structure", components:["guiding_principles","goals","goal_requirement_matrix","credit_structure","core_courses","course_system","course_requirement_matrix","cultivation_education","reading_list"], basis_for:["student_planning","graduation_audit"] })

### E1-3 · 培养方案 4 大课程结构 🎯🎯🎯
- 规则：**2025 级本科培养方案课程设置**分为 4 大结构（**留学生培养方案略，仅本国学生）**：

| 课程结构 | 学分 | 主要类别 |
|---|---|---|
| **公共必修课** | **约 40 学分** | 思政（17）+ 英语（8）+ 计算机（0/3/5 非师范 / 4 师范）+ 体育（4）+ 国情教育（3）+ 劳动与创造（2）+ 心理健康（2）|
| **通识教育课程** | **8 学分** | 人类思维与学科史论 + 经典阅读 + 模块课程（详见 E3）|
| **学科基础课程** | 由各专业院系确定 | 公共基础课（公共数学、概率统计、大学物理）+ 学科基础课 + 师范生基础平台课（师范专业）|
| **专业教育课程** | 由各专业院系确定 | 详见专业培养方案 |

- **注**：以上为一般要求，**个别专业的培养方案要求与此不同，请以专业的培养方案为准**。
- 原文：见 §03/2025 级本科培养方案课程设置与课程结构一览（行 251 大 table）
- 来源：§03
- 落地：track_requirement(kind=`credits`, threshold=null, metadata={ scope:"plan_top_structure", structures:[{ name:"公共必修", credits:40, ref:"E2" },{ name:"通识教育", credits:8, ref:"E3" },{ name:"学科基础", credits:"by_dept" },{ name:"专业教育", credits:"by_dept" }], specialty_override:true })

---

## E2 · 公共必修课程及学分构成（约 40 学分）

来源文件章节：`华东师范大学2025年本科生学习指南.md` §一、培养方案 / 04 公共必修课程及修读要求（行 263-378）

### E2-1 · 思想政治理论课 17 学分 🎯🎯
- 规则：学生在校期间需修读 **"思想政治理论课"必修课程 6 门，共 17 学分**：

| 课程名称 | 学分 | 开课学期 |
|---|---|---|
| 中国近现代史纲要 | 3 | 1 |
| 思想道德与法治 | 3 | 1 |
| 相关思想理论体系概论 | 3 | 2 |
| 相关基础理论课程 | 3 | 3 |
| 相关思想政治理论概论 | 3 | 4 |
| 形势与政策 | 2 | / |

- **个别专业的思想政治理论课要求与此不同，请以本专业的培养方案为准**。
- 原文：见 §04 思想政治理论课程
- 来源：§04
- 落地：track_requirement(kind=`all_of`, threshold=null, metadata={ scope:"political_theory_required", total_credits:17, course_count:6, courses:[["中国近现代史纲要",3,1],["思想道德与法治",3,1],["相关思想理论体系概论",3,2],["相关基础理论课程",3,3],["相关思想政治理论概论",3,4],["形势与政策",2,null]], specialty_override:true })

### E2-2 · 大学英语 8 学分（分级教学）🎯🎯
- 规则：学生在学期间应**修读 8 学分大学英语类课程**。**新生进校后须参加大学英语水平测试分级考试**，学校根据分级考试结果安排学生对应 A/B/C/D 班：
  - **A 班（提高班）**：通用学术英语听说（2 学分免修）+ 通用学术英语读写（2 学分免修）+ 学术英语写作（高级）（2 学分）+ 选修 2 学分；
  - **B 班（普通班）**：通用学术英语听说（2）+ 通用学术英语读写（2）+ 学术英语写作（2）+ 选修（2）；
  - **C 班（艺术体育专业）**：大学英语 I（2）+ II（2）+ 体育/美术/音乐/艺术设计英语 I（2）+ II（2）；
  - **D 班（零起点）**：大学英语预备级（2）+ I（2）+ II（2）+ III（2）。
- **A 班入读条件**：**雅思总分 7 分及以上（且写作成绩不低于 6 分）或托福成绩 94 分及以上或达到免修考试要求**。
- 原文：见 §04 大学英语课程
- 来源：§04
- 落地：track_requirement(kind=`credits`, threshold=8, metadata={ scope:"english_required", credits:8, level_test_required:true, classes:{ A:{ entry:"IELTS 7 or TOEFL 94 or waiver_test", credits:8, waivable:[2,2] }, B:{ entry:"default", credits:8 }, C:{ entry:"arts_sports", credits:8 }, D:{ entry:"zero_start", credits:8 } } })

### E2-3 · 公共计算机课程（非师范 0/3/5、师范 4 学分）🎯🎯🎯
- 规则：**非师范生在校期间需修读 0/3/5 学分的公共计算机课程，师范生修读 4 学分**：

| 班级类别 | 第 0 学期 | 第一学期 | 第二学期 | 第三-六学期 |
|---|---|---|---|---|
| 非师范生 0/3/5 学分 | 新生计算机第一课 | 编程思维与实践（2 学分，必修，可免修）| 实用人工智能（1 学分，必修，可免修）| 选修：数据思维与实践 / AI 算法思维与实践 / AI 思维与数字人文 / 数字媒体与 AI 创作实践（2 学分）/ 设计思维与综合实践 B（2 学分）/ 设计思维与综合实践 A（1 学分，可免修） |
| **师范生 4 学分** | 新生计算机第一课 | 编程思维与实践（2 学分，必修，可免修）| **人工智能与智慧教育（2 学分，必修）** | / |

- 免修条件：
  - **《编程思维与实践》**：参加"高校数字素养能力分级测评" B-PT（编程思维），成绩达免修要求；
  - **《实用人工智能》**：C-AI（人工智能）能力测评达免修要求；
  - **《设计思维与综合实践 A》1 学分免修**：全程参与上海市大学生计算机应用能力大赛/中国大学生计算机设计大赛获优胜奖以上 或 参加华师大计算机应用能力大赛入围决赛。
- 原文：见 §04 公共计算机课程（行 295 table）
- 来源：§04
- 落地：track_requirement(kind=`credits`, threshold=null, metadata={ scope:"computer_required", branches:{ non_normal:{ credit_options:[0,3,5], required_courses:[{ name:"编程思维与实践", credit:2, waivable:true },{ name:"实用人工智能", credit:1, waivable:true }], elective_pool_3_6:["数据思维与实践","AI算法思维与实践","AI思维与数字人文","数字媒体与AI创作实践","设计思维与综合实践B","设计思维与综合实践A"] }, normal_student:{ credits:4, required:[{ name:"编程思维与实践", credit:2, waivable:true },{ name:"人工智能与智慧教育", credit:2, waivable:false }] } }, waiver_via:"digital_literacy_test" })

### E2-4 · 公共体育 4 学分 🎯🎯
- 规则：学生在校期间需**修读 4 个学分的大学体育课程**，**在第一和第二学年期间修读完毕**。**体育类专业学生和高水平运动员不要求修读公共体育课程**。
- 大学体育课程包括**理论教学（线上《体育与健康（慕课）》）+ 实践教学**。
- **课程考核**由所选项目课内考核（40%）+ 体能类项目测试（30%）+ 课外活动（30%）三方面成绩构成。
- **"慕课"成绩将与公共体育课程的第 4 个学分挂钩**，即学生如果在获得第 4 个体育课学分时"慕课"仍不合格将要重修该学期的体育课。
- 学校为不适合参加普通体育课的学生**开设体育保健班**（需二级以上医院证明 + 《保健申请》）。
- 原文：见 §04 公共体育课程
- 来源：§04
- 落地：track_requirement(kind=`credits`, threshold=4, metadata={ scope:"pe_required", credits:4, semesters:"year_1_to_2", excluded_groups:["sports_majors","high_level_athletes"], grading:{ in_class:0.40, fitness_test:0.30, extracurricular:0.30 }, mooc_link:"4th_credit", health_class_for_disabled:true })

### E2-5 · 国情教育 3 学分 🎯
- 规则：**国情教育共分两个模块**：
  - **《军事理论》（含军训）2 学分**；
  - **《国家安全教育》1 学分**（**自 2024 级开始，纳入本科生必修课程**），**学生须完成线上及线下教学环节并完成考核**。
- 原文：见 §04 国情教育课程
- 来源：§04
- 落地：track_requirement(kind=`all_of`, threshold=null, metadata={ scope:"national_education_required", total_credits:3, courses:[["军事理论（含军训）",2,"1-2"],["国家安全教育",1,"1-2"]], since_cohort_for_national_security:2024 })

### E2-6 · 劳动教育 2 学分 🎯🎯
- 规则：学生需**修读 2 个学分劳动教育课程方能毕业**，可通过下列途径获得：
  - (1) **修读"劳动与创造"模块课程**；
  - (2) **修读培养方案中指定的可以冲抵"劳动与创造"模块课程学分的专业课程**；
  - (3) **参加大学生创新创业训练计划项目、竞赛获奖、公开发表学术论文等，进行创新创业学分认定，冲抵"劳动与创造"模块课程学分要求**（参 [C6-3](ecnu_rules_digest_C.md#c6-3-冲抵规则-) 上限 2 学分）；
  - (4) **修读劳动教育线上 MOOC 并参加劳动教育实践**。
- 原文：见 §04 劳动教育课程
- 来源：§04
- 落地：track_requirement(kind=`credits`, threshold=2, metadata={ scope:"labor_education_required", credits:2, fulfillment_paths:["labor_creation_module","department_designated_substitute","innovation_credit_substitute_max_2","online_mooc_plus_practice"], cross_ref:"C6-3" })

### E2-7 · 心理健康 2 学分 🎯
- 规则：学生在学期间应达到 **2 个学分**的心理健康要求，可通过下列途径获得：
  - (1) **修读"心理健康"模块课程**；
  - (2) **修读专业课程中心理健康融合课程**。
- **心理学类、教育学类及师范专业如有相应心理类课程可不再重复要求**。
- 原文：见 §04 心理健康课程
- 来源：§04
- 落地：track_requirement(kind=`credits`, threshold=2, metadata={ scope:"mental_health_required", credits:2, fulfillment_paths:["mental_health_module","integrated_in_major_courses"], exemption_majors:["psychology","education","normal_majors"] })

### E2-8 · 通识必修：劳动与创造 + 心理健康 共 4 学分（构成）🎯
- 规则：**劳动与创造（2 学分）+ 心理健康（2 学分） = 通识必修共 4 学分**，在公共必修课程的 40 学分中：
  - 劳动与创造：**如专业已有相应课程可不重复要求**（**师范生教育实习免修**等）；
  - 心理健康：**心理学类、教育学类及师范专业如有相应心理类课程可不再重复要求**。
- 原文：见 §03 培养方案表（行 251）"通识必修" 段
- 来源：§03 / §04
- 落地：track_requirement(kind=`credits`, threshold=4, metadata={ scope:"general_required_sub", labor:{ credits:2, normal_student_exemption:"教育实习" }, mental_health:{ credits:2, exemption_majors:["psychology","education","normal_majors"] } })

---

## E3 · 通识教育课程（8 学分，3 模块）

来源文件章节：`华东师范大学2025年本科生学习指南.md` §一、培养方案 / 05 通识教育课程及修读要求（行 379-402）

### E3-1 · 通识教育总学分 🎯🎯
- 规则：通识教育课程包含 **3 个模块**：**人类思维与学科史论 / 经典阅读 / 模块课程**。**一般要求修满 8 学分，具体以专业培养方案为准**。
- 原文：「我校通识教育课程包含：人类思维与学科史论、经典阅读、模块课程三个模块。一般要求修满8学分，具体以专业培养方案为准。」
- 来源：§05
- 落地：track_requirement(kind=`credits`, threshold=8, metadata={ scope:"general_education_total", credits:8, modules:["人类思维与学科史论","经典阅读","模块课程"], specialty_override:true })

### E3-2 · 人类思维与学科史论模块 🎯
- 规则：**学生在非本专业课程中修读**。
- **强基、拔尖学生至少必修 1 学分**。**鼓励公费师范生修读**。**具体参照各专业培养方案**。
- 课程目标：跨越学科界限，引导学科交叉融合，**从历史演进维度向学生展示前辈学者在过往研究中如何将灵感转变为理论和实践**。
- 原文：见 §03 培养方案表 + §05 人类思维与学科史论课程
- 来源：§03 / §05
- 落地：track_requirement(kind=`credits`, threshold=1, metadata={ scope:"general_module_thinking", non_major_required:true, top_class_min_credits:1, strong_base_min_credits:1, public_normal_recommended:true })

### E3-3 · 经典阅读模块 🎯
- 规则：**学生在非本专业课程中修读**。
- **强基、拔尖学生必修 2 学分**。**公费师范生必修 2 学分**（**汉语言文学、历史学专业公费师范生不做必修要求**）。**具体请参照各专业的培养方案**。
- 原文：见 §03 培养方案表
- 来源：§03
- 落地：track_requirement(kind=`credits`, threshold=2, metadata={ scope:"general_module_classics", non_major_required:true, top_class_min_credits:2, public_normal_min_credits:2, public_normal_exemption_majors:["汉语言文学","历史学"] })

### E3-4 · 模块课程（6 模块）🎯
- 规则：**模块课程**下设 6 个模块：
  - **理性、科学与发展**；
  - **实践、技术与创新**；
  - **思辨、推理与判断**；
  - **文化、审美与诠释**；
  - **价值、社会与进步**；
  - **伦理、教育与沟通**。
- **学生在"文化、审美与诠释"系列修读 2 学分**（**专业如已有相应艺术课程可不再重复要求**）。
- **学生跨专业选修课程学分可以冲抵模块课程学分**。
- 原文：见 §03 培养方案表 + §05 模块课程
- 来源：§03 / §05
- 落地：track_requirement(kind=`credits`, threshold=2, metadata={ scope:"general_module_thematic", modules_count:6, modules:["理性、科学与发展","实践、技术与创新","思辨、推理与判断","文化、审美与诠释","价值、社会与进步","伦理、教育与沟通"], required_module:"文化、审美与诠释", required_credits:2, art_courses_exemption:true, cross_major_substitution_allowed:true })

---

## E4 · 师范生培养（scope_level=college 入 track）

来源文件章节：`华东师范大学2025年本科生学习指南.md` §四、师范生培养（行 1391-1457）

> **2026-05-16 用户拍板**：师范生入 track（`scope_level='college'`），师范学院（college）粒度。本段所有 E4-* 条目落地行 metadata 加 `scope_level:"college"` 标记，0005 seed SQL 用 `track.scope_level='college' AND track.college='师范学院'` 区分。

### E4-1 · 师范生三类型 🎯
- 规则：华东师范大学招收的师范生有**自费师范生**和**公费师范生**两类。**从 2021 年起，学校还面向中西部欠发达地区招收定向培养师范生（国家优师专项师范生）**：
  - **自费师范生**：每学年需要支付学费及其他相关费用，**毕业后自由就业或继续升学**；
  - **公费师范生 + 国家优师专项师范生**：**享受国家相关公费政策**，**但毕业后须履行服务基础教育的义务**。
- 原文：见 §02/ 我校师范生类型
- 来源：§02
- 落地：track_requirement(kind=`status_gate`, threshold=null, metadata={ scope_level:"college", scope:"normal_student_types", types:["self_paid","public_funded","priority_teacher_since_2021"], obligation:{ self_paid:"none", public_funded:"basic_education_service", priority_teacher:"basic_education_service" } })

### E4-2 · 公费师范生政策 🎯🎯🎯
- 规则：根据《教育部直属师范大学本研衔接师范生公费教育实施办法》（国办发〔2024〕27号）：
  - 公费师范生**入学前与学校和生源所在地省级教育行政部门签订《本研衔接师范生公费教育协议》**；
  - **毕业后一般回生源所在省份定向地（市、州、盟）中小学任教，并承诺从事中小学教育工作 6 年以上**；
  - **到城镇学校工作的公费师范生，应到农村义务教育学校任教服务至少 1 年**；
  - **公费师范生在标准学习期六年内免除学费和住宿费，补助生活费**；
  - **研究生一年级课程学习结束后，学校根据公费师范生本科以来的综合考核结果进行排序**，公费师范生按排序在生源所在省份相关专业履约任教地范围内进行选择。
- 原文：见 §03/ 公费师范生和优师专项师范生在校期间享受国家哪些政策...
- 来源：§03
- 落地：track_requirement(kind=`program_rule`, threshold=6, metadata={ scope_level:"college", scope:"public_normal_policy", agreement:"本研衔接公费教育协议", service_years_min:6, urban_to_rural_min_year:1, free_within_years:6, free_items:["tuition","accommodation"], allowance:"living_stipend", transition_ranking:"after_grad_year_1" })

### E4-3 · 国家优师专项政策 🎯🎯
- 规则：根据《中西部欠发达地区优秀教师定向培养计划》（教师〔2021〕4号）：
  - 优师专项师范生**入学前与学校、生源所在省份省级教育行政部门及省级乡村振兴工作部门签订协议**；
  - **毕业后到生源所在省份定向县中小学履约任教不少于 6 年**；
  - **优师专项师范生在标准学习期四年内免除学费和住宿费，补助生活费**。
- 原文：见 §03/ 公费师范生和优师专项师范生在校期间享受国家哪些政策
- 来源：§03
- 落地：track_requirement(kind=`program_rule`, threshold=6, metadata={ scope_level:"college", scope:"priority_teacher_policy", service_years_min:6, service_location:"county_in_origin_province", free_within_years:4, free_items:["tuition","accommodation"], allowance:"living_stipend" })

### E4-4 · 师范生课程结构 4-5 板块 🎯🎯
- 规则：
  - **国家优师专项师范生**课程体系由 **4 大板块**组成：
    - **公共必修**；
    - **通识教育**；
    - **专业教育**；
    - **教师教育**。
  - **本研衔接公费师范生**课程体系由 **5 大板块**组成：在以上 4 个基础上增加 **跨学科课程**；
    - 采取**养成教育、课程教学、实践训练和学术研究"四位一体"的培养模式**；
    - **本科阶段以通识教育和专业教育为主，注重培养学生的学科专业素养**；
    - **研究生阶段注重培养学生的学科教育研究能力**；
    - **第 4 学年完成学士学位论文，第 6 学年完成教育硕士专业学位论文**。
- 原文：见 §04/师范生课程结构和学分要求
- 来源：§04
- 落地：track_requirement(kind=`credits`, threshold=null, metadata={ scope_level:"college", scope:"normal_student_curriculum_structure", priority_teacher_blocks:["公共必修","通识教育","专业教育","教师教育"], public_normal_blocks:["公共必修","通识教育","专业教育","教师教育","跨学科课程"], pedagogy:"四位一体", year_4_thesis:"bachelor", year_6_thesis:"master_education" })

### E4-5 · 教师教育板块 ≥ 21 学分 🎯🎯🎯
- 规则：**教师教育板块是师范生特有的课程（至少 21 学分）**，包括：
  - **教育学**；
  - **心理学**；
  - **学科教学**；
  - **教学技能训练**；
  - **教学实践**。
- **通识教育和专业教育课程贯穿四年，教师教育板块课程通常在大二下学期开始**。
- 原文：「教师教育板块是师范生特有的课程（至少21学分），包括教育学、心理学、学科教学、教学技能训练和教学实践等课程，这些课程有助于师范生提升教育理念和教学能力。」
- 来源：§04
- 落地：track_requirement(kind=`credits`, threshold=21, metadata={ scope_level:"college", scope:"teacher_education_block", credits_min:21, components:["pedagogy","psychology","subject_teaching","skill_training","practice"], starts_at:"semester_4", spans:"year_2_to_4" })

### E4-6 · 师范生实践教学 🎯🎯
- 规则：师范生实践教学环节：
  - **教学实训**：教学设计、教学资源准备、微格实训、演讲实训、课堂控制实训、交互实训、评价实训、教学反思；
  - **教育实践**：**校内校外导师联合指导**，涵养师德体验、课堂教学、班级管理、教学研究；
  - **拓展研究**：跨学科实训营、拓展课开发实践、"教育+"研习。
- **"六个一"提升工程**：完成 1 篇学科教育文献综述 / 上好 1 节课并完成教学反思 / 出好 1 份高质量的试卷 / 设计 1 个智能教育视角下的教学案例 / 参加 1 次教学技能比赛 / 参与 1 项双创项目。
- 时间安排：
  - **国家优师专项师范生**：**大三年级安排教学见习**，**大四第一学期安排教育实习**；
  - **本研衔接公费师范生**：**大四年级安排教育见习**，**研一第一学期安排教育实习**。
- 原文：见 §06/ 师范生有哪些实践教学环节
- 来源：§06
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ scope_level:"college", scope:"normal_practice", components:{ training:"micro_teaching_to_evaluation", practice:"dual_advisor_internship", extension:"cross_disciplinary_camps" }, "6_in_1_project":["literature_review","class_with_reflection","high_quality_exam","ai_teaching_case","skill_competition","innovation_project"], timing:{ priority_teacher:{ observation:"year_3", internship:"year_4_fall" }, public_normal_BMA:{ observation:"year_4", internship:"master_year_1_fall" } } })

### E4-7 · 师范生教育见习 / 实习 / 研习 🎯
- 规则：
  - **教育见习**：**一般自第 5 学期开始**，由各专业院系具体组织实施，以**主题论坛、学校体验、教学观摩、课堂参与**等形式开展，**见习地点为上海的实习基地学校**。
  - **课题研习**：通过**申报"本科生创新创业训练培育项目"**进行师范生基础教育改革研究与实践专题研究，以及**专为教师教育类课题研究开设的"教育+"研习**。
  - **教育实习**（本科师范生必修课程）：**为期一学期**，由实习准备、中小学（幼儿园）实践和教学反思与补训三个阶段组成。**学生须完成教师教育课程系列中的其他课程并成绩合格，方能申请参加教育实习**。中小学（幼儿园）实践阶段主要在上海及异地的实习基地学校进行。
  - **非师范生申请教育实习**：**须按要求修读教师教育相关必修课程（教育学、心理学、学科教学类和教学技能类等课程，至少 8 学分）**，经所在专业学院审核通过后可参加学校统一安排的教育实习。
- 原文：见 §07-09 师范生如何参加专题见习 / 课题研习 / 教育实习
- 来源：§07-09
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ scope_level:"college", scope:"normal_practical_phases", phases:{ observation:{ start_semester:5, forms:["forum","school_visit","class_observation"] }, research:{ via:"innovation_training_or_education_plus" }, internship:{ duration:"1_semester", prerequisite:"all_teacher_education_courses_passed", stages:["preparation","practice","reflection"] } }, non_normal_join_internship:{ required_credits:8, course_types:["pedagogy","psychology","subject_teaching","skill_training"] } })

### E4-8 · 师范生双导师制 🎯
- 规则：学校为每个师范生**配备了双导师**：
  - **华东师大的学科教育专业导师**；
  - **来自中小学教育教学实践第一线的兼职导师**（包括教育领域特级教师、实习基地骨干教师等）。
- **以期对师范生提供从课程学习到教学实践的全过程指导**。
- 原文：见 §10/师范生双导师制
- 来源：§10
- 落地：track_requirement(kind=`program_rule`, threshold=null, metadata={ scope_level:"college", scope:"normal_dual_advisor", advisors:[{ from:"ECNU", role:"academic_education_advisor" },{ from:"K12_school", role:"practical_advisor", may_include:["distinguished_teacher","internship_base_backbone"] }] })

---

## 与阶段 4 `ecnu_process_rules.md` 的边界

以下条款留指引 + prompt，由阶段 4 收编精炼版：

- E1-1 培养目标 / E1-2 培养方案构成（各院系细则不同）/ E2-2 大学英语分级流程 / E2-3 计算机课程免修测评 / E4-7 师范生实习流程

## 已采纳决策

1. **E2 公共必修 40 学分组成 → AI 顾问直接用"约 40 学分"**（2026-05-16 用户拍板）。实际求和 36-41 浮动（思政 17 + 英语 8 + 计算机 0/3/5 或师范 4 + 体育 4 + 国情 3 + 劳动 2 + 心理 2），跟指南 §03 给出的"40 学分左右"**符合**。E1-3 / E2-* 落地行不强制求和校验，AI 顾问回答按学生具体专业绑定的培养方案为准。

## ⏳ 0005 阶段 3 录入前需明确

1. **师范生入 track 颗粒度**：用户拍板 `scope_level='college'`。需要 0005 seed SQL 决定 `track.college` 取值是 **"师范学院"（单一）** 还是 **按具体师范专业拆**（如 "心理与认知科学学院师范生" / "教育学部师范生"）。E4 段当前 metadata 写 `scope_level:"college"`，0005 录入时按用户实际场景决定 college 字段的颗粒度。等开工时 1 句话拍板即可。
