# AI Memory — 长期项目状态存档

> **新 AI 会话 / 新 agent 接手时直接贴这一份。** 等于是给新对话灌入"项目长期记忆"。
> 重大里程碑后更新；不是每次都改。CURRENT_TASK.md 是每会话的；这份是跨会话的。

> Last snapshot: **2026-05-08**
> Latest commit: `c60efa1` (第三页完成) ＋ 未提交：登录/注册页 + Mock 鉴权
> Active branch: `main`

---

## 1. 当前项目状态（一图速览）

```
阶段        →  落地页完成 + 一级结构债收敛完毕，进入业务接入期
今日重点    →  架构审计后做了 4 件结构事：menu 单一真理 / _app layout route / 删旧 stub / Providers 壳
下一里程碑  →  决定 BFF vs Supabase / AI provider 抽象 / Dashboard 真实数据
风险点      →  bun.lockb 与 node_modules 可能不同步；中国高校本地化未做
```

**完成度估计：**

| 模块 | 状态 |
|---|---|
| 落地页（Home） | ✅ 90%（视觉/动画完成，文案需本地化为中国高校） |
| 笔记本 3D 展示 | ✅ 100%（CSS 伪 3D，含厚度 / 键盘 / hover lift） |
| 文档体系 | ✅ 100%（CURRENT_TASK / AI_MEMORY / OVERVIEW / ARCHITECTURE / DESIGN_SYSTEM / TECH_DEBT / ARCHITECTURE_AUDIT） |
| 路由架构 | ✅ pathless `_app` layout，6 个功能页统一套 DashboardLayout |
| 全局菜单单一真理 | ✅ `src/config/menu.ts`（Navbar + DashboardLayout 共用） |
| Providers 壳 | ✅ `__root.tsx` 已挂 pass-through `<Providers>`（5 个 TODO 挂点） |
| Dashboard / 6 个功能页 | 🟡 静态 demo（写死 const，等真实数据） |
| CourseAnalyzer 页 | 🟡 5%（骨架，无 route） |
| 后端 Worker | ❌ 0%（未建项目；BFF vs Supabase 方向未定） |
| AI provider 抽象 | ❌ 0%（`src/api/aiApi.ts` 全空 stub，streaming 协议未定） |
| 鉴权 / 用户系统 | 🟡 30%（**Mock 实现**，localStorage-backed；详见下文 2026-05-08 条目） |
| 学校手册 RAG pipeline | ❌ 0% |
| 真实数据接入 | ❌ 0% |

---

## 2. 已完成（按 commit 倒序）

### **2026-05-08** — 登录/注册页 + Mock 鉴权（未提交）

把 auth 系统从「全空 stub」推到「能点登录、能跳 dashboard、刷新仍登录」。**全部是 mock，不是真后端**。

**视觉：**
- 新页 `src/pages/Login/`、`src/pages/Register/`：白卡 + Apple-like 字体规范（Inter / `font-semibold tracking-tight` / `text-3xl` 大标题 / `text-sm` 正文 / `text-xs` 小字）+ rounded-full 输入与按钮
- 两卡尺寸锁死：`max-w-[440px] min-h-[640px]`，登录↔注册切换零跳动
- 入场用项目内 `animate-fade-in-up-soft`，子元素阶梯延时 80/140/200/260/460ms（社交按钮额外 520ms，仅登录页）
- 输入框 `hover:border-gray-400` + `focus:border-gray-900 + ring-gray-900/10`
- 路由：`src/routes/login.tsx`、`src/routes/register.tsx`（不挂 `_app`，绕开 DashboardLayout）

**鉴权流：**
- `src/api/authApi.ts` ←  **完整 mock**：login/register/logout/getCurrentUser；session 存 `localStorage["meridian:auth"]`，包含 `{ user: { id, email, name, createdAt }, token: "mock_..." }`；带 300ms 假延迟模拟网络
  - 校验规则：login 密码 ≥6 位；register 密码 ≥8 位；邮箱必须含 `@`
  - **不校验唯一性、不存密码、token 是随机字符串**——上线必换
- `src/context/AuthContext.tsx` ← 改成真 Provider，暴露 `{ user, isAuthenticated, loading, login, register, logout }`；mount 时 `getCurrentUser()` 恢复 session
- `src/hooks/useAuth.ts` ← 一行 re-export `useAuthContext`
- `src/routes/__root.tsx` ← `<Providers>` 改成 `<AuthProvider>` 包裹（不再 pass-through）

**入口接通：**
- 首页 Navbar 「登录/注册」按钮 → `/login`、`/register`；登录态自动切换为头像首字母 + DropdownMenu（与 DashboardLayout 同一组项），颜色随 scrolled 状态自适应（白底深色 / 透明白色）
- DashboardLayout 右上头像：`isAuthenticated` 时是头像首字母 + shadcn DropdownMenu（用户名 / 邮箱 / 我的面板 / 退出登录）；未登录时显示 "登录" 按钮链到 `/login`
- Login 提交 → `useAuth().login()` → `navigate({ to: "/dashboard" })`，错误显示在按钮上方
- Register 提交 → `useAuth().register()` → 同上（即"注册→自动登录→跳 dashboard"）
- 提交期间按钮 disabled + 文案改为「登录中…」/「创建中…」

**接真后端时改这几处：**
1. **改 `src/api/authApi.ts`**：四个函数的函数体替换成 `fetch("/api/auth/login", ...)` 真实调用。返回类型保持 `MockSession` / `AuthUser` 形状，或同步修改 `AuthContext` 的 `setUser` 数据结构
2. **token**：当前 token 是 `mock_xxx` 随机串，无 expiry。换真 JWT 时考虑：
   - 存储位置：localStorage（XSS 风险）vs httpOnly cookie（推荐）
   - Refresh token 流程：在 `AuthProvider` 加 axios/fetch 拦截器或 react-query mutation
   - 401 全局处理：TanStack Router 的 beforeLoad / route guards
3. **路由守卫**：`/_app/*` 下的 dashboard/ai-advisor 等当前对未登录用户也开放。真上线时在 `routes/_app.tsx` 加 `beforeLoad` 检查 `isAuthenticated`，否则 throw redirect 到 `/login?redirect=...`
4. **DESIGN_SYSTEM 同步**：登录卡片用了 `shadow-[0_5px_20px_rgba(0,0,0,0.04)]`，违反"落地页几乎不用 box-shadow"——auth 页是浮层卡片，特例。如要彻底纯 border 风，删除 shadow class
5. **Apple/Google 登录按钮**：UI 已有，未接 OAuth provider。接入时走 `src/services/` 业务层 + `authApi.ts` 新方法

**没做：**
- 没加 `/forgot-password` 流程（按钮目前是 `<button type="button">` 无 href）
- 没加路由守卫（dashboard 等页面对未登录用户仍可访问）
- 没接 OAuth

### **2026-05-07** — 一级结构债收敛（未提交）
做了架构审计 + 处理 4 件最高优先级结构问题，**严格不动 UI 与业务逻辑**：

- `src/config/menu.ts` 单一真理：6 项功能菜单（label/desc/to/icon）抽出，`Navbar` 与 `DashboardLayout` 共用
- TanStack Router `_app` pathless layout：新建 `routes/_app.tsx` 包 `<Outlet>` in `DashboardLayout`，6 个功能页 route 移入 `routes/_app/`，**page 不再 import DashboardLayout**
  - URL 不变（仍 `/dashboard` 等，`_app` 段被 pathless 吃掉）
  - `routeTree.gen.ts` 由 router-plugin 自动重生成
- 删除旧 stub：`src/components/Navbar/`、`src/components/Sidebar/`（确认零引用）
- `__root.tsx` 加 `<Providers>` pass-through 函数：5 个 JSDoc 挂点（QueryClient / Auth / Theme / Toaster / ErrorBoundary）。**未引入任何新依赖、无业务逻辑**
- 派生文档：`docs/ARCHITECTURE_AUDIT.md`（一次性深度审计，4 章 + 14 节）+ `docs/TECH_DEBT.md`（持续追踪）
- 验证：`tsc --noEmit` clean

**未做（用户明确要求不做）：** 真接 react-query / Supabase / AI provider；不抽业务组件；不改 api/services/hooks。

### `c826436` — docs: AI handoff documentation
四份文档：
- `docs/CURRENT_TASK.md` — 每会话任务约束
- `docs/PROJECT_OVERVIEW.md` — 项目定位 / 用户 / 商业 / 技术栈
- `docs/ARCHITECTURE.md` — 文件结构 / 数据流 / 协作约定
- `docs/DESIGN_SYSTEM.md` — token / 字体 / 按钮 / 动画 / 文案规范

### `1c26d5f` — restructure project + 自适应 Nav + SplitText
- 拆 `src/pages/Home/index.tsx` 730 行 → 一 section 一文件
- Nav/Footer 抽到 `src/components/layout/`
- CourseAnalyzer / Dashboard 骨架页
- Nav 在 dark Hero 上透明白字、滚 30vh 后切换白底深字
- Hero 三行大字用 `gsap/SplitText` 字符级 fade-up
- assets/logo → assets/logos
- styles/global.css → globals.css + animations.css 拆分

### `db63087` — 笔记本厚度 + hover lift
- 修了 `embedded-laptop-base-3d` 缺 `transform-style: preserve-3d` 的 bug（导致 base-front 子元素 rotateX(-90) 被压回 2D）
- 底座前缘加可见厚度立面
- 键盘从渐变贴图改成 5×14 真实 div 键，每键独立厚度 box-shadow
- 整机加多层 ambient drop shadow
- 鼠标 hover 笔记本上抬 -2vh，scroll progress > 0.7 启用

### `72a8a3b` — CSS 笔记本展示初版
- Hero 内嵌入 `<EmbeddedLaptop>`
- ScrollTrigger pin/scrub：scale 1→0.32, xPercent 26, rotateY -14, rotateX -4
- 起始 offset 0.05 + duration 1.2 + ease "power2.out"（fast start, slow tail）
- GridMotion 从鼠标驱动改自动循环（marquee 风格，items 复制双倍 + xPercent 0→-50% 无限循环）
- Trust 文案嵌在第二页左侧

### `7da4447` — 初始项目
- TanStack Start + React 19 + Vite 7 + Tailwind 4
- shadcn/ui 50+ 组件
- GSAP 已装

---

## 3. 关键技术决策（带原因）

### 笔记本展示：CSS 伪 3D 而不是 Three.js / R3F
**为什么：** 试过 R3F 路线（commit 已 reset）。装了 `@react-three/fiber + @react-three/drei` 后渲染失败 + 视觉粗糙，回退到 CSS。
**当前：** 全 CSS + `transform-style: preserve-3d` + translateZ + rotateX/Y。
**坑：** 嵌套 3D 必须 **每层** 父级加 `preserve-3d`，否则子元素 3D 退化为 2D。
**未来要不要换 3D 模型：** 不要轻易动。CSS 已能做合盖动画（旋转 lid 即可）。要换得重写整个展示。

### 动画引擎：GSAP + ScrollTrigger + SplitText
**为什么：** Tailwind / Framer Motion 表达力不够（pin、scrub、字符级动画都需要 GSAP）。
**注意：** GSAP 3.13+ 把 SplitText 改为免费，本项目装的 3.15.0 可用。
**坑：** `gsap.registerPlugin(useGSAP)` 这行在 SSR 期间不会爆，因为 Vite 只 transform 不 execute。但要注意各 plugin 的 register 函数有 `window.innerWidth` 引用，万一变成模块顶层执行就会炸。

### 状态管理：React Context（不上 Zustand / Redux）
**为什么：** 项目规模不大，跨页面共享状态有限（用户 + 鉴权）。
**何时升级：** Context 触发的 re-render 出现性能问题时。
**当前：** `src/context/{Auth,User}Context.tsx` 仅占位，未实装。

### 后端：Cloudflare Workers
**为什么：** 项目已配 `wrangler.jsonc` + `@cloudflare/vite-plugin`。前后端同一栈部署，简化运维。
**当前：** Worker 项目骨架未建，`src/api/*` 都是空 stub。
**TBD：** 数据库选 D1（SQLite）还是 KV，向量库用 Cloudflare Vectorize 还是外部。

### Nav 自适应：scroll listener + setState
**为什么：** IntersectionObserver 需要监测节点对齐 nav，复杂；scrollY 比较够用。
**阈值：** 30vh（笔记本展示已缩小到右下，主视野是白色 sticky 舞台）。
**坑：** 直接 setState 在快速滚动时频繁触发；当前用了 `passive: true` listener 没明显问题。如果以后卡，改成 RAF 节流。

### 路由分组：TanStack Router pathless `_app` layout
**为什么：** 6 个功能页都需要 `DashboardLayout`（左侧 rail + drawer）。原本每个 page 各自 `import DashboardLayout` 后手动包裹——layout 决策被泄露到 page 里，新增功能页要记得包，新增全局壳要改 6 处。
**当前：** `routes/_app.tsx` 是 pathless layout（`_` 前缀），内部 `<DashboardLayout><Outlet/></DashboardLayout>`。功能页 route 全在 `routes/_app/` 下，URL 不变（`_app` 段被 pathless 吃掉）。
**坑：** `routeTree.gen.ts` 由 router-plugin 自动生成；移动 route 文件后 plugin 会自动改写 `createFileRoute` 路径字符串到 `/_app/<name>`，但**别手改 routeTree.gen.ts**，重启 dev 会被覆盖。

### 全局菜单：单一真理 `src/config/menu.ts`
**为什么：** Navbar（首页 drawer）和 DashboardLayout（功能页左侧 rail + drawer）显示**完全相同**的功能菜单。改一处忘另一处 = UI 不一致。
**当前：** `src/config/menu.ts` 导出 `MENU_ITEMS: MenuItem[]`，字段统一为 `{ label, desc, to, icon }`。两处 import 同一份。
**新加菜单项：** 只动 `src/config/menu.ts`，Navbar 和 DashboardLayout 自动同步。

### 项目结构：一 section 一文件
**为什么：** 多 agent 用 git 分支并行开发同一项目。Home/index.tsx 730 行的单文件会冲突。
**协作模式：** `feature/home-flow`、`feature/home-feedback` 各自分支互不冲突。
**协调点：** `Home/index.tsx`（加新 section 时改）、`Navbar.tsx`、`globals.css`、`package.json`、`__root.tsx`——这些是约定 owner，不是各自动手。

### 文档体系：4 份分层
- `CURRENT_TASK.md` 每会话变 — 边界
- `AI_MEMORY.md` 每里程碑变 — 状态
- 其它三份稳定 — 项目本身

---

## 4. 注意事项（已踩过的坑）

### CSS 3D
- **每层 preserve-3d**：父元素只要有 `transform` 但没 `transform-style: preserve-3d`，所有子的 3D 旋转都被压回 2D（看起来"消失"或变成扁条）。Bug 排查模板：先把可疑元素加 4vw 红色背景看渲染位置。
- **transform-origin 选择**：旋转轴决定子元素飞向哪里。`top` / `bottom` / `center` 不一样，要根据物理含义选。
- **rotateX 方向**：CSS Y-down 坐标。rotateX(+90) 让元素的"底"转向远离镜头方向，rotateX(-90) 转向镜头。容易记反。

### React 19
- **Ref callback 不能 return 元素**：`ref={el => rowRefs.current[i] = el}` 在 React 19 会报 TS 错误。要写成 `ref={el => { rowRefs.current[i] = el; }}`（显式 void return）。
- **JSX namespace 不存在**：React 19 把 `JSX.IntrinsicElements` 移除了，组件里写 `Tag as keyof JSX.IntrinsicElements` 报错。用 `createElement(tag, ...)` 绕开。

### TanStack Start SSR
- 路由组件被 SSR 渲染。组件 init 期间引用 `window.innerWidth` 之类会炸（GridMotion 现在的写法工作是因为 dev mode 当前没 SSR 这页 / 客户端补全）。后期接入 Worker 后要补 client-only 守卫或 useEffect。
- Vite transform ≠ execute。模块顶层的 `gsap.registerPlugin(...)` 不会在 transform 时跑——但浏览器 import 时跑。

### Drei `<Html transform>` 局限（当前未使用）
- Hero 嵌入 `<Html transform>` 渲染时，内部 React 子树用了 `min-h-screen` 会炸尺寸（参考 viewport 而不是 Html 容器）。要么改 Hero 用 `h-full`，要么放弃。

### `useEffect` cleanup + GSAP context
- `gsap.context()` 必须 return cleanup 函数 `() => ctx.revert()`，否则 dev hot reload 时会有重复 trigger 残留。

### bun + npm 混用
- 本项目装过 npm（`npm install --no-package-lock` 装 R3F，后来 reset），但 `bun.lockb` 没重新生成。新 agent 拉分支跑 `bun install` 可能拉到旧依赖。
- **建议：** main 分支跑一次 `bun install` 重生 lockb 后再让 agent 各自拉分支。

### 落地页文案与目标用户错位
- Hero / Explain section 用 `CS 101 / MATH 220 / RateMyProf` 这些**美式选课系统词汇**。
- 但 `PROJECT_OVERVIEW.md` 已确认目标用户是**中国高校**学生。
- 这是有意保留的占位文案，本地化任务**还没做**。

---

## 5. 未解决问题 / TBD

### 业务侧
- ❓ 中国高校的实际选课规则差异有多大？需要调研典型几所学校的培养方案
- ❓ 第一批种子学校选谁（推荐试点 5 所典型院校：985 / 211 / 双非 / 民办 / 高职）
- ❓ "学校手册"具体格式：PDF 主流？教务系统直接抓？需要调研

### 技术侧
- ❓ 学校手册 OCR + 解析 pipeline（用 Cloudflare AI / OpenAI / 自建？）
- ❓ Worker 项目结构（在 `/workers/` 平级目录还是嵌入 `/src/`）
- ❓ D1 还是 KV：用户数据用 D1（关系型），手册解析结果用 KV / Vectorize
- ❓ 鉴权：cookie session（推荐）还是 JWT（移动端友好）

### 历史包袱（不影响功能但乱）
- ~~`src/components/{Navbar,Sidebar}/`~~ 已删除（2026-05-07）
- `src/components/{CourseCard,GPAChart,UploadBox,ChatPanel}/` 仍是空 `<div />` stub，留待业务接入时实做或删
- `src/components/effects/LaptopFrame.tsx + .css` 旧版 CSS 笔记本（已不用，保留作 fallback）
- `src/components/effects/LiquidEther.css` 孤儿 CSS（无对应 .tsx，可删）
- `src/layouts/MainLayout.tsx` 旧版页面壳（与 `components/layout/PageShell` 重复且都无人用）
- `src/components/layout/PageShell.tsx` 写完无人引用（Home 直接拼 Navbar+Footer）
- `src/pages/{Courses,Upload,AIAdvisor,Profile,CourseAnalyzer}/` 中无 route 的 4 个：早期占位（AIAdvisor 已通过 `/ai-advisor` route 接入）
- `components.json` tailwind css 入口指 `src/styles.css`，实际是 `src/styles/globals.css`——`shadcn add` 会出错

**清理时机：** 等业务方向定下来（BFF vs Supabase + AI provider）后统一清理。详见 `docs/TECH_DEBT.md`。

---

## 6. 命令速查

```bash
# 开发
bun dev                    # 默认 8080 端口
./node_modules/.bin/tsc --noEmit   # 类型检查（bun 不在 PATH 时直接跑）

# 构建
bun run build
bun run preview

# git
git log --oneline -10
git reset --hard <hash>    # 回退
git status --short

# 部署（待）
bunx wrangler deploy       # Cloudflare 部署，等 Worker 项目建好后启用
```

---

## 7. 给新 AI 的开场白模板

> 拷贝下面这段贴到新对话，AI 就能一键 onboarding：

```
我在做 Meridian — 中国高校选课决策引擎。读 docs/AI_MEMORY.md
拿到当前状态。然后读 docs/CURRENT_TASK.md 知道今天要做什么。
重要参考：docs/{PROJECT_OVERVIEW,ARCHITECTURE,DESIGN_SYSTEM}.md。

技术栈：React 19 + TS + Vite + TanStack Start + Tailwind 4 + shadcn/ui +
GSAP + Cloudflare Workers（待建）。包管理 bun。

不要改不该改的（CURRENT_TASK 里有"不要修改"清单）。完成后停下报告。
```

---

## 8. 文档维护节奏

| 文档 | 更新频率 | 谁改 |
|---|---|---|
| `CURRENT_TASK.md` | 每次开会话前 | 用户 |
| `AI_MEMORY.md` | 每个里程碑（commit 几个之后） | 让 AI 总结然后审 |
| `PROJECT_OVERVIEW.md` | 商业 / 用户定位变了 | 用户 |
| `ARCHITECTURE.md` | 加新文件夹 / 改数据流 | AI 改完后用户审 |
| `DESIGN_SYSTEM.md` | 加新 token / 新 pattern | AI 改完后用户审 |

**更新 AI_MEMORY 的指令：**

```
让 AI 跑：

「根据最近 commit 和当前代码状态更新 docs/AI_MEMORY.md。
保留章节结构。重点更新：当前状态、已完成、未解决问题。」
```
