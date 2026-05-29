# Tech Debt — Meridian

> Backlog 形式。一条 = 问题 + 风险 + 优先级 + 简短原因 + 建议。
> **解决一条直接删掉**（commit 历史可追溯）。新债加进对应优先级。
> 编号不重排：删条留缺口，历史引用（如 `TD-3`）不失效。

---

## 🔴 高 — 业务接入前必须解决

### TD-1 · AI provider 真接入（**骨架完成，余尾：上游 LLM 未决**）
- **现状**：provider-agnostic 骨架已就位（`src/ai/providers/{mock, remote, anthropic}.ts` + `Token` discriminated union + `docs/AI_PROXY_SPEC.md` 4 家 LLM SSE 协议速记）
- **余尾**：server route 在 Phase 1 (2026-05-28) 已建 mock stub `src/routes/api/ai/chat.ts`（返 10 个 text token + `[DONE]`）；当前 `VITE_AI_PROVIDER=remote` 拿到 mock 流（不再 404）。真上游接入待用户拍板 LLM 后做。
- **阻塞**：用户未拍板上游（倾向 DeepSeek / Qwen，待定）
- **建议**：拍板后按 `AI_PROXY_SPEC.md` Step 3-4 实施（写 server route + `wrangler secret put`）
- **总路线**：`docs/backend_migration_plan.md` Phase 2（涵盖鉴权 / rate limit / session 校验）

### TD-2 · `rag_source.parsed_status` 永远卡 pending
- **风险**：上传文件后 UI 永远显示"待解析"，用户认为坏掉了
- **原因**：4a 只写入流程，没写解析流程；依赖 TD-1（解析需调 AI）
- **建议**：TD-1 完成后加 worker / Edge Function 推进 `pending → parsing → parsed/failed`，并恢复"重新解析"按钮（替代当前"删除"）

---

## 🟡 中 — 业务接入半年内会爆

### TD-6 · 多 tab 实时同步缺失（profile / rag_source）
- **风险**：A tab 改了字段 / 删了文件，B tab 看到旧值直到刷新
- **建议**：各 Context / hook 订阅 `supabase.channel('<table>').on('postgres_changes', ...)`

### TD-7 · 功能页仍有写死 const（**Dashboard 主线 + Schedule 政策段**）
- **未解决子项**：
  - `Dashboard.tsx`：5 张卡 + 4 个 shortcut 仍 100% 写死。文档契约已锁定（`docs/DASHBOARD_DATA_CONTRACT.md`），等排队 11/13 分阶段接（卡 5「下一步建议」已接文案池）
  - `Schedule.tsx` 的 `SEED_POLICIES`（学校特殊政策）—— 归属 track_* schema，等排队 13 后接
- **建议**：排队 11 → 接卡 1/2 + Section 1；排队 13 → 接卡 4/5 + Schedule 政策段；阶段 3 → 新建 risk_snapshot 接卡 3

### TD-8 · `_app.tsx` beforeLoad context 注入未做
- **风险**：当前 `getSession()` 读 localStorage 够稳，但服务端鉴权（D3=b）切不过去
- **建议**：要做 D3=b 才动；当前不阻塞

### TD-9 · shadcn primitives 在功能页 0 引用
- **风险**：46 个 Radix primitive 装而不用，业务页全靠裸 Tailwind class；视觉漂移已开始
- **建议**：排队 14 UI 重设计时统一替 `<Button>` / `<Card>` / `<Dialog>`

### TD-10 · `target_gpa` / `goal_weights` 字段无 UI 入口
- **风险**：schema 留位但用户无法输入；个性化模式无权重面板
- **决策点**：(1) 放 Upload 个人设置区还是新建 Settings 页？(2) goal_weights 是 8 个 slider 还是更简化形态？
- **建议**：拍板后即可实施

### TD-11 · 上传去重（**大小预检已完成**，余尾：sha256 去重）
- **未完成**：rag_source 加 `sha256` 字段 + 上传前内容预校验（避免同名同内容传两次建两行两份对象）
- **依赖**：需新 migration（加列）+ 客户端 `crypto.subtle.digest` 算 sha256
- **建议**：排队 11 后做（migration 同期；客户端实现简单）

### TD-12 · upload / delete 后台 GC（**前端 race 已完成**，余尾：GC 脚本）
- **未完成**：Storage 删成功 + 表删失败 → 文件丢、列表还在；多环境批量上线前需后台清理脚本
- **建议**：单环境可忽略；多环境上线前写 `scripts/gc-rag-storage.ts`（service_role key + 双向 diff Storage objects / rag_source rows）

### TD-13 · 通用 fetch wrapper（**AbortSignal 已完成**，余尾：retry / timeout）
- **未完成**：非 AI 的 api 调用没统一取消方案；retry / exponential backoff 未做
- **建议**：等真接 LLM 跑通后看真实失败率再决策

### TD-31 · Router context `{}` 空对象（来自 AUDIT R1）
- **现状**：`src/router.tsx` `createRouter({ ..., context: {} })`
- **风险**：排队 11/13 写 loader-driven 数据时再决策，会扩散到所有 `_app/*` route 文件
- **建议**：排队 11 启动会议时回头评估 —— 注入 `{ supabase, queryClient?, auth }` 还是保留 `{}` 让 loader 静态 import？

---

## 🟢 低 — 累计影响，不卡业务

### TD-18 · 死代码 / 历史包袱（**大部分已清**，剩零碎）
- 当前剩余：`src/data/` 空目录 / `src/pages/Landing/Trust.tsx` "kept unmounted" / `src/assets/` 3 个空目录 + .gitkeep
- **建议**：业务方向定下来后统一清扫；要清需要用户确认清单

### TD-20 · 路由命名 kebab-case vs 页目录 PascalCase 不统一
- **风险**：`/course-planner` ↔ `Planner/`，新人迷惑
- **建议**：影响 0，遇到批改名再统一

### TD-22 · profile fetch 与 auth.getSession 串行
- **风险**：首屏 profile 字段有 ~100–300ms 延迟
- **建议**：可接受；要优化就并行 prefetch

### TD-26 · PDF 内联预览 + source_ref 精确到页码
- **想法**：用户 2026-05-16 提议 —— 把规则源 PDF 放进网站，AI 输出 citations 时 source_ref 能定位到 PDF 具体页码 / 段落，UI 点开直接跳页高亮
- **可行性**：技术成熟（PDF.js + URL `#page=N` fragment + Supabase Storage 已有上传管道）。难点在数据层 —— digest § 章节标记 → PDF 页码的反向映射需要人工标 or PDF outline 抽取
- **建议**：推迟到排队 14 UI 重设计阶段统一处理。当前 source_ref 字段已支持自由字符串，将来扩格式不需要 migration

---

## 🟢 低 — 从 ARCHITECTURE_AUDIT 同步

> 这一段是 2026-05-09 + 2026-05-16 两轮架构审计中暴露但未单独立 TD 的项目。
> TECH_DEBT = 唯一权威 backlog；AUDIT 见 `docs/_archive/ARCHITECTURE_AUDIT.md`（已归档）。

### TD-32 · `src/layouts/` vs `src/components/layout/` 双目录共存
- **现状**：前者 1 个 (DashboardLayout)，后者 3 个 (Navbar / Footer / UserMenu)
- **风险**：名字相近误导新接手 AI；grep "layout" 双查
- **建议**：要么并入 `components/layout/`，要么显式注释"layouts/ 仅放 pathless route 对应的 layout 组件"

### TD-33 · `src/data/` 空目录
- **现状**：旧 `mockCourses.ts` 删后空目录存留
- **建议**：删空目录，真有 seed 时再建

### TD-34 · `useProfile` vs `useUserProfile` 命名病
- **现状**：两个 hook 名字差一个词，读 grep 混淆
- **建议**：合并或重命名（如 `useProfileForm` / `useProfileEditing`），看实际用途差异决定

### TD-35 · URL state 范式不一致（**2026-05-25 已失效**）
- **历史**：旧 plan-based Planner 用 `useSearch` 把 `?id=<uuid>` 写进 URL
- **现状**：v5 Track Workspace 重写后 Planner **无任何 URL state**（grep `useSearch` 0 hit）；Schedule / AIAdvisor 同样无；只剩 Upload 内的 ragSource 可能用，但未确认
- **结论**：跨页规约暂无必要 —— 真出现"数据态可分享"需求时再定。本条留底，可删

### TD-36 · `prompts.ts` 单文件
- **现状**：`src/ai/prompts.ts` 只有 1 个 prompt 函数（`recommendModePrompt`）
- **风险**：RAG / 课程排序 / GPA 模拟接上后，prompts/ 会膨胀到 10+ use-case；单文件顶不住
- **建议**：第 3 个 use-case 出现时改成 `src/ai/prompts/<use-case>.ts` 目录形

### TD-37 · mock keyword vs prompt keyword 双源
- **现状**：`providers/mock.ts` 的 `recommendMode` 关键词数组与 `prompts.ts` 的 prompt 都列了 8 mode 关键词
- **风险**：增/改一个 mode 时容易漏改一份，"双份真理"雏形
- **建议**：抽 `src/ai/goalModeKeywords.ts` 单一源，mock + prompt 都引用

### TD-38 · Page hero 5 处重复
- **现状**：5 个功能页各自写一份 page hero（H1 + 描述 + `mx-auto max-w-7xl px-5 py-8 ...`）
- **建议**：抽 `<PageHeader>` 组件；与排队 14 UI 重设计一起做

### TD-39 · 卡片基线（`rounded-xl border border-slate-200 bg-white p-5`）所有页重复
- **现状**：shadcn `<Card>` 装了 0 引用（同 TD-9）
- **建议**：与 TD-9 / 排队 14 一起做

### TD-40 · "guest / loading / empty / data" 状态机重复
- **现状**：Schedule line 79-86 写明 `isResolving / isGuest / isEmpty / showSeed`；Upload 同款
- **2026-05-25 update**：Planner v5 重写后**已删 SEED 模式 + showSeed 分支**（自绘 SVG 不需要 guest seed 兜底），本条对 Planner 已不适用
- **建议**：抽 `useGuestAwareData()` hook 仅覆盖 Schedule + Upload；下次改这两页时顺手

### TD-41 · Trust / status / tone 颜色映射 3 页各一份
- **现状**：Schedule(`TRUST_META`) · Upload(`STATUS_CLS`) · Dashboard(`toneClass`) 各写一份 className → 色阶 map
- **建议**：集中到 `src/styles/colorPresets.ts`，或加 lint 规则禁手写

### TD-42 · ISO 日期 → `YYYY-MM-DD` slice
- **现状**：Upload 内 `formatDate` 函数；Schedule / Dashboard 也会用
- **建议**：移到 `src/lib/format.ts` 集中

### TD-43 · Schedule 跨表占位
- **现状**：Schedule.tsx 注释"学校特殊政策：暂走 SEED，不入库（属 track_* 范畴）"
- **风险**：track schema 第二次 pivot 后 Schedule 还得跟随重构
- **建议**：排队 13 后 track schema 稳定时归位

### TD-44 · Planner SEED_MERIDIAN_NODES 占位 ✅ 2026-05-17 已解
- 排队 12 落地，删 `seedGraph.ts` + 重写 Planner 页为按真实 track schema 三层视图。

### TD-45 · service_role 写公共表手动跑 SQL
- **现状**：0005 seed 走 Dashboard SQL Editor，没自动化 pipeline
- **风险**：换学校（不只是华师大）时这条路径要重复，易错
- **建议**：落 `scripts/seed.ts`（用 service_role key）+ CI step

### TD-46 · `defaultPreloadStaleTime: 0` 关 preload 缓存
- **现状**：`src/router.tsx`
- **风险**：真接 API 后引发不必要重复 fetch
- **建议**：接到真表数据后视真实瀑布图调

### TD-47 · `pages/Login` 与 `pages/Register` 无共用 layout
- **建议**：未来加 SSO / forgot-password / 邮箱确认时新建 `_auth` layout 分组

### TD-48 · DashboardLayout icon-rail 仅 `lg+` 显示
- **现状**：移动端只剩 hamburger
- **风险**：与 CLAUDE.md "Mobile responsive required" 轻微背离
- **建议**：需视觉测试，目前可接受

### TD-49 · 图标自由组合
- **现状**：5 功能页各自从 `lucide-react` 自由组合图标，没有"概念 → 图标"映射规范
- **风险**：长期会出现"同一概念两套图标"
- **建议**：与排队 14 UI 重设计一起约束

### TD-50 · plan 表语义切换待定（"自由备注画布"模式）
- **现状**：排队 12 落地后 plan 表 + planApi.ts 成 orphan；`usePlans.ts` 因依赖 seedGraph 已删
- **设想**：未来"自由备注画布"模式 = 用户在 track 树上拖出便利贴 / 思考节点，plan.nodes shape 改为 `{ id, anchor_option_id?, text, color?, position }`，不再是 ReactFlow MeridianFlowNode
- **风险**：若长期不用，plan 表整张退役；要删需要 migration + 数据备份
- **建议**：排队 13 + 14 跑通后看用户需求是否真出现"想标自由想法"的需求；不主动开工
