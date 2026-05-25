# AI Memory — Meridian 长期项目记忆

> 新 AI 5 分钟读完即可上手。每个里程碑 5–15 行摘要，不是开发日志。
> 短期 sprint 看 `CURRENT_TASK.md`；技术债 backlog 看 `TECH_DEBT.md`。

> Last snapshot: **2026-05-20**  ·  Branch: `main`

---

## 1. 项目定位

**Meridian** — 中国高校选课决策引擎。

帮学生看见 培养方案 / 成绩 / 课表 / 学校规则 之间的关系网，按目标（高 GPA / 保研 / 留学 / 实习…）推荐选课与路径，并模拟决策代价。

**目标用户**：在校大学生（首批中国高校，5 所典型院校试点）
**核心价值**：不是推荐"好课"，是在你的目标下计算代价最低的路径，并把规则之间的影响关系展开

---

## 2. 当前阶段

| 维度 | 状态 |
|---|---|
| 阶段 | 数据层接通收尾，主线推进毕业路径结构化 + 画布改造 + AI 落地学校 |
| 已接通业务表 | `profiles` ✅ · `rag_source` ✅ · `plan` ✅ · `rule` ✅ · `rule_conflict` ✅ · `chat_message` ✅ |
| 公共 track 表 | 5 张 track_* + `user_progress` schema 落地（0002-0006 migration）+ 0005 华师大 2023 级 seed 198 条 track_requirement 跑通 |
| AI 抽象层 | provider-agnostic 骨架 ✅（mock + remote + anthropic 三 provider）；真 LLM 上游待用户拍板（TD-1） |
| 下一里程碑 | 排队 13（AI mock 接 track，gradPathAdvisorPrompt + zod）→ 13.2（TD-1 拍板 LLM 上游，写 ai.chat server route）→ 12.5（workspace 二次重构：requirement 加 shortcut 层 + AI 现算捷径 + 兴趣 input）→ 13.8（TD-2 RAG）→ 14（UI 重设计） |
| 主要风险 | 中国高校本地化文案未做；解析 pipeline 未建（TD-2，依赖 TD-1）；多 tab realtime 未上（TD-6） |

---

## 3. 技术栈

- **Runtime**：React 19 + TS 5.8 + Vite 7 + TanStack Start（SSR / 文件式 routes）+ Bun + Cloudflare Workers
- **UI**：Tailwind 4（@theme inline + oklch tokens）+ shadcn/ui（46 个 Radix primitive）+ lucide-react
- **动画**：GSAP 3.15 + ScrollTrigger + SplitText；自定义 CSS keyframes
- **后端**：Supabase（Postgres + Auth + Storage + 未来 Edge Functions）；Cloudflare Worker 跑 TanStack Start SSR
- **状态**：React Context（Auth + Profile），不上 Zustand / Redux
- **数据接入层**：`src/api/*` 薄壳调 Supabase，`src/context/*` 管 Provider，`src/hooks/*` re-export

---

## 4. 核心架构

```
src/
├─ routes/             TanStack Router 文件式
│  ├─ __root.tsx           根布局 + <AuthProvider><ProfileProvider>
│  ├─ _app.tsx             pathless layout：DashboardLayout + beforeLoad 鉴权
│  ├─ _app/                5 功能页 routes（dashboard / ai-advisor / course-planner / import / schedule）
│  ├─ login.tsx · register.tsx
│  └─ index.tsx            → Home
├─ pages/              业务页面，一页一目录
├─ components/
│  ├─ layout/              Navbar · Footer · DashboardLayout · UserMenu（Navbar+DashboardLayout 共用）
│  ├─ effects/             EmbeddedLaptop · GridMotion · SplitText · TiltedCard · CardSwap
│  └─ ui/                  shadcn primitives，不要重写
├─ lib/                supabase 客户端单例 · guestMode · errorBus · uuid · utils
├─ api/                authApi · profileApi · ragSourceApi · planApi · ruleApi · ruleConflictApi · chatMessageApi · trackApi · userProgressApi · courseApi（薄壳）
├─ context/            AuthContext · ProfileContext
├─ hooks/              useAuth · useProfile · useRagSources · useRules · useChatMessages · useDrawer · useTrack · useUserProgress · useCourses
│                     （usePlans 已删，planApi 留作 TD-50 接入点）
├─ ai/                 stream · schema · prompts · providers/{mock, remote, anthropic} · AI_PROXY_SPEC（4 家 LLM SSE 协议速记）
├─ types/              db.ts（supabase gen types 自动派生 743 行 / 11 表）· trackEnums.ts（12 档 kind + 3 档 scope/option + 5 档 status 字面量，与 SQL CHECK 同源）
├─ config/             menu.ts（单一真理源，Navbar + DashboardLayout 共用）
└─ styles/             globals.css · variables.css · animations.css
```

**数据接入三层模式**：`api/<table>Api.ts` → `context/<Table>Context.tsx`（全局） 或 `hooks/use<Table>.ts`（页面级） → page 消费。切后端只动 api 层。

---

## 5. 关键技术决策

| 决策 | 选择 | 原因 |
|---|---|---|
| 后端 | Supabase（Postgres + Auth + Storage） | 单家 SaaS，RLS 把权限收到 DB 层；Worker BFF 之后再加 |
| 鉴权 | D3=a 纯浏览器 `@supabase/supabase-js` | session 由 supabase-js 自管 localStorage；服务端鉴权（D3=b）推迟 |
| 邮箱确认 | 关闭（D2=a） | 摩擦最小化，注册即用 |
| TS 类型 | `supabase gen types` 自动派生 `types/db.ts` + 业务层 `Omit<Row, …> & {…}` narrowing | 列集合自动跟随 DB，新表零手维护类型；JSONB / enum 字段在业务层窄化（如 `goal_mode: string → GoalMode`） |
| 状态管理 | React Context | 跨页共享有限；性能问题再升 Zustand |
| 笔记本 3D | 全 CSS preserve-3d（不用 R3F） | 试过 R3F 已 reset；CSS 已能做合盖动画 |
| 动画 | GSAP + ScrollTrigger + SplitText | Tailwind / Framer 表达力不够（pin / scrub / 字符级） |
| 路由分组 | TanStack pathless `_app` layout | 5 功能页共享 DashboardLayout 不泄露到 page |
| 全局菜单 | `src/config/menu.ts` 单一真理 | Navbar + DashboardLayout 共用，避免改一处忘另一处 |
| Plan 存储 | JSONB 整存 graph（D6=a） | 不拆 plan_node / plan_edge，图状结构天然 JSONB 友好。**⚠️ plan 表现在已与 Planner 解耦**：v5 workspace 改用 track_* + user_progress；plan 表保留供未来 TD-50「自由备注画布」语义切换 |
| 冲突表 | 独立 `rule_conflict`（D8=b） | 不嵌进 `rule.conflicts_with[]`，便于 AI 判断和审计 |
| chat_message | 不开 parent table（D9=a） | conversation_id 字段挂消息上，未来加 conversation 表升级路径 |

---

## 6. 已完成的大模块

### 落地页（Home）— `~90%`
Hero / Flow / Explain / GpaMath / Transparency / Control / Feedback / FAQ / FinalCTA / Footer 全接好。文案需本地化中国高校。
特色：EmbeddedLaptop（CSS 伪 3D）· GridMotion 图墙 · TiltedCard 3D tilt · Feedback 5 卡扇形 + 滚动星 · Transparency hub-and-spoke SVG 连线。

### 5 功能页 demo — `100%`（visual）+ 数据接通进行中
`/dashboard` · `/ai-advisor` · `/course-planner`（v5 Track Workspace，自绘 SVG）· `/schedule` · `/import`，已套 DashboardLayout，pathless `_app` 分组，breadcrumb HoverCard。接通现状：`/import` ✅ rag_source / `/course-planner` ✅ track + user_progress + course（v5 已抛 React Flow + usePlans + seedGraph，commit `974c21b`）/ `/ai-advisor` ✅ chat_message + AI 流式 / `/schedule` ✅ rule + rule_conflict / `/dashboard` ⏳ 5 张卡片 + 4 个 shortcut 仍写死 const（TD-7，依赖排队 11/13 后分阶段接）。

### 数据库 — `100%`（schema 已演进到 0006）
- **用户私有表**：`docs/DATA_MODEL.md` 6 张主表（profiles / course / plan / rule / rule_conflict / chat_message）+ 1 RAG 表（rag_source），RLS + index + trigger 全套，`0001_init_schema.sql` 跑通；Storage `rag_sources` bucket + 4 条 path-based RLS 已建
- **公共 track 表**：`docs/TRACK_SCHEMA.md` 5 张表（track / track_category / track_requirement / track_option / user_progress），0002 → 0006 migration 落地
  - 0002 五层结构初版（排队 9）
  - 0003 scope 三档演进（school / college / major）
  - 0004 `track_requirement.source_ref` + `track_option.source_ref` 来源追溯列
  - 0006 `requirement.kind` 扩到 12 档 + `metadata jsonb`（D-track-8）
- **学校 seed**：0005 华师大 2023 级 198 条 track_requirement 落库（用户 Supabase Dashboard 跑通，2026-05-16）

### `chat_message` 接入 — `100%`
`chatMessageApi.ts`（list/insert/delete + Conversation Summary group by 客户端）+ `useChatMessages.ts`（race 守卫三件套 + persistRound / selectConversation / remove）。`/ai-advisor` 流式结束写 user + assistant 双消息，`conversation_id` 一次会话一个 uuid（走 `lib/uuid.ts` randomUUID 三层兜底）；abort 路径写 `metadata.aborted=true` + 部分 acc；历史列表 UI（preview / mode tag / 中断标识 / 时间倒序）+ 点历史灌 textarea+parsedNote / 新建 / 删除全套。**未解决**：`ProfileContext.updateProfile` guest 态早退导致 AIAdvisor 模式卡 guest 下点不动，已知未修。

### `rule` + `rule_conflict` 接入 — `100%`
`/schedule` 真接 `rule` + `rule_conflict` 表（原 TD-24 收尾，2026-05-14 commit 9fb712e）。trust 三档配色 / 冲突表独立 D8=b / 等等。

### AI 抽象层 — `~80%`（provider-agnostic v2，余尾：上游 LLM 拍板）
`src/ai/` 文件：`stream.ts`（`Token` discriminated union，留 citation / tool_use 扩展位）· `schema.ts`（Recommendation / ChatMessage / RagAnswer zod）· `prompts.ts`（recommendModePrompt）· `providers/mock.ts`（默认，正则 + 模板 rationale + 18ms/字 yield）· `providers/remote.ts`（**新增**，fetch `/api/ai.chat` SSE）· `providers/anthropic.ts`（已弃用，调用即抛错）· `index.ts`（`VITE_AI_PROVIDER=mock|remote|anthropic`）。`docs/AI_PROXY_SPEC.md` 记 4 家 LLM (Anthropic / OpenAI-style DeepSeek-Qwen / Zhipu / 通用) 的 SSE 事件协议速记。**余尾**：`src/routes/api/ai.chat.ts` server route 未写（等用户拍板上游再实施），当前 `VITE_AI_PROVIDER=remote` 会 404。Key 永远走 server route（CF Worker secret），不进 VITE_*。

### 文档体系 — `100%`

### 用户系统 — `~95%`
Supabase auth 接入 + 注册 / 登录 / 登出 / 多 tab 同步；`_app.tsx` beforeLoad 鉴权门禁；访客模式（localStorage flag）；Login 「暂时跳过」按钮；Home CTA 鉴权门禁；`profiles` 表前端接通（4 处消费方）。
待办：邮件确认 / 忘记密码 / OAuth / 服务端鉴权 / profile realtime。

### `rag_source` 接入 — `100%`
`/import` 真上传到 Supabase Storage + 写 `rag_source` 表 + 列表读 DB + 删除。文件路径 `<auth_uid>/<rag_source_id>.<ext>`。upload 兜底清孤儿 storage。当前 `parsed_status` 永远 pending（解析流程依赖 AI provider，TD-2）。

### `track + user_progress + course` 接入 — `100%`（v5 Track Workspace）
`/course-planner` v5 重写（commit `974c21b`，2026-05-20）抛 React Flow + 删 `usePlans` / `seedGraph` / `SEED_MERIDIAN_NODES`，改自绘 SVG + 绝对定位 DIV。数据走 `useTrack`（read-only 全校 track + 30 cat + 198 req）+ `useUserProgress`（upsert/delete）+ `useCourses`（completedCodes 命中已修）+ `useProfile`（goal_mode）。算法层 `computeRecommendation({goalMode})` 启发式预算主推荐路径 + 节点徽章。UI 三栏：PathGraph（root → milestone → bucket → requirement 思维导图）+ ImpactPanel（take/delay/switch 模拟器）+ EvidencePanel（规则证据 + source_ref）。post-v5 拆件重构（commit `6f8b241`）抽 `WorkbenchHeader` / `PathGraph` / `ImpactPanel` / `EvidencePanel` 5 命名组件 + 新增 `EvidencePanel`「规则证据」面板。

### `plan` 表现状 — 与 Planner 解耦
`plan` 表 schema 保留（D6a 整图 JSONB）但 v5 后已无业务消费方。`planApi.ts` 留作 TD-50「自由备注画布」语义切换的接入点。

### 文档体系 — `100%`
`CURRENT_TASK.md`（sprint）· `AI_MEMORY.md`（本文，长期）· `TECH_DEBT.md`（backlog）· `PROJECT_OVERVIEW.md` · `ARCHITECTURE.md` · `DESIGN_SYSTEM.md` · `DATA_MODEL.md` · `ARCHITECTURE_AUDIT.md`（一次性深度审计）。

---

## 7. 已踩过的重要坑

### Supabase env 缺失导致整站打不开
最早 `lib/supabase.ts` env 缺失硬抛错 → Providers 链崩溃 → SSR 失败 → 整站包括 Home 加载不了。
**修法**：fail-soft，env 缺失只 `console.warn`，`isSupabaseConfigured` 标志在 authApi 检查；只有 login / register 抛清晰错。

### Vite `VITE_*` 是构建时静态替换不是运行时变量
`wrangler.jsonc` 加 `vars` 块没用——Worker 拿到的 bundle 里值已字面量替换。
**修法**：CI build 前导出环境变量；GitHub Actions 用 `env:` 注入 secrets。

### Supabase URL 误带 `/rest/v1/` 后缀
SDK 自己拼路径，重复 → 404 "Invalid path"。
**修法**：`.env.local` 写裸 URL `https://xxx.supabase.co`，不加任何后缀。Vite 改 env 必须重启 dev server。

### CSS 3D 必须每层 `preserve-3d`
父元素只要有 transform 但没 `transform-style: preserve-3d`，所有子的 3D 旋转都被压回 2D。
**Bug 排查模板**：先把可疑元素加红色背景看渲染位置。

### React 19 ref callback 不能 return
`ref={el => arr[i] = el}` 在 React 19 会报 TS 错；写成 `ref={el => { arr[i] = el; }}` 显式 void。

### Radix DropdownMenu 默认 `modal={true}` 锁 body scroll
打开时注入 padding-right 抵消滚动条 → fixed Navbar 整条向右跳 ~15px。
**修法**：UserMenu 用 `modal={false}`。

### `<button>` 不能内嵌 `<input type=file>`
HTML5 规范禁止 button 内含 interactive content。React 不报错但 a11y / Firefox / Safari 行为不一致。
**修法**：用 `<label>` 包 `<input>`，label 自动触发内嵌 input click，免 ref + stopPropagation。

### Plan ReactFlow 节点定义在父组件函数内会丢动画
父级 re-render 时组件函数引用变 → React 卸载重挂 → CSS transition 没机会跑。
**修法**：组件定义在模块顶层，或改成函数调用返回 JSX（不当组件用）。

### Debounce save 用 selectedId 给 patch 盖戳 → 切 plan 瞬间错存
`saveGraph` 回调依赖 `selectedId` 的话，切 plan 时 selectedId 先 set 到 NEW，current（实际数据）还是 OLD。save-watcher effect 因为 saveGraph 引用变了被触发重跑，用 OLD nodes/edges + NEW id 调 saveGraph → 800ms 后 UPDATE NEW SET=OLD-content。新 plan 被旧数据覆盖。
**修法**：用 `activePlanIdRef`（镜像 `current?.id`）给 patch 盖戳，saveGraph 依赖只剩 flushSave（稳定）。save-watcher 不会因切 plan 被误触发。`remove` 删 plan 时若 pendingPlanIdRef 指向被删行，要主动清 timer + refs（不然 DELETE 后 timer 还会 UPDATE 死行）。

### 子页面菜单单一真理
原 Navbar 和 DashboardLayout 各写一份菜单，改一处忘另一处 = UI 不一致。已抽到 `src/config/menu.ts`，加菜单项只动这一处。

### bun + npm 混用
本项目装过 npm（R3F 已 reset），`bun.lockb` 没重新生成。新 agent 拉分支跑 `bun install` 可能拉到旧依赖。
**建议**：main 跑 `bun install` 重生 lockb 后再让 agent 各自拉分支。

---

## 8. 下一阶段方向

### 短期（当前 sprint）
- ✅ 排队 10 阶段 4（`ecnu_process_rules.md` 已落）/ 排队 11（course 表接通）/ 排队 12（v5 Track Workspace 闭环）
- **排队 13** — AI 接 track + user_progress + course mock（`gradPathAdvisorPrompt` + zod schema；mock provider 沿用）

### 中期（按主线顺序）
- **排队 13.2 / TD-1 拍板 LLM 上游** — DeepSeek / Qwen / Zhipu / Anthropic 任一家 → 写 `src/routes/api/ai.chat.ts` server route（详见 `AI_PROXY_SPEC.md`）
- **排队 12.5 workspace 二次重构** — requirement 加 shortcut 层 + AI 现算捷径 + 兴趣 input（依赖 13 + 13.2）
- **排队 13.8 / TD-2 解析 pipeline** — 依赖 TD-1，跟 RAG 公告一起做（推进 rag_source.parsed_status pending → parsed/failed）
- **TD-6 多 tab realtime 订阅** — profile / rag_source 等表 supabase channel 订阅
- **排队 14 UI 重设计** — 五个功能页对齐 DESIGN_SYSTEM（触发条件：12.5 完成后）

### 长期
- 中国高校文案本地化（Hero / Explain 仍是美式选课词汇）
- 学校字典 `schools` 表 + 学期字典
- `rag_chunk` + pgvector embedding（等单文档超 1MB）
- 第二课堂 / 国际生路径 / 留学申请路径专项
- 学校手册 OCR + 解析 pipeline
- 移动端 / PWA

---

## 9. 项目时间线（按 commit 倒序，5-15 行/里程碑）

### 2026-05-20 · 排队 12 v5 — Workspace 大改（commit `974c21b` + merge `c9efedd` 从 `auth-system` 分支）
- **核心转向**：从"AI 高亮 1 条主路径"转到"展示**所有捷径**+ 高亮当前目标最优 + 选了看影响"。用户口述：学生要两件事 —— 一是一眼看到所有学校规则之间能找到的捷径（捷径对不同目标不同，要标注），二是做选择能看到影响。推荐路径不能只展示 3 条挤掉其他可能性。
- **抛 React Flow**：`src/pages/Planner/index.tsx` 重写为自绘 SVG path + 绝对定位 DIV 卡（1121 行；buildGraph / edgePath / GraphNodeButton），不再走 reactflow MiniMap / Controls
- **三层导图**：root → milestone(上课/第二课堂/论文项目，3 个) → bucket(公必/通识/专必/专选/任选) → requirement；`expandedMilestones` / `expandedBuckets` 两 Set 控制展开
- **`strategyForItem()`**：requirement 卡 title 从"课名"切到"可执行策略短句"，按 bucket + keyword 9 档（公必 + 体育/英语/其他 / 通识 / 专必 / 专选 / 任选 / second / thesis）。例：公必体育 →「把体育与体测放进低冲突学期 · 不和核心课、实习周抢精力」；公必其他 →「公必按低负担组合完成 · 优先选不额外占用整天的安排」
- **`FocusMode` toggle**："全部路径 / 只看推荐" 圆角药丸；"全部"模式非推荐边 slate dashed `5 7`（弱化但仍可见）；"只看推荐" 过滤到 `isOnPath`。回应用户"不能只展示 3 条 其他依然要可见"
- **`GOAL_COPY` 8 档**：每 `goal_mode` 一句话在头卡 pill 下方显示当前高亮逻辑（实习优先 →「不挤压连续实习时间」/ 保研 →「排名、核心课与科研时间取舍」等）
- **右侧 `ImpactPanel` 选择模拟器**：选中 requirement 后 take/delay/switch 三 action 圆角分段 + before/after credits delta + category delta + target，接 `simulatePick`
- **视觉**：推荐边 amber `#d97706` 实线 strokeWidth 2.4；非推荐边 slate dashed；完成态 emerald-50/200；选中态 ring-2 ring-slate-950
- **`.playwright-mcp/page-2026-05-20T*.yml` × 4** 入 commit：开发期 Playwright MCP 浏览器实测过
- **延伸需求 → 排队 13.5**：(A) requirement 卡再下钻"多条并列具体捷径变体"（"塞已有课的那天" / "公必不计 APF 任选" 等），(B) 每条捷径标"对哪种目标最优"chip；依赖排队 13 AI 真推荐落地

### 2026-05-17 · 文档漂移大同步 + uuid bug 修
- `useChatMessages.ts` / `ragSourceApi.ts` 兜底分支生成非合法 UUID（base36 串），DB `uuid` 列拒收。抽 `src/lib/uuid.ts` `randomUUID()` 三层兜底（`crypto.randomUUID` → `crypto.getRandomValues` → `Math.random`），两处调用 import；tsc 干净
- 文档漂移修：CURRENT_TASK + AI_MEMORY 多处把已闭环任务仍写"待做"。本次同步排队 5/6/7/8/9 + 10 阶段 1-3 全部已闭环（指 commit hash）+ AI_MEMORY § 2/5/6/8/9 全更新；TD-7 含义已重新分配（Dashboard 写死 const）的旧用法标注

### 2026-05-17 · 基础设施 + 16 条 TD 大清理（commit c36f3c4 / 96cca12 / ba45ec4）
- **架构审计合并**：`docs/ARCHITECTURE_AUDIT.md`（5-09 + 5-16 两轮合并），AUDIT = 历史快照 / TECH_DEBT = 唯一权威 backlog
- **AI 抽象升级 v2**（用户决定 LLM 未定 → provider-agnostic）：`Token` discriminated union 留 citation / tool_use 扩展位 + 新 `providers/remote.ts` 走 `/api/ai.chat` server proxy + 新 `docs/AI_PROXY_SPEC.md`（4 家 LLM SSE 协议速记）。server route 待用户拍 LLM 上游再写
- **错误暴露 UI**：`src/lib/errorBus.ts`（`reportApiError` / `failApiCall`）+ `__root.tsx` 挂 `<Toaster richColors />` + 6 个 api/*.ts 接 errorBus
- **Drawer 抽 hook**：`src/hooks/useDrawer.ts`（scroll-lock + Esc + 可选 closeOnRouteChange），Navbar + DashboardLayout 各删 ~30 行
- **track schema 字面量**：`src/types/trackEnums.ts`（12 档 kind + 3 档 scope/option + 5 档 status）与 SQL CHECK 同源
- **db.ts 重 gen**：471 → 743 行（含 track_* / user_progress / scope_level / 12 档 kind）
- **Migration 规约**：`supabase/migrations/_template.sql`（UP + DOWN 段）+ `DATA_MODEL §10` 规约
- **ProfileContext race**：`updateProfile` 接共享 `requestIdRef`，spam-click / logout / 切账号期间过期响应丢弃
- **Dashboard 部分接通**：删教务 shortcut（立项书严禁爬学校系统）+ 卡 5「下一步建议」接文案池按小时轮换 + Navbar/DashboardLayout 头像/名称跟随 profile.name + Upload 加显示名输入字段
- **TD 状态**：TD-3/4/5/14/15/16/17/19/21/23/24/25 + TD-27~30 共 16 条闭环 → 直接从 TECH_DEBT.md 删除；剩 4 条部分余尾（TD-1/11/12/13）精简描述

### 2026-05-16 · 阶段 3 — 0005 seed SQL 落库（198 条 track_requirement）
- `supabase/migrations/0005_seed_ecnu_2023.sql` 全段 — 2 track（school + 师范学院 college）+ 30 category（A1-A5/B1-B6/C1-C9/D1-D6/E1-E3 + E4）+ **198 track_requirement**。整片 PL/pgSQL DO 块 + `ON CONFLICT (category_id, code) DO UPDATE` 幂等可重跑
- 段分布：A 23 + B 48 + C 56 + D 49 + E 全校 14 + E 师范 8 = 198
- `0005_verify.sql` 扩 15 段全段验证（基本结构 + 完整性 + 5 个抽样段 + module metadata 分布）
- 12 档 kind 分布：program_rule 56 / assessment_rule 37 / status_gate 31 / time_limit 21 / credits 13 / gpa_threshold 11 / score_scheme 11 / warning_threshold 8 / tuition 8 / all_of 2
- **用户 Supabase Dashboard 跑通**（2026-05-16）：seed + verify 两份均 OK，零反馈修复
- 解锁后续：阶段 4 `docs/ecnu_process_rules.md` + 排队 13 AI 顾问从 198 条结构化规则取数

### 2026-05-16 · 数据源切 PDF + 旧 md 处置 + CLAUDE.md 分流条
- 用户提供 2 份新 PDF（`docs/华师大规则文件pdf/2025本科生手册.pdf` + `2025本科生学习指南.pdf`），PDF = source of truth，旧 34 份 md 仅历史佐证
- 全局 CLAUDE.md 加「数据源文件分流」条：规则源文件只在排队 10 / 13 读，其他任务禁 Grep
- 旧 md 处置：99 条录完 0005 后一次性 `git mv` 到 `docs/_archive/`，禁止现在 rm（digest source_ref 链）
- 师范生入 track（scope=college）/ 微专业单独 track；新增 TD-26（PDF 内联预览 + source_ref 精确到页码，推到排队 14）

### 2026-05-15 · 排队 10 前置 — 4 份 ECNU 规则 digest 录入（commit ef06fe2）
- AI 一次性读完 23 个 md（剔除硕博 / 二学位等不相关 11 个）→ 写 4 份 digest（A 毕业资格核心 / B 学业规则 / C 特殊计划 / D 过程类）
- 每条规则强制 4 字段：规则中文 / 原文片段 / 来源(§条款) / 落地(track_requirement 或 prompt)
- 用户审阅工作流：用户在 IDE 直接改 md 补 ⚠️ → AI 收 system-reminder 同步「落地」行去 ⚠️ → chat 互验 typo（A2-2 肄业 → 毕业 这种被 AI 主动质询）
- AI OCR 工具补强：用户把表格放桌面 `C:\...\Cx-y.png` → AI Read 读图 → 录入 markdown 表 + 落地行结构。批 C 三张表都这样录入
- 解锁 task #4：`0004_add_source_ref.sql` + `0005_seed_ecnu_2023.sql` + `docs/ecnu_process_rules.md`

### 2026-05-14 · 排队 6/7 — chat_message + rule + rule_conflict 接通（commit 44b00b6 + 9fb712e）
- 排队 6：`chatMessageApi.ts` + `useChatMessages.ts` + `/ai-advisor` persistRound（流式结束 user+assistant 双消息落库 / abort 路径写 metadata.aborted）+ 历史列表 UI（preview / mode tag / 中断标识 / 时间倒序 / 点切 / 删除）
- 排队 7：`ruleApi.ts` + `ruleConflictApi.ts` + `useRules.ts` 接通 `/schedule`（原 TD-24 收尾）；trust 三档配色 / 冲突表独立 D8=b

### 2026-05-15 · 排队 8/9 — 五层结构契约 + 0002 track schema migration（commit 71c184e + 4bb156b + e0df73b）
- 排队 8：`docs/TRACK_SCHEMA.md` 五层契约起草（track / track_category / track_requirement / track_option / user_progress）；UI 重设计推迟到排队 14
- 排队 9：`0002_init_track_schema.sql` + verify + `DATA_MODEL` §10 入口（11 表总览）
- 0003 scope 三档演进（school / college / major），不分专业改全校通用为默认

### 2026-05-16 · 架构决策 D-track-8 — requirement.kind 扩档 + metadata jsonb（排队 10 task #4 阶段 0）
- **起因**：跑 0005_seed_ecnu_2023 时抽 4 份 ECNU digest 落地行，发现 99 条 track_requirement 候选用了 **98 个不同的 kind 标签**（`time_limit / graduation_status / certificate_threshold / gpa_threshold / credit_recognition_cap / attendance_threshold / pf_credit_cap / score_mapping / overage_credit_fee / fitness_grad_threshold / thesis_resit / ...`），与 0002 schema 的 `count\|credits\|one_of\|all_of` CHECK 四档**全部不兼容**。digest 当时（2026-05-15）用户审阅期，kind 字段被当成"语义标签"自由写，没考虑 schema 兼容。
- **4 选 1**：A 缩范围（弃 80% 结构化数据，仅 ~15 条进 track_*）/ **B 扩 kind 枚举到 ~10-12 档 + 加 `metadata jsonb`**（保 95%）/ C 拆新表 track_school_policy（双表 RLS + AI prompt 翻倍）/ D 全塞 description（丢结构化）。
- **选 B**：理由 — (1) 98 标签语义重叠重（学费类 ~4 个 / 补考类 ~3 个 / 时间约束类 ~3 个），归并到 10-12 档自然；(2) D-track-3 已留口子（"AI 整 JSON 喂 prompt"），metadata jsonb 是延伸；(3) track_* 表为空（0002/0003 后无 seed），CHECK 改不踩老数据；(4) C 拆表代价 ≈ 0002 重做一半；(5) A 损失太大，排队 13 AI 没法 join `user_progress` 做"用户当前是否触发阈值"判断。
- **落地路径**：
  - 阶段 1（先）：`docs/track_kind_taxonomy.md` 归并 98 → ~10-12 canonical kind，含语义 + 典型 metadata 形态
  - 阶段 2：`0006_extend_requirement_kinds.sql` 扩 CHECK 枚举 + 加 `metadata jsonb NOT NULL DEFAULT '{}'` + 改 threshold CHECK（`threshold IS NOT NULL OR metadata <> '{}'::jsonb` 二选一）+ `0006_verify.sql` + TRACK_SCHEMA.md §3.3 同步
  - 阶段 3：`0005_seed_ecnu_2023.sql` 按归并 kind 写 99 条 INSERT，每条带 source_ref + metadata
  - 阶段 4：`docs/ecnu_process_rules.md` 把 ~123 条 prompt 类规则精炼到 ~500 行，留排队 13 喂 gradPathAdvisorPrompt
- **决策记录在**：`TRACK_SCHEMA.md` §1 D-track-8 / `CURRENT_TASK.md` 排队 10 task #4 子任务展开 / `MEMORY.md` project_track_kind_extend.md。

### 2026-05-14 · `supabase gen types` typed client 切换（排队 5，TD-3 收尾）
- 跑 `supabase gen types typescript --project-id tukdczwcygcgpxmdhobl --schema public > src/types/db.ts`（471 行，7 表自动派生）
- `src/lib/supabase.ts` 从 `createClient(...)` 升级到 `createClient<Database>(...)`，`supabase.from("xxx")` 自动推断列类型
- 4 个 API 文件改用 typed client 派生：`profileApi.ts` / `planApi.ts` / `ragSourceApi.ts` 都改成 `type X = Omit<XRow, "narrow_fields"> & { narrow_fields }` —— 列集合自动跟随 db.ts，未来加 chat_message / rule / rule_conflict / course / track_* 自动有类型
- 写入侧用 `<Table>Insert` / `<Table>Update`；JSONB 字段（ReactFlow Node[]/Edge[] / goal_weights）用 `as unknown as Json` 桥接，读出侧 `as unknown as Plan` 反向 narrow（TS 不递归推断 Json↔结构化业务类型）
- 不动：authApi（无表调用）、视觉组件、Supabase 接入面公共 API。tsc 干净（仅 CardSwap 历史遗留错）；vite build 通过

### 2026-05-14 · AI provider 抽象 + streaming 协议骨架（排队 2）
- 新建 `src/ai/` 6 文件：`stream.ts`（`Chat = (opts) => AsyncIterable<Token>` 协议 + `collect()` helper）· `schema.ts`（zod：`Recommendation` / `ChatMessage` / `RagAnswer`，`ChatMessage` 对齐 DATA_MODEL § 3.6 / 决策 D9）· `prompts.ts`（`recommendModePrompt` 系统提示词）· `providers/mock.ts`（默认实现，沿用原 AIAdvisor recommendMode 正则 + 8 模式模板化 rationale + 关键词原话引用 + 18ms/字 yield + signal.aborted 优雅 return）· `providers/anthropic.ts`（stub 抛错，预留接口位）· `index.ts`（`VITE_AI_PROVIDER` env 选 provider，默认 mock）
- `profileApi.GoalMode` 改成从 `GOAL_MODES as const` 数组派生（不破 API），让 zod `z.enum(GOAL_MODES)` 复用
- AIAdvisor `handleParse` 重写：abortRef + AbortController；for-await 消费 chat() 流式 token，逐字 setState 累加；流完正则解析「推荐：<mode>」校验在 GOAL_MODES 后 updateProfile；catch AbortError 沉默；卸载 / 切模式都 abort 上一轮
- AIAdvisor UI 适配：按钮 streaming 时禁用 + 「分析中…」 + Sparkles `animate-spin`；parsedNote `<p>` 改 `flex items-start whitespace-pre-wrap` 撑多行 + 末尾 `▍` `animate-pulse` 流式光标；空输入禁用按钮
- 不动：AIAdvisor 视觉布局（grid / 模式卡 / textarea / aside）、profileApi 公共 API（仅 readonly tuple 化）、ProfileContext / useProfile / Supabase 接入面。tsc 干净（仅 CardSwap 历史遗留）；vite build 通过

### 2026-05-14 · `/course-planner` 接通 `plan` 表（排队 4b）
- 新建 `planApi.ts`（list / get / create / updateGraph / rename / delete，整图 JSONB）+ `usePlans.ts`（list + current + 800ms debounce save + 空态自动建 + remove 删当前自动切下一张 / 删空再补一张）+ `seedGraph.ts`（types + lane 骨架 + SEED_MERIDIAN_NODES 12 节点 + SEED_EDGES 13 边抽出）
- 改 Planner 页：删 initial state，加 header bar（plan 名 inline 编辑 + 切换下拉 + 新建 + 删除[下拉每项 hover 出垃圾桶 + window.confirm，最后一张禁删] + 保存状态 + 画布锁挪过来）；URL `?id=<uuid>` 同步，刷新 / 直链 / 切换 / 新建 / 删除都可恢复；lane 骨架渲染时拼接不入 DB；viewport 只在 interactive=true 时持久化（锁定态 fitView 不写）；onMoveEnd 触发 debounce 保存
- 访客模式：`!authLoading && !user` 喂 SEED 只读预览，编辑不入 DB，header 显示「访客预览 · 登录后保存」+「示例规划」+ 禁用切换 / 新建 / 重命名（loadedPlanIdRef = "__GUEST__" sentinel）
- `course-planner` route 加 `validateSearch` 暴露 `?id=`（空串归 undefined）；Dashboard / Schedule 的 Link 同步加 `search={{ id: undefined }}`
- 审计修 3 条：B1 saveGraph 改用 `activePlanIdRef`（镜像 `current?.id`）给 patch 盖戳，回调稳定化，防"切 plan 瞬间用 stale 数据写新 id"；B2 `remove` 删 plan 时若 pendingPlanIdRef 指向被删行，主动清 timer + refs；B3 validateSearch 空串归 undefined（之前 `typeof === "string"` 会让 `?id=` 通过）
- 不动：MeridianNode / LaneHeader / NodeDrawer 视觉组件、kindMeta 配色、5 功能页 routes 目录其它部分、AuthContext / supabase 接入面。tsc 干净（仅 CardSwap 历史遗留错）；vite build 通过

### 2026-05-11 · `/import` 接通 Storage + `rag_source` 表（排队 4a）
- 新建 `ragSourceApi.ts`（list / upload / delete + RagSourceKind / ParsedStatus 类型 + 兜底清孤儿 storage）+ `useRagSources.ts`（本地 hook，登入即拉，乐观更新，race 防护）
- 改 `/import`：3 个 ImportSlot 用 `<label>` 包 `<input>` 接通拖拽 + 选文件 + 多文件串行上传；列表读 DB；状态 pill 映射 `parsed_status` → 中文 + low-saturation 配色；空态 + uploading 计数 spinner + inline rose error banner
- 审计修了 3 条中度问题：button → label、useEffect dep 加 user.id 守卫防 token-refresh 重拉、loading 初值 true 防空态闪烁
- 不动：AuthContext / supabase.ts / __root.tsx / Navbar / profileApi。tsc 干净（仅 CardSwap 历史遗留错）。

### 2026-05-10 · `profiles` 表前端接通
- 新建 `profileApi.ts`（getProfile / upsertProfile / updateProfile + GoalMode 枚举）+ `ProfileContext.tsx`（Provider，登入即拉，404 兜底 upsert，乐观更新 + requestId race 防护）+ `useProfile.ts` re-export
- `__root.tsx` 嵌套 `<AuthProvider><ProfileProvider>` 顺序关键
- 4 处页面接入：`/import`（school/grade/major）· `/ai-advisor`（goal_mode 派生 + 点击 updateProfile）· `/dashboard`（importShortcuts + decisionCards 动态派生 currentGoalMode）· UserMenu（profile.name → user.name → email 三级 fallback）
- 不动 AuthContext / authApi / supabase.ts / Navbar / 页面 className 与布局

### 2026-05-10 · `docs/DATA_MODEL.md` 起草 + SQL migration 落地
- 6 张主表（profiles / course / plan / rule / rule_conflict / chat_message）+ 1 RAG 表（rag_source）设计 + RLS + index + trigger
- 6 处决策：D1=b 建 profiles · D5=a course 用户私有 · D6=a plan JSONB 整存 · D7=a rule 用户私有 · D8=b 冲突独立表 · D9=a chat_message 不开 parent
- 工程审计修 4 处：SQL DDL 顺序、rule_conflict UNIQUE 对称、rule_conflict 用户一致性 trigger、rag_source.storage_path 格式
- `supabase/migrations/0001_init_schema.sql` 在 Dashboard 跑通；Storage `rag_sources` bucket + 4 条 path-based RLS 已建

### 2026-05-10 · 路由鉴权门禁 + 访客模式 + 退出回首页 + Home CTA 鉴权
- `_app.tsx` beforeLoad 4 道守卫：SSR / `isSupabaseConfigured` / 访客 / `await getSession()` → 无 session redirect `/login?redirect=`
- 新建 `src/lib/guestMode.ts` localStorage 薄壳（SSR + 隐私模式 try/catch 守卫）
- Login 加「暂时跳过」按钮 + `safeRedirect()` 防 open redirect；Login↔Register 透传 redirect
- UserMenu 退出登录跳 `/`（不再回登录页）+ `exitGuestMode()` 防残留
- Home `Hero.tsx` / `FinalCTA.tsx` CTA 改 `<button onClick>` 已登录或访客直进 dashboard，未登录 → `/login?redirect=/dashboard`

### 2026-05-09 · Supabase auth 接入（mock 退役） + 死文件清扫 + 架构审计
- 决策 D1–D4 全走默认 (a)：profiles 推迟 / 关邮件确认 / 纯浏览器 auth / 保 AuthUser shape 解耦
- 新建 `src/lib/supabase.ts` 单例（SSR 守卫 + fail-soft env 缺失 + `isSupabaseConfigured`）；`authApi.ts` 4 函数 mock → Supabase + 新增 `onAuthChange`；`AuthContext` 加订阅，公共 API 不变
- 死文件清扫：21 文件 + 8 目录全部 0 引用确认后删（MainLayout / PageShell / common/ / ChatPanel 等 stub）
- react-query 移除（全项目 0 useQuery）；架构审计 `ARCHITECTURE_AUDIT.md` 全文刷新
- 部署坑：Vite `VITE_*` 构建时替换，`wrangler.jsonc vars` 没用，CI build 前导环境变量

### 2026-05-09 · 落地页 Transparency 区 + Feedback 重做 + 共享 UserMenu
- 新 section `Transparency.tsx` 替代 `Honesty.tsx`：hub-and-spoke + SVG bezier 连线 + marching-ants 关键帧 + 中央 TiltedCard 3D tilt
- 新组件 `TiltedCard`（React Bits TS port，零依赖）+ `CardSwap`（视频堆叠自动循环）
- Feedback 5 卡扇形 + 滚动星 cascade；Control 缓动 hover（layered transitions）
- 共享 `UserMenu.tsx` 抽出 Navbar + DashboardLayout 两处复用；`modal={false}` 修首页点头像导致 Navbar 整条向右跳的 bug
- 5 功能页 breadcrumb HoverCard：删每页顶部 eyebrow + h1 + intro，搬到 `menu.ts` title/intro 字段

### 2026-05-08 · 登录系统 mock + 落地页 4 个 section 改版
- mock 鉴权 + Login / Register 页（白卡 Apple-like，两卡尺寸锁死 max-w-440 min-h-640 零跳动）
- Explain「认知落差」+ GpaMath「Meridian 不只是推荐好课」+ Faq.tsx 新建 + Footer 黑底三栏 + Navbar 4 项居中

### 2026-05-07 · 一级结构债收敛
- `src/config/menu.ts` 单一真理；TanStack pathless `_app` layout（6 功能页统一壳）
- 删旧 Navbar / Sidebar stub；`__root.tsx` `<Providers>` pass-through 壳

### 2026-05-06 · 项目结构 + 笔记本 3D 初版
- 拆 `Home/index.tsx` 730 行 → 一 section 一文件
- EmbeddedLaptop CSS 伪 3D + GridMotion 自动循环图墙 + Hero SplitText 字符级 fade-up
- TanStack Start + React 19 + Vite 7 + Tailwind 4 + shadcn 50+ + GSAP 装备完成
