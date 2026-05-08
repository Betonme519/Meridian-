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

## 当前任务（Last updated: 2026-05-08）

> 新任务覆盖此区，旧的挪到「完成归档」。

### 目标

> 一句话，要具体到能验证。

下个会话进入「业务接入期」准备：开 Worker 项目骨架（Cloudflare）+ 决定 BFF vs Supabase + AI provider 抽象层规范。当前 Mock 鉴权可工作，但 dashboard / ai-advisor 等页面仍是 const 假数据。

### 需要做

> 每条要小到能在一次会话内完成。

- [ ] 决定鉴权后端方案（Supabase Auth / 自建 BFF / Cloudflare Access），先写决策文档（`docs/AUTH_DECISION.md`）
- [ ] 把 `src/api/authApi.ts` 的 mock 实现替换成真后端调用（参考 `AI_MEMORY.md` → 2026-05-08 「Mock 鉴权」条目里的 6 步迁移清单）
- [ ] 加路由守卫：`routes/_app.tsx` 的 `beforeLoad` 检查 `isAuthenticated`，未登录 throw redirect 到 `/login?redirect=...`
- [ ] AI provider 抽象：`src/api/aiApi.ts` 当前全空 stub，先定 streaming 协议（SSE / WebSocket）+ 一个 mock provider 让 ai-advisor 跑通

### 不要修改

- 全局 Nav / Footer (`src/components/layout/`)
- 落地页 (`src/pages/Home/*`)（昨天刚改完，别动）
- 路由根 / 配置 (`src/routes/__root.tsx`、`src/router.tsx`、`src/routes/_app.tsx`)（除非任务要求加 beforeLoad）
- 路由分组 (`src/routes/_app/*` pathless layout 结构)
- 菜单单一真理 (`src/config/menu.ts`)
- 设计令牌 (`src/styles/variables.css`、`globals.css`)
- 笔记本相关 (`src/components/effects/EmbeddedLaptop.*`、`GridMotion.*`、`CardSwap.*`)
- 自动生成 (`src/routeTree.gen.ts`)
- 已有 commit 历史（禁 `git reset` / `git rebase`）

### 完成标准

- [ ] `tsc --noEmit` 干净通过
- [ ] 视觉符合 `DESIGN_SYSTEM.md`（圆角 / 字号 / 按钮 / 语气）
- [ ] 所有「需要做」打钩
- [ ] 没碰「不要修改」
- [ ] commit 已提，message 写清做了什么

### 备注 / 参考

- 持续技术债追踪：`docs/TECH_DEBT.md`
- 一次性深度审计：`docs/ARCHITECTURE_AUDIT.md`
- 当前 Mock 鉴权说明：`AI_MEMORY.md` → 2026-05-08「Mock 鉴权」条目
- 落地页改版细节：`AI_MEMORY.md` → 2026-05-08「落地页 Explain / GpaMath / FAQ / Footer 改版」条目

---

## 完成归档

> 保留最近 5–10 条；权威记录在 `git log`，这里只留人话摘要。

- **2026-05-08** — 登录系统 + 落地页改版（4 个 section + 新增 1 个组件）：
  - **登录系统**：`src/api/authApi.ts` 写入 localStorage-backed mock（任意邮箱 + ≥6 位密码即过）；`AuthContext.tsx` 改成 Provider 暴露 `{user, isAuthenticated, loading, login, register, logout}`；`useAuth.ts` 一行 re-export；`__root.tsx` 用 `<AuthProvider>` 替换 pass-through；新 `src/pages/Login/` `src/pages/Register/`（白卡 rounded-2xl + 入场 fade-up-soft + Apple/Google placeholder）+ `src/routes/login.tsx` `register.tsx`；首页 Navbar 与 DashboardLayout 右上头像接 `useAuth`，登录后变 shadcn DropdownMenu（用户名/邮箱/我的面板/退出登录）。
  - **Explain.tsx**：删 "每个推荐都有理由"，换成「认知落差」黑底磨砂卡，左右两栏并置 6 件事，scroll-driven check/strike + 鼠标 tilt 3D + SplitText 大标题。
  - **GpaMath.tsx**：删 "绩点不是玄学，是公式"，换成「Meridian 不只是推荐好课」+ 右侧 CardSwap 三张视频卡（占位，等业务方插入 `<video>`）。
  - **新组件 `CardSwap.{tsx,css}`**：React Bits TS port，自动循环 + 点击跳转 + IntersectionObserver 视口外暂停，垂直居中锚点。
  - **新 section Faq.tsx**：4 条 Q&A，hover 展开答案 + 触屏降级常驻 + 入场 stagger。
  - **Footer.tsx**：三栏黑底重写（左：品牌 + tagline；中：Workspace/Rules/Simulation 一列三行；右：Built for students.）。
  - **Navbar.tsx**：4 项居中（产品理念 / 规则系统 / 决策路径 / 用户反馈），absolute 定位锚点；HeroLaptopShowcase 加 `<div id="trust" top:100vh>` sentinel 让「产品理念」跳到第二屏 GSAP progress ≈ 0.45。
  - **AIAdvisor**：一处文案改「口述你的情况」→「描述你的情况」。
- **2026-05-07** — 落地页第二屏文案重写 + 诚实性/Trust 真融合：`HeroLaptopShowcase.tsx` 左侧文案改为"建立信任 / 计算你的整个学业路径"，4 项分析维度用圆圈+勾，GSAP scrub stagger 滚动顺序打钩；`Honesty.tsx` 把原 Trust 块（"一个 AI 凭什么帮我选课？"+ 4 transparency points）与原 3 列（确定/估算/未知）互嵌而非堆叠：trust 主题问句留作 H2，4 transparency 中"每个推荐来自哪条规则"压成 hero 引导语，另外 3 条作为 3 列卡片各自的"提问行"，原 Honesty H2"我们不会假装什么都知道"降为底部收束句；`index.tsx` 卸载独立 `<Trust />`。`tsc --noEmit` clean。
- **2026-05-07** — 一级结构债收敛（不动 UI）：`src/config/menu.ts` 单一真理，`routes/_app.tsx` pathless layout 把 DashboardLayout 上提，6 个功能页 route 移入 `routes/_app/` 并去掉 page 内 import；删除 `components/Navbar`、`components/Sidebar` 旧 stub；`__root.tsx` 加 pass-through Providers 壳。`tsc --noEmit` clean，URL 不变。
- **2026-05-06** — 项目结构整理：`src/pages/Home/index.tsx` 730 行拆分（一 section 一文件），抽 Nav/Footer 到 `layout/`，新增 CourseAnalyzer/Dashboard 骨架，自适应 Nav，Hero SplitText 字符级动画 · `1c26d5f`
- **2026-05-06** — 笔记本细节：`embedded-laptop-base-3d` 加 `transform-style: preserve-3d`，前缘厚度，5×14 真实键独立厚度，hover -2vh（scroll progress > 0.7 才启用） · `db63087`
- **2026-05-06** — CSS 笔记本展示初版：Hero 嵌入 EmbeddedLaptop，ScrollTrigger pin/scrub 缩放+旋转到第二页右侧，GridMotion 改 marquee · `72a8a3b`
