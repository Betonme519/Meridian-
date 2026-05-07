# Meridian 技术债

> **维护节奏：** 完成一项就把它移到「已解决」+ 当天日期；新发现的债加到对应优先级。
> **配套阅读：** `docs/ARCHITECTURE_AUDIT.md`（一次性深度审计，按炸药当量列了 16 项）+ 本文（持续追踪）。

---

## 高优先级

> 业务接入前会爆，必须先解。

- [ ] BFF vs Supabase 方向决定（影响 `src/api/*` 全部实现路径与 Auth/Realtime/Storage 选型）
- [ ] AI provider 抽象 + streaming 协议（Anthropic/OpenAI/校内任选其一；`src/api/aiApi.ts` 当前全空）
- [ ] `useAuth` 接通 `AuthContext`（现在双轨：hook 不读 context，加了 Provider 也无效）

---

## 中优先级

> 半年内会爆。

- [ ] AI provider abstraction（providers/ + prompts/ 目录，避免 page 内散写 prompt）
- [ ] React Query Provider 真启用（`__root.tsx` 已挂 `<Providers>` 壳，缺 QueryClient + 业务 useQuery）
- [ ] CourseCard 抽象（Insights/Dashboard/AIAdvisor 重复造卡 8+ 处；shadcn `<Card>` 当前 0 引用）

---

## 低优先级

> 累计影响，不卡业务。

- [ ] 4 个无 route page 决策：`Courses / Profile / Upload / CourseAnalyzer` 删 or 加路由
- [ ] shadcn primitives 实际落地业务页（46 个 primitive 当前 0 引用，视觉漂移已开始）
- [ ] 业务数据 mock-mode flag（Dashboard/Insights/AIAdvisor 全写死 const，切真实数据要逐文件挖）
- [ ] Drawer 逻辑抽 `useDrawer` hook（Navbar + DashboardLayout 仍各写一份 open/scroll-lock/ESC）
- [ ] `components.json` css 入口修（写的 `src/styles.css`，实际 `src/styles/globals.css`，`shadcn add` 会出错）
- [ ] `MainLayout` / `PageShell` 决策（无人用，留还是删）
- [ ] `effects/LiquidEther.css` 孤儿 + `LaptopFrame.*` fallback 清理
- [ ] 4 个空 stub 业务组件（`ChatPanel / CourseCard / GPAChart / UploadBox`）：实做或删
- [ ] `src/api/*` `src/services/*` `src/hooks/*` 12 个空函数文件：方向定后统一处理
- [ ] 路由命名 kebab-case (`/gpa-simulator`) vs page 目录 PascalCase (`GPASimulator`) 统一

---

## 已解决

### 2026-05-07
- [x] **MENU_ITEMS 单一真理** — 抽到 `src/config/menu.ts`，`Navbar` + `DashboardLayout` 共用同一份；字段统一为 `to`（之前 DashboardLayout 用 `href`，已迁移）
- [x] **Layout route** — 新建 `routes/_app.tsx` pathless layout，6 个功能页 route 移入 `routes/_app/`，page 内不再 import DashboardLayout；URL 不变
- [x] **删除旧 Navbar/Sidebar stub** — `src/components/Navbar/` 和 `src/components/Sidebar/` 删除（确认零引用）
- [x] **`__root.tsx` Providers 壳** — pass-through `<Providers>` 函数 + 5 个挂点 JSDoc（QueryClient / Auth / Theme / Toaster / ErrorBoundary）；不接业务、不引依赖
