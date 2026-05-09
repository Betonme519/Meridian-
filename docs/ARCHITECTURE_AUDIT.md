# Meridian 架构审计报告

> 审计时间：2026-05-09（覆盖 2026-05-07 旧版）
> 审计范围：`src/` 全量 + `routes/`、`config/`、`docs/`、`wrangler.jsonc`
> 审计目标：识别技术债、未来必爆点、不合理抽象、重复逻辑
> 输出原则：只描述、不动代码；按"炸药当量"排序

---

## 0. 一句话结论

**前端骨架成熟（Tailwind + shadcn + TanStack Router 文件式 + GSAP 动效齐全），但所有"业务接入面"——AI、数据、鉴权、状态——是一层只有形状没有契约的脚手架。** 现在加任何真实功能，第一个动手的人都得在 page 内现场发明协议；越往后接，规格越无法统一。本次审计把 12 处"幽灵抽象 / 死文件 / 隐性双轨"摆出来，让用户先做 4–5 个关键决策，再动代码。

---

## 1. 审计快照（与 2026-05-07 旧版对比）

| 项 | 2026-05-07 状态 | 2026-05-09 现状 |
|---|---|---|
| `MENU_ITEMS` 双份 | 🔴 Navbar / DashboardLayout 各写一份 | ✅ 抽到 `src/config/menu.ts` 单一真理 |
| 旧 `components/Navbar/` `Sidebar/` 残骸 | 💀 还在 | ✅ 已删除 |
| 功能页是否包 DashboardLayout | 🟡 page 内手动 import | ✅ `routes/_app.tsx` pathless layout 自动包 |
| `AuthProvider` 挂载 | ❌ `__root.tsx` 只有 `<Outlet/>` | ✅ 已挂（mock 实现）|
| `useAuth` ⇄ `AuthContext` 接通 | ❌ hook 返回硬值 | ✅ `useAuth` re-export `useAuthContext` |
| Mock 鉴权 | ❌ 无 | ✅ `localStorage` 实现，刷新保持登录 |
| `pages/Insights` `pages/GPASimulator` | （旧版幻觉，实际不存在） | n/a |

旧版审计的"L1 / L2 双 MENU_ITEMS"已经修了。**剩下的问题在下面，全部是现状。**

---

## 2. 文件结构（现状 + 死文件清单）

```
src/
├─ pages/        10 个目录：Home(✅) Login(✅) Register(✅)
│                 Dashboard / AIAdvisor / Planner / Schedule / Upload(均挂 _app，含静态 demo 数据)
│                 CourseAnalyzer / Courses / Profile（💀 无 route）
├─ routes/       8 个 route：__root + _app + index + login + register
│                 + _app/{ai-advisor,course-planner,dashboard,import,schedule}
├─ components/
│  ├─ layout/    Navbar(✅) Footer(✅) UserMenu(✅)
│  │            PageShell(💀 0 引用)
│  ├─ effects/   EmbeddedLaptop / GridMotion / SplitText / TiltedCard / CardSwap(✅ 在用)
│  │            LaptopFrame.{tsx,css}（💀 自己引自己，0 外部引用）
│  │            LiquidEther.css（💀 css 孤儿，无 .tsx）
│  ├─ ui/        shadcn 46 个 primitives（✅）
│  ├─ common/    💀 仅 .gitkeep
│  ├─ ChatPanel / CourseCard / GPAChart / UploadBox/  💀 4 个目录，0 引用
├─ layouts/      DashboardLayout(✅ _app 调用)
│                MainLayout(💀 0 引用，几乎空函数)
├─ context/      AuthContext(✅ 已挂)  UserContext(💀 仅 createContext，无 Provider 无消费者)
├─ hooks/        useAuth(✅ re-export)  use-mobile(✅)
│                useCourses / usePlanner（🟡 硬编码 [] / null，不读 context 不调 API）
├─ api/          authApi(✅ mock)  aiApi / courseApi / plannerApi（🟡 全部 async return null/[]）
├─ services/     gpaService / ragService / recommendationService（🟡 全部 stub）
├─ data/         mockCourses（空数组）userProfile（mock，OK）
├─ utils/        calculateGPA(✅ 真实现)  format(🟡 一行 stub)
├─ styles/       globals + variables + animations（✅）
├─ assets/       3 个空目录 + .gitkeep
├─ router.tsx    createRouter + 默认 ErrorComponent（✅）
└─ routeTree.gen.ts  自动生成
```

**死文件汇总（一次性可清，但请用户确认再动）：**

| # | 路径 | 性质 | 备注 |
|---|---|---|---|
| 1 | `src/layouts/MainLayout.tsx` | 死代码 | 0 引用，函数体几乎空 |
| 2 | `src/components/layout/PageShell.tsx` | 死抽象 | 0 引用，Home 拒绝用、功能页用 DashboardLayout |
| 3 | `src/components/effects/LaptopFrame.tsx` + `.css` | 死代码 | 仅自身互相 import |
| 4 | `src/components/effects/LiquidEther.css` | 孤儿 css | 无对应 .tsx |
| 5 | `src/components/{ChatPanel,CourseCard,GPAChart,UploadBox}/` | 4 个空 stub 目录 | 0 引用 |
| 6 | `src/components/common/` | 占位空目录 | 仅 .gitkeep |
| 7 | `src/pages/Profile/index.tsx` | `<div>Profile</div>` | 无 route |
| 8 | `src/pages/Courses/index.tsx` | `<div>Courses</div>` | 无 route |
| 9 | `src/pages/CourseAnalyzer/{index,UploadPanel,AnalysisResult}.tsx` | 完整写好的页 | 无 route，无入口 |
| 10 | `src/pages/Home/Trust.tsx` | 注释明示 "kept unmounted" | 复用意图未兑现 |
| 11 | `src/context/UserContext.tsx` | 仅 createContext | 无 Provider，无消费者 |
| 12 | `src/data/mockCourses.ts` | 空数组导出 | 留壳无意义，等真数据再加 |

**单独看每一个都"想保留"，合起来就是 12 个房间没人打扫。**

---

## 3. Router 架构

### 现状（已比 5-07 进步）

- TanStack Router 文件式 + `_app.tsx` pathless layout：`/dashboard /ai-advisor /course-planner /import /schedule` 自动套 `DashboardLayout`，page 内 0 import。
- `__root.tsx` 已加 `<Providers>` 壳（目前只挂 `AuthProvider`，注释列出 5 个未来挂点）。
- `routeTree.gen.ts` 自动生成、不手改。
- 有默认 `defaultErrorComponent` 和 `notFoundComponent`，已比骨架项目好。

### 仍存在的问题

| # | 严重度 | 问题 |
|---|---|---|
| R1 | 🔴 高 | **没有 `beforeLoad` 鉴权门禁**。`grep beforeLoad src/routes` 0 命中。`/_app/dashboard` 等"功能页"未登录可直达；mock 鉴权阶段无所谓，真用户进来即裸奔。建议在 `_app.tsx` 加 `beforeLoad: () => isAuthenticated 否则 throw redirect("/login")`。CLAUDE.md 把 `_app.tsx` 列为"不要修改"——所以这个动作必须由用户显式授权。 |
| R2 | 🟡 中 | **`router.tsx` 的 `context: {}` 空对象**。等鉴权 / queryClient 接入时，要么把 `auth`、`queryClient` 注入 router context，要么靠 `useAuth` 在 page 内调——两种范式现在都没决定。 |
| R3 | 🟢 低 | `defaultPreloadStaleTime: 0` 关掉了路由 preload 缓存；功能页静态 demo 阶段无影响，真接 API 时记得重看。 |

---

## 4. Layout 系统

### 现状

| 名称 | 路径 | 用途 | 状态 |
|---|---|---|---|
| `Navbar` | `components/layout/Navbar.tsx` | Home 顶栏（自适应透明↔白） | ✅ 真实现 |
| `Footer` | `components/layout/Footer.tsx` | Home 页脚 | ✅ 真实现 |
| `UserMenu` | `components/layout/UserMenu.tsx` | Navbar + DashboardLayout 共用 | ✅ 真实现 |
| `PageShell` | `components/layout/PageShell.tsx` | "标准 Navbar+Footer 页"封装 | 💀 **0 引用** |
| `DashboardLayout` | `layouts/DashboardLayout.tsx` | 5 个功能页外壳（rail + drawer + breadcrumb） | ✅ 由 `_app.tsx` 唯一调用 |
| `MainLayout` | `layouts/MainLayout.tsx` | 历史遗留 | 💀 **0 引用** |

### 问题

| # | 严重度 | 问题 |
|---|---|---|
| L1 | 🟡 中 | **Drawer 三件套（open state + scroll-lock + Esc）在 `Navbar.tsx` 和 `DashboardLayout.tsx` 各写一份**。`MENU_ITEMS` 已经 DRY 了，drawer 行为没有。一个 `useDrawer()` hook 就能收掉。 |
| L2 | 🟡 中 | **三种 layout 范式并存**：(a) Home 在 page 内 inline `<Navbar/>...<Footer/>`；(b) 功能页通过 `_app` 包 `DashboardLayout`；(c) `PageShell` 是第三种"我以为我们要做但没人做"的范式。第三种应当删除——抽象不被使用就是噪声。 |
| L3 | 🟡 中 | **`layouts/` vs `components/layout/` 双目录共存**。`layouts/` 只有 1 个 真实成员（DashboardLayout）+ 1 个死文件（MainLayout）。要么把 DashboardLayout 移进 `components/layout/` 收成一处，要么删 `layouts/`。两个名字相近的目录长期并存是误导。 |
| L4 | 🟢 低 | DashboardLayout 的 icon-rail 仅 `lg+` 显示——CLAUDE.md 写明"Mobile responsive required"，移动端只剩 hamburger，可接受但需视觉测试。 |

---

## 5. 状态管理

### 现状

```
AuthContext       ✅ 已挂、能 login/logout、mock 后端
UserContext       💀 createContext({profile:null})，无 Provider
useAuth           ✅ re-export useAuthContext
useCourses        🟡 return { courses: [], loading: false }   ← 不读 context、不调 API
usePlanner        🟡 return { plan: null, loading: false }    ← 同上
@tanstack/
react-query       🟡 已装，全项目 0 useQuery/0 QueryClient
```

### 问题

| # | 严重度 | 问题 |
|---|---|---|
| S1 | 🔴 高 | **`useCourses` `usePlanner` 是"形状障眼法"**。它们的返回类型让调用者以为"我接 API 后这里就有数据了"——其实没接 API 时也返回这个形状，page 不会报错，于是没人记得它们其实没接。建议要么连接（react-query 或 fetch），要么删除并让 page 直接 hardcode（让"没数据"显式）。 |
| S2 | 🔴 高 | **`react-query` 装了不用 = 包体白付费**。要么 1 周内接，要么从 deps 删；目前是最坏状态——又装又不用。 |
| S3 | 🟡 中 | **`UserContext` 与 `AuthContext` 概念分裂未兑现**。原始意图大概是"AuthContext 管登录态，UserContext 管偏好/profile"，但 UserContext 一行没写。建议：要么折叠进 AuthContext，要么标 TODO 并先删，等真有 profile 字段再建。 |
| S4 | 🟡 中 | **5 个功能页全部把数据写在文件顶部 `const xxx = [...]`**（AIAdvisor 7 modes、Schedule rule tree、Upload fileSlots、Dashboard 数组、Planner 数组）。真接 AI/数据时每个 page 都要重写顶部。这是"跳过 model 层"的症状。 |

---

## 6. 组件复用

### 现状（已修）

- shadcn `ui/` 46 primitives 齐全。
- `MENU_ITEMS` 单一真理。
- `UserMenu` 共享。

### 仍存在的重复

| 重复点 | 出现位置 | 建议落点 |
|---|---|---|
| Drawer open + scroll-lock + Esc | `Navbar.tsx` + `DashboardLayout.tsx` | `src/hooks/useDrawer.ts` |
| Page hero（H1 + 描述 + `mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10`）| AIAdvisor / Dashboard / Schedule / Upload / Planner | `<PageHeader>` 组件 |
| 卡片基线 `rounded-xl border border-slate-200 bg-white p-5` | 所有功能页 | shadcn `<Card>`（已存在却没用） |
| CTA `rounded-full bg-black ... transition-colors` | 所有页面 | shadcn `<Button variant>` |
| Mode/Goal/Risk metric 卡（icon + title + meta + bar）| AIAdvisor / Dashboard | `<MetricCard>` |

**关键观察：shadcn `Button` `Card` 装好了没人用——大家在写裸 Tailwind 类名。**

---

## 7. 页面职责

| Page | Route | Layout | 数据 | 状态 |
|---|---|---|---|---|
| Home | `/` | inline | sections | ✅ 完成 |
| Login | `/login` | 无（独立壳） | useState + useAuth | ✅ 通 mock auth |
| Register | `/register` | 无 | （未读，应同 Login） | 🟡 推断 OK |
| Dashboard | `/dashboard` | `_app` | 写死 const | 🟡 静态 demo |
| AIAdvisor | `/ai-advisor` | `_app` | 写死 const + useState 切换 mode | 🟡 静态 demo |
| Planner | `/course-planner` | `_app` | 写死 const | 🟡 静态 demo |
| Schedule | `/schedule` | `_app` | 写死 ruleTree 数组 | 🟡 静态 demo |
| Upload | `/import` | `_app` | 写死 fileSlots/connectors/dataRecords | 🟡 静态 demo |
| **CourseAnalyzer** | ❌ 无 route | none | UploadPanel + AnalysisResult | 💀 死页 |
| **Courses** | ❌ 无 route | none | `<div>Courses</div>` | 💀 stub |
| **Profile** | ❌ 无 route | none | `<div>Profile</div>` | 💀 stub |

**问题：3 个页面目录无 route、无入口、无 Menu 引用，纯遗留——CourseAnalyzer 还有完整 200 行实现。决定它的归宿（接到某个 route 上 / 或删）。**

---

## 8. 可扩展性

| 任务 | 今天的成本 | 备注 |
|---|---|---|
| 加一个新功能页 | 🟢 低 | 只需 `pages/X/index.tsx` + `routes/_app/x.tsx`（3 行 shell）+ `MENU_ITEMS` 加一项 |
| 加一个独立鉴权页（forgot-password 等） | 🟢 低 | 仿照 `routes/login.tsx` |
| 加 Toast | 🟢 低 | sonner 已装，在 `Providers` 里挂一个 `<Toaster />` |
| 加 Theme | 🟡 中 | tokens 是 oklch + `@theme inline`，dark mode 需要手动建 token alias |
| 接真鉴权 | 🟢 低 | `authApi.ts` 4 个函数体替换即可，AuthContext / Login 0 修改 |
| 接 AI 流式 | 🔴 高 | 见 §9 |
| 接路由级鉴权 | 🟡 中 | 加 `beforeLoad` 即可，但需先决定 router context 注入 vs hook 调用 |
| 接真数据 | 🔴 高 | `useCourses` / `usePlanner` / `services/*` / `api/*` 4 层都得现场发明契约 |

---

## 9. AI API 接入预留

### 现状

```ts
// src/api/aiApi.ts —— 全部内容
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
| AI1 | 🔴 高 | **没有 provider 抽象**。Anthropic / OpenAI / DeepSeek / Cloudflare AI / 校内模型——切换点在哪？没有人决定。 |
| AI2 | 🔴 高 | **流式协议未定义**。`chat()` 是 `Promise<null>`，真接入是 SSE / `ReadableStream` / WebSocket？前端 hook 要 `onToken / onDone / onError / onAbort`？今天 0 影。 |
| AI3 | 🔴 高 | **没有 prompt template registry**。AIAdvisor 的 7 种 mode 各自带一段"系统逻辑描述"——它们将来必然变 system prompt——现在散在 page 文件顶部 `const modes = [...]` 里，无法复用，无法 A/B。 |
| AI4 | 🟡 中 | **Server vs Client 不分**。`api/` 是浏览器代码，`wrangler.jsonc` 指向 TanStack Start server-entry 但项目内 0 个 Worker handler。API key 归属、CORS、限流策略 都没有住址。建议预留 `src/server/` 与 `src/api/` 的边界。 |
| AI5 | 🟡 中 | **`AbortController` / 取消 / 超时 / 重试** 0 模板。用户切 mode 时上一个请求要不要取消？切页时呢？ |
| AI6 | 🟡 中 | **RAG 完全无骨架**。向量库（Cloudflare Vectorize / pgvector / 第三方？）+ chunking 策略 + embedding model + reranker——`AI_MEMORY.md` 一字未提。 |
| AI7 | 🟢 低 | `recommend(_userContext: unknown)` 返回 `unknown[]`——zod schema 缺席。建议 `Recommendation` 先用 zod 定下来。 |

### 推荐最小预留（仅参考、不要现在改）

```
src/ai/
├─ providers/   anthropic.ts | openai.ts | mock.ts   ← strategy
├─ prompts/     mode.ts | rag.ts | system.ts          ← AIAdvisor 的 modes 搬来
├─ stream.ts    SSE 解析 + AbortController 模板
├─ schema.ts    zod: Recommendation / ChatMessage / RagAnswer
└─ index.ts     export const aiClient: AiClient
```

`api/aiApi.ts` 退化为薄 wrapper：`aiClient.chat(...)`。

---

## 10. Supabase 接入合理性

### 现状

- 后端方向**未决**：`wrangler.jsonc` 表明意图用 Cloudflare Workers + TanStack Start server-entry；但 `src/server/` 不存在，`api/` 是纯 browser code。
- `AuthContext` + `authApi.ts` 是 localStorage mock，**故意写成可以"4 个函数体替换"切换真后端**的形状——这是好的预留。

### 三条路线对比

| 路线 | 优 | 劣 |
|---|---|---|
| **Supabase 全栈**（auth + Postgres + Storage + Realtime） | 上线最快；auth + RLS + 文件 + 实时 4 件套即开即用；前端零后端代码 | 与 Cloudflare Workers 部署互斥（Supabase Edge Functions ≠ Worker）；Vendor lock-in；RAG 向量库要么用 Supabase pgvector（需付费 Pro 等级）要么外挂 |
| **CF Workers BFF**（自建） | 与 wrangler.jsonc 一致；冷启动快；可接 D1 + Vectorize + R2 + KV 一站式；TanStack Start SSR 原生支持 | Auth / Realtime 全要自己写；交付速度慢 |
| **混合**（CF 前端 + Supabase 数据层） | 保持 CF SSR + 拿 Supabase 数据福利 | 两份 vendor 关系；Realtime 走 Supabase 还是 Worker DO？决策点更多 |

### 接入风险（无论哪条路线）

| # | 严重度 | 问题 |
|---|---|---|
| SB1 | 🔴 高 | **`api/` 4 个文件直接 fetch 第三方 = 客户端泄密**。所有 secret 必须经 Worker / Supabase Edge Function 中转，但项目中无中转层。 |
| SB2 | 🟡 中 | **AuthContext 已经预留好替换路径**（注释明示），这是少数做得对的地方。Supabase 落地时 `authApi.ts` 体内换 `supabase.auth.signInWithPassword(...)` 即可。 |
| SB3 | 🟡 中 | **数据库 schema 不存在**。`Course / Plan / User Profile / RAG Source` 的字段一字没写，Supabase 接入第一天要写 7 张表的 schema。先在 `docs/` 起一份 `DATA_MODEL.md` 草稿。 |
| SB4 | 🟢 低 | RLS 策略与"Mock 鉴权 = 任何 ≥6 位密码即通过"互斥——上线前必须把测试账号关掉，否则 RLS 全部白绕。 |

### 推荐前置决策

1. **CF Workers vs Supabase vs 混合：本周内定**。这一项决定 `src/api/`、`src/server/`、AI provider 三个边界全部走向。
2. **数据 schema：另起 `docs/DATA_MODEL.md`**，先写 5 张表（user / course / plan / rule / chat_message）的字段。比写代码便宜 10 倍。
3. **AI key 归属：BFF 或 Edge Function，绝不允许浏览器侧持有**。

---

## 11. 重复逻辑清单（可立即抽离）

| 重复点 | 出现位置 | 建议落点 | 优先级 |
|---|---|---|---|
| Drawer 三件套 | `Navbar.tsx` + `DashboardLayout.tsx` | `src/hooks/useDrawer.ts` | 🟡 |
| Page hero (`mx-auto max-w-7xl px-5 py-8 ...` + H1) | 5 个功能页 | `<PageHeader>` | 🟡 |
| 卡片 (`rounded-xl border border-slate-200 bg-white p-5`) | 所有功能页 | shadcn `<Card>` | 🟡 |
| CTA (`rounded-full bg-black + transition-colors`) | 所有页面 | shadcn `<Button>` | 🟢 |
| Metric 卡（icon + title + meta + bar） | AIAdvisor / Dashboard | `<MetricCard>` | 🟢 |

---

## 12. 不合理抽象清单

| # | 抽象 | 状态 | 处置 |
|---|---|---|---|
| A1 | `PageShell` | 死抽象，0 引用 | **删** |
| A2 | `MainLayout` | 死抽象，0 引用 | **删** |
| A3 | `components/common/` | 空目录占位 | **删 .gitkeep，等有 1 个 common 组件再建** |
| A4 | `UserContext` | 仅 createContext，无 Provider | **折叠进 AuthContext 或删** |
| A5 | `useCourses` `usePlanner` | "形状障眼法" hook | **要么接通要么删 stub** |
| A6 | `services/gpaService.ts:projectGPA` vs `utils/calculateGPA.ts` | 同域两套，一假一真 | **决定单一住址** |
| A7 | `data/mockCourses.ts` 导出空数组 | 形状导出无内容 | **删，或填真 mock** |
| A8 | `effects/LaptopFrame.{tsx,css}` | CLAUDE.md 标"留 fallback"但 0 引用 | **删（fallback 不是不用的理由）** |
| A9 | `effects/LiquidEther.css` | CSS 孤儿 | **删** |
| A10 | `components/{ChatPanel,CourseCard,GPAChart,UploadBox}/` | 4 个空 stub 目录 | **删** |
| A11 | `pages/{Profile,Courses,CourseAnalyzer}/` | 无 route、无入口 | **接 route 或删** |
| A12 | `pages/Home/Trust.tsx` "kept unmounted" | 复用承诺未兑现 | **真要复用就抽到 effects 或 common；不复用就删** |

**A1–A12 是同一种病：**"我先把房间盖好，等业务搬进来。"——业务始终没搬进来，房间累积成噪声。

---

## 13. 技术债总评（按炸药当量排）

### 💣 一级（业务一接入立刻爆）

- **AI1–AI3**：provider 抽象 / 流式协议 / prompt registry 三件套全部 0 设计
- **R1**：路由级鉴权门禁缺失
- **SB1**：`api/` 直接 fetch 第三方 = 客户端泄密风险

### 💥 二级（半年内爆）

- **S1 + S2**：useCourses / usePlanner 假 hook + react-query 装了不用
- **A4 + A6**：UserContext 与 gpaService 双轨
- **L1**：drawer 行为重复
- **SB2 / SB3**：数据 schema 缺席

### 🔥 三级（2 个月内累计影响）

- **死文件 12 处**（A1–A3, A7–A12）
- **重复 Tailwind 类（卡片 / hero / CTA）** 跟 shadcn 双轨

### 💨 四级（小烦恼）

- `assets/` 3 个空目录、`format.ts` stub、`router.tsx` 的 `defaultPreloadStaleTime: 0`

---

## 14. 推荐决策顺序（先决策、再动代码）

1. **后端方向（Supabase / CF Workers / 混合）** —— 决定 `api/` 重构形态、AI key 归属、数据库 schema 起点。
2. **AI 供应商 + 流式协议** —— 即使先用 mock，先把 `chat()` 签名改成 `({ messages, signal }) => AsyncIterable<Token>`，让 7 个 caller 不再各自发明。
3. **路由级鉴权（`_app.tsx beforeLoad`）** —— 加一个 redirect，全局收敛。
4. **react-query 进 / 退** —— 二选一，避免装而不用。
5. **死文件清扫一刀切**（A1–A3 + A7–A11） —— 一个 PR 全删，留下 A4 / A6 / A12 等需"决定"的，单独跟。
6. **GPA 单一住址（utils 还是 services）** —— 决定后再做 §11 的 metric 卡复用。

**前 3 项不做完，下一轮"接 AI"或"接真数据"会出现 5–7 处 page 内现场发明——回头修起来比现在多花 3–5 倍。**

---

## 15. 项目优势（保留勿动）

- TanStack Router 文件式 + `_app.tsx` pathless layout 是当前 React 路由最佳实践
- `MENU_ITEMS` 单一真理 + 共享 UserMenu 是上一轮干得最好的事
- shadcn/ui 46 primitives + Tailwind 4 oklch tokens：UI 工具链成熟
- AuthContext 的"4 函数体替换即切真后端"形状，是少数做对的预留
- Home 落地页的 GSAP / SplitText / TiltedCard / CardSwap 视觉系统（CLAUDE.md 标"不要修改"，认同）
- `__root.tsx` 已留 5 个 Provider 挂点 + 错误页 + 404 页

---

> 报告止于此。**任何代码修改请用户先回应"按 §14 哪条走"，再开新 task。**
