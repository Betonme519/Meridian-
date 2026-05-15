# Current Task — Meridian sprint

> 短期工作内存。**AI 接手优先读这份**，再按需查 `AI_MEMORY.md` / `TECH_DEBT.md`。
> 铁律：只做下方「排队」里的事，做完停下汇报。「不要修改」当只读。

> Last updated: **2026-05-15**

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

**等用户在 Supabase Dashboard 跑 `0002_add_track_schema.sql` + `0002_verify.sql`**（排队 9 收尾）。跑完后启动**排队 10**（用户需提供培养方案原始资料 PDF / 网页 / 手抄列表）。

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

- **2026-05-15** — 排队 7 — `rule` + `rule_conflict` 表接 `/schedule`（TD-24 收尾，第一阶段「无关基础」完成）
  - 新建 `src/api/ruleApi.ts`：`listRules(userId)` / `createRule({...})` / `updateRule(id, patch)` / `deleteRule(id)`；Rule 走 typed client 派生 + 窄 `trust: TrustLevel` 枚举；从 `TRUST_LEVELS as const` 数组派生 union。
  - 新建 `src/api/ruleConflictApi.ts`：`listConflicts(userId)` / `createConflict({...})` / `updateConflict(id, patch)` / `deleteConflict(id)`；插入前 `sortRulePair` 强制 (a, b) 字典序满足 CHECK (a < b)；同 id 自检；`confidence` / `resolved_by` 都派生 const 数组；CONFIDENCE_LEVELS / RESOLVED_BY_VALUES 公开导出。
  - 新建 `src/hooks/useRules.ts`：同款 race 守卫（requestIdRef + loadedUserIdRef + auth-loading 短路）；`Promise.all` 并发拉两表；CRUD 乐观写本地 + 失败 revert；`removeRule` 同步清掉本地引用该 rule 的 conflicts（DB 上靠 ON DELETE CASCADE）；派生 view `rulesByBranch` / `rulesByTrust` / `ruleMap` 走 useMemo。
  - 新建 `src/pages/Schedule/scheduleSeed.ts`：12 条 SEED_RULES（DB Rule shape 对齐 + 合成 `seed-rule-*` id）+ 2 条 SEED_CONFLICTS（满足 CHECK a<b）+ 4 条 SEED_POLICIES（学校特殊政策本轮不入库，登录用户 + 访客共用）+ TRUST_META（lucide icon / 配色 / 中文短称三档元数据）。
  - Schedule 页改造：删 4 段 hardcode → 接 useRules + useAuth；访客模式（!authLoading && !user）= 全 SEED 只读预览 + 横幅；登录用户空态也 fallback SEED + 「以下为示例…立即新建」amber 横幅；error 横幅含「重试」走 refresh()；rule 树 hover 显示删除 ✕；trust 列项 hover 显示「⇄ 调档」（点 cycle high→med→low）+ 删除 ✕；conflict 卡片 join `ruleMap` 显示 A/B title + source；`resolved_by` 端高亮（emerald）；新建规则 inline 表单（分组/可信度/标题/详情/来源/页码 6 字段）；新建冲突 inline 表单（A/B 下拉 + 标题 + 判断 + 置信度，rule 数 < 2 时按钮禁用）；删除走 window.confirm。
  - 工程细节：rule_conflict CHECK (a < b) 由 API 层强制 sort，UI 不暴露顺序概念；SEED_RULES 用合成 string id（不是 UUID）但不入 DB 所以不会触发 PK 校验；trust 切档用 `as const` 数组取 `(idx + 1) % 3`，类型安全循环。
  - 完成标准：`tsc --noEmit` 干净（仅 CardSwap 历史）；`vite build` 通过；schedule bundle 54.62 kB；UI 增删改跑通；访客 / 空账号见 SEED；冲突区按 resolved_by 高亮。

- **2026-05-14** — 排队 6 — `chat_message` 表接 `/ai-advisor` 对话历史（TD-7 chat_message 部分收尾）
  - 新建 `src/api/chatMessageApi.ts`：`listConversations(userId, rowLimit)` / `listConversationMessages(conversationId)` / `insertChatMessage({...})` / `deleteConversation(userId, conversationId)`；ChatMessage 走 typed client 派生（窄 role / mode / metadata 三字段）；PostgREST 不原生 group by → 客户端从 idx_chat_user_created 拉最近 100 行后 JS 压平成 ConversationSummary（preview / mode / aborted / last_at / message_count）。
  - 新建 `src/hooks/useChatMessages.ts`：同款 race 守卫（listReqIdRef + activeReqIdRef + loadedUserIdRef + auth-loading 短路）；`persistRound({userMessage, assistantMessage, mode, aborted})` 生成 conversation_id → 串行 insert user/assistant 两条 → 乐观 prepend 到本地 conversations；`selectConversation(id)` 拉详情；`clearActive()` 退出查看；`remove(id)` 硬删。
  - AIAdvisor 页：每次 handleParse = 一个新 conversation_id（单次推荐场景，不开多轮）；流式完成 / abort 都落库（abort 时 meta.aborted=true，content 是部分输出，profile 不写回避免半截解析）。aside 新增「对话历史」卡片（animationDelay 300ms，列表项含 mode badge / 中断标记 / 相对时间 / hover-删除按钮）；textarea / parse 按钮上方加「正在查看历史会话」banner + 「返回新建」入口；点历史条目 effect 同步 user/assistant 内容到 textarea + parsedNote；点 active 自己 = 退出查看；编辑 textarea 自动 clearActive。
  - 工程细节：`as unknown as ChatMessage` / `as unknown as Json` 桥接 Json↔业务窄类型（TS 不递归推断）；mock provider abort 是优雅 return（不抛），用 `ctrl.signal.aborted` 而不是 catch 判断是否中断。
  - 完成标准：`tsc --noEmit` 干净（仅 CardSwap 历史）；`vite build` 通过；ai-advisor bundle 35.05 kB；刷新看得到上次会话；点历史载入上下文；abort 落库且标记中断。

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
