# AI Memory — 长期项目状态存档

> **新 AI 会话 / 新 agent 接手时直接贴这一份。** 等于是给新对话灌入"项目长期记忆"。
> 重大里程碑后更新；不是每次都改。CURRENT_TASK.md 是每会话的；这份是跨会话的。

> Last snapshot: **2026-05-09**
> Latest commit: `ded270d` (前端完成准备审计) ＋ 未提交：Transparency hub-and-spoke / TiltedCard / Feedback 5 卡扇形 + 滚动星 / Control 缓动 hover / UserMenu 共享 / 5 功能页 breadcrumb HoverCard
> Active branch: `main`

---

## 1. 当前项目状态（一图速览）

```
阶段        →  前端 demo 全部完成（落地页 + 5 功能页），进入业务接入期
近期重点    →  Transparency 视觉重做、Feedback / Control 交互打磨、共享 UserMenu、功能页顶栏 breadcrumb HoverCard
下一里程碑  →  决定 BFF vs Supabase / AI provider 抽象 / 5 功能页接真实数据
风险点      →  bun.lockb 与 node_modules 可能不同步；中国高校本地化未做；功能页全是写死 const
```

**完成度估计：**

| 模块 | 状态 |
|---|---|
| 落地页（Home） | ✅ 98%（Hero / Flow / Explain / GpaMath / **Transparency**（替代 Honesty） / Control / Feedback / FAQ / FinalCTA / Footer 全部接好；文案需本地化为中国高校） |
| 笔记本 3D 展示 | ✅ 100%（CSS 伪 3D，含厚度 / 键盘 / hover lift） |
| TiltedCard 3D tilt 组件 | ✅ 100%（React Bits TS port，无 `motion` 依赖） |
| 共享 UserMenu | ✅ 100%（`components/layout/UserMenu.tsx`，Navbar + DashboardLayout 两处共用） |
| 文档体系 | ✅ 100%（CURRENT_TASK / AI_MEMORY / OVERVIEW / ARCHITECTURE / DESIGN_SYSTEM / TECH_DEBT / ARCHITECTURE_AUDIT） |
| 路由架构 | ✅ pathless `_app` layout，5 个功能页统一套 DashboardLayout |
| 全局菜单单一真理 | ✅ `src/config/menu.ts`（label/desc + **新增** title/intro 给 breadcrumb hover 用） |
| Providers 壳 | ✅ `__root.tsx` 已挂 `<AuthProvider>`（其余 TODO 挂点） |
| 5 功能页（Dashboard / Planner / AIAdvisor / Schedule / Upload） | 🟡 demo 完成（feature/dashboard 合并），全是写死 const，等真实数据 |
| CourseAnalyzer 页 | 🟡 5%（骨架，无 route） |
| 后端 Worker | ❌ 0%（未建项目；BFF vs Supabase 方向未定） |
| AI provider 抽象 | ❌ 0%（`src/api/aiApi.ts` 全空 stub，streaming 协议未定） |
| 鉴权 / 用户系统 | 🟡 30%（**Mock 实现**，localStorage-backed；详见下文 2026-05-08 条目） |
| 学校手册 RAG pipeline | ❌ 0% |
| 真实数据接入 | ❌ 0% |

---

## 2. 已完成（按 commit 倒序）

### **2026-05-09** — Supabase auth 接入（mock 退役）

**决策（D1–D4 全部走默认建议路径）：**
- **D1 = (a)** 暂不建 `profiles` 表；profile 字段（name 等）暂存 `auth.users.user_metadata`
- **D2 = (a)** 关闭邮件确认（Supabase Dashboard → Authentication → Email → "Confirm email" 关）
- **D3 = (a)** 纯浏览器 `@supabase/supabase-js`（不上 `@supabase/ssr`）；`_app.tsx beforeLoad` 鉴权门禁推迟
- **D4 = (a)** 保留本地 `AuthUser` shape，在 `authApi.ts` 内做 Supabase User → AuthUser 映射（解耦）

**改动（最小化）：**
- 新建 `src/lib/supabase.ts`：客户端单例 + SSR 守卫（`typeof window !== "undefined"`），缺 env 时启动报错
- 新建 `.env.example`：`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 模板
- `.gitignore`：补 `.env` 显式规则（`.env.local` 已被 `*.local` 覆盖）
- `package.json`：+ `@supabase/supabase-js: ^2.45.0`
- `src/api/authApi.ts`：4 个函数体替换为 `supabase.auth.*` 调用，新增 `onAuthChange(cb): unsubscribe` 包 `onAuthStateChange`，删除所有 localStorage / mock 助手；`MockSession` → `AuthSession`（去 `token` 字段，AuthContext 不消费）；`AuthUser` shape 不变（id / email / name / createdAt）
- `src/context/AuthContext.tsx`：`useEffect` 内首次 `getCurrentUser` 后再订阅 `onAuthChange(setUser)`，cleanup 时 unsubscribe；公共 API（login / register / logout / user / isAuthenticated / loading）**完全不变**——Login / Register 页 0 修改

**校验：**
- `npm run build` 通过（client + Cloudflare Worker SSR 双端均无 type 错）
- `lib/supabase.ts` 的 env 缺失校验只在**运行时**触发（dev / SSR 第一次请求），build 不爆——dev 前必须先建 `.env.local`

**未做（明确推迟到下一轮）：**
- `_app.tsx beforeLoad` 鉴权门禁（CLAUDE.md 标"不要修改"，且 D3 浏览器侧 auth 需先解决路由 context 注入或升级 SSR）
- `profiles` 表 + RLS（D1 = a，等 UI 真要写业务字段再建 + 先起草 `docs/DATA_MODEL.md`）
- 邮件确认 / 忘记密码 / OAuth / `/auth/callback` 路由（D2 = a）
- AI provider 抽象 / RAG（明确不在本轮）

**部署 env 策略（重要）：**
Vite 的 `import.meta.env.VITE_*` 是 **构建时静态替换**，不是 Worker 运行时变量。所以 `wrangler.jsonc` 里加 `vars` 块**没用**——Worker 拿到的 bundle 里值已经被字面量替换。正确流程：
- **本地开发**：`.env.local`（gitignore 已盖）
- **CI / 本地部署**：在 `npm run build` 之前导出环境变量，例如：
  ```bash
  export VITE_SUPABASE_URL=https://xxx.supabase.co
  export VITE_SUPABASE_ANON_KEY=eyJ...
  npm run build
  wrangler deploy
  ```
- **GitHub Actions**：在 build step 用 `env:` 注入 secrets
- **anon key 公开安全**：可以提交到 git（如想"零配置"的话），但本项目目前选择不提交，按 CI/CD 注入

**已踩过的坑 — env 缺失导致整站打不开（2026-05-09 当天修复）：**
最早 `lib/supabase.ts` 在 env 缺失时硬抛错，导致 `__root.tsx Providers` 链崩溃 → SSR 启动失败 → 整站包括 Home 都加载不了。修复：fail-soft——env 缺失只 `console.warn`，`isSupabaseConfigured` 标志在 `authApi.ts` 里检查，未配置时 `getCurrentUser` 返回 null、`logout` no-op、`onAuthChange` 返回空 unsubscribe，只有 `login` / `register` 抛清晰错（用户点登录按钮才看到）。

### **2026-05-09** — Transparency / TiltedCard / Feedback 扇形 + 滚动星 / Control 缓动 / 共享 UserMenu / 5 功能页 breadcrumb HoverCard（未提交）

**`Transparency.tsx`（替代旧 `Honesty.tsx`，已删除）** — 落地页"透明性"区，hub-and-spoke 布局：
- 3×3 grid（lg+）：Row 1 [P0 / 标题 / P1] / Row 2 [· / 卡 / ·] / Row 3 [P2 / · / P3]
- 4 个 pillar 在四角，标题 + 推荐示例卡在中央列；移动端单列堆叠（`order-` 重排），SVG 隐藏
- 卡片视觉下移 40px：5 个包装层 `lg:translate-y-10`（transform 不改 layout box，下方 Control 不被推下）；SVG 加 `overflow-visible` 让线端不被 hub 边界裁掉
- **SVG bezier dashed marching-ants 连线**：用 `getBoundingClientRect()` + `ResizeObserver` 实时测算 pillar 内边中点和卡的左右边中点，写到 SVG 的真实像素 viewBox；卡只有 2 个连接点（左中 / 右中），TL+BL 汇聚于左中，TR+BR 汇聚于右中（Y 字形）；marching-ants 用 `transparency-ants` 关键帧（`Home.css`），1.4s 线性循环 `stroke-dashoffset 0 → -12` 与 `stroke-dasharray="6 6"` 同步
- **Hover 联动**：进入 pillar → 该 pillar 描边深 + 阴影、对应 chip 浮起 + 描边变彩、对应连线变彩 + 加粗、端点小圆变大变彩；4 处同步反应强调"同一条信息流"
- **Pillar 缓缓亮起**：内联 layered transitions（transform 0.85s / border 0.85s+0.06s 延迟 / shadow 1s+0.1s 延迟 / icon 方框 bg 0.95s+0.18s / icon color 0.95s+0.22s），全 `cubic-bezier(0.16,1,0.3,1)` —— 修了"一下子跳起来变黑"的 bug（之前 `<Pillar>` 定义在 `Transparency` 函数体内，每次父级 re-render 函数引用变了 → React 卸载重挂 → CSS transition 完全没机会跑）。改成 `renderPillar()` 函数调用（返回 JSX 而不是组件），就在原 DOM 节点上 update style，transitions 正常生效
- **中央卡用 `<TiltedCard>`** rotateAmplitude=6 / scaleOnHover=1.015 / perspective=1200
- 入场 IntersectionObserver 触发，stagger：headline 0s → 卡 0.15s → chip 0.45s+0.08·i → pillar 0.7s+0.1·i → 连线 0.7s+0.12·i → 端点小圆 0.9s+0.12·i

**新组件 `TiltedCard.{tsx,css}`（`components/effects/`）** — React Bits 的 TS port：
- **零依赖**：原版用 `motion`（30KB+ 弹簧库）；本项目已有 React Bits TS port 先例（`CardSwap`、`SplitText`），保持惯例不引 motion，spring 物理感用 CSS `cubic-bezier(0.22,0.61,0.36,1)` 600ms 长缓动近似
- 鼠标 tracking 期 90ms 微缓动（消抖不延迟），离场 600ms 长缓动（模拟 spring 回弹无 overshoot）
- shine overlay：`mix-blend-mode: soft-light` + `radial-gradient(400px circle at var(--shine-x) var(--shine-y), rgba(255,255,255,0.55), transparent 45%)`，仅 `:hover` 时不透明
- 接 `children` 而非 `imageSrc`（原版只支持图片），方便包任意 JSX
- `prefers-reduced-motion: reduce` 自动停用所有 transform 与 shine

**`Feedback.tsx` 全面重做** — 5 张 testimonial 卡（增 Tao 大三数学 / Sara 国际学生）：
- 评分调整：Lin 5⭐ / Tao 4⭐ / Marcus **3→4⭐** / Aisha **4→5⭐** / Sara 5⭐
- **xl 单行扇形布局**：`xl:grid-cols-5`，rotate `-3.5° / -1.5° / 0 / +1.5° / +3.5°`，外两张 scale 0.95 + translate-x ±12px + z-0；中心卡 z-20、内侧卡 z-10；hover 任一张 → rotate 归零 + translate 归零 + scale 1 + z-30 抽出，700ms `cubic-bezier(0.16,1,0.3,1)`；容器 `max-w-[1700px]` 让 5 卡有舒展空间
- **滚动驱动星星 cascade**：12 颗 lit 星（5+4+4+5+5 → 实际 23 总星）每颗有阈值 `(globalIdx + 0.5) / TOTAL_LIT`，进度公式 `(vh - sectionTop) / (vh/2 + sectionHeight/2)` clamp 0-1（section 顶进入视口底 → 0；section 中心到达视口中心 → 1，之后保持 1）。rAF 节流 scroll 监听。filled `#fbbf24`（amber-400）/ unfilled `#e2e8f0`（slate-200）→ 后改 `#f59e0b`（amber-500）/ `#e5e7eb`（gray-200）按 design system 对齐。无 scale-pop（避免抽搐）
- **`FeedbackCard` 模块顶层定义**：父级每帧 scroll re-render，组件函数引用稳定，本地 hover state 持久化，CSS transitions 正常运行
- **设计系统对齐**：tone 色从 blue/slate 改回 emerald/amber/gray；highlight 卡从 `border-amber-200/70 ring-1` 改成 `border-amber-300 ring-2 ring-amber-100`；section bg 从渐变改成 `bg-gray-50`；hover 从 scale + shadow 改成只 translateY(-3px) + 边框深；eyebrow 标准化 `text-xs tracking-widest mb-4`；标题 `text-3xl md:text-5xl mb-4`；头像渐变改 `bg-gray-100` 单色

**`Control.tsx` 缓动 hover** — 3 张编号卡：
- 之前 Tailwind `hover:` arbitrary value `hover:-translate-y-0.5 transition-[border-color,transform,box-shadow] ease-[cubic-bezier(0.16,1,0.3,1)]` "卡卡的"——原因：Tailwind arbitrary values 在某些情况下没解析全 + 2px translate 太微小读不出动感
- 改成 `ControlCard` 模块顶层组件 + `useState` hover + 内联分层过渡：transform 0.85s / border 0.85s+0.06s / shadow 1s+0.1s / 数字圆 scale(1.08) 0.85s+0.1s，全部 `cubic-bezier(0.16, 1, 0.3, 1)` expo-out（前快后慢）
- Section padding `py-24 → pt-12 pb-48`：移上去贴近 Transparency + 整体加高
- Transparency 与 Control 之间的横线删了（`border-y → border-t`）

**`FinalCTA.tsx` 按钮反向** — 实心黑底 → 黑色描边 + 黑字；hover 反相为黑底白字 + 箭头 `group-hover:translate-x-1`；200ms `transition-colors` + `transition-transform ease-out`

**`Footer.tsx`** — 3 列改 2 列，删掉中间 Workspace/Rules/Simulation 块，保留左品牌 + 右"Built for students."

**共享 `UserMenu.tsx`（新增 `components/layout/`）** — Navbar + DashboardLayout 两处头像下拉单一组件：
- **`modal={false}`**（关键 bug 修复）：默认 Radix DropdownMenu `modal={true}` 打开时锁 body scroll + 注入 `padding-right` 抵消滚动条消失，**导致 fixed 定位的首页 Navbar 整条向右跳 ~15px** 同时入场动画在首帧 reflow 中被吃掉。`modal={false}` 直接绕过 body lock，两个 bug 一起消失
- 菜单项（用户头像点击）：用户名 + 邮箱 → 个人资料 / 个性化 / **Upgrade plan**（amber 渐变高亮）/ 设置 / 帮助 / 退出登录（red）。后两次迭代删掉了「个性化」并按用户要求重排为 个人资料 / Upgrade plan / 设置 / 帮助 / 退出登录
- 入场 220ms `cubic-bezier(0.22,0.61,0.36,1)` from `origin-top-right`（从头像位置展开），shadcn 默认 fade + zoom-95 + slide-from-top-2 复合
- Hover 交互：底色 + 文字 + 图标颜色平滑过渡，**图标不做 transform**（之前 0.5px sub-pixel translate 看起来是抽搐 bug），upgrade 项 amber 渐变加深，logout 项红底 + 红字
- Trigger 按钮在调用方各自定义（Navbar 适应 dark/light hero / DashboardLayout 实心 slate-950），通过 `trigger` prop 传入

**5 功能页 breadcrumb HoverCard**（Dashboard / AIAdvisor / Planner / Schedule / Upload）：
- 删掉每页顶部 `<header>` 块（eyebrow + h1 + intro 段落）
- 内容搬到 `MENU_ITEMS` 的新 `title` + `intro` 字段（`src/config/menu.ts`），单一真理源
- `DashboardLayout` 顶栏的 `[CurrentIcon] {currentItem.label}` breadcrumb 外包 shadcn `HoverCard`，hover 弹出圆角白卡（`rounded-2xl border-slate-200/70 bg-white/95 backdrop-blur-xl shadow-[0_18px_44px_...]`）显示 `currentItem.title` + `currentItem.intro`，sideOffset 12，`openDelay/closeDelay` 各 120ms
- 中间短命的 `PageIntro.tsx` 已删除

### **2026-05-09**（早些）— **feature/dashboard 分支合并**（commit `d4c10c5`）：5 个功能页从骨架推进到可演示状态

每页仍是写死 `const`（无 fetch），但视觉与 state 交互完整：

- **`pages/Dashboard/index.tsx`**（384 行，路由 `/dashboard`）：4 区——信息导入快捷入口（5 入口 + 状态徽章）+ 决策卡（3 张可点切换 tone）+ 场景动作选择（`useState` selectedAction，活跃态切换 metric 文案）+ 指标卡（4 项 GPA / 学位进度 / 学习时长 / 风险）。`metricIcons` 数组 + tone class 映射。
- **`pages/Planner/index.tsx`**（676 行，路由 `/course-planner`，菜单 label "Workspace"）：基于 `@xyflow/react` 的 ReactFlow 决策图谱。多种节点类型 `course / requirement / gpa / risk / goal / workload / abroad / internship / second-class / volunteer / alternative`，lane 分层（L0 培养目标 / L1 课程 / L2 GPA / L3 风险 等），自定义 `MeridianFlowNode`，背景 `BackgroundVariant.Dots` + `MiniMap` + `Controls`，节点 `MarkerType.ArrowClosed`，可拖拽缩放。
- **`pages/AIAdvisor/index.tsx`**（256 行，路由 `/ai-advisor`，菜单 label "Goal Mode"）：左侧 4 个固定 Mode 卡（GPA 优先 / 学习兴趣 / 留学准备 / 实习就业，各带 logic 逻辑说明）+ 右侧自然语言输入框，输入框上方状态指示器「中文 · 自然语言」+ pulse halo 效果（`animate-pulse-halo`）。
- **`pages/Schedule/index.tsx`**（332 行，路由 `/schedule`，菜单 label "Rule Graph"）：左侧规则树（按培养方案分组的可折叠 RuleLeaf + ConflictRule + ExternalLink）+ 右侧冲突详情卡（A 方文案 + B 方文案 + AI 判断 + 来源链接），冲突卡黑底白字（`bg-slate-950`）。
- **`pages/Upload/index.tsx`**（355 行，路由 `/import`，菜单 label "Import"）：学校选择器 + 当前连接状态（教务 / 个人 / 社区数据源）+ 文件上传槽（5 种类型 + 格式提示）+ 已导入文件表格（带导入日期、类型、状态）。

合并产生的路由文件：`routes/_app/{ai-advisor,course-planner,dashboard,import,schedule}.tsx`，全部走 pathless `_app` layout 套 `DashboardLayout`。

### **2026-05-08** — 落地页 Explain / GpaMath / FAQ / Footer 改版（未提交）

落地页 4 个 section 的视觉与交互重做，新增 1 个通用组件 CardSwap。

**Explain.tsx — 「认知落差」（替代旧的"每个推荐都有理由"）：**
- 黑底 + 磨砂玻璃卡（`bg-gradient-to-br from-white/[0.10] via-white/[0.05] to-white/[0.02] + backdrop-blur-2xl + border-white/15 + inset 高光 shadow`）
- 两栏并置同一组 6 件事，左栏 emerald check 圆 + 文字由 `#9ca3af → #f8fafc`，右栏白色描边问号圆 + 文字由 `#e5e7eb → #9ca3af` + overlay 横线 `scaleX 0→1` 划过
- 滚动驱动：GSAP scrub 1，cardRef trigger，`start: "top 90%" end: "center 62%"`，6 项 stagger 0.6 间隔 → 卡片中心碰到视口中心稍前完成全部勾掉/划掉
- 鼠标 tilt：`perspective 1200 + transformStyle preserve-3d`，quickTo `rotationY ±2.5° / rotationX ±1.75°` (Y 反向)，duration 0.55s power2.out
- 大标题用 `<SplitText>` 与 Hero 同源参数（splitType chars / delay 40 / duration 0.9 / from y:50）
- 文案：「为什么大家会焦虑」「在同一个学校中」（无句号）+ 桥接「很多人直到毕业前，才第一次看清这些规则之间的关系」

**GpaMath.tsx — 「Meridian 不只是推荐好课」（替代旧的"绩点不是玄学，是公式"）：**
- 左栏文字：kicker 「产品价值」+ h2 大字（Meridian / 不只是推荐好课，强制换行）+ 副文 `text-lg md:text-2xl text-gray-700`（而是在你的目标下 / 计算代价最低的路径）+ 三个 bullet 点 `space-y-3 text-gray-600`（目标变化推荐逻辑实时变化 / 规则之间的影响关系被重新展开 / 每一次选择都会被提前推演）
- 右栏视频堆叠：CardSwap 三张卡（width 720 / height 480 / cardDistance 84 / verticalDistance 96 / delay 3000ms / easing linear），列高 500/580/640px，container `position: absolute top:50% right:0 translate(0,-50%)` 垂直居中锚点
- 入场顺序：kicker → h2 SplitText → 副文 0.55s → bullets stagger 0.12s → 视频 0.35s 同链 ScrollTrigger `top 80%`
- `id="value"` 给 Navbar 用（备用，当前未引用）

**新组件 `src/components/effects/CardSwap.{tsx,css}` — React Bits port，TS 化：**
- 自动循环：`setInterval(swap, delay)`，前卡 y+=500 掉下，余卡 promote，原前卡返回末位
- 点击跳转：`goToFrontRef` 按 click 把对应 idx 旋到 order[0]，0.55s power2.out 全卡同步重定位，结束后重启 interval（kill 当前 timeline 防冲突）
- 视口暂停：IntersectionObserver `threshold: 0` 观察 container，离屏 → `tlRef.pause() + clearInterval`，回屏 → `play() + startInterval`，避免滚过去之后卡片继续滑动到下一 section
- 卡片样式：`linear-gradient(140deg, #1d1d22, #131318)` + `border-white/16` + `box-shadow 0 18px 50px`（不是纯黑），`cursor: pointer`
- props：`width / height / cardDistance / verticalDistance / delay / pauseOnHover / onCardClick / skewAmount / easing(linear|elastic) / children`

**Faq.tsx — 新 section（在 Feedback 与 FinalCTA 之间）：**
- 4 条 Q&A，编号 `01-04 text-xl md:text-2xl tabular-nums`，hover 时颜色由 gray-400 → gray-900
- 鼠标悬停展开答案：`grid-template-rows 0fr → 1fr` 平滑展开 + 答案 opacity 0→1 delay 100ms + Plus 图标 `rotate-45` 变 × + 行 `bg-gray-50` 浅底 + 题目 `translate-x-0.5`
- 触屏降级：`[@media(hover:none)]:grid-rows-[1fr] + opacity-100`，无 hover 设备答案常驻
- 入场：kicker / h2 / 4 项 stagger fade-up（duration 0.5/0.75/0.6 + delay 0/150/400ms）
- 容器宽 `max-w-6xl`，行 padding `px-4 md:px-8 py-8`，列间距 `gap-8 md:gap-14`

**Footer.tsx — 三栏黑底重写：**
- `bg-black + border-t border-white/10 + py-14`
- 左栏：M logo 反色（`bg-white + 黑 M`）+ Meridian + `See the rules earlier.` + 「很多规则，只是从来没人把它们连接起来。」
- 中栏：`Workspace / Rules / Simulation` 一列三行（`<br />` 分行 + leading-7）
- 右栏：`Built for students.`
- 字色阶：white / gray-300 / gray-500 三档，重要 white、次重要 gray-300、辅助 gray-500
- 底部 `border-t border-white/10` + © 版权小字

**Navbar.tsx：**
- 4 项导航居中：父 `relative`，nav links 容器 `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`
- 文案与锚点：产品理念 → `#trust`（HeroLaptopShowcase 内 sentinel `<div id="trust" top:100vh>`，触发 GSAP scrub progress ≈ 0.45）/ 规则系统 → `#explain` / 决策路径 → `#value` / 用户反馈 → `#feedback`
- 登录态适配（已有）：`useAuth` 拿 user，登录后右上变 DropdownMenu 头像
- AIAdvisor 一处文案：「口述你的情况」→「描述你的情况」

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
- ~~Worker 项目结构~~ → Supabase 路线下不再需要独立 Worker BFF；TanStack Start SSR 仍跑 Cloudflare Worker
- ~~D1 还是 KV~~ → 走 Supabase Postgres；向量库（pgvector / Vectorize）等 RAG 阶段再定
- ~~鉴权方式~~ → 已选 Supabase 浏览器 auth（D3 = a）；session 由 supabase-js 自管 localStorage

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
