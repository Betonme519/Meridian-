# Meridian 技术债

> **维护节奏：** 完成一项就把它移到「已解决」+ 当天日期；新发现的债加到对应优先级。
> **配套阅读：** `docs/ARCHITECTURE_AUDIT.md`（一次性深度审计，2026-05-09 已更新）+ 本文（持续追踪）。

---

## 高优先级

> 业务接入前会爆，必须先解。

- [ ] **后端方向定锤（Supabase / Cloudflare Workers BFF / 混合）** —— 决定 `src/api/*` 重生形态、AI key 归属、数据库 schema 起点。当前 `src/api/` 仅剩 `authApi.ts`（mock 实现），其余 stub 已于 2026-05-09 删除——真接入前必须先选路线再加文件，避免再次堆出 stub 假象。
- [ ] **AI provider 抽象 + streaming 协议** —— 即使先用 mock，先把 `chat()` 签名固化成 `({ messages, signal }) => AsyncIterable<Token>` + zod schema（`Recommendation` / `ChatMessage` / `RagAnswer`），让 7 个 caller 不再各自发明。建议预留 `src/ai/{providers,prompts,stream,schema,index}.ts` 骨架。
- [ ] **`_app.tsx` 路由级鉴权门禁** —— 当前未登录可直达 `/dashboard /ai-advisor /course-planner /import /schedule`。加 `beforeLoad: () => { if (!isAuthenticated) throw redirect({ to: "/login" }) }`；mock 阶段无影响，真用户进来即裸奔。CLAUDE.md 把 `_app.tsx` 列为"不要修改"，需用户授权后再动。
- [ ] **API key 归属：BFF / Edge Function 强制中转** —— 浏览器侧（`src/api/*`）严禁直 fetch 第三方持密；选定后端方向后立刻确立 `src/server/` 与 `src/api/` 边界。
- [ ] **数据 schema 起草** —— `docs/DATA_MODEL.md` 不存在。Supabase 第一天要写 5–7 张表（user / course / plan / rule / chat_message / rag_source）的字段；先文档化、再 SQL，比写代码便宜 10 倍。

---

## 中优先级

> 半年内会爆。

- [ ] **AbortController / 流式取消 / 重试 / 超时 模板** —— 用户切 mode、切页时上一个 AI 请求要不要取消？没有约定。
- [ ] **AIAdvisor 7 modes 的 prompt 文案现散在 page 顶部 `const modes = [...]`** —— AI 接入时它们必然变 system prompt；先就近留着，但接入时第一步就是把它们搬到 `src/ai/prompts/mode.ts`。
- [ ] **5 个功能页的 const 数组数据**（Dashboard / AIAdvisor / Schedule / Upload / Planner）—— 真接数据要逐文件挖；建议落入 mock-mode flag 或 service 层后再切。
- [ ] **Drawer 三件套（open + scroll-lock + Esc）抽 `useDrawer` hook** —— `Navbar.tsx` + `DashboardLayout.tsx` 仍各写一份，body 是同一个抽屉。
- [ ] **shadcn `<Card>` `<Button>` 实际落地业务页** —— 46 个 primitive 当前在功能页几乎 0 引用，业务页全靠裸 Tailwind 类（`rounded-xl border border-slate-200 bg-white p-5`、`rounded-full bg-black ...`）—— 视觉漂移已开始；下次有改动顺手替。

---

## 低优先级

> 累计影响，不卡业务。

- [ ] **`src/pages/Home/Trust.tsx` 复用承诺未兑现** —— 注释明示 "kept unmounted for re-use"，CLAUDE.md 把 Home/* 列为不动区，本次保留；下次改 Home 时一并决定（删 / 抽到 effects 复用 / 真挂）。
- [ ] **`src/data/userProfile.ts` 0 引用** —— 含 mock seed 数据但当前无消费者。Supabase 接入时 user profile shape 要重定义，届时复用或删。
- [ ] **`components.json` css 入口字段不一致** —— 写的 `src/styles.css`，实际是 `src/styles/globals.css`，`shadcn add` 会出错；shadcn 落地业务页前先修。
- [ ] **路由命名 kebab-case (`/course-planner`) vs page 目录 PascalCase (`Planner`) 不统一** —— 历史遗留，影响 0，遇到批改名再统一。
- [ ] **`src/assets/` 3 个空目录 + .gitkeep** —— 业务图片 / icon 进来再说，现在留壳。

---

## 已解决

### 2026-05-09 — 接 Supabase 前清扫

> 目标：删幽灵抽象、断假数据流、移除装而不用的依赖，让"真后端接入"的起点不被脚手架干扰。

**死文件 / 死目录（共 21 个文件 + 8 个目录，全部 0 引用确认后删除）**
- [x] `src/layouts/MainLayout.tsx` —— 历史空函数、0 引用。
- [x] `src/components/layout/PageShell.tsx` —— 抽象写完无人用、0 引用。
- [x] `src/components/common/` —— 仅 `.gitkeep` 占位空目录。
- [x] `src/components/{ChatPanel,CourseCard,GPAChart,UploadBox}/` —— 4 个空 stub 业务组件目录，0 引用。
- [x] `src/components/effects/LaptopFrame.{tsx,css}` —— 仅自身互引用，0 外部 import。
- [x] `src/components/effects/LiquidEther.css` —— CSS 孤儿、无对应 .tsx。
- [x] `src/pages/{Profile,Courses,CourseAnalyzer}/` —— 3 个无 route 页；CourseAnalyzer 含完整 200 行实现但无入口、无 menu，删除后由后续按需新建。

**假抽象 / stub 文件（全部 0 引用确认后删除）**
- [x] `src/context/UserContext.tsx` —— 仅 `createContext({profile:null})`，无 Provider 无消费者。Auth 用户已在 `AuthContext` 管理；profile 字段后续按需在 `AuthContext` 内扩展。
- [x] `src/data/mockCourses.ts` —— 空数组导出，无消费者。
- [x] `src/utils/format.ts` —— `formatCourse(raw){return raw}` 一行 stub。
- [x] `src/api/{aiApi,courseApi,plannerApi}.ts` —— 3 个 `Promise<null>` / `Promise<[]>` stub，0 引用；后端方向定锤后由 `src/server/` 或 Supabase client 重生。
- [x] `src/services/` 整目录 —— `gpaService / ragService / recommendationService` 全部 stub，0 引用；GPA 单一住址保留 `src/utils/calculateGPA.ts`。
- [x] `src/hooks/{useCourses,usePlanner}.ts` —— 返回 `{ courses: [], loading: false }` 形状障眼法 hook，0 引用；真接入数据时与 `src/api` / `services` 同时设计。

**依赖清理**
- [x] `@tanstack/react-query` 从 `package.json` 移除 —— 全项目 0 `useQuery` / `QueryClient`，装而不用。需要 server-state 缓存时再装回 + 在 `__root.tsx Providers` 挂 `QueryClientProvider`。`__root.tsx` 注释同步更新。

**审计报告**
- [x] `docs/ARCHITECTURE_AUDIT.md` 全文刷新（2026-05-07 → 2026-05-09），修正旧版幻觉（Insights / GPASimulator 不存在）、标记已修项、列出新发现的 12 处死文件 / 幽灵抽象 + 三级炸药当量 + §14 决策序列。

### 2026-05-07
- [x] **MENU_ITEMS 单一真理** — 抽到 `src/config/menu.ts`，`Navbar` + `DashboardLayout` 共用同一份；字段统一为 `to`（之前 DashboardLayout 用 `href`，已迁移）
- [x] **Layout route** — 新建 `routes/_app.tsx` pathless layout，6 个功能页 route 移入 `routes/_app/`，page 内不再 import DashboardLayout；URL 不变
- [x] **删除旧 Navbar/Sidebar stub** — `src/components/Navbar/` 和 `src/components/Sidebar/` 删除（确认零引用）
- [x] **`__root.tsx` Providers 壳** — pass-through `<Providers>` 函数 + 5 个挂点 JSDoc（QueryClient / Auth / Theme / Toaster / ErrorBoundary）；不接业务、不引依赖
- [x] **`useAuth` 接通 `AuthContext`** —— 已 re-export `useAuthContext`；mock auth 全链路打通（验证于 2026-05-09 审计）
