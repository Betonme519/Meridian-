# Meridian 架构审计报告

> 审计时间：2026-05-07
> 审计范围：`src/` 全量 + 配置文件 + `docs/`
> 审计目标：识别技术债、未来必爆点、不合理抽象、重复逻辑
> **不动代码，仅出报告。**

---

## 0. 一句话结论

落地页(Home)是项目唯一"完成态"区域，水平很高；其余 90% 是**多版本骨架并存的脚手架**——三套 Layout、两份导航数据、四种空 stub、零 Provider、零状态管理实例。再叠一层业务前结构必须先收敛，否则后期每加一个页面 = 多一份重复 + 多一处不一致。

---

## 1. 文件结构审计

### 现状

```
src/
├─ pages/        11 个目录，5 个有内容、6 个 stub
├─ routes/       7 个 route 文件（全部一行壳）
├─ components/
│  ├─ layout/    Navbar / Footer / PageShell  ← 新版
│  ├─ Navbar/    空 stub  ← 旧版残骸
│  ├─ Sidebar/   空 stub  ← 旧版残骸
│  ├─ ChatPanel / CourseCard / GPAChart / UploadBox  ← 全部空 stub
│  ├─ effects/   实质内容（含一个孤儿 LiquidEther.css）
│  ├─ ui/        shadcn 46 个 primitives（OK）
│  └─ common/    空目录
├─ layouts/      DashboardLayout / MainLayout  ← 又一版 layout
├─ context/      AuthContext / UserContext     ← 仅 createContext，无 Provider
├─ hooks/        4 个，全部硬编码返回 null/[]
├─ api/          4 个，全部 async 返回 null/[]
├─ services/     3 个，全部返回 null/[]
├─ data/         mockCourses / userProfile（OK）
├─ utils/        calculateGPA 实做了；format 是 stub
├─ styles/       globals + variables + animations（OK）
└─ assets/       3 个空目录 + .gitkeep
```

### 问题

| # | 严重度 | 问题 |
|---|---|---|
| F1 | 🔴 高 | **三套 Layout 共存**：`components/layout/PageShell` + `layouts/DashboardLayout` + `layouts/MainLayout` + Home 直接 inline `<Navbar/><Footer/>`。无人裁决谁是真理。 |
| F2 | 🔴 高 | **同名异路径组件**：`components/Navbar/index.tsx`（空 stub）vs `components/layout/Navbar.tsx`（真版本）。`Sidebar` 同。任何未来 import 走错路径，IDE 也不会报错。 |
| F3 | 🟡 中 | **空 stub 组件 6 个**：`ChatPanel / CourseCard / GPAChart / UploadBox / Navbar(old) / Sidebar(old)`，都是"`return <div />`" 占位。属于幽灵抽象。 |
| F4 | 🟡 中 | **api/services/hooks/context 共 12 个文件全是空实现**。提前划好的"领域分层"在没有任何具体业务前先空跑，等真接入时 90% 概率推翻重写。 |
| F5 | 🟢 低 | `effects/LiquidEther.css` 孤儿（无对应 .tsx），`effects/LaptopFrame.*` 已不用但保留。`assets/*` 3 个空目录。 |
| F6 | 🟢 低 | `components.json` 写的 tailwind css 入口是 `src/styles.css`，**实际入口是 `src/styles/globals.css`**。`shadcn add` 时会出错。 |
| F7 | 🟢 低 | `pages/Courses` `pages/Profile` `pages/Upload` `pages/CourseAnalyzer` **没有对应 route**——全是死页。 |

---

## 2. Router 架构审计

### 现状

- TanStack Router 文件式，`@lovable.dev/vite-tanstack-config` 一行预设。
- `routes/` 7 个文件全是 3 行：`createFileRoute → component`。
- `__root.tsx`：HTML shell + meta + 字体；`<Outlet />` 直接挂载，**无任何 Provider**。
- `router.tsx`：仅 `createRouter` + 默认 ErrorComponent。

### 问题

| # | 严重度 | 问题 |
|---|---|---|
| R1 | 🔴 高 | **`__root.tsx` 零 Provider**。未来必加：`QueryClientProvider`、`AuthProvider`、`ThemeProvider`、`Toaster`、`Suspense fallback`、`ErrorBoundary`——每加一个都要改 root，root 会膨胀。现在不预留挂点，将来挤成一坨。 |
| R2 | 🔴 高 | **不用 layout route**。TanStack Router 支持 `_layout.tsx` 做嵌套布局；当前每个 page 各自 `import DashboardLayout` 然后 `return <DashboardLayout>...`，这是经典反模式：layout 应由 router 决定，不应由 page 决定。 |
| R3 | 🟡 中 | **路由命名不一致**：Page 叫 `Planner` 但 route 叫 `/course-planner`；Page 叫 `Schedule` 但 sidebar label 是 "毕业路径"。未来加 i18n / SEO / 共享链接时这种错位会成本翻倍。 |
| R4 | 🟡 中 | 没有 `404 fallback route`、没有 `loader`、没有 `pendingComponent`、没有 auth-gate route。当前是 demo 体型，业务一上立刻不够用。 |
| R5 | 🟢 低 | `routeTree.gen.ts` 自动生成 OK，但 `routes/` 命名是 kebab-case（`gpa-simulator`），page 目录是 PascalCase（`GPASimulator`）。两边命名规范没统一。 |

### 推荐结构（仅参考，不要现在改）

```
routes/
├─ __root.tsx                ← Providers 挂点
├─ index.tsx                 ← Home
├─ _app.tsx                  ← DashboardLayout 在这层
│  ├─ dashboard.tsx
│  ├─ ai-advisor.tsx
│  ├─ course-planner.tsx
│  └─ ...
└─ _auth.tsx                 ← 未来 login/register
```

---

## 3. Layout 系统审计

### 现状

| 名称 | 路径 | 状态 | 用途 |
|---|---|---|---|
| `Navbar` | `components/layout/Navbar.tsx` | ✅ 真实现 | Home 顶栏（自适应透明↔白） |
| `Footer` | `components/layout/Footer.tsx` | ✅ 真实现 | Home 页脚 |
| `PageShell` | `components/layout/PageShell.tsx` | ⚠️ 定义后**全项目零引用** | 本意做"普通页"壳 |
| `DashboardLayout` | `layouts/DashboardLayout.tsx` | ✅ 真实现 | 6 个功能页都直接 import |
| `MainLayout` | `layouts/MainLayout.tsx` | ❓ 几乎空 | 历史遗留 |
| `Navbar` 旧 | `components/Navbar/index.tsx` | 💀 空 stub | 残骸 |
| `Sidebar` 旧 | `components/Sidebar/index.tsx` | 💀 空 stub | 残骸 |

### 问题

| # | 严重度 | 问题 |
|---|---|---|
| L1 | 🔴 高 | **MENU_ITEMS 完全重复**：`Navbar.tsx` 和 `DashboardLayout.tsx` 各写一份完全相同的 6 项菜单数组（label / desc / to / icon），改一处忘改另一处 = 顶栏和侧栏不一致。 |
| L2 | 🔴 高 | **drawer 打开/关闭逻辑写两遍**：scroll-lock effect、ESC effect、open state 这三件套，Navbar 一份、DashboardLayout 一份。本质上是同一个抽屉。 |
| L3 | 🟡 中 | `PageShell` 写完没人用——属于"我以为我有抽象，其实在自我安慰"。Home 拒绝用它（自己拼 Navbar+Footer），功能页用 DashboardLayout 不用它。 |
| L4 | 🟡 中 | Home 的 layout 责任**写在 page 内部**（`<Navbar/><sections/><Footer/>`），DashboardLayout 是包裹式——两种范式同存。 |
| L5 | 🟢 低 | 移动端：DashboardLayout 的 icon-rail 只在 `lg+` 显示，移动端只能靠 hamburger。可接受但需测试，CLAUDE.md 写明"Mobile responsive required"。 |

---

## 4. 状态管理审计

### 现状

- `@tanstack/react-query` **已装、零使用**——package.json 里有，全项目 grep 不到 `useQuery` / `QueryClient`。
- `AuthContext` `UserContext`：只 `createContext`，**没有 Provider，没有任何调用方**。
- `useAuth` `useCourses` `usePlanner`：**不读 context**，直接 `return { user: null }` 之类的硬值。
- 业务页面（Dashboard / AIAdvisor / Insights）数据全是**写死在文件顶部的 const 数组**（goals、modes、courses）。

### 问题

| # | 严重度 | 问题 |
|---|---|---|
| S1 | 🔴 高 | **react-query 安装但未架设**。一旦真接 API，谁先动谁就要在 root 加 Provider + 决定 staleTime/cacheTime/devtools——没共识时会变成"每个 page 一个客户端"。 |
| S2 | 🔴 高 | **Context vs Hook 错配**：`useAuth` 不读 `AuthContext`，等于双跑道。任何"未来加 Provider"的人，必须先重写 hook 才能让 context 起作用——这种隐藏耦合最坑。 |
| S3 | 🟡 中 | 业务数据写死在 page 文件中（如 AIAdvisor 的 `modes` 数组、Dashboard 的 `goals/suggestions/risks`）。Mock 阶段 OK，但**没有 mock-mode 开关**，将来切真实数据时要逐文件挖。 |
| S4 | 🟡 中 | 没有 form state 标准（react-hook-form 已装，但所有 page 用 `useState`）。 |
| S5 | 🟢 低 | 没有全局错误/Toast 通道（sonner 已装但未挂）。 |

---

## 5. 组件复用审计

### 现状

- `components/ui/` 46 个 shadcn primitives 完整可用，但**业务页几乎不用**——AIAdvisor / Dashboard / Insights 全部手撸 `<button className="..."> <div className="rounded-xl border border-slate-200">`。
- `components/common/` 空目录（业务通用应放这）。
- `components/CourseCard` / `GPAChart` / `ChatPanel` / `UploadBox` 都是空 `<div />`，但概念上每个功能页都需要它们。

### 问题

| # | 严重度 | 问题 |
|---|---|---|
| C1 | 🔴 高 | **shadcn 装了 46 个 primitive，业务页 0 引用**。`Card / Button / Badge / Tabs / Dialog` 应该是基本盘，现在每个页面手写 `rounded-xl border border-slate-200` 和按钮——重复 + 视觉漂移风险（DESIGN_SYSTEM 写的"只用 rounded-2xl 和 rounded-full"已经被违反）。 |
| C2 | 🔴 高 | **课程卡 (CourseCard)**：Insights 写一遍（表格行）、Dashboard 写一遍（goals/risks 卡）、AIAdvisor 写一遍（mode 卡）、未来 Planner 还要写。**它是核心复用单元，现在是空 stub**。 |
| C3 | 🟡 中 | "卡 + 标题 + 副标题 + 数字 + icon"模式在 Dashboard / AIAdvisor / Insights / GPASimulator / Schedule 至少出现 8 次，没抽 `<MetricCard>` / `<InfoCard>`。 |
| C4 | 🟢 低 | "page header（H1 + 描述）"也在每个功能页重写。 |

---

## 6. 页面职责审计

| Page | Route | 用 Layout | 内容来源 | 状态 |
|---|---|---|---|---|
| Home | `/` | inline Navbar+Footer | Home/* sections | ✅ 完成 |
| Dashboard | `/dashboard` | DashboardLayout | 写死 const | 🟡 静态 demo |
| AIAdvisor | `/ai-advisor` | DashboardLayout | 写死 const + useState | 🟡 静态 demo |
| Planner | `/course-planner` | DashboardLayout | 写死 const | 🟡 静态 demo |
| Schedule | `/schedule` | DashboardLayout | 写死 const | 🟡 静态 demo |
| Insights | `/insights` | DashboardLayout | 写死 const | 🟡 静态 demo |
| GPASimulator | `/gpa-simulator` | DashboardLayout | 写死 const + useState | 🟡 静态 demo |
| **CourseAnalyzer** | ❌ 无 route | none | UploadPanel + AnalysisResult | 💀 死页 |
| **Courses** | ❌ 无 route | none | "Courses" 字符串 | 💀 stub |
| **Profile** | ❌ 无 route | none | stub | 💀 stub |
| **Upload** | ❌ 无 route | none | stub | 💀 stub |

### 问题

| # | 严重度 | 问题 |
|---|---|---|
| P1 | 🔴 高 | 4 个 page 没 route，处于"已写但永不可达"状态——浪费上下文、增加 grep 噪音。 |
| P2 | 🟡 中 | 7 个功能页职责模糊：Dashboard / Insights / AIAdvisor / Planner / Schedule / GPASimulator 都讲"推荐和分析"，划分不清，未来用户也搞不懂去哪点。 |
| P3 | 🟡 中 | **Page 自己 import Layout** 是反模式（见 R2）。 |

---

## 7. 可扩展性审计

### 加一个新页面，今天的成本

1. 在 `src/pages/Foo/index.tsx` 写 page。
2. 在 `src/routes/foo.tsx` 写 route 壳。
3. 在 page 顶部 `import DashboardLayout` 包一遍。
4. **手动改两份 MENU_ITEMS**（Navbar.tsx + DashboardLayout.tsx）。
5. 设计 mock 数据写死在 page 内。
6. 重写 card / header / button 视觉——不用 shadcn。

第 3、4、6 步是结构性税。每加一个页面都付一次。

### 加一个全局能力（如 Toast / Auth / 主题），今天的成本

`__root.tsx` 现在只有 `<Outlet />`。加 Provider 时要：判断顺序、判断 SSR 兼容、判断和 createRouter 的 context 关系——都没有先例。第一个动手的人压力大。

### 推荐预留挂点

- `__root.tsx` 加 `<Providers>` 抽象：`QueryClient / Auth / Theme / Toaster` 一处对齐。
- `routes/_app.tsx` layout route 把 DashboardLayout 上提。
- `src/config/menu.ts` 单一真理 MENU_ITEMS。
- `src/components/common/` 立刻塞 `<MetricCard> <PageHeader> <CourseCard>`。

---

## 8. AI API 接入预留审计

### 现状

```ts
// src/api/aiApi.ts — 全部内容
export async function chat(_message: string) { return null; }
export async function recommend(_userContext: unknown) { return []; }
```

```ts
// src/services/ragService.ts
export async function ragQuery(_question: string) {
  return { answer: "", sources: [] };
}
```

### 未来必爆问题

| # | 严重度 | 问题 |
|---|---|---|
| AI1 | 🔴 高 | **没有 provider 抽象**。Anthropic vs OpenAI vs DeepSeek vs 校内模型，都要在 `aiApi.ts` 里一个 if/else 还是 strategy，今天没决定。 |
| AI2 | 🔴 高 | **没有 streaming 协议**。当前 `chat()` 返回 `Promise<null>`，真接入时是 SSE / fetch ReadableStream / WebSocket？前端 hook 接口（`onToken / onDone / onError`）今天没影。 |
| AI3 | 🔴 高 | **没有 system prompt / template registry**。AIAdvisor 的 7 种 mode 各自有一段"系统逻辑"描述（保研/留学/实习…），它们将来要变成 prompt——现在散在 page 内 const 里，复用 0。 |
| AI4 | 🟡 中 | **API key 归属未定**：Cloudflare Worker 做 BFF？还是直连？wrangler.jsonc 在但 `src/api/*` 是浏览器代码，无路径分层（`/api/server/` vs `/api/client/`）。 |
| AI5 | 🟡 中 | **取消/重试/超时**：用户切 mode 时上一个请求要不要取消？没有 AbortController 模板。 |
| AI6 | 🟡 中 | **RAG 入口**：`ragService.ragQuery` 一个空函数，但向量库选型（Cloudflare Vectorize / pgvector / 第三方）+ chunking + embedding model + reranker 这四样**完全没记录**——AI_MEMORY.md 也只字未提。 |
| AI7 | 🟢 低 | `recommend(_userContext: unknown)` 返回 `unknown[]`——类型未定义。建议先定 `Recommendation` zod schema。 |

### 推荐最小预留

```
src/ai/
├─ providers/   anthropic.ts | openai.ts | mock.ts
├─ prompts/     mode.ts | rag.ts | system.ts
├─ stream.ts    SSE 解析 + AbortController
├─ schema.ts    zod: Recommendation / ChatMessage / RagAnswer
└─ index.ts     export const aiClient: AiClient
```

---

## 9. Supabase 接入合理性审计

### 现状

- 未安装 `@supabase/supabase-js`。
- `src/api/authApi.ts` 写的是 `login(email, password) → null` 的旧式 BFF 风格。
- `wrangler.jsonc` 暗示有自己的 Cloudflare Worker——和 Supabase 直连**有冲突**。

### 接入风险

| # | 严重度 | 问题 |
|---|---|---|
| SB1 | 🔴 高 | **架构方向不一致**：当前 `src/api/*` 是"前端 → Worker → DB"，Supabase 是"前端 → Supabase 直连"。两边并存会变成"一半 Worker 一半 Supabase"——两套 auth、两套缓存、两套 RLS。**先决定**走哪条。 |
| SB2 | 🔴 高 | **AuthContext 接不上 Supabase**：当前 `useAuth` 不读 context，Supabase 的 `auth.onAuthStateChange` 事件流没有挂点。引入时整个 hook+context 要重写。 |
| SB3 | 🟡 中 | **RLS 策略零文档**。课程数据是公开还是 per-user？AI 对话历史按 user_id 切？这些将来反推到 schema 时会被迫返工。 |
| SB4 | 🟡 中 | **Realtime / Subscription** 当前架构无影。Dashboard 的"AI 实时建议"如果想做 push，需要在 root 加 channel 订阅——又是 root 改造。 |
| SB5 | 🟡 中 | `@tanstack/react-query` + Supabase 共存时，要决定 `supabase-js` 的 `select()` 走 RQ 还是裸调用——又是先决问题。 |
| SB6 | 🟢 低 | 文件存储（用户上传的学校手册 PDF）：Cloudflare R2 vs Supabase Storage——两套 Worker 的话很尴尬。 |

### 推荐前置决策（按优先级）

1. **BFF 还是直连？** Worker + Supabase 同时存在，只允许一种数据流：要么 Worker 把 Supabase 当 DB，前端不接触 supabase-js；要么前端直连，Worker 只跑 AI。
2. **Auth 在哪？** Supabase Auth vs Clerk vs 校内 SSO——影响 useAuth/AuthContext 的全部接口。
3. **PDF 存哪？** R2 / Supabase Storage 二选一。
4. **RLS schema 草图**：至少把 `users / uploads / recommendations / chats` 四张表关系画清楚。

---

## 10. 重复逻辑清单（可立即抽离）

| 重复点 | 出现位置 | 建议落点 |
|---|---|---|
| `MENU_ITEMS` 6 项数组 | `components/layout/Navbar.tsx` + `layouts/DashboardLayout.tsx` | `src/config/menu.ts` |
| Drawer 打开 + scroll-lock + ESC | `Navbar.tsx` + `DashboardLayout.tsx` | `src/hooks/useDrawer.ts` |
| `min-h-screen bg-white` page 包壳 | Home / CourseAnalyzer / 其他 | `PageShell`（已有，没人用） |
| Page header (H1 + 描述 + 顶部留白) | 6 个功能页 | `<PageHeader>` |
| 卡片 (rounded-xl border border-slate-200 bg-white p-5) | 几乎所有页 | shadcn `<Card>` |
| 按钮 (rounded-full + 黑底白字 + transition-colors) | 几乎所有页 | shadcn `<Button variant>` |
| Mode/Goal/Risk 数据 + 图标渲染 | AIAdvisor / Dashboard / Insights | `<MetricCard>` |

---

## 11. 不合理抽象清单

| 抽象 | 为什么不合理 | 建议 |
|---|---|---|
| `src/api/*.ts`（4 文件全空） | 没有真业务前划分了 auth/course/planner/ai 四个文件，每个就一两个空函数；当真接 Supabase 或 AI provider 时这种"按域名切 API"完全不适用 | 推迟到第一个真请求出现时再划 |
| `src/services/*.ts`（3 文件全空） | "service" 这个词在前端没有共识；当前 service vs api 边界为零 | 当前合一即可，留一个 `src/lib/business/` 等真有 ≥3 个有依赖关系的纯函数再分 |
| `src/context/*.ts` 仅 createContext | Context 没 Provider 等于占位文件；hook 不读它等于双轨 | 删 context 文件，等真有 Provider 时再建（连同 hook 一起） |
| `src/components/{ChatPanel,CourseCard,GPAChart,UploadBox}` | 4 个空 `<div />`，从 git 角度看是"占位文件夹"——实质是把"未来 TODO"伪装成"已有抽象" | 删，TODO 写到 CURRENT_TASK.md |
| `components/common/` 空目录 | 同上，自我安慰 | 删，等真有第一个共享组件时再建 |
| `PageShell` | 写完无人用，继续放着会让后人困惑"该不该用" | 要么 Home 立刻改用它（推荐），要么删 |
| `MainLayout` | 几乎空，无人用 | 删 |

---

## 12. 技术债总评（按炸药当量排）

### 💣 一级（业务一接入立刻爆）
- **D1**: MENU_ITEMS 重复 → 改一处忘另一处 = UI 不一致 (L1)
- **D2**: __root.tsx 零 Provider → 加 RQ/Auth/Toast 时 root 难产 (R1, S1)
- **D3**: api/services/hooks 12 个空文件 → 第一次真接入时这一层大概率重写 (F4, AI1)
- **D4**: useAuth 不读 AuthContext → 加 Provider 也无效 (S2)

### 💥 二级（半年内爆）
- **D5**: shadcn 0 引用 → 视觉漂移已经开始 (C1)
- **D6**: 没有 streaming/AI provider 抽象 → AI 真接入时翻盘 (AI1, AI2)
- **D7**: BFF vs Supabase 方向未定 → 选错一边重写一半 (SB1)
- **D8**: 4 个 page 没 route → 死代码堆积 (F7, P1)
- **D9**: 三套 Layout 共存 → 任何"全局加东西"都不知道改哪 (F1, L3, L4)

### 🔥 三级（2 个月内累计影响）
- **D10**: 业务数据全写死 const → mock-real 切换时人肉迁移 (S3)
- **D11**: Drawer 逻辑重复 → 任何交互改动改两遍 (L2)
- **D12**: components.json 路径错 → shadcn 命令出错 (F6)
- **D13**: 旧 Navbar/Sidebar 空 stub → import 走错难发现 (F2)

### 💨 四级（小烦恼）
- **D14**: LiquidEther.css 孤儿、LaptopFrame 不用、空 .gitkeep 目录 (F5)
- **D15**: 路由命名 kebab vs PascalCase 不一致 (R5)
- **D16**: format.ts 空函数 (F3)

---

## 13. 优先收敛建议（不要现在改，等用户决定再动）

我建议按下面这个**顺序**收敛，每一步都解一类爆点：

| 步 | 动作 | 解决炸点 |
|---|---|---|
| 1 | 删空 stub：旧 Navbar/Sidebar/ChatPanel/CourseCard/GPAChart/UploadBox + MainLayout + 空 context/api/services/hooks 文件 | D3 D13 D16 |
| 2 | `src/config/menu.ts` 单一真理 + Navbar/DashboardLayout 引用 | D1 |
| 3 | `routes/_app.tsx` layout route，Page 不再 import DashboardLayout | D9 |
| 4 | `__root.tsx` 引入 `<Providers>`：QueryClientProvider + (空 Auth + 空 Toaster 占位) | D2 D4 |
| 5 | `pages/Courses Profile Upload CourseAnalyzer` 删或加 route，二选一 | D8 |
| 6 | `components/common/` 真抽 `<PageHeader> <MetricCard> <CourseCard>`，Dashboard/Insights/AIAdvisor 切过去 | D5 D11 |
| 7 | 决策：**BFF vs Supabase 直连**（写进 ARCHITECTURE.md），然后才动 api/ | D7 |
| 8 | 决策：**AI provider 抽象**（providers + prompts 目录），再写 AI page 真请求 | D6 |
| 9 | components.json 修 css 入口 | D12 |

---

## 14. 项目优势（保留勿动）

> 审计要平衡，避免只看负面。

- ✅ Home 落地页质量很高，section 切分干净，GSAP/EmbeddedLaptop 效果到位。
- ✅ Tailwind v4 + oklch 设计令牌选型先进。
- ✅ `docs/` 文档体系（PROJECT_OVERVIEW / ARCHITECTURE / DESIGN_SYSTEM / CURRENT_TASK / AI_MEMORY）非常成熟，超出大部分早期项目水平。
- ✅ TanStack Router 文件式 + Cloudflare Workers 部署链路是现代 stack。
- ✅ TypeScript strict + 路径别名 + ESLint + Prettier 基础配齐。
- ✅ shadcn primitives 全部安装，未来真用起来成本低。

---

**结论**：项目当前是"门面 + 骨架"的状态。门面（Home）干净，骨架（功能页与基础设施）有大量"看上去抽象、实际是占位"的债。**业务接入前必须做收敛**——优先 1→4 步，能用最小代价拆掉绝大多数定时炸弹。
