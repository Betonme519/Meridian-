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

排队 1 / 3 / 3a 完成 + profiles 表已在前端接通（Upload / AIAdvisor / Dashboard / UserMenu 全部用上 profile 字段）。排队 2 暂缓。下一步进排队 4 的剩余功能页（按 rag_source / course / plan / rule / chat_message 各表分别接）。

### 需要做（排队，按优先级）

> 一次开一条。开始前用户先指定要做哪条。

- [ ] **🟡 中 · 排队 4a** — `/import` 接 `rag_source` + Supabase Storage（约半天）
  - 文件上传走 `supabase.storage.from("rag_sources").upload(...)`，路径 `<auth_uid>/<rag_source_id>.<ext>`
  - 同步写一行 `rag_source` 表（kind / mime / size_bytes / storage_path / parsed_status='pending'）
  - 已导入列表（`dataRecords` 写死 const）改成 `SELECT * FROM rag_source WHERE user_id = auth.uid()`
  - 依赖：profiles 接入已完成（本轮）；schema 已落地
  - 完成标准：登录用户上传文件 → 列表显示 → 刷新页仍在

- [ ] **🟡 中 · 排队 4b** — `/course-planner` 接 `plan` 表（约半天）
  - 把 ReactFlow 当前的写死 nodes/edges 改成读 `plan` 表，自动保存
  - "新建 plan" 按钮 → `INSERT INTO plan (...)` → 跳到该 plan
  - 依赖：profiles 接入已完成

- [ ] **🟡 中 · 排队 4c** — `/schedule` 接 `rule` + `rule_conflict`（约半天）
  - 规则树按 branch 分组拉取，trust 三档着色保留
  - 冲突独立加载

- [ ] **🔴 高 · 排队 2（暂缓）** — AI provider 抽象 + streaming 协议骨架（约 1–2 小时）
  - 排队 4a/b/c 跑通后再做（业务表写入流程稳了再叠 AI 抽象层）
  - 完成标准：`/ai-advisor` 输入框发消息 → mock provider 模拟 token-by-token 流式返回 → 写 `chat_message` 表

### profile 接入 · 未解决问题（本轮记录）

> 不阻塞当前实现，但下一轮要意识到。

- **Navbar 头像首字母仍取 `auth.user.name`**：`src/components/layout/Navbar.tsx:25` 的 `initial` 派生没切到 profile.name。理由：CLAUDE.md 标 "Navbar 不要修改"。profile.name 与 user.name 大多数情况一致（注册时同一字符串），只有用户改名后会短暂不一致。要改的话改 `Navbar.tsx` 一行 + 用 `useProfile()`。
- **`src/data/userProfile.ts` 是 0 引用 dead code**：保留未删（CLAUDE.md "不要 refactor unrelated"）。下一轮清死代码时一并清掉。
- **访客模式无 profile**：Login「暂时跳过」进入访客态时 `useProfile()` 返回 `{ profile: null, ... }`，所有读 profile 的页面 fallback 到默认值（"高 GPA" / 空 school 等）。`updateProfile` 早 return 不抛错。访客切换写不进 DB——目前无明确产品反馈机制（不是 bug 是设计选择）。
- **error 状态无 UI 暴露**：`useProfile().error` 已实现，但所有页面只 `console.warn` 不显示给用户。理由：requirement 4 "不修改现有 UI 样式"，新增错误条/toast 会引入新 UI 元素。如要暴露，建议在 `__root.tsx` 挂 `<Toaster />`（sonner 已装）+ ProfileContext useEffect 监听 error 弹 toast。
- **`profile.target_gpa` 暂无消费方**：requirement 列了 6 个字段（name/school/major/grade/target_gpa/goal_mode），但当前 5 个功能页里只有 `target_gpa` 没有对应 UI 输入位（schema 已留位）。下一轮加 Settings 页或在 Upload 个人设置区追加输入框时再用。
- **`profile.goal_weights` 同上**：仅 `goal_mode === '个性化定制'` 时有意义，UI 暂未做权重输入面板。
- **`AIAdvisor` 切换模式无 loading 反馈**：optimistic update 立刻反映，绝大多数情况无感知；网络断时 revert 后无视觉提示（同上 error 不暴露问题）。
- **多 tab 同步**：profile 不订阅 Supabase realtime；A tab 改了 goal_mode，B tab 看到的还是旧值直到刷新。如要同步：`supabase.channel('profiles').on('postgres_changes', ...)` 走 realtime。本轮不做。
- **profile fetch 与 Supabase auth getSession 串行**：`AuthContext.useEffect` 拉 user，`ProfileProvider.useEffect` 监听 user 变化再拉 profile，两次 IO 串行。首屏可见 profile 字段会有 ~100–300ms 延迟。可接受。
- **`updateProfile` 并发写 stale revert（审计追加）**：连点 AIAdvisor 模式 3 次，3 次写并发，服务器按到达顺序处理；客户端按响应顺序 setProfile，旧响应可能覆盖新乐观值，UI 闪一下旧值。任一中途 fail，revert 到的是"前一次乐观值"而非真正服务器值。修法：updateProfile 内部加 requestId 计数器（同 loadProfile 模式），只让 latest 响应应用。严重度中（spam-click 才显现）。
- **logout 期间 pending updateProfile race（审计追加）**：登出时 useEffect 清空 profile，但已发出的 updateProfile 仍可能 catch → `setProfile(prev)` 把旧 profile 写回去，造成 UI 短暂复原。修法：updateProfile 入口读 requestIdRef，logout 时 ++ref 让所有 pending 失效。严重度低（边角 race）。
- **TS 类型手动维护 vs Supabase 自动生成（审计追加）**：所有 `as Profile` cast 绕开运行时校验，schema drift 时编译过运行时挂。下一轮跑一次 `supabase gen types typescript --project-id <id> > src/types/database.ts`，profileApi 切到 typed client。本轮不动。
- **grade 无效输入无 UI 反馈（审计追加）**：用户敲 "abc" → onBlur Number(NaN) 校验失败，本地 state 保留 "abc"，profile 同步前看起来"已保存"。修法：onBlur 时把无效值 reset 回 `String(profile?.grade ?? "")` 并显示 helper text，或加 zod 校验。本轮不修。

- [ ] **🔴 高 · 排队 2（暂缓）** — AI provider 抽象 + streaming 协议骨架（约 1–2 小时）
  - 用户系统验证完整通过后再做（先确认登录 / 注册 / 路由门禁 / 数据写入都稳了，再叠 AI 抽象层）
  - 新建 `src/ai/{providers,prompts,stream,schema,index}.ts`
  - 先定 `chat()` 签名：`({ messages, signal }) => AsyncIterable<Token>`
  - 写一个 `mock` provider 让 `/ai-advisor` 跑通流式渲染（不接真实 LLM）
  - zod schema 先定 `Recommendation` / `ChatMessage` / `RagAnswer`
  - 完成标准：`/ai-advisor` 输入框发消息 → mock provider 模拟 token-by-token 流式返回 → 页面流畅渲染

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

- **2026-05-10** — profiles 表前端接通（第一阶段业务接入，紧接 SQL migration）：
  - **新建 3 文件**：`src/api/profileApi.ts`（getProfile / upsertProfile / updateProfile + GoalMode 枚举 + Profile / ProfilePatch 类型）；`src/context/ProfileContext.tsx`（Provider 跟 useAuth 同步，404 兜底 upsert，乐观更新 + race 防护用 requestId 计数器）；`src/hooks/useProfile.ts`（re-export）。
  - **`__root.tsx`** 在 `<AuthProvider>` 内嵌 `<ProfileProvider>`（依赖 useAuth）。
  - **Upload `/import`**：school / grade / major 从 profile 读取并写回。select onChange 即时写；text input onBlur 才写（避免每键一次 IO）。grade 转 number 校验 + 空字符串写 null。
  - **AIAdvisor `/ai-advisor`**：`selectedMode` 由 `profile?.goal_mode ?? '高 GPA'` 派生（不再用 useState 本地）；点击模式 → `updateProfile({ goal_mode })`；`Mode.title` 类型从 `string` 收紧为 `GoalMode` union。
  - **Dashboard `/dashboard`**：`importShortcuts[4].status` 与 `decisionCards[0].body` 不再写死 "高 GPA"，改为渲染时动态派生 `currentGoalMode = profile?.goal_mode ?? '高 GPA'`；`isReady` 检查从字面值匹配 `s.status === '高 GPA'` 改成"非占位状态"判断（`status && status !== '未连接' && status !== '未导入'`）。
  - **UserMenu**：显示名优先级 `profile.name > user.name > email`，避免改名后菜单标签滞后。
  - **不动**：`AuthContext` / `authApi.ts` / `supabase.ts`（CLAUDE.md "不要修改 公共 API"）；`Navbar.tsx`（CLAUDE.md "全局 Nav 不要修改"，已记入未解决问题）；`src/data/userProfile.ts`（dead code 0 引用，留给未来 refactor）。
  - **`tsc --noEmit` 干净**（仅遗留 CardSwap.tsx 旧错，与本任务无关）。
  - **未解决问题已记入 § 当前任务 → profile 接入 · 未解决问题**（8 项，含 Navbar、target_gpa 无 UI、多 tab 实时同步、error 不暴露 UI 等）。

- **2026-05-10** — `docs/DATA_MODEL.md` 起草 + 工程审计 + 决策确认（排队 3 完成）：
  - 6 张表设计：`profiles` / `course` / `plan` / `rule` / `rule_conflict` / `chat_message` + 可选 `rag_source`（5 表预算 + 冲突拆出来 + RAG 文件清单加挂）。
  - 每表给：字段表（name / type / required / 默认 / 注释）+ RLS policies + 索引建议；末附 § 9 SQL DDL 速查（未审定，下一轮 SQL Editor 走一遍再落 migration）。
  - **6 处决策点用户确认**（§ 1 表格全部标 ✅）：D1=b 建 profiles / D5=a 用户私有修课记录 / D6=a JSONB 整存 ReactFlow graph / D7=a rule 用户私有 / D8=b 冲突独立表 `rule_conflict` / D9=a chat_message 不开 parent table。
  - **工程审计修了 4 处问题**：
    1. § 9 SQL DDL 顺序错（`rule.rag_source_id` FK 引用了下方才建的 `rag_source`）→ 加了"建表顺序 ≠ 编号顺序"说明
    2. `rule_conflict` UNIQUE 不对称（A↔B 与 B↔A 可重复）→ 加 `CHECK (rule_a_id < rule_b_id)` 强规范化
    3. `rule_conflict` 用户一致性无校验（理论上可拼凑别人 rule_id）→ 加 `check_rule_conflict_owner` trigger
    4. `rag_source.storage_path` 格式含混（是否含 bucket 前缀）→ 明确 = `<auth_uid>/<rag_source_id>.<ext>`，bucket 名由代码常量持有
  - **审计还覆盖**：course / plan / rule 索引完整、JSONB 字段不建 GIN 故意为之、SECURITY DEFINER + search_path = public 是标准 Supabase 模式、ON DELETE CASCADE 全链路一致、timestamps 全 timestamptz UTC、profiles.id 复用 auth.users.id 不另起 UUID。
  - **加了 § 5b**：service_role 在 Worker 端 bypass RLS 的注意事项（不进 client bundle / 手动校验 user_id），与排队 2 配合时再展开。
  - **未做**：学校字典 `schools` 表、学期字典、`school_rules` public 共享表、`rag_chunk` + pgvector embedding、审计日志、partial / BRIN / 物化视图——明确推迟到具体功能页接入时按需补。

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
