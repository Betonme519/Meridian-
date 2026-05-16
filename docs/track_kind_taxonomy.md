# Track Kind Taxonomy — 99 条 ECNU digest 落地行归并方案

> 阶段 1 草稿（2026-05-16）。决策点 [TRACK_SCHEMA.md §1 D-track-8](TRACK_SCHEMA.md)；架构动机 [AI_MEMORY.md §9 2026-05-16](AI_MEMORY.md)。
> 用途：把 4 份 digest 的 99 条 `track_requirement` 候选（用了 98 个自由 kind 标签）归并到 **8 个新 canonical kind**（加上现有 4 档 = 12 档），给 `0006_extend_requirement_kinds.sql` 扩 CHECK 用，并指导 `0005_seed_ecnu_2023.sql` 录入。
>
> **下一步**：用户审 → 改 / 通过 → 写 0006 schema 演进 SQL。

---

## 0. 12 档 canonical kind 全景

| 编码 | 来源 | 语义 | 99 条计数 |
|---|---|---|---|
| `count` | 0002 现有 | 从 option 选至少 N 门 | 0 |
| `credits` | 0002 现有 | 累计学分 ≥ N | 0 |
| `one_of` | 0002 现有 | 必选 1 门 | 0 |
| `all_of` | 0002 现有 | 全部必修 | 0 |
| `time_limit` | **0006 新加** | 时间约束 | 14 |
| `gpa_threshold` | **0006 新加** | 成绩/GPA 阈值 | 8 |
| `status_gate` | **0006 新加** | 状态门槛 / 资格判定 | 9 |
| `warning_threshold` | **0006 新加** | 学业预警 / 退学线 | 8 |
| `assessment_rule` | **0006 新加** | 考核 / 考勤 / 补考 / 答辩规则 | 11 |
| `score_scheme` | **0006 新加** | 成绩记分方式 | 5 |
| `tuition` | **0006 新加** | 学费规则 | 4 |
| `program_rule` | **0006 新加** | 项目级规则（辅修/双学位/强基/创新创业/CTP/论文/实习/转专业） | 40 |

> 现有 4 档（`count/credits/one_of/all_of`）在 99 条 digest 落地行里**未出现**，但它们仍是"选课要求"层的基础，0005 录入"修课要求"段时仍会用到（如 0005 里若录"必修 N 学分"会用 `credits`）。这次扩档是**添**不是**替换**。

---

## 1. 每档 canonical kind 详细

### `time_limit` · 时间约束（14 条）

**语义**：年限 / 期限 / 时点类硬性时间规则。`threshold` 存数值，`metadata.unit` 存单位（`year`/`semester`/`week`/`month`）。

**典型 metadata**：`{ unit: "year", direction: "upper" }` / `{ unit: "week", direction: "deadline" }`

**典型 digest 例子**：最长学习年限 6 年；休学累计 ≤ 2 年；入学逾期 2 周；最短提前毕业 3 年

**全部 14 条 digest 映射**：

| batch | digest § | 原 kind 标签 | 规则摘录 |
|---|---|---|---|
| A | A1-1 · 最长学习年限 | `time_limit` | 本科生最长学习年限（含休学和保留学籍）为 6 年，自获得普通高等学校学籍起算。 |
| A | A2-5 · 提前毕业 | `early_graduation` | 可申请提前毕业，但**一般应在本校修读满 3 年**；应提前 1 学期向学部院系申请，由学部院系报本科生院备案；后因故无法按期可申请撤销提前 |
| B | B4-4 · 请假权限分级 | `leave_cap` |  |
| C | C1-7 · 修读期限 | `minor_max_years` | 学生应在主修专业修读期间完成辅修专业规定的全部课程；**辅修专业最长学习年限至主修专业最长学习年限**（即主修 6 年内）。 |
| C | C2-2 · 学制 | `double_degree_years` | 双学士学位项目**学制为 4 年**，最长修读年限不超过六年（含休学）。 |
| D | D1-1 · 新生入学注册 | `enrollment_grace` | 新生持录取通知书按《新生入学须知》规定的期限到校办理入学手续；因故不能按期入学者应办理请假手续；**请假期限一般不得超过两周**；除因不可抗 |
| D | D1-3 · 学期注册（含缴费）🎯🎯 | `semester_registration` | 每学期开学时学生应当按学校规定办理注册手续，含**报到和缴纳学费**；因故不能如期报到者应**事先履行请假手续**；**请假期限一般不得超过 |
| D | D1-8 · 未注册学生统计 | `registration_overdue` | **每学期第三周，教务处对未注册学生名单进行汇总经管理院系核实，对于未请假、请假未准或请假期满逾期两周以上（含两周），除因不可抗力等正当事由 |
| D | D2-2 · 休学时间单位 🎯🎯 | `leave_duration` | **休学时间以 1 学期为最小单位**，**休学时长累计不得超过 2 年**；起讫时间以本科生院核定为准。 |
| D | D2-3 · 应当休学情形 | `leave_required` | 以下情况应办理休学： |
| D | D2-6 · 应征参军 🎯🎯 | `enlistment_preserve` | 学生应征参加中国人民解放军（含武警），予以**保留入学资格或保留学籍**；**保留学籍可至退役后 2 年**，**保留学籍时长不计入学习年限 |
| D | D2-9 · 复学申请时点 🎯🎯 | `resume_apply_deadline` | **学生最迟应在休学（含保留学籍）期满前 1 周提交复学申请**，经所在学部院系审核后报本科生院备案，**经复查合格方可复学注册**。 |
| D | D2-11 · 创业休学 🎯🎯 | `entrepreneur_leave` | 因创业休学的学生符合以下条件者，经审核通过，**休学年限不计入最长学习年限，但累计不得超过 2 年**： |
| D | D5-5 · 项目研究时长 🎯🎯 | `ctp_duration` | **项目研究时间原则上不超过 1 年**；**国创、市创项目研究时间最长不超过 2 年**；**完成时间不迟于学生毕业时间**。 |

---

### `gpa_threshold` · 成绩/GPA 阈值（8 条）

**语义**：GPA、体测分数、论文评分等门槛值。`threshold` 存阈值，`metadata.scope` 存适用范围。

**典型 metadata**：`{ scope: "degree_apply", scale: "4.0" }` / `{ scope: "fitness_grad", scale: "100" }`

**典型 digest 例子**：GPA ≥ 2.0 申请学位；体测 ≥ 50 才能毕业；论文优秀率 ≤ 20%

**全部 8 条 digest 映射**：

| batch | digest § | 原 kind 标签 | 规则摘录 |
|---|---|---|---|
| A | A3-2 · GPA 阈值 🎯🎯🎯 | `gpa_threshold` | 满足下列条件之一可申请学士学位： |
| B | B2-7 · 课程绩点 | `gpa_excluded` | 课程绩点按附录 2「课程总评与课程绩点对应关系」计算。**考核不合格、三级制（含 P/F）记分课程不计绩点**。 |
| B | B2-9 · 平均学分绩点 GPA 公式 🎯🎯🎯 | `gpa_formula` |  |
| B | B5-4 · 等级 | `fitness_grade_scale` |  |
| B | B5-6 · 毕业成绩计算 🎯🎯 | `fitness_grad_formula` | **学生毕业时的成绩和等级，按毕业当学年总分的 50% 与其他学年总分平均得分的 50% 之和进行评定**。 |
| B | B5-8 · 评优门槛 🎯🎯 | `fitness_award_threshold` | **测试成绩达到 60 分及以上者，方可参加评优与评奖**。确实丧失运动能力、被免予执行的学生仍可参加。 |
| B | B5-9 · 毕业门槛 🎯🎯🎯 | `fitness_grad_threshold` | **学生毕业时，体质健康测试成绩达不到 50 分者按结业或肄业处理**。 |
| D | D4-8 · 优秀比例 🎯🎯 | `thesis_excellence_cap` | 优秀毕业论文必须进行**系级以上答辩**，可请校外专家参加。**优秀率不超过20%** 。 |

---

### `status_gate` · 状态门槛 / 资格判定（9 条）

**语义**：学籍 / 学位 / 项目"通过 vs 拒绝"的硬性门槛，多档枚举或布尔判定。`metadata.tiers` 存档位定义。

**典型 metadata**：`{ tiers: [{name:"毕业", pct:100}, {name:"结业", pct:90}] }` / `{ blocked_states: ["disciplined"] }`

**典型 digest 例子**：毕业 100% / 结业 ≥90% / 退学 <90%；处分期内不授学位；论文抽检不合格撤销学位

**全部 9 条 digest 映射**：

| batch | digest § | 原 kind 标签 | 规则摘录 |
|---|---|---|---|
| A | A2-1 · 三档结果 | `graduation_status` | 根据完成情况分三档： |
| A | A2-2 · 毕业证书 | `certificate_threshold` | 学满 1 年以上、所获学分达培养方案总学分 **10%** 的，发毕业证书；未达毕业要求的，出具写实性学习证明。 |
| A | A3-1 · 学位申请基本条件 | `degree_prereq` | 在学校接受本科教育，通过规定的课程考核或修满相应学分，通过毕业论文/毕业设计等毕业环节审查，达到《中华人民共和国学位法》规定的学士学位申请人 |
| C | C1-8 · 辅修学士学位授予条件 🎯🎯🎯 | `minor_degree_prereq` | 辅修毕业资格审查与主修毕业资格审查**同时进行**。符合下列条件可申请授予辅修学位： |
| C | C1-9 · 辅修学位证书发放规则 | `minor_cert_logic` |  |
| C | C3-5 · 退出后规则 🎯🎯 | `strong_base_exit_consequences` | 强基计划学生未通过考核或自愿申请退出的，**原则上退出至本专业普通班**。退出后，学生： |
| D | D4-4 · 抽检 🎯🎯 | `thesis_spot_check` | 本科毕业论文**抽检每年进行一次**；抽检对象为**上一学年度授予学士学位的论文**；**抽检比例原则上不低于2%，重点对论文选题意义、写作 |
| D | D4-13 · 学术不端处分 🎯🎯 | `thesis_misconduct` | 违纪行为分类与处分依据： |
| D | D4-14 · 抽检后果 🎯🎯 | `spot_check_consequence` | **连续 2 年校外抽检发现存在问题毕业论文，且比例较高或篇数较多的院系，教务处将提请学校减少其招生计划，并对院系和导师进行调查追责；连续3 |

---

### `warning_threshold` · 学业预警 / 退学线（8 条）

**语义**：触发预警 / 试读 / 退学的学分或学期数公式。`metadata.formula` 存计算规则。

**典型 metadata**：`{ trigger: "credits_per_semester < 10%", action: "warning" }` / `{ stage: "probation" }`

**典型 digest 例子**：单学期 <10% 学分 + 累计 <10%×N 触发退学；试读 / 二次退学 三阶段

**全部 8 条 digest 映射**：

| batch | digest § | 原 kind 标签 | 规则摘录 |
|---|---|---|---|
| A | A1-6 · 退学情形 | `warning_threshold` | 以下情形可予退学： |
| B | B3-2 · 预警线 🎯🎯🎯 | `warning_threshold` | 以下任一情况达到**学业预警线**： |
| B | B3-3 · 退学线 🎯🎯🎯 | `dropout_threshold` | **除第一学年秋季学期外**，学生在**单个长学期获得学分低于培养方案规定总学分的 10%**，**且**累计获得学分低于**总学分的 10 |
| B | B3-4 · 学分计算规则 | `warning_calc_rules` |  |
| B | B3-6 · 第一次退学线 → 试读 | `probation_grant` | 标准学习年限内，**学业成绩第一次达到退学线**的（试读流程）： |
| B | B3-7 · 试读期间 | `probation_resolve` | 试读学期内，试读学生正常报到注册。学生所在学部院系应加强学生学业指导。**试读学期结束，学生学业成绩高于退学线的解除（试读）**。 |
| B | B3-8 · 第二次退学线 🎯🎯 | `second_probation` | **学业成绩第二次低于退学线**的，如学生同时满足以下三个条件，且所在学部院系认为学生可完成学业，并为学生配备学业导师的，可第二次申请试读。 |
| D | D4-10 · 中途放弃 | `thesis_dropout` | 对于**中途放弃毕业论文的学生**： |

---

### `assessment_rule` · 考核 / 考勤 / 补考 / 答辩规则（11 条）

**语义**：考试资格、补考范围、考勤要求、答辩流程等过程类约束。`metadata` 自由形态描述规则。

**典型 metadata**：`{ check: "attendance", min: "2/3" }` / `{ check: "plagiarism", scope: "all_thesis" }`

**典型 digest 例子**：出勤 ≥ 2/3 才能考；旷课 ≥ 10 学时处分；论文抄袭检测全员；答辩组 ≥ 3 人

**全部 11 条 digest 映射**：

| batch | digest § | 原 kind 标签 | 规则摘录 |
|---|---|---|---|
| A | A5-4 · 考核资格 | `attendance_threshold` | 缺课学时或缺交作业次数累计**超过教学规定要求三分之一（1/3）**的，**取消该课程考核资格**。 |
| A | A5-6 · 不予补考情形 | `resit_blocked_states` | 以下情况**不予补考**：(1) 缺考；(2) 考核违纪；(3) 取消考核资格；(4) 缓考不合格。 |
| A | A5-7 · 补考课程范围 | `resit_scope` | 补考、缓考限**必修课程和专业选修课程**；公共选修课/任选课/通识/考查类型课程**不设补考**；暑期学期课程不设缓考和补考。 |
| B | B2-8 · 补考/缓考/重修/免修记载 🎯🎯 | `resit_grade_mapping` |  |
| B | B4-2 · 旷课学时折算 | `attendance_calc` | 旷课按实际授课时数计算学时。 |
| B | B4-3 · 旷课处分阈值 🎯🎯 | `truancy_threshold` | **一学期累计旷课达到 10 学时以上**的，将按《华东师范大学学生违纪处分办法》给予相应纪律处分；**连续两周无故不参加学校规定的教育教学 |
| B | B5-5 · 不及格补测 | `fitness_retest` | 测试成绩评定不及格者，**在本学年准予补测一次**；补测仍不及格，则学年成绩评定为不及格。 |
| C | C1-5 · 补考与缓考 | `minor_resit_range` | 辅修专业课程考核成绩在 **40-59 分**的学生**可以参加补考**；因病、课程考试冲突等可以申请缓考；**补考不及格及缺考的允许重修* |
| D | D4-3 · 抄袭检测 | `plagiarism_check` | 学校**使用"大学生论文抄袭检测系统"对所有毕业论文进行检测**；组织校外专家对部分院系的毕业论文进行抽查；存在质量问题的论文要求院系进一步 |
| D | D4-5 · 答辩小组组成 | `defense_panel_min` | **答辩小组至少应由三位教师组成**，**组长应由具有副高级及以上技术职称的教师担任，其中一位可以是指导教师。**。 |
| D | D4-9 · 未通过补答辩 🎯🎯🎯 | `thesis_resit` | **对于毕业论文答辩未通过的学生**： |

---

### `score_scheme` · 成绩记分方式（5 条）

**语义**：百分制 ↔ 五级 ↔ P/F 的映射 / 加权公式 / 绩点换算。`metadata` 存映射表或公式。

**典型 metadata**：`{ mapping: {A: [90,100], B: [80,89]} }` / `{ formula: "Σ(score×credit)/Σcredit" }`

**典型 digest 例子**：五级 vs 百分制；P/F 计学分不计 GPA；加权平均公式；论文 优良中及不及格

**全部 5 条 digest 映射**：

| batch | digest § | 原 kind 标签 | 规则摘录 |
|---|---|---|---|
| B | B2-3 · 记分方式 🎯🎯 | `grade_scale` | 可采用**等级制（三级制 / 十级制）或百分制**： |
| B | B2-5 · P/F 记分 🎯🎯 | `pf_credit_cap` | 除已采用三级制记分课程外，**在校期间学生可累计选择不超过 8 学分课程，以 P/F 方式记分且不计绩点**。可选范围由开课单位确定；本专业 |
| B | B2-6 · 课程总评记载 | `score_mapping` |  |
| B | B2-10 · 加权平均分（百分制）🎯 | `weighted_avg_formula` |  |
| D | D4-7 · 评阅与成绩评定 | `thesis_grade_scale` | 成绩分**优、良、中、及格、不及格**五档；每篇论文在指导教师初评后须经**至少 1 名其他教师交叉评阅**并撰写评语，最后由论文答辩小组评 |

---

### `tuition` · 学费规则（4 条）

**语义**：学分单价 / 超额结算 / 中途退课退费等学费类规则。`metadata` 存价目 / 公式。

**典型 metadata**：`{ normal: 165, international: 300 }` / `{ free_credits: 10, beyond_rate: 165 }`

**典型 digest 例子**：超额学分单价 165 元 / 国际学生 300；毕业生 10 学分免费、超 10 按 165 计

**全部 4 条 digest 映射**：

| batch | digest § | 原 kind 标签 | 规则摘录 |
|---|---|---|---|
| B | B6-5 · 超额学分单价 🎯🎯 | `credit_unit_price` | 按学分收费时实行统一标准收取超额学分的学费。**现行学分收费标准：普通全日制学生 165 元/学分；留学生 300 元/学分**。 |
| B | B6-8 · 中途离校结算公式 🎯🎯 | `tuition_settle_formula` | **转学、退学、结业、肄业等未取得毕业资格离校的学生**： |
| B | B6-9 · 毕业生超修结算 🎯🎯 | `overage_credit_fee` | 除卓越学院毕业学生外，毕业学生离校时按以下结算： |
| B | B6-12 · 公费师范生 / 优师计划 | `tuition_exemption` |  |

---

### `program_rule` · 项目级规则（辅修/双学位/强基/创新创业/CTP/论文/实习/转专业）（40 条）

**语义**：依附于具体"项目模块"的规则，靠 `metadata.module` 区分项目类型。涵盖学分范围 / 申请条件 / 工作流 / 分值表 / 替代认定 / 限制名单等。

**典型 metadata**：`{ module: "minor", credit_range: [28, 40] }` / `{ module: "ctp", level: "national", credit: 3 }`

**典型 digest 例子**：辅修学分 28-40；双学位 ≥ 60；强基招生上限 30 人；创新创业 10 学分上限；CTP 团队 ≤ 5 人

**全部 40 条 digest 映射**：

| batch | digest § | 原 kind 标签 | 规则摘录 |
|---|---|---|---|
| A | A4-2 · 认定上限 🎯🎯 | `credit_recognition_cap` | 累计认定学分数**一般不超过在读培养方案总学分的 40%**。 |
| B | B1-3 · 学期选课量建议 | `semester_credit_suggested` | 秋季/春季单学期选课量建议 **25 学分左右**；双学位项目、卓越学院学生可适量增加；除毕业学年/校外交流外，单学期选课量**一般不得低于 |
| B | B1-6 · 不可申请免听/免修的课程 | `waiver_blocked_categories` | 思想政治教育课、军事理论课和开课单位规定的课程一般不可申请免听或免修。 |
| B | B1-7 · 不可申请免听/免修的学生 | `waiver_blocked_students` | **学业预警、试读的学生**不可申请免听或免修。 |
| C | C1-2 · 辅修学分要求 🎯🎯 | `minor_credit_range` | 辅修专业**总学分在 30~36 学分**之间；可设置毕业论文（或毕业设计）要求；辅修课程体系聚焦相同主修专业的专业必修课程。 |
| C | C1-3 · 修读资格 | `minor_apply_conditions` | 申请修读辅修专业的学生需具备以下条件： |
| C | C1-6 · 冲突处理 | `minor_audit_only_cap` | 在辅修修读期内，如遇当学期应修的辅修课程与主修课程**上课时间冲突**、师范学生外地教学实习等正常教学安排，经辅修课程任课教师、开课院系同意 |
| C | C2-3 · 培养方案总学分 🎯🎯 | `double_degree_credit_total` | 双学士学位培养方案**原则上总学分保持在 180 学分左右**，应体现两个专业的核心培养要求，在课程、考核、实习实践等环节充分体现跨学科。 |
| C | C2-6 · 学位授予条件 | `double_degree_conditions` | 达到双学位培养方案规定的课程、学分和毕业要求 → 授予毕业证书；**同时符合双方学士学位授予条件的学生**可申请授予**双学士学位**。 |
| C | C2-8 · 未达条件回退 | `double_degree_fallback` | **未达到双学士学位授予条件**的学生，可： |
| C | C3-2 · 动态进出 | `strong_base_admit_cap` | 实施**阶段性考核和动态进出机制**： |
| C | C3-4 · 不得调整专业 | `strong_base_transfer_restriction` | **强基计划学生入校后一般不得调整专业**；确有特殊困难或特殊需要，无法继续在录取专业学习的，**可申请在强基计划招生专业范围内转到相近专业 |
| C | C3-6 · 本研衔接 | `strong_base_grad_track` | 学校对**符合培养要求**的强基计划学生实行**本研衔接培养**： |
| C | C4-3 · 非传统课程替代 🎯🎯 | `personalized_alt_credit` | 鼓励跨专业跨学科的人才培养；**允许以非传统课程学习形式（如高质量的项目报告、实践成果等）替代部分必修课程的学分要求**；对达到免听免修要求 |
| C | C5-1 · 三类转专业 🎯🎯 | `transfer_types` | 转专业类型包括： |
| C | C5-2 · 不予办理情形 🎯🎯 | `transfer_blocked` | 除以下情形外，学生均可申请转专业： |
| C | C5-4 · 转入计划数 | `transfer_quota_floor` | **专业转入计划数一般不低于该专业当年招生人数的 15%**；确因客观条件限制的，可适当降低转入计划数。拟录取人数如超过计划数，学部院系应及 |
| C | C5-5 · 学分修读类型课程数 | `credit_based_transfer_courses` | 组织学分修读类型转专业，学部院系应提前公布转入条件，**指定不少于 2 门专业课程**，明确课程修读要求。 |
| C | C5-10 · 参军退伍/创业休学 | `transfer_quota_exempt` | **参军退伍学生和认定为创业休学学生**申请转专业**不受专业计划数限制**，应符合国家相关规定和招生考试相关规定；学生复学时向本科生院提出 |
| C | C6-3 · 冲抵规则 🎯🎯🎯 | `innovation_credit_cap` | 创新创业学分**不等同于培养方案中的课程学分**，**仅可用于冲抵培养方案中的"劳动与创造"模块的必修学分**，**最高不超过 2 学分** |
| C | C6-4 · 累加规则 🎯🎯 | `innovation_credit_grade` | 不同类别的创新创业学分可累加。 |
| C | C6-5 · 项目级别认定标准 🎯🎯 | `innovation_project_credit` | 参加大学生创新创业训练计划项目并通过结题验收，按以下标准认定学分： |
| C | C6-6 · 竞赛获奖分值 🎯🎯 | `competition_credit_table` | 学生在省部级及以上级别的学科类和创新创业类竞赛获奖，按以下标准认定创新创业学分（**分三档**：顶级三赛事 / A 类竞赛 / B 类竞赛） |
| C | C6-7 · 团队赛规则 | `team_award_rules` | 以团队参加比赛： |
| C | C6-8 · 同作品多赛取最高 | `multi_award_dedup` | 学生以同一作品参加同一竞赛不同级别赛事（或在同一竞赛同一级别赛事中获得多个奖项），**按获得最高分值的获奖结果认定**创新创业学分。 |
| C | C6-9 · 论文/专利/著作分值 🎯🎯 | `publication_ip_credit_table` | 学生以华东师范大学为**第一完成单位**公开发表学术论文、获得知识产权或公开出版著作，按以下标准认定学分。**第二-四作者分值**用 `a/ |
| C | C7-1 · 三级分类 | `competition_level_def` | 学科竞赛按主办单位和规模分**国际级 / 国家级 / 省部级**三个级别： |
| C | C7-2 · A/B 类分级 🎯🎯 | `competition_grade` | 按学术水平和影响力分**高水平（A）和普通（B）两类**： |
| C | C7-3 · 同一作品多赛取最高 | `competition_dedup` | 以团队参赛的赛事，以团队为单位计算工作量；学生以同一作品参加同一竞赛不同级别赛事（或在同一竞赛同一级别赛事中获得多个奖项），**只取最高奖进 |
| D | D3-1 · 实习教学形式 | `internship_format` | 本科实习教学组织形式有**集中实习、分散实习**，提倡和鼓励由学部（院系）统一组织安排、专业教师带队的集中实习。对于分散实习，应加强过程性管 |
| D | D3-3 · 集中实习指导教师比例 | `internship_advisor_ratio` | **集中实习指导教师与实习学生的比例原则上不低于1:30，分散实习也应当安排校内教师跟踪指导。** 。 |
| D | D3-5 · 实习成绩考核 | `internship_grade_components` | 实习成绩由**实习日志、实习作业、实习单位评价以及考核成绩**等予以综合评定，考核形式可多样化；学部（院系）应制定实习成绩考核标准。 |
| D | D3-6 · 分散实习造假处理 | `internship_fraud` | 对分散实习的学生应严格考核制度；除对其实习报告进行评阅外，还可组织答辩。若有提交虚假证明、虚假报告的，**一经发现按违纪处理，实习成绩以不及 |
| D | D3-7 · 实习重修阈值 🎯🎯 | `internship_retake_threshold` | **实习考核不及格者**或**在实习期间请假、缺课时间达总实习时间 1/3 以上者**，应当**重修实习学分**。 |
| D | D4-16 · 竞赛作品替代毕业论文 🎯🎯🎯 | `thesis_substitute` | **创业大赛上海市铜奖及以上**或**"挑战杯"课外学术作品竞赛上海市二等奖及以上奖项**，**提供参赛作品与获奖证明可代替毕业论文**。 |
| D | D5-1 · 项目分级 | `ctp_project_levels` | 本科生创新训练计划项目分为： |
| D | D5-2 · 项目类型 | `ctp_project_types` | 项目分为三类： |
| D | D5-3 · 申报条件团队 🎯🎯 | `ctp_team_rules` | 项目团队成员原则上**均为全日制普通本科在读学生**；成员基本稳定，专业、能力结构较为合理；**团队人数不超过 5 人**，**项目负责人仅 |
| D | D5-4 · 指导教师 | `ctp_advisor_rules` | 项目申请团队应选择具有较高学术造诣、较好创新性的成果、热心教书育人、关爱学生成长的教师作为导师，一般应具有博士学位或中级以上职称。允许聘请校 |
| D | D5-6 · 答辩验收 🎯🎯 | `ctp_acceptance` | 学部（院系）自行组织专家对项目进行答辩评审；**各院系可根据实际验收情况评定优秀项目**，**优秀率一般不超过结题项目数的20%。未能按时提 |

---

## 2. 待用户拍板项

1. **canonical kind 名是否合适？** 8 个新档名（`time_limit` / `gpa_threshold` / `status_gate` / `warning_threshold` / `assessment_rule` / `score_scheme` / `tuition` / `program_rule`）。若要更短或更长可拍板。
2. **`program_rule` 是否拆？** 当前 40 条全归 `program_rule`，靠 `metadata.module ∈ {minor, double_degree, strong_base, innovation, ctp, internship, thesis, transfer, personalized}` 区分。优点：12 档总数控制住。缺点：单档体量大，UI 渲染要 case 分流。是否拆成 `program_threshold`（学分/数量类）+ `program_workflow`（流程类）= 13 档？
3. **`status_gate` 与 `warning_threshold` 是否合并？** `warning_threshold` 8 条都是"触发某档状态"，本质也是状态门槛。是否合并 = 17 条单档？
4. **现有 4 档（count/credits/one_of/all_of）保留 vs 重命名？** 当前在 99 条 digest 里没用到，但 0005 录入"修课要求"段时会用。保留即可，不需改名。
5. **metadata jsonb 是否在 0006 加 schema 约束？** 当前计划：`metadata jsonb NOT NULL DEFAULT '{}'::jsonb`，无 CHECK 约束，自由形态。是否要给某些 canonical kind 加 metadata key 必填校验（如 `time_limit` 必须有 `metadata.unit`）？还是全靠排队 13 zod 守？

---

## 3. 0006 schema 演进预期

```sql
-- 0006_extend_requirement_kinds.sql 关键改动
ALTER TABLE track_requirement DROP CONSTRAINT track_requirement_kind_chk;
ALTER TABLE track_requirement ADD CONSTRAINT track_requirement_kind_chk
  CHECK (kind IN (
    'count','credits','one_of','all_of',          -- 0002 现有 4 档
    'time_limit','gpa_threshold','status_gate',
    'warning_threshold','assessment_rule',
    'score_scheme','tuition','program_rule'        -- 0006 新加 8 档
  ));

ALTER TABLE track_requirement
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- threshold CHECK 改: 允许 metadata 非空替代 threshold
ALTER TABLE track_requirement DROP CONSTRAINT track_requirement_threshold_chk;
ALTER TABLE track_requirement ADD CONSTRAINT track_requirement_threshold_chk
  CHECK (
    kind = 'all_of'
    OR threshold IS NOT NULL
    OR metadata <> '{}'::jsonb
  );
```

---

## 4. 0005 录入策略预告

99 条 INSERT 按 canonical kind 分 8 段，每段顺序 `time_limit → gpa_threshold → status_gate → warning_threshold → assessment_rule → score_scheme → tuition → program_rule`。每条带：

- `source_ref`: `"ecnu_rules_digest_X.md §Xn-m"`（0004 加的列）
- `title`: digest § 名（去 🎯）
- `description`: digest 规则全文
- `kind`: canonical kind
- `metadata`: 按本文档 typical 形态填
- `threshold`: 单一数值阈值时填，复杂规则留 NULL 全靠 metadata
