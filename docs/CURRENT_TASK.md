# Current Task — Meridian sprint

> 短期工作内存。**AI 接手优先读这份**，再按需查 `AI_MEMORY.md` / `TECH_DEBT.md`。
> 铁律：只做下方「排队」里的事，做完停下汇报。「不要修改」当只读。

> Last updated: **2026-05-16**

---

## 目标

**两段式推进：先收尾「与毕业路径无关的后端基础」（排队 5/6/7），再进入产品核心「毕业路径结构化 + 画布重做 + AI 落地学校」（排队 8-13）。**

用户 2026-05-14 决定：

1. **先把跟毕业路径无关或基本无关的后端接好** —— 避免主线推进时回头补基建。
   - typed client（TD-3）/ chat_message 接入 / rule + rule_conflict 接入。
2. **再做毕业路径主线** —— 三问同根（画布主线分支 / AI 锁既定逻辑 / 何时灌学校数据），都卡在结构化 schema 不存在。

**TD-1（真 Anthropic）用户主动后放**。锁逻辑靠 prompt + zod schema，mock 够用，底层模型可换。
**TD-2（解析 pipeline）依赖 TD-1**，也后放。

---

## 排队（按优先级，一次开一条）

### 第一阶段 · 无关基础

#### 排队 5 — `supabase gen types` 切 typed client（TD-3）

- 现状：`profileApi.ts` / `planApi.ts` / `ragSourceApi.ts` 4 处 `as Profile / as RagSource / as Plan` 手维护类型。
- 工作量：半天。装 `supabase` CLI → 跑 `supabase gen types typescript --project-id <id> > src/types/db.ts` → 4 个 API 文件 import 替换。
- ROI 最高 → 排队 6/7/8-13 全部受益（不切的话，后面要加 chat_message/rule/rule_conflict/track_* 共 7 个手类型）。
- 完成标准：4 个 API 文件移除所有 `as X`；`tsc --noEmit` 干净；新加表自动有类型。

#### 排队 6 — `chat_message` 表接 `/ai-advisor` 对话历史（TD-7 余尾）

- 新建 `src/api/chatMessageApi.ts` + `src/hooks/useChatMessages.ts`。
- `/ai-advisor` 流式返回结束后把整条 user/assistant 消息写入 `chat_message`（`conversation_id` 用一次会话一个 uuid）。
- 页面加历史列表（按 `conversation_id` 分组 / 时间倒序，最近 N 条）。
- 流式中途 abort 也要落库（保 user msg + 部分 assistant 内容 + metadata.aborted=true）。
- 完成标准：刷新页面看得到上次对话；切 conversation 切上下文；与 `metadata` 字段对齐（DATA_MODEL §3.6）。

---

### 第二阶段 · 毕业路径主线

#### 排队 10 — 学校种子数据 seed SQL（华师大 2023 级）

**数据源文件清单**（CLAUDE.md 第 8 条禁扫名单，仅本任务 / 排队 13 读）：

| 路径 | 用途 |
|---|---|
| `docs/华师大规则文件pdf/*.md` + `*.toc.txt` | **source of truth**（codex 敏感词清洗版本科生手册 + 学习指南 + PDF 目录抽取），AI 读这里；PDF 原件在 .gitignore，仅本地 |
| `docs/_archive/华师大公示文件_old_md/` | 旧 23 份 md（已归档，digest v1 来源，**保留可回滚但不再 Grep**）|
| `docs/ecnu-digests/ecnu_rules_digest_{A,B,C,D,E}.md` | **5 份 digest v2**，~227 条 track_requirement 候选 + 6 项设计决策（A 末尾段）|
| `docs/ecnu-digests/_archive/` | 旧 4 份 digest（v1，已归档，**仅作历史对照**）|
| `docs/track_kind_taxonomy.md` | D-track-8 归并方案（98 自由 kind → 8 canonical kind，+ 4 现有 = 12 档）+ metadata 形态 |
| `docs/ecnu_process_rules.md` | 过程类规则精炼版（~500 行内），阶段 4 生成，喂排队 13 的 `gradPathAdvisorPrompt`（尚未写）|

---

- 手动 SQL `0005_seed_ecnu_2023.sql` —— 把培养方案录成 ~50-200 行 insert（首条 track 用 `scope_level='school'` 全校通用）。
- **不做 RAG，不做爬虫**。

**2026-05-16 数据源升级**：旧 34 份 md (`docs/华师大公示文件/`) → 新 2 份 PDF (`docs/华师大规则文件pdf/`)。**PDF 是 source of truth**，md 仅历史佐证。旧 md 处置：99 条录完 0005 后一次性 `git mv` 到 `docs/_archive/华师大公示文件_old_md/`，**禁止现在 rm**（digest 的 `source_ref` 还指着旧文件名 § 章节）。两份 PDF：
- `华东师范大学2025年本科生手册.pdf`（64 篇规章原文，对应旧 md）
- `华东师范大学2025年本科生学习指南.pdf`（FAQ + 培养方案 + 学分构成核心数据 + 师范生 + 微专业 + 卓越学院）

**前置子任务（2026-05-15 拍板，分 4 批读 + 双层记录 + schema 加 source_ref）**：

1. **分批读 + 逐批校验** — 34 个 md 分 4 批，每批读完先出 digest 让用户拍板，再进下一批：
   - 批 A · 毕业资格核心（5 个）：学籍管理 / 毕业资格审核 / 学士学位授予 / 成绩及学分认定 / 课程考核
   - 批 B · 学业规则类（6 个）：选课退课 / 成绩管理 / 学业预警 / 考勤 / 体质健康 / 学分制收费
   - 批 C · 特殊计划/加分（7 个）：辅修 / 双学位 / 强基计划 / 个性化培养 / 转专业 / 创新创业学分 / 学科竞赛
   - 批 D · 过程类（5 个）：注册 / 休学复学 / 实习 / 毕业论文 / 创新训练
   - 跳过：研究生免试 / 师范生教育教学考核 / 第二学士学位 / 少数民族预科 / 境外联合培养 / 学籍学历电子注册 / 学生证 / 学分制收费(老版) / 本科论文抽检
2. **两层记录**：
   - 人读层 `docs/ecnu-digests/ecnu_rules_digest_{A,B,C,D}.md` —— 每条规则 4 字段：规则中文 / 原文片段 / 来源(文件名 §章节) / 落地(入 track_requirement / 入 prompt / 不入)
   - 机读层 `supabase/migrations/0005_seed_ecnu_2023.sql` —— 可结构化的入 track_requirement / track_option，每行 INSERT 带 `-- source:` 注释
3. **schema 加 source_ref（在 seed 之前）** — 新建 `supabase/migrations/0004_add_source_ref.sql`：
   - `track_requirement.source_ref text` 可空
   - `track_option.source_ref text` 可空
   - 自由字符串，存 "文件名 §章节"；AI 输出时引；UI hover 显示
4. **过程类规则** — 单出 `docs/ecnu_process_rules.md` 精炼版（~500 行内）：选课退课流程、转专业流程、考勤等不入 track_* 但 AI 顾问要知道的内容。排队 13 写 `gradPathAdvisorPrompt` 时一起喂。

**触发顺序**：用户说「开始批 A」→ 读 5 个 md → 写 digest A → 停 → 用户拍板 → 同样跑 B/C/D → 4 个 digest 都过 → 写 0004 + 0005 + ecnu_process_rules.md → 排队 13 接 AI prompt + UI 展示 citations。

**只做本科生内容**，硕士/博士相关全跳。

#### 排队 11 — `course` 表接 API + UI 入口

- 新建 `courseApi.ts` + `useCourses.ts`。
- UI 入口：在 `/profile` 或 `/upload` 加"我已修的课"列表/Drawer。
- 画布要读这个判断"哪些 option 已完成"，排队 12 前置。

#### 排队 12 — 画布改造（思维导图体验）

- `plan` 表保留，语义变成「用户在 track 树上的标注 + 自由备注」。
- 主线 = 横向排列的 `track_category`。
- 点击 category → requirement 列表；点击 requirement → option 列表。
- option 颜色按 user_progress + course 表是否已修。

#### 排队 13 — AI 接 track + user_progress + course（schema 锁逻辑）

- `src/ai/prompts.ts` 加 `gradPathAdvisorPrompt`（system prompt 硬编码"你是 Meridian 规划顾问，只能基于以下 track 数据 + 用户进度回答…"）。
- `src/ai/schema.ts` 加 zod 类型：`PathSuggestion` / `OptionRanking` / `RequirementGap`。
- mock provider 沿用模板化 rationale，**还不接真 Anthropic**。

---

### 第三阶段 · UI 重设计（在主线全部跑通后）

#### 排队 14 — 全局功能页前端视觉重设计

- **触发条件：排队 12 完成（画布改造跑通、数据层稳定）后才启动**。在此之前不动功能页 UI。
- 用户 2026-05-15 决定：「现在改 UI = 白做」，等 track schema + 画布交互模型确定再批量对齐视觉。
- 范围：`/dashboard` / `/ai-advisor` / `/schedule` / `/import` / `/course-planner` 五个功能页（落地页 + 路由 + 全局布局仍在「不要修改」清单）。
- 准备工作（可以提前做，不阻塞主线）：
  - 更新 `docs/DESIGN_SYSTEM.md` 风格指南（颜色 / 字体 / 间距 / 卡片 / 动效原则）—— 稳定层，schema 变也不失效。
  - 排队 8 完成（schema 锁了）后可以画 Figma 稿，但**不要动代码**。
- 完成标准：五个功能页对齐新视觉；保持 CLAUDE.md 的 "low saturation / Apple-like / clean academic"；mobile responsive。

---

## 并行/穿插（不阻塞主线，但要做）

- **TD-4 全局 Toaster** — 排队 6/7 错误会变多，做完更稳，但不卡。
- **TD-2 解析 pipeline** — 非结构化数据（公告/手册细节）入口，挂到 requirement 上做 RAG 增强。**主线不依赖**。

---

## 已推迟（先不做）

- **TD-1 接真 Anthropic** — 用户 2026-05-14 主动后放。锁逻辑靠 prompt + schema，mock 够用。
- **TD-2 解析 pipeline** — 跟 RAG 公告一起做，依赖 TD-1。

---

## 当前阻塞

**无。阶段 3 已落库 (2026-05-16)，下一步起阶段 4 ecnu_process_rules.md。状态盘点：**

1. ~~**0002 SQL 跑通**~~ ✅ 2026-05-15 用户回报全 OK
2. ~~**0003_relax_track_scope SQL 跑通**~~ ✅ 2026-05-15 用户回报「没问题了」
3. ~~**重新 gen types 同步 db.ts**~~ → **推到排队 11**。2026-05-15 用户跑 `> src/types/db.ts` 命中 `Access token not provided` 错误，shell 已 truncate 旧 db.ts → 已用 `git checkout HEAD -- src/types/db.ts` 从 commit `387e5ba` 恢复（471 行，含 0002 之前的 7 表）。**db.ts 暂不含 0003 列（scope_level / college）**，但 src/ 里还没业务代码用 track 表，所以不阻塞 schema 演进；等排队 11 真正写 `courseApi` / 涉及 track 时再用[[feedback-supabase-gen-types-safe]] 安全跑法重生成。
4. **读规则 md** — 用户已把规则导出到 `docs/华师大公示文件/`（**未读，等用户说『开始』**）。用户明确「先别读，规则比较复杂」。`docs/raw/` 已删除（不再需要图片路径）。

**2026-05-16 状态（v2 重写完毕：5 份 digest 全删旧版从新 md 重写，共 ~227 条 track_requirement 候选）：**

| digest | 文件 | 条数 | 来源校规数 | 主要 kind 分布 | 备注 |
|---|---|---|---|---|---|
| 批 A 毕业资格核心 | `docs/ecnu-digests/ecnu_rules_digest_A.md` | 29 | 5 | time_limit / status_gate / warning_threshold / gpa_threshold | 含 6 项设计决策段，B/C/D/E 沿用 |
| 批 B 学业规则类 | `docs/ecnu-digests/ecnu_rules_digest_B.md` | 57 | 6 | score_scheme（含附录两张表）/ warning_threshold / assessment_rule / tuition | GPA 公式 / A 等比例 / 退学线 |
| 批 C 特殊计划 | `docs/ecnu-digests/ecnu_rules_digest_C.md` | 56 | 9 | program_rule（含创新创业三张分值表 + 学科竞赛两张奖金表）| 含 C9 推免段（新增）；C3 强基 ⚠️ 散见 4 条 |
| 批 D 过程类 | `docs/ecnu-digests/ecnu_rules_digest_D.md` | 60 | 6 | time_limit / assessment_rule / status_gate / score_scheme | 含 D5 毕业论文抽检（独立成段）|
| 批 E 培养方案与学分构成 | `docs/ecnu-digests/ecnu_rules_digest_E.md` | 25 | — | credits / program_rule | **首次纳入**：本科教育目标 / 公共必修 40 学分 / 通识 8 学分 / 师范生 scope=college |

**重写原因**：用户 2026-05-16 拍板「以新 PDF 清洗 md 为 source of truth，全删旧 digest 重写而非差分修补」。验证通过 —— 旧 OCR 三张表分值数字在新 md 中文本完整呈现（甚至多了 CCF-A/B/C / 中科院一二三区 / SSCI/A&HCI 等细节）。旧 4 份 digest 已归档 `docs/ecnu-digests/_archive/`。

**6 项设计决策（A 段固化，B/C/D/E 沿用，不再逐份重审）**：
1. 多条款合一条：同一法律条文下子项归并 + metadata 数组表达分支
2. 跨 digest 重叠规则：先出现段留 cross-link prompt，主负责段升级 track_requirement
3. `time_limit` 用 `metadata.direction` 表达上下限，控制 12 档 kind 总数
4. 分支 GPA 阈值用 object 结构 `{ gpa_min: number|null, criterion?: string }`
5. AI 顾问无关条款（监考标准等）digest 阶段直接删，不进 process_rules
6. `source_ref` 统一格式：`华东师范大学2025年本科生手册.md §章节 第x条`

**⚠️ 2 处待用户拍板（不阻塞 0005 seed SQL）**：
1. **C3 强基计划独立办法在新 PDF 中未收录**：仅基于手册 1608/2832/2938 + 指南 1063/1077 散见条款重写 4 条（AI 建议接受现状，等学校发新版补）
2. **E2 公共必修 40 学分组成求和**：思政 17 + 英语 8 + 计算机 0/3/5（师范 4）+ 体育 4 + 国情 3 + 劳动 2 + 心理 2 = 36-41 浮动；指南给"40 学分左右"，AI 顾问直接引用即可

**下一步**：
1. ~~**0004_add_source_ref.sql** + verify~~ ✅ 2026-05-16 commit `a2b955f`
2. ~~**阶段 1**：`docs/track_kind_taxonomy.md` 12 档 canonical kind~~ ✅ 2026-05-16
3. ~~**阶段 2 SQL**：`0006_extend_requirement_kinds.sql`~~ ✅ 2026-05-16
4. ~~**阶段 3 前置**：digest A/B/C/D/E v2 全部重写~~ ✅ 2026-05-16 commit `cd6c7f4`
5. **阶段 3**：`supabase/migrations/0005_seed_ecnu_2023.sql` —— 详见下方 ⏸ 段。
6. **阶段 4**：`docs/ecnu_process_rules.md` —— 各 digest 末尾「与阶段 4 边界」段列出的 prompt 类规则 + AI 顾问背景知识，精炼版（~500 行内）喂排队 13 `gradPathAdvisorPrompt`。
7. **旧 md 处置** ✅ 2026-05-16 已 `git mv` 到 `docs/_archive/华师大公示文件_old_md/`（commit `fcc57be`）
8. **gen types** 不阻塞主线，推到排队 11 一起做。用[[feedback-supabase-gen-types-safe]] 的双步 `.tmp` 安全跑法。

---

### ✅ 阶段 3 - 0005 seed SQL 已落库（2026-05-16 用户 Supabase Dashboard 跑通）

**全段写入 + 跑通（2026-05-16）**：
- ✅ `0005_seed_ecnu_2023.sql` 全段 —— 2 track + 30 category + **198 requirement**，整片 PL/pgSQL DO 块 + ON CONFLICT 幂等可重跑
  - 单文件分批 Edit 注入：A(已有, 23) + B(48) + C(56) + D(49) + E全校(14) + E师范(8)
  - 198 个 metadata JSON 全部 `JSON.parse` 通过（修了 D4-6 一处 `"key:value":value` 误写）
  - 段分布与计划完全对齐：A1=9 / A2=2 / A3=4 / A4=3 / A5=5 / B1=6 / B2=14 / B3=5 / B4=6 / B5=7 / B6=10 / C1=10 / C2=7 / C3=4 / C4=2 / C5=8 / C6=9 / C7=4 / C8=4 / C9=8 / D1=5 / D2=7 / D3=6 / D4=15 / D5=7 / D6=9 / E1=2 / E2=8 / E3=4 / E4=8
- ✅ `0005_verify.sql` 扩 8 段 → 15 段全段验证（含 5 个抽样 + module 分布 + 师范学院 track 单查）
- ✅ **用户 Supabase Dashboard 跑通**（2026-05-16）：seed + verify 两份 SQL 均 OK，198 条 requirement 落库, 15 段验证全 pass

**两 track 颗粒度（已落库）**：
- `track[school='华东师范大学', year=2023, scope_level='school', college=NULL, major=NULL]` → 挂 29 category (A1-A5/B1-B6/C1-C9/D1-D6/E1-E3) + 190 requirement
- `track[..., scope_level='college', college='师范学院', major=NULL]` → 挂 1 category (E4) + 8 requirement

**12 档 kind 分布（已验证）**：
| kind | n | 主要来源 |
|---|---|---|
| program_rule | 56 | C 项目级 + D 项目级 + E4 师范段 |
| assessment_rule | 37 | A5 课程考核 + B 过程类 + D 过程类 |
| status_gate | 31 | 各段状态门槛 |
| time_limit | 21 | A 学籍/休复学 + B 免听免修 + D 注册/休学 |
| credits | 13 | E2/E3 全校公共必修 + 通识 + E4 师范课程结构 |
| gpa_threshold | 11 | A3-2 学位 / B5 体测 / C9-1 推免 / D 优秀率 |
| score_scheme | 11 | B2/B5/B6 成绩记分 + D4 五级记分 |
| warning_threshold | 8 | A1-10 / B3 预警退学 / D 重修阈值 / D5 抽检 |
| tuition | 8 | B6 学分制收费 + C1-5 辅修学费 |
| all_of | 2 | E2-1 思政 6 门 / E2-5 国情教育 2 门 |
| count / one_of | 0 | 留给排队 11 课程列表 |

**下一步**：
1. ~~阶段 3 0005 seed SQL~~ ✅ AI 写完 + 用户 Dashboard 跑通（2026-05-16）
2. **阶段 4** `docs/ecnu_process_rules.md` —— 各 digest 末尾「与阶段 4 边界」段的 prompt 类规则 + AI 顾问背景知识，精炼版（~500 行内）喂排队 13 `gradPathAdvisorPrompt`
3. **gen types** 推到排队 11 一起做，用 [[feedback-supabase-gen-types-safe]] 安全跑法

**⏳ 已采纳决策（不再追问）**：
- C3 强基计划独立办法在新 PDF 未收录 → 接受 4 条散见现状（2026-05-16 用户拍板）
- E2 公共必修「约 40 学分」→ AI 顾问直接引用指南，不强制求和（2026-05-16 用户拍板）
- 师范学院 track 颗粒度 = 单一 `college='师范学院'`，不按具体师范专业拆（2026-05-16 用户拍板）

---

## 不要修改

- 全局 `src/components/layout/`（Navbar / Footer / DashboardLayout / UserMenu）
- 落地页 `src/pages/Home/*`
- 路由根与分组：`src/routes/__root.tsx` · `src/router.tsx` · `src/routes/_app.tsx` · `src/routes/_app/*`（除非任务要求加 beforeLoad）
- 菜单单一真理 `src/config/menu.ts`（除非要新增菜单项 / 调整 title 文案）
- 设计令牌 `src/styles/variables.css` · `globals.css`
- 笔记本相关 effects（EmbeddedLaptop / GridMotion / CardSwap / TiltedCard）
- Supabase 接入面 `src/lib/supabase.ts` · `src/api/authApi.ts` · `src/context/AuthContext.tsx`（公共 API 已稳定）
- 自动生成 `src/routeTree.gen.ts`
- 已有 commit 历史（禁 `git reset` / `git rebase`）

---

## 完成标准（对任一排队任务）

- [ ] `tsc --noEmit` 干净（允许 CardSwap.tsx 历史遗留错）
- [ ] 视觉符合 `DESIGN_SYSTEM.md`
- [ ] 没碰「不要修改」清单里的文件
- [ ] 已记入「最近完成」+ 必要的技术债已挪到 `TECH_DEBT.md`

---

## 最近完成（最多 5 条）

> 详细技术债见 `TECH_DEBT.md`；项目时间线见 `AI_MEMORY.md` § 9。
> 早于 2026-05-14 的里程碑（排队 5 / 2 / 4b / 4a / profiles / DATA_MODEL）已挪到 `docs/AI_MEMORY.md` § 9。

- **2026-05-16** — 阶段 3 — 0005 seed SQL ✅ 落库（198 条 requirement / 用户 Supabase Dashboard 跑通）
  - `supabase/migrations/0005_seed_ecnu_2023.sql` 全段 —— 2 track（school + 师范学院 college）+ 30 category（A1-A5/B1-B6/C1-C9/D1-D6/E1-E3 + E4）+ **198 track_requirement**。整片 PL/pgSQL DO 块 + `ON CONFLICT (category_id, code) DO UPDATE` 幂等可重跑。
  - 段分布：A 23 + B 48 + C 56 + D 49 + E全校 14 + E师范 8 = 198。
  - 实施策略：用户拍板单文件分批 Edit（A 方案）——skeleton + A 段（已有 23 行）+ 5 次 Edit 注入 B/C/D/E全校/E师范，避免一次 Write 几千行卡顿。
  - 198 个 metadata JSON 全部 `JSON.parse` 通过（D4-6 一处 `"key:value":value` 误写修复）；198 INSERT 段分布精确符合计划。
  - `supabase/migrations/0005_verify.sql` 扩 8 段 → 15 段全段验证：基本结构（§ 1-5）+ 完整性（§ 6-7）+ 5 个抽样段（A1-10 / B3-1 / C6-6 三档赛事 / C7-2 A 类奖金 / D4-12 重复率两档 / E2-3 计算机分支 / E4 师范全部 8 条）+ § 15 module metadata 分布。
  - 12 档 kind 分布（已验证）：program_rule 56 / assessment_rule 37 / status_gate 31 / time_limit 21 / credits 13 / gpa_threshold 11 / score_scheme 11 / warning_threshold 8 / tuition 8 / all_of 2 / count + one_of 0。
  - **用户 Supabase Dashboard 跑通**（2026-05-16）：seed + verify 两份均 OK，零反馈修复，落库零错。
  - 解锁后续：阶段 4 `docs/ecnu_process_rules.md`（prompt 类规则精炼版给 `gradPathAdvisorPrompt` 用）+ 排队 13 AI 顾问真正能从 198 条结构化规则中取数。

- **2026-05-16** — 数据源切 PDF + 旧 md 处置方案 + CLAUDE.md 分流条 + TD-26 入册
  - 用户提供 2 份新 PDF（`docs/华师大规则文件pdf/2025本科生手册.pdf` + `2025本科生学习指南.pdf`），PDF 是 source of truth，旧 34 份 md 仅历史佐证。
  - 全局 CLAUDE.md 加「数据源文件分流」条：规则源文件只在排队 10 / 13 读，其他任务禁 Grep。
  - 旧 md 处置：99 条录完 0005 后一次性 `git mv` 到 `docs/_archive/`，禁止现在 rm（digest `source_ref` 链）。
  - 两本 PDF 目录已盘点：手册 64 篇（21 已 digest 覆盖 / 5 跳过 / 14 新内容 / 15 奖励处分多半 prompt / 14 学习生活多半跳）；学习指南 P0 核心数据在 二.03/04/05（培养方案 + 公共必修 + 通识学分构成）。
  - 师范生入 track（scope=college）/ 微专业单独 track（2026-05-16 拍板）。
  - 新增 TD-26：PDF 内联预览 + source_ref 精确到页码，推到排队 14 UI 重设计统一做。

- **2026-05-16** — TD-25 修 — `/schedule` 闪屏（"先一个界面，~1s 后跳到另一个"）
  - 入口溯源：导航「Rule Graph · 规则透明与来源」`menu.ts:55-62` → `/schedule`，**不是落地页 Transparency 锚点**（TECH_DEBT 原描述指错了）。
  - 根因：`SchedulePage` 的状态分支 `isGuest = !authLoading && !user` / `isEmpty = !loading && ...` 把 loading 期判成 false → 第一帧渲染空 Trust 列 + 空树 → 等 auth+hook（约 800ms-1s）落地后才切到 SEED 或真实数据。两段跳变 = 用户感知的"闪屏"。
  - 修：`src/pages/Schedule/index.tsx:63-70` 引入 `isResolving = authLoading || loading`，并入 `showSeed = isResolving || isGuest || isEmpty`。第一帧直接显示 SEED；访客 / 登录空态全程 SEED 无跳变；登录有数据 → SEED → 真实数据一次切换（预期，不算 bug）。
  - `canEdit = !isGuest && !authLoading` 保持原样 → loading 期 SEED 上不出 CRUD 按钮，避免点了未鉴权按钮。
  - `tsc --noEmit`：仅 CardSwap 历史遗留错（允许）。零新增类型错误。
  - TECH_DEBT.md TD-25 段标 ✅ 2026-05-16 已修并写明修法 / 副作用。

- **2026-05-15** — 排队 10 前置 — 华师大 23 个 md → 4 份 ECNU 规则 digest 录入完毕
  - **AI 一次性读完 23 个 md（剔除硕博/二学位等不相关 11 个）→ 写 4 份 digest**：
    - `docs/ecnu-digests/ecnu_rules_digest_A.md` 毕业资格核心（学籍管理 / 毕业资格 / 学士学位 / 成绩学分认定 / 课程考核）
    - `docs/ecnu-digests/ecnu_rules_digest_B.md` 学业规则（选课退课 / 成绩管理 / 学业预警 / 考勤 / 体质健康 / 学分制收费）
    - `docs/ecnu-digests/ecnu_rules_digest_C.md` 特殊计划（辅修 / 双学位 / 强基 / 个性化 / 转专业 / 创新创业学分 / 学科竞赛）
    - `docs/ecnu-digests/ecnu_rules_digest_D.md` 过程类（注册 / 休学复学 / 实习 / 毕业论文 / 创新训练）
  - **每条规则强制 4 字段**：规则中文 / 原文片段 / 来源(§条款) / 落地(track_requirement 或 prompt)。结构稳定，下游 seed SQL 可机器扫描。
  - **用户审阅工作流**：用户在 IDE 直接改 4 份 md 补 ⚠️ / 修正规则行 → AI 收 system-reminder 同步「落地」行去 ⚠️ / 升级到 track_requirement 结构 → chat 互验 typo（A2-2 肄业 → 毕业 这种被 AI 主动质询）。
  - **工具补强：AI OCR**：用户把表格放桌面 `C:\Users\J-R-N\Desktop\Cx-y.png` 命名 → AI Read 读图 → 录入 markdown 表 + 落地行结构。批 C 三张表（C6-5 项目 / C6-6 竞赛 / C6-9 论文专利著作）就是这样录入。
  - **拍板覆盖度**：A/B/C/D 4 份的「待用户拍板要点」段几乎全部 ⚠️ 解决；剩余 2-3 条不影响 track 结构化（D2-8 因病医药费 / D5-8 教师工作量）。
  - 修两个 typo：A2-2 落地行同步「肄业→毕业」；D3-6 用户重复粘贴的句子去重。
  - **解锁 task #4**：写 `0004_add_source_ref.sql`（schema 加 source_ref 列）+ `0005_seed_ecnu_2023.sql`（按 4 份 digest 把 track_requirement 候选录成 INSERT）+ `docs/ecnu_process_rules.md`（过程类精炼版给 AI prompt 用）。
  - 新增技术债：TD-25 落地页「规则透明与来源」section 闪屏 bug（用户报）。

- **2026-05-15** — 0003 — track schema scope 三档演进（排队 9 之后插入的小迭代，不算新排队）
  - 用户决定「学校多数规则全专业通用，学院间才有差异」→ track 字段从 `(school, major, year)` UNIQUE 演进为 scope 三档表达适用范围。
  - 新建 `supabase/migrations/0003_relax_track_scope.sql`：ALTER 现有 track 表（保留 RLS / trigger / 旧索引），DROP 旧 UNIQUE 约束 → `major` 改 nullable → 新增 `scope_level text DEFAULT 'school'` + `college text`（可空）→ 两个 CHECK 约束（`scope_level` 三档枚举 + 三档语义自洽）→ 新建表达式 UNIQUE INDEX 用 COALESCE 处理 NULL → partial index `idx_track_school_college`。
  - 新建 `supabase/migrations/0003_verify.sql`：9 段验证（新列存在 / CHECK 约束就位 / 旧 UNIQUE 已删新 INDEX 已建 / 插入合法 school+college+major 三档示例 / 违规数据被拦截测试段注释保留 / 自动 cleanup）。
  - 更新 `docs/TRACK_SCHEMA.md`：§3.1 track 表字段表加 scope_level + college；约束段升级为表达式 UNIQUE；新增「scope_level 语义 + 三档自洽」表 + 业务层 fallback 匹配规则（profile.college/major → major track → college track → school track 逐层降级）；D-track-2 决策点 v2 升级标注。
  - `docs/raw/` 目录删除（用户改成 md 路径，规则文件已挪到 `docs/华师大公示文件/`，未读）。
  - 用户侧待操作：在 Supabase Dashboard 跑 `0003_relax_track_scope.sql` + `0003_verify.sql` → 跑通后重新跑 `supabase gen types typescript --project-id tukdczwcygcgpxmdhobl --schema public > src/types/db.ts` 让 typed client 反映新列。

- **2026-05-15** — 排队 9 — `0002_add_track_schema.sql` migration + verify + DATA_MODEL 入口
  - 新建 `supabase/migrations/0002_add_track_schema.sql`：5 张表（track / track_category / track_requirement / track_option / user_progress）+ 8 索引 + RLS（4 公共表 `SELECT USING (true)` + user_progress 4 条 owner CRUD policy）+ 5 个 `set_updated_at` trigger（沿用 0001）+ 所有 CHECK 约束（kind 枚举 / threshold 必填规则 / course kind credits 必填 / user_progress status 枚举 / year 范围）+ UNIQUE 约束（track 三元组 / category code / requirement code / option code / user_progress user-option）。**完全幂等**（DROP IF EXISTS + CREATE IF NOT EXISTS），失败回滚重跑即可。
  - 新建 `supabase/migrations/0002_verify.sql`：9 段独立验证查询（表数 5 / RLS 全开 / policy 合计 8 / trigger 数 5 / 4 公共表空读不报错 / service_role 写公共表 / CASCADE 跟删链路 / user_progress 留排队 10 后再验）。
  - `docs/DATA_MODEL.md` §2 表清单速览段后加 track_* + user_progress 段 + cross-link 指 TRACK_SCHEMA.md（明确说"本文件仅维护 7 张 user-owned 表；track_* 文档独立避免互相挤占"）。
  - **用户侧待操作**：去 Supabase Dashboard SQL Editor 粘 `0002_add_track_schema.sql` 跑 → 粘 `0002_verify.sql` 逐段跑确认输出 → 然后启动排队 10（提供培养方案原始资料）。

- **2026-05-15** — 排队 8 — `docs/TRACK_SCHEMA.md` 起草（毕业路径五层结构契约）
  - 用户拍板 7 个决策点（D-track-1 ~ D-track-7）：track_* 公共表 + service_role 写 / track 颗粒度 (school, major, year) / requirement 平铺不嵌套 / option `kind: course|alt|project` / user_progress option 级 / AI 整 JSON 喂 prompt / prerequisite 用 `option.prerequisites text[]` 弱实现。
  - 新建 `docs/TRACK_SCHEMA.md`（420 行）：§0 设计原则 / §1 决策点表 / §2 表清单速览 / §3 五张表详情（track / track_category / track_requirement / track_option / user_progress 各含字段表 + RLS + 约束 + 索引）/ §4 RLS 总览 / §5 ASCII 关系图（含冗余 track_id 链路说明）/ §6 推迟项（prerequisite 关系表、requirement 嵌套、schools / majors 字典表、catalog 公共表已弃）/ §7 排队 9-13 迁移路径。
  - 关键设计：track 按 (school, major, year) UNIQUE；category / requirement / option 都用 `order_index` 排序 + `code` 机器名 + `title` 展示名；requirement.kind 四档（count / credits / one_of / all_of）+ threshold；option.kind 三档（course / alt / project）；user_progress.status 五档（planned / enrolled / done / waived / dropped）+ UNIQUE (user_id, option_id)。
  - 不写 SQL（留排队 9）；不写 seed（留排队 10，等用户提供原始培养方案）。
  - 完成标准：与 DATA_MODEL.md 同款 markdown 格式 + 表格风格；与 `rule` 表（D7=a 用户私有）分工清晰：rule = 主观偏好，track = 客观规则。

