# Current Task

> AI 接手必读，**优先级高于其它三份文档**。

---

## AI 阅读规则

**顺序：** 这份 → `PROJECT_OVERVIEW.md` → `ARCHITECTURE.md` → 改 UI 再读 `DESIGN_SYSTEM.md`。

**铁律：**

- ✅ 只做「需要做」列表里的事；做完停下汇报，不自己加戏
- ✅ 「不要修改」区域当只读——即使能顺手优化也不要动
- ❌ 不动列表外文件 / 配置 / 路由 / 全局样式 / 已有 commit 历史
- ❌ 不装新依赖，除非「需要做」明确要求
- ⚠️ 「不要修改」区有阻塞问题 → **报告，不要绕开**

---

## 当前任务（Last updated: 2026-05-10）

> 新任务覆盖此区，旧的挪到「完成归档」。

### 目标

> 一句话，要具体到能验证。

排队 1（路由鉴权门禁）已完成。**进入业务接入期**——剩下 3 条排队任务等用户挑一条开新会话，每条都小到能在一次会话内完成。

### 需要做（排队，按优先级）

> 一次开一条。开始前用户先指定要做哪条。

- [ ] **🔴 高 · 排队 2** — AI provider 抽象 + streaming 协议骨架（约 1–2 小时）
  - 新建 `src/ai/{providers,prompts,stream,schema,index}.ts`
  - 先定 `chat()` 签名：`({ messages, signal }) => AsyncIterable<Token>`
  - 写一个 `mock` provider 让 `/ai-advisor` 跑通流式渲染（不接真实 LLM）
  - zod schema 先定 `Recommendation` / `ChatMessage` / `RagAnswer`
  - 完成标准：`/ai-advisor` 输入框发消息 → mock provider 模拟 token-by-token 流式返回 → 页面流畅渲染

- [ ] **🟡 中 · 排队 3** — `docs/DATA_MODEL.md` 起草（约 1 小时）
  - 先文档再 SQL，5 张表字段：`profiles / course / plan / rule / chat_message`（+ 可选 `rag_source`）
  - 每张表写：字段名 / 类型 / 是否必填 / RLS 策略草稿 / 索引建议
  - 完成标准：用户读完能直接在 Supabase Dashboard 建表

- [ ] **🟡 中 · 排队 4** — 5 功能页之一接 Supabase（约半天）
  - 推荐从 `Upload (/import)` 开始（文件上传天然贴 Supabase Storage + `imported_files` 表）
  - 把页面顶部写死的 `dataRecords` const 替换为 `useQuery` 风格的 fetch（不引 react-query，先用纯 `useEffect + useState`）
  - 完成标准：登录用户上传文件 → 显示在已导入列表 → 刷新页仍在

### 不要修改

- 全局 Nav / Footer (`src/components/layout/`)
- 落地页 (`src/pages/Home/*`)（包括 `Transparency.tsx` + `TiltedCard` + Feedback 5 卡扇形 + Control 缓动 hover）
- 共享 UserMenu (`src/components/layout/UserMenu.tsx`)（Navbar + DashboardLayout 两处共用，改一处影响两处）
- 路由根 / 配置 (`src/routes/__root.tsx`、`src/router.tsx`、`src/routes/_app.tsx`)（除非任务要求加 beforeLoad）
- 路由分组 (`src/routes/_app/*` pathless layout 结构)
- 菜单单一真理 (`src/config/menu.ts`)（除非要新增菜单项 / 调整 title/intro 文案）
- 设计令牌 (`src/styles/variables.css`、`globals.css`)
- 笔记本相关 (`src/components/effects/EmbeddedLaptop.*`、`GridMotion.*`、`CardSwap.*`、`TiltedCard.*`)
- Supabase 接入面 (`src/lib/supabase.ts`、`src/api/authApi.ts`、`src/context/AuthContext.tsx`)（公共 API 已稳定，扩展时不要破坏 `AuthUser` shape 与 `useAuth` 签名）
- 自动生成 (`src/routeTree.gen.ts`)
- 已有 commit 历史（禁 `git reset` / `git rebase`）

### 完成标准

- [ ] `npm run build` 干净通过（client + Worker SSR）
- [ ] 视觉符合 `DESIGN_SYSTEM.md`（圆角 / 字号 / 按钮 / 语气）
- [ ] 所有「需要做」打钩
- [ ] 没碰「不要修改」
- [ ] commit 已提，message 写清做了什么

### 备注 / 参考

- 持续技术债追踪：`docs/TECH_DEBT.md`（高优先级 3 条 + 中优先级 5 条）
- 一次性深度审计：`docs/ARCHITECTURE_AUDIT.md`（2026-05-09 已刷新）
- Supabase 接入说明 + 部署 env 策略：`docs/AI_MEMORY.md` → 2026-05-09「Supabase auth 接入」条目
- 落地页改版细节：`docs/AI_MEMORY.md` → 2026-05-09「Transparency / TiltedCard / Feedback 扇形 / Control 缓动 / 功能页 breadcrumb HoverCard」条目
- 共享 UserMenu / Navbar layout-shift 修复细节：`docs/AI_MEMORY.md` → 2026-05-09 同上条目

---

## 完成归档

> 保留最近 5–10 条；权威记录在 `git log`，这里只留人话摘要。

- **2026-05-10** — 路由鉴权门禁 + 访客模式 + 退出登录改首页 + Home CTA 鉴权（排队 1 完成 + 用户追加 3 项）：
  - **`_app.tsx`** 加 `beforeLoad`：SSR 守卫（`typeof window === 'undefined'` 直接 return，避免 server 端把已登录用户也踢出，因为 D3=浏览器 auth，token 只在 localStorage）+ `isSupabaseConfigured` 守卫（fail-soft，缺 env 不拦路）+ **访客模式守卫**（`isGuestMode()` 为真即放行）+ `await supabase.auth.getSession()` 读 localStorage 缓存（无网络 IO）+ 无 session → `throw redirect({ to: '/login', search: { redirect: location.href } })`。
  - **`login.tsx` / `register.tsx`** 加 `validateSearch`：接受 `?redirect=` string 参数，类型化到 search。
  - **`Login/index.tsx` / `Register/index.tsx`**：`useSearch` 读 `redirect`，登录/注册成功后 `exitGuestMode()` + `navigate({ to: target, replace: true })`。`safeRedirect` 工具函数防 open redirect（仅放行 `/` 开头且不以 `//` 开头的同源相对路径，否则 fallback `/dashboard`）。Login↔Register 切换链接 `<Link search={{ redirect: ... }}>` 透传 redirect 参数。
  - **新建 `src/lib/guestMode.ts`**：localStorage 薄壳（`isGuestMode` / `enterGuestMode` / `exitGuestMode`），SSR 守卫 + try/catch 防隐私模式 quota 异常。键名 `meridian_guest_mode === "1"`。
  - **Login 页加「暂时跳过 · 以访客身份浏览」按钮**：点击 → `enterGuestMode()` + `navigate(redirect ?? '/dashboard')`，让用户无需注册登录即可浏览功能页（功能页对未登录态自行做空状态）。位置：登录按钮下方小号 underline 链接。
  - **`UserMenu.tsx` 退出登录改跳首页**：`handleLogout` 从 `navigate({ to: '/login' })` 改成 `navigate({ to: '/' })`，且调用 `exitGuestMode()`（防止退出后访客标志残留导致下次访问功能页绕过门禁）。
  - **`Hero.tsx` / `FinalCTA.tsx` CTA 鉴权门禁**：「开始分析」/「立即开始」按钮 `<a href="/dashboard">` → `<button onClick>`，已登录或访客 → `/dashboard`，未登录 → `/login?redirect=/dashboard`。
  - **手测验证项**（用户跑 `npm run dev` 后自验）：未登录访问 `/dashboard`/`/ai-advisor`/`/course-planner`/`/import`/`/schedule` → 跳 `/login?redirect=<原路径>`，登录后回原页；首页两个 CTA 同样行为；点「暂时跳过」 → 进 dashboard 不需登录；退出登录 → 落到首页 `/`；登录或注册成功 → 访客标志被清除。
  - **未做（明确推迟）**：router context 注入；服务端鉴权（保持 D3=a 浏览器 auth）；功能页空状态视觉打磨（当前页面已是 const 假数据，访客模式下天然有内容显示）。

- **2026-05-10** — Supabase auth 联通验证：
  - 用户在 Supabase 建项目，拿到 URL + 新格式 publishable key（`sb_publishable_*`，2024 末新发的，等价旧 anon key）。
  - `.env.local` 第一版 URL 误带 `/rest/v1/` 后缀（SDK 自己拼，重复 → 404 "Invalid path"），删掉后正常。
  - 注册流程跑通；遗留 3 条小验证任务交给用户：登出、重登、多 tab 同步（验证 `onAuthChange`）。
  - **关键坑提醒**：Vite 只在启动时读 `.env.local`，改完必须 `Ctrl+C` + `npm run dev` 重启，再浏览器 `Ctrl+Shift+R` 硬刷新。
  - **Supabase Dashboard 配置确认**：Authentication → Email 启用 + "Confirm email" 关闭（D2 = a）+ Site URL 加 `http://localhost:8080`（lovable vite preset 默认 8080，不是 5173）。

- **2026-05-09** — Supabase auth 接入（mock 退役）+ 架构审计 + 死文件清扫：
  - **架构审计** `docs/ARCHITECTURE_AUDIT.md` 全文刷新（2026-05-07 → 2026-05-09），按炸药当量列出 12 处死文件 / 幽灵抽象 + 4 项决策点。
  - **死文件清扫**（21 文件 + 8 目录，全部 0 引用确认后删）：`MainLayout` / `PageShell` / `common/` / `ChatPanel` / `CourseCard` / `GPAChart` / `UploadBox` / `LaptopFrame` / `LiquidEther.css` / 3 个无 route 页（Profile / Courses / CourseAnalyzer）/ `UserContext` / `mockCourses` / `format.ts` / 3 个 stub api（aiApi / courseApi / plannerApi）/ `services/` 整目录 / `useCourses` / `usePlanner`。
  - **react-query 移除**：全项目 0 `useQuery` / `QueryClient`，从 `package.json` 删除；`__root.tsx Providers` 注释同步更新。
  - **Supabase auth 接入**（决策 D1–D4 全走默认 (a)）：新建 `src/lib/supabase.ts` 单例（含 SSR 守卫 + fail-soft env 缺失警告 + `isSupabaseConfigured` 标志）；`src/api/authApi.ts` 4 函数体 mock → Supabase + 新增 `onAuthChange(cb): unsubscribe`；`src/context/AuthContext.tsx` 加订阅，公共 API 不变（Login / Register / UserMenu 0 修改）；`MockSession` → `AuthSession`（去 token 字段）；`AuthUser` shape 不变。
  - **环境变量**：新建 `.env.example`，`.gitignore` 显式 `.env` 规则；`wrangler.jsonc` 加注释说明 Vite `VITE_*` 是构建时内联（不要放 wrangler `vars`）。
  - **未做（明确推迟）**：`_app.tsx beforeLoad` 鉴权门禁、`profiles` 表 + RLS、邮件确认 / 忘记密码 / OAuth、AI provider 抽象、RAG 设计、5 功能页接真实数据。

- **2026-05-09** — 落地页 Transparency 区 + Feedback 重做 + Control 缓动 + 5 功能页 breadcrumb HoverCard：
  - **新 section `Transparency.tsx`**（替代旧 `Honesty.tsx`）：hub-and-spoke 布局，3×3 grid（标题 / 卡 / pillar 在中央列；4 个 pillar 落在四角），SVG bezier 连线 + dashed marching-ants 关键帧（`transparency-ants` in `Home.css`）；连线坐标用 `getBoundingClientRect()` + `ResizeObserver` 实时测算，端点精准落在 pillar 内边中点和卡的左右边中点；卡左/右两个连接点各承接两条线（Y 字形）；hover pillar 联动卡片中对应 chip 浮起 + 连线变彩；中央卡用 `<TiltedCard>` 3D tilt；overflow-visible 让卡片视觉下移 40px 不被裁掉。
  - **新组件 `TiltedCard.{tsx,css}`**：React Bits TS port，零依赖（不引 `motion`），鼠标 tracking 期 90ms 缓动 + 离场 600ms 长缓动近似 spring，shine overlay 跟随鼠标 `mix-blend-mode: soft-light`，`prefers-reduced-motion` 自动停用。
  - **`Feedback.tsx` 全面重做**：5 张卡片（增 Tao / Sara），中间 Marcus 改 4⭐ + Aisha 改 5⭐；xl 单行扇形布局（rotate -3.5° / -1.5° / 0 / +1.5° / +3.5° + 外两张 scale 0.95 + translate-x ±12px），hover 任意卡 rotate 归零 + z-30 抽出；滚动驱动星星 cascade（每颗有阈值，section 中心到达视口中心时全部点亮，amber-400 fill ↔ slate-200）；按 design system 改回 emerald/amber/gray 语义色 + 标准 eyebrow + `bg-gray-50` 区底。`FeedbackCard` 定义在模块顶层避免父级 scroll re-render 导致的 unmount-remount bug。
  - **`Control.tsx` 缓动 hover**：3 张卡片改用 React `useState` + 内联分层过渡（transform 0.85s / border 0.85s+0.06s / shadow 1s+0.1s / 数字圆 scale 0.85s+0.1s），全部 `cubic-bezier(0.16,1,0.3,1)`；之前 Tailwind `hover:` arbitrary value + `transition-[border-color,transform,box-shadow]` 偶尔解析不全导致"卡卡的"已修复。`ControlCard` 同样定义在模块顶层。
  - **`FinalCTA.tsx` 按钮**：实心黑底 → 黑色描边 + 黑字；hover 反相为黑底白字 + 箭头 `translate-x-1`。
  - **`Footer.tsx`**：3 列 → 2 列，删掉中间 Workspace/Rules/Simulation 块。
  - **共享 `UserMenu.tsx`**：抽出 Navbar + DashboardLayout 两处头像下拉菜单为单一组件；`modal={false}` 修首页点头像导致整条 nav 向右跳的 bug（Radix 默认锁 body scroll + 加 padding-right 抵消滚动条，fixed nav 重新对齐到加宽 viewport）；新菜单项 个人资料 / 个性化 / Upgrade plan / 设置 / 帮助 / 退出登录，hover 只动颜色不动图标位置（避免 0.5px 抽搐感）；动画 220ms `cubic-bezier(0.22,0.61,0.36,1)` from `origin-top-right`。
  - **5 个功能页 breadcrumb HoverCard**：Dashboard/AIAdvisor/Planner/Schedule/Upload 删掉页面顶部 eyebrow + h1 + intro 段落，把内容搬到 `MENU_ITEMS` 的新 `title` + `intro` 字段（`src/config/menu.ts` 单一真理源）。功能页顶栏的 `[icon] Workspace/AI Feed/...` breadcrumb（`DashboardLayout` 内）外包 shadcn `HoverCard`，hover 弹出圆角白卡显示完整介绍。删除短命 `PageIntro.tsx` 中间组件。

- **2026-05-09**（早些）— **feature/dashboard 分支合并** 把 5 个功能页从骨架推进到可演示状态：
  - **Dashboard** (`/dashboard`, 384 行)：4 区——信息导入快捷入口（5 个）+ 决策卡（3 张可点切换 tone）+ 场景动作选择 + 指标卡（4 项 GPA/进度/风险）。useState 切换 selectedAction，Tailwind 动效。
  - **Planner** (`/course-planner`, 676 行)：基于 `@xyflow/react` 的 ReactFlow 决策图谱。多种节点类型（course/requirement/gpa/risk/goal/abroad/internship 等），lane 分层（L0..），自定义 NodeKind/NodeData/LaneData，背景 `BackgroundVariant.Dots` + MiniMap + Controls。
  - **AIAdvisor** (`/ai-advisor`, 256 行)：Goal Mode——4 个固定模式卡（GPA 优先 / 学习兴趣 / 留学准备 / 实习就业）右侧自然语言输入框，状态指示「中文 · 自然语言」+ pulse halo。
  - **Schedule** (`/schedule`, 332 行)：Rule Graph——左侧规则树（按培养方案分组的可折叠 LeafNode + ConflictRule + ExternalLink），右侧冲突详情卡（A 方 / B 方 / AI 判断）。
  - **Upload** (`/import`, 355 行)：Import Center——学校选择器 + 当前连接状态 + 文件上传槽（5 种类型 + 格式提示）+ 已导入文件表格。
  - 全部仍是写死 const，无 fetch；视觉满足 DESIGN_SYSTEM。

- **2026-05-08** — 登录系统 + 落地页改版（4 个 section + 新增 1 个组件）：登录系统 mock 鉴权 + Login/Register 页；Explain「认知落差」+ GpaMath「Meridian 不只是推荐好课」+ Faq.tsx 新建 + Footer 黑底三栏（中间栏现已删）+ Navbar 4 项居中。
- **2026-05-07** — 落地页第二屏文案 + 诚实性/Trust 真融合（Honesty.tsx 已被 Transparency.tsx 替代）；一级结构债收敛（menu 单一真理 / `_app` pathless layout / 删旧 stub / Providers 壳）。
- **2026-05-06** — 项目结构整理 + 笔记本厚度 + CSS 笔记本展示初版。
