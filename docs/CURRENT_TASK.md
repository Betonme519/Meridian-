# Current Task — Meridian sprint

> 短期工作内存。**AI 接手优先读这份**，再按需查 `AI_MEMORY.md` / `TECH_DEBT.md`。
> 铁律：只做下方「排队」里的事，做完停下汇报。「不要修改」当只读。

> Last updated: **2026-05-14**

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

#### 排队 7 — `rule` + `rule_conflict` 表接 `/schedule`（原 4c，TD-24）

- 新建 `src/api/ruleApi.ts` + `ruleConflictApi.ts` + `src/hooks/useRules.ts`。
- `/schedule` 删 const 数据，CRUD 跑通：增删改 rule + rule_conflict。
- 完成标准：UI 可增删改 + 冲突高亮 + `tsc --noEmit` 干净 + 没碰「不要修改」清单。

---

### 第二阶段 · 毕业路径主线

#### 排队 8 — `docs/TRACK_SCHEMA.md` 起草（毕业路径五层结构）

- 定五层契约：`track` / `track_category` / `track_requirement` / `track_option` / `user_progress`。
- 关键待决策：track_* 公共 SELECT + service_role WRITE，还是用户私有？推**公共 + service_role**（D7 rule 私有不冲突，rule 是用户主观偏好，track 是学校客观规则）。
- 不写 SQL，只定结构 + 决策点，跟 `DATA_MODEL.md` 同款格式。

#### 排队 9 — `0002_add_track_schema.sql` migration

- 按排队 8 文档建 5 张表 + RLS + index + trigger。
- `track_*`：`SELECT` public，`INSERT/UPDATE/DELETE` 限 service_role。
- `user_progress`：owner only。
- 在 `DATA_MODEL.md` 补 §3.8-§3.12。

#### 排队 10 — 学校种子数据 seed SQL

- 手动 SQL `0003_seed_<school>_<major>.sql` —— 把培养方案录成 ~50-200 行 insert。
- **不做 RAG，不做爬虫**。

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

## 并行/穿插（不阻塞主线，但要做）

- **TD-4 全局 Toaster** — 排队 6/7 错误会变多，做完更稳，但不卡。
- **TD-2 解析 pipeline** — 非结构化数据（公告/手册细节）入口，挂到 requirement 上做 RAG 增强。**主线不依赖**。

---

## 已推迟（先不做）

- **TD-1 接真 Anthropic** — 用户 2026-05-14 主动后放。锁逻辑靠 prompt + schema，mock 够用。
- **TD-2 解析 pipeline** — 跟 RAG 公告一起做，依赖 TD-1。

---

## 当前阻塞

无。排队 5 已完成。等用户启动**排队 6**（chat_message 接 /ai-advisor）。

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

- **2026-05-14** — 排队 5 — `supabase gen types` 切 typed client（TD-3 收尾）
  - 跑 `supabase gen types typescript --project-id tukdczwcygcgpxmdhobl --schema public > src/types/db.ts`（471 行，7 表自动派生）。
  - `src/lib/supabase.ts`：`createClient(...)` → `createClient<Database>(...)`，`supabase.from("xxx")` 自动推断列类型。
  - `profileApi.ts`：`interface Profile {...}` → `type Profile = Omit<ProfileRow, "goal_mode" | "goal_weights"> & { goal_mode: GoalMode; goal_weights: Record<string, number> }`。列集合自动跟随 db.ts。
  - `planApi.ts`：同款 narrow 派生（保留 `Node[] / Edge[] / Viewport`）；`createPlan` row 改用 `PlanInsert` 类型；`updatePlanGraph` 用 `PlanUpdate` 类型 + 显式 `as unknown as Json` 桥接 ReactFlow→Json（TS 不递归推断）；读出侧 3 处 `as unknown as Plan` 桥接 Json→Node[]。
  - `ragSourceApi.ts`：同款 narrow 派生（保留 `RagSourceKind / ParsedStatus` 枚举）；uploadRagSource row 改用 `RagSourceInsert`。
  - `authApi.ts` 无表调用，不动。
  - 完成标准：4 个 API 文件移除所有手维护 interface 主体（保留 narrow 那两层）；`tsc --noEmit` 干净（仅剩允许的 CardSwap 历史错）；新加 chat_message/rule/rule_conflict/course/track_* 自动有类型。

- **2026-05-14** — 排队 2 — AI provider 抽象 + streaming 协议骨架
  - 新建 `src/ai/{stream,schema,prompts,providers/mock,providers/anthropic,index}.ts` 6 文件；定 `chat({ messages, signal }) => AsyncIterable<Token>` 签名 + 3 个 zod schema（`Recommendation` / `ChatMessage` / `RagAnswer`，与 DATA_MODEL § 3.6 对齐）+ `recommendModePrompt` 模板；mock provider 沿用原 `recommendMode` 正则 + 模板化 rationale，18ms/字 流式 yield、signal aborted 时优雅 return；Anthropic stub 抛"未实现"错。`profileApi.GoalMode` 改成从 `GOAL_MODES as const` 数组派生，给 zod `z.enum` 复用。AIAdvisor `handleParse` 改成 async：abort 上一轮 → for-await 流式累加到 `parsedNote` → 正则解析「推荐：<mode>」→ 写 profile；按钮 streaming 态禁用 + 「分析中…」 + spinner；parsedNote multi-line + `▍` 光标；卸载 abort；切模式 abort。`VITE_AI_PROVIDER` env 切 provider（默认 mock）。`tsc --noEmit` 干净（除 CardSwap 历史遗留）；`vite build` 通过。

- **2026-05-14** — 排队 4b — `/course-planner` 接 `plan` 表
  - 新建 `planApi.ts`（list/get/create/updateGraph/rename/**delete**）+ `usePlans.ts`（list / current / debounce save 800ms / 空态自动建 / **remove 删当前自动切下一张、删空再补一张**）+ `seedGraph.ts`（types / lane 骨架 / SEED_*data 抽出）；Planner 页删 initial state，加 header bar（plan 名 inline 编辑 + 切换下拉 + 新建 + **删除（下拉每项垃圾桶 hover + window.confirm，禁删最后一张）** + 保存状态 + 画布锁挪过来）；URL `?id=<uuid>` 同步，刷新 / 直链 / 多 plan 切换都可恢复；800ms debounce 自动保存；空账号自动建「我的第一张规划」（用 seed 12 节点 + 13 边）；lane 骨架渲染时拼接，**不入 DB**。**访客模式**（`!authLoading && !user`）改成喂 SEED 只读预览（不入 DB，header 显示「访客预览 · 登录后保存」+「示例规划」），保 4b 之前的视觉感。`course-planner` route 加 `validateSearch` 暴露 `?id=` 类型；Dashboard / Schedule 的 Link 同步加 `search={{ id: undefined }}`。`tsc --noEmit` 干净（除 CardSwap 历史遗留）；`vite build` 通过。

- **2026-05-11** — 排队 4a — `/import` 接通 Storage + `rag_source` 表
  - 新建 `ragSourceApi.ts` + `useRagSources.ts`，改 Upload 页接通拖拽 / 选文件 / 列表读 DB / 删除；审计修 3 条中度问题（button→label、useEffect dep 守卫、loading 初值 true）

- **2026-05-10** — `profiles` 表前端接通
  - 新建 `profileApi.ts` + `ProfileContext.tsx` + `useProfile.ts`；4 处页面接入（Upload / AIAdvisor / Dashboard / UserMenu）

- **2026-05-10** — `docs/DATA_MODEL.md` 起草 + SQL migration 落地
  - 6 主表 + 1 RAG 表 schema + 6 决策确认 + 工程审计；`0001_init_schema.sql` 跑通；Storage bucket + RLS 已建
