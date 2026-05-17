# Current Task — Meridian sprint

> 短期工作内存。**AI 接手优先读这份**，再按需查 `AI_MEMORY.md` / `TECH_DEBT.md`。
> 铁律：只做下方「排队」里的事，做完停下汇报。「不要修改」当只读。

> Last updated: **2026-05-17**

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

- **TD-2 解析 pipeline** — 非结构化数据（公告/手册细节）入口，挂到 requirement 上做 RAG 增强。**主线不依赖**，依赖 TD-1。

---

## 已推迟（先不做）

- **TD-1 接真 LLM provider** — 2026-05-17 用户拍板 "可能接 DeepSeek / Qwen / Zhipu / Anthropic 任一家"，骨架已升级为 provider-agnostic（`/api/ai.chat` 走本地 server proxy）；具体 server route 等用户决定上游再写。详见 `docs/AI_PROXY_SPEC.md`。
- **TD-2 解析 pipeline** — 依赖 TD-1，跟 RAG 公告一起做。

---

## 当前阻塞

**无。等用户拍板下一波方向。** 候选：

1. **阶段 4** `docs/ecnu_process_rules.md` — 把各 digest 末尾「与阶段 4 边界」段的 prompt 类规则 + AI 顾问背景知识精炼成 ~500 行内单文档，喂排队 13 的 `gradPathAdvisorPrompt`。**用户说"开始阶段 4"即启动。**
2. **排队 11** `course` 表接 API + UI 入口（db.ts 已重 gen 解锁）。
3. **TD-10** target_gpa / goal_weights UI（需用户拍板：放 Upload 设置区还是新建 Settings 页 / weights 是 8 个 slider 还是简化）。
4. **TD-1 余尾** 拍板 LLM 上游（DeepSeek / Qwen / Zhipu / Anthropic）→ 写 `src/routes/api/ai.chat.ts` server route，详见 `docs/AI_PROXY_SPEC.md`。

### ✅ 阶段 3 — 0005 seed SQL 已落库（2026-05-16）

5 份 digest v2 → 198 条 track_requirement + 2 track（全校 / 师范学院 college）+ 30 category 落库。
详细分布 / kind 统计已挪到 `AI_MEMORY.md`；本段只保留入口。

**⏳ 已采纳决策（不再追问）**：
- C3 强基计划独立办法在新 PDF 未收录 → 接受 4 条散见现状
- E2 公共必修「约 40 学分」→ AI 顾问直接引用指南，不强制求和
- 师范学院 track 颗粒度 = 单一 `college='师范学院'`，不按具体师范专业拆

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

- **2026-05-17** — 基础设施 + TD 清理大波次（架构审计 + 16 条 TD 闭环）
  - **架构审计**：合并 `docs/ARCHITECTURE_AUDIT.md`（5-09 + 5-16 两轮），删冗余日期版，AUDIT = 历史快照 / TECH_DEBT = 唯一权威 backlog
  - **文档漂移修**：`PROJECT_OVERVIEW.md` / `ARCHITECTURE.md` 删 services/ + 老 hooks 描述，对齐当前 api + hooks 三层架构；`SCHEMA_EVOLUTION` 合进 `DATA_MODEL §10`
  - **AI 抽象升级 v2**（用户决定 LLM 未定 → provider-agnostic）：`Token` discriminated union（留 citation / tool_use 扩展位）+ 新 `providers/remote.ts` 走 `/api/ai.chat` server proxy + 新 `docs/AI_PROXY_SPEC.md`（4 家 LLM SSE 协议速记）。server route 待用户拍 LLM 上游再写
  - **错误暴露 UI**：`src/lib/errorBus.ts` (`reportApiError` / `failApiCall`) + `__root.tsx` 挂 `<Toaster richColors />` + 6 个 api/*.ts 接 errorBus（authApi 不接，避免 Login 红字双重显示）
  - **Drawer 抽 hook**：`src/hooks/useDrawer.ts`（scroll-lock + Esc + 可选 closeOnRouteChange），Navbar + DashboardLayout 各删 ~30 行
  - **track schema 字面量**：`src/types/trackEnums.ts`（12 档 kind + 3 档 scope/option + 5 档 status）与 SQL CHECK 同源，db.ts 漂移期间唯一可信来源
  - **db.ts 重 gen**（SB1 解锁）：从 471 行（0002 前快照）→ 743 行（含 track_* / user_progress / scope_level / 12 档 kind）
  - **Migration 规约**：`supabase/migrations/_template.sql`（UP + DOWN 注释段）+ `DATA_MODEL §10` 规约（幂等 / verify / DOWN / 命名 / CHECK 修改）
  - **ProfileContext race**：`updateProfile` 接共享 `requestIdRef`，spam-click / logout / 切账号期间过期响应丢弃
  - **useRagSources 防护**：`MAX_UPLOAD_BYTES = 50MB` 预检 + upload 抛错（不再返 null）+ remove deps 改 `[]` + drop 路径加 `matchesAccept()` 类型校验
  - **Dashboard 部分接通**：删教务 shortcut（立项书严禁爬学校系统）+ 卡 5「下一步建议」接 `NEXT_STEP_POOL` 8 句文案池按小时轮换 + Navbar/DashboardLayout 接 `useProfile` 让头像/名称跟随 profile.name + Upload 加显示名输入字段
  - **小修**：`components.json` css 入口 `src/styles.css` → `src/styles/globals.css`；ragSourceApi 删死代码 catch；bucket 名走 `VITE_SUPABASE_RAG_BUCKET` env；grade 无效输入 reset
  - **TD 状态**：TD-3/4/5/14/15/16/17/19/21/23/24/25 + TD-27~30 共 16 条闭环 → 直接从 TECH_DEBT.md 删除（按规约"完成即删，git 历史可追溯"）；剩 4 条部分余尾（TD-1/11/12/13）精简描述
  - 验证：`tsc --noEmit` 0 新错误（仅 CardSwap 原 effects bug）；eslint 0 真错误（CRLF 噪声是项目级老问题）

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

