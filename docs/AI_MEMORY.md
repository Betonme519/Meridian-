# AI Memory — Meridian 长期项目记忆

> 新 AI 5 分钟读完即可上手。每个里程碑 5–15 行摘要，不是开发日志。
> 短期 sprint 看 `CURRENT_TASK.md`；技术债 backlog 看 `TECH_DEBT.md`。

> Last snapshot: **2026-05-11**  ·  Branch: `main`

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
| 阶段 | 前端 demo 完成（落地页 + 5 功能页），业务接入期 |
| 已接通业务表 | `profiles` ✅ · `rag_source` ✅ |
| 待接通业务表 | `plan` · `rule` · `rule_conflict` · `chat_message` |
| 下一里程碑 | 排队 4b（`/course-planner` 接 `plan`）/ 4c（`/schedule` 接 `rule`）/ 2（AI provider 抽象） |
| 主要风险 | bun.lockb 与 node_modules 可能不同步；中国高校本地化文案未做；解析 pipeline 未建 |

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
├─ lib/                supabase 客户端单例 · guestMode · utils
├─ api/                profileApi · ragSourceApi · authApi（薄壳）
├─ context/            AuthContext · ProfileContext
├─ hooks/              useAuth · useProfile · useRagSources
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
| TS 类型 | 手维护对齐 schema（待自动生成） | 当前 `as Profile` cast，TD-3 待跑 `supabase gen types` |
| 状态管理 | React Context | 跨页共享有限；性能问题再升 Zustand |
| 笔记本 3D | 全 CSS preserve-3d（不用 R3F） | 试过 R3F 已 reset；CSS 已能做合盖动画 |
| 动画 | GSAP + ScrollTrigger + SplitText | Tailwind / Framer 表达力不够（pin / scrub / 字符级） |
| 路由分组 | TanStack pathless `_app` layout | 5 功能页共享 DashboardLayout 不泄露到 page |
| 全局菜单 | `src/config/menu.ts` 单一真理 | Navbar + DashboardLayout 共用，避免改一处忘另一处 |
| Plan 存储 | JSONB 整存 ReactFlow graph（D6=a） | 不拆 plan_node / plan_edge，图状结构天然 JSONB 友好 |
| 冲突表 | 独立 `rule_conflict`（D8=b） | 不嵌进 `rule.conflicts_with[]`，便于 AI 判断和审计 |
| chat_message | 不开 parent table（D9=a） | conversation_id 字段挂消息上，未来加 conversation 表升级路径 |

---

## 6. 已完成的大模块

### 落地页（Home）— `~90%`
Hero / Flow / Explain / GpaMath / Transparency / Control / Feedback / FAQ / FinalCTA / Footer 全接好。文案需本地化中国高校。
特色：EmbeddedLaptop（CSS 伪 3D）· GridMotion 图墙 · TiltedCard 3D tilt · Feedback 5 卡扇形 + 滚动星 · Transparency hub-and-spoke SVG 连线。

### 5 功能页 demo — `100%`（visual）
`/dashboard` · `/ai-advisor` · `/course-planner`（ReactFlow）· `/schedule` · `/import`，已套 DashboardLayout，pathless `_app` 分组，breadcrumb HoverCard。仍部分写死 const（plan / rule / chat_message 未接）。

### 数据库 — `100%`
`docs/DATA_MODEL.md` 6 张主表 + 1 RAG 表 + RLS + index + trigger，已落 `supabase/migrations/0001_init_schema.sql` 跑通；Storage `rag_sources` bucket + 4 条 path-based RLS 已建。

### 用户系统 — `~95%`
Supabase auth 接入 + 注册 / 登录 / 登出 / 多 tab 同步；`_app.tsx` beforeLoad 鉴权门禁；访客模式（localStorage flag）；Login 「暂时跳过」按钮；Home CTA 鉴权门禁；`profiles` 表前端接通（4 处消费方）。
待办：邮件确认 / 忘记密码 / OAuth / 服务端鉴权 / profile realtime。

### `rag_source` 接入 — `100%`
`/import` 真上传到 Supabase Storage + 写 `rag_source` 表 + 列表读 DB + 删除。文件路径 `<auth_uid>/<rag_source_id>.<ext>`。upload 兜底清孤儿 storage。当前 `parsed_status` 永远 pending（解析流程依赖 AI provider，TD-2）。

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

### 子页面菜单单一真理
原 Navbar 和 DashboardLayout 各写一份菜单，改一处忘另一处 = UI 不一致。已抽到 `src/config/menu.ts`，加菜单项只动这一处。

### bun + npm 混用
本项目装过 npm（R3F 已 reset），`bun.lockb` 没重新生成。新 agent 拉分支跑 `bun install` 可能拉到旧依赖。
**建议**：main 跑 `bun install` 重生 lockb 后再让 agent 各自拉分支。

---

## 8. 下一阶段方向

### 短期（当前 sprint）
- **排队 4b** — `/course-planner` 接 `plan` 表（ReactFlow nodes/edges → JSONB 自动保存）
- **排队 4c** — `/schedule` 接 `rule` + `rule_conflict`
- **排队 2** — AI provider 抽象 + streaming 协议骨架（mock provider 跑通 `/ai-advisor` 流式渲染）

### 中期
- `chat_message` 表接 `/ai-advisor` 历史
- `rag_source.parsed_status` 解析 pipeline（worker 推进 pending → parsed/failed，TD-2）
- `<Toaster />` 全局错误通道（TD-4）
- `supabase gen types` 切 typed client（TD-3）
- 多 tab realtime 订阅（TD-6）

### 长期
- 中国高校文案本地化（Hero / Explain 仍是美式选课词汇）
- 学校字典 `schools` 表 + 学期字典
- `rag_chunk` + pgvector embedding（等单文档超 1MB）
- 第二课堂 / 国际生路径 / 留学申请路径专项
- 学校手册 OCR + 解析 pipeline
- 移动端 / PWA

---

## 9. 项目时间线（按 commit 倒序，5-15 行/里程碑）

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
