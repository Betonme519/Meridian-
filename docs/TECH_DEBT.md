# Tech Debt — Meridian

> Backlog 形式。一条 = 问题 + 风险 + 优先级 + 简短原因 + 建议。
> 解决一条直接删掉（commit 历史可追溯）。新债加进对应优先级。

---

## 🔴 高 — 业务接入前必须解决

### TD-1 · AI provider 抽象 + streaming 协议骨架（**骨架完成，余尾：接真 Anthropic**）
- **现状**：2026-05-14 排队 2 已落地骨架 —— `src/ai/{stream,schema,prompts,providers/mock,providers/anthropic,index}.ts` + 3 zod schema + `chat({ messages, signal }) => AsyncIterable<Token>` 签名 + mock provider + `/ai-advisor` 流式 UI（含 abort）。VITE_AI_PROVIDER env 选 provider，默认 mock
- **余尾风险**：`providers/anthropic.ts` 当前是 stub，抛错；真接入还要：(1) API key 走 Edge Function / Worker（**不能** VITE_*）；(2) SSE / fetch streaming 读 `content_block_delta` 归一成 Token；(3) signal abort 时取消 fetch；(4) 错误归一成 Error
- **建议**：等 TD-2 解析 pipeline 启动时一起做（rag_source 解析也要 AI 调用）

### TD-2 · `rag_source.parsed_status` 永远卡 pending
- **风险**：上传文件后 UI 永远显示"待解析"，用户认为坏掉了
- **原因**：4a 只写入流程，没写解析流程；依赖 TD-1
- **建议**：TD-1 完成后加 worker / Edge Function 推进 `pending → parsing → parsed/failed`，并恢复"重新解析"按钮（替代当前"删除"）

### ~~TD-3 · Supabase 类型手维护（`as Profile` / `as RagSource`）~~ ✅ 2026-05-14 完成（排队 5）
- 跑了 `supabase gen types typescript --project-id tukdczwcygcgpxmdhobl --schema public > src/types/db.ts`（471 行，7 表自动派生）
- `src/lib/supabase.ts` 切 `createClient<Database>()`
- `Profile / Plan / RagSource` 改成 `Omit<XxxRow, narrow字段> & { narrow字段: 业务窄类型 }` 派生，列集合自动跟随 DB
- 仍保留：(1) `Profile.goal_mode → GoalMode` (2) `Plan.nodes/edges/viewport → ReactFlow` (3) `RagSource.kind/parsed_status → 枚举`；这些是业务层 narrowing，不是债。读出侧用 `as unknown as` 桥接 Json→ReactFlow（TS 不递归推断）
- 之后加 chat_message / rule / rule_conflict / course / track_* 表都直接 `Database['public']['Tables']['x']['Row']`，不用再手维护 interface

---

## 🟡 中 — 业务接入半年内会爆

### TD-4 · 全局错误不暴露 UI（profile / rag_source / 未来 AI）
- **风险**：所有失败只 `console.warn`，用户无感知；rag_source 已加 inline rose banner 不一致
- **建议**：`__root.tsx` 挂 `<Toaster />`（sonner 已装）+ 各 Context useEffect 监听 `.error` 弹 toast；统一错误反馈通道

### TD-5 · `updateProfile` 并发写 stale revert + logout race
- **风险**：spam-click 模式切换时 UI 闪旧值；logout 期间 pending fail 把旧 profile 写回
- **建议**：`updateProfile` 入口加 requestIdRef，只让 latest 响应应用；logout 时 ++ref 让所有 pending 失效

### TD-6 · 多 tab 实时同步缺失（profile / rag_source）
- **风险**：A tab 改了字段 / 删了文件，B tab 看到旧值直到刷新
- **建议**：各 Context / hook 订阅 `supabase.channel('<table>').on('postgres_changes', ...)`

### TD-7 · 功能页仍有写死 const（**仅剩 rule**）
- **风险**：profile + rag_source + plan + chat_message 已接通；只剩 rule + rule_conflict 仍 const。
- **现状**：`chat_message` 已于 2026-05-14 排队 6 接通 `/ai-advisor` 对话历史；`/schedule` 接 `rule` + `rule_conflict` = 排队 7（即将做）
- **建议**：跑完排队 7 这条整体消掉

### TD-8 · `_app.tsx` beforeLoad context 注入未做
- **风险**：当前 `getSession()` 读 localStorage 够稳，但服务端鉴权（D3=b）切不过去
- **建议**：要做 D3=b 才动；当前不阻塞

### TD-9 · shadcn primitives 在功能页 0 引用
- **风险**：46 个 Radix primitive 装而不用，业务页全靠裸 Tailwind class；视觉漂移已开始
- **建议**：下次改业务页顺手替 `<Button>` / `<Card>` / `<Dialog>`

### TD-10 · `target_gpa` / `goal_weights` 字段无 UI 入口
- **风险**：schema 留位但用户无法输入；个性化模式无权重面板
- **建议**：新建 Settings 页或在 Upload 个人设置区追加输入位

### TD-11 · 上传无去重 / 无文件大小预检
- **风险**：同名同内容传两次建两行两份对象；超 50MB 才报错（Supabase 免费版上限）
- **建议**：rag_source 加 `sha256` 字段，上传前预校验；客户端先 `if (file.size > MAX) return setError`

### TD-12 · upload 并发无 race 防护 + delete 部分成功无 GC
- **风险**：连点多文件 setSources 顺序与服务端 created_at 略偏差（刷新即正）；Storage 删成功 + 表删失败 → 文件丢、列表还在
- **建议**：upload 加 requestIdRef；后台清理脚本扫孤儿 storage 对象 / 孤儿 rag_source 行

### TD-13 · `AbortController` / 流式取消 / 重试 / 超时模板
- **风险**：用户切 mode、切页时上一个 AI 请求要不要取消？无约定
- **建议**：与 TD-1 一起设计；fetch wrapper 统一约定

### TD-14 · Drawer 三件套（open + scroll-lock + Esc）未抽 hook
- **风险**：`Navbar.tsx` + `DashboardLayout.tsx` 各写一份，body 是同一个抽屉
- **建议**：抽 `useDrawer()`

---

## 🟢 低 — 累计影响，不卡业务

### TD-15 · 4a 审计中的 4 条小瑕疵
- ragSourceApi cleanup `.catch` 是死代码（`supabase.storage.remove()` 不 throw）
- useRagSources upload 失败返回 null 不抛错，批量上传错误信息合并丢失
- useRagSources remove dep `[sources]` 让函数引用每次都变（当前无消费者把它当 effect dep，将来需注意）
- Upload drop 不校验文件类型（input click 走 accept 过滤，drop 跳过；设计选择 vs 校验）
- **建议**：下次改 Upload / useRagSources 时顺手清

### TD-16 · `grade` 无效输入无 UI 反馈
- **风险**：用户敲 "abc" → onBlur Number(NaN) 校验失败，本地 state 保留"abc"看起来已保存
- **建议**：onBlur reset 回 `String(profile?.grade ?? "")` 显示 helper text，或加 zod 校验

### TD-17 · Navbar 头像 initial 仍取 `auth.user.name`
- **风险**：profile.name 改名后 Navbar 标签滞后
- **原因**：CLAUDE.md "Navbar 不要修改"
- **建议**：下轮改 Navbar 时一行切到 `useProfile()`

### TD-18 · 死代码 / 历史包袱
- `src/data/userProfile.ts` 0 引用
- `src/components/{CourseCard,GPAChart,UploadBox,ChatPanel}/` 仍是空 stub
- `src/components/effects/LaptopFrame.{tsx,css}` 旧版 fallback
- `src/pages/Home/Trust.tsx` "kept unmounted for re-use"，复用承诺未兑现
- `src/assets/` 3 个空目录 + .gitkeep
- **建议**：业务方向定下来后统一清扫

### TD-19 · `components.json` css 入口字段不一致
- **风险**：写的 `src/styles.css`，实际是 `src/styles/globals.css`，`shadcn add` 会出错
- **建议**：shadcn 落地业务页前先修

### TD-20 · 路由命名 kebab-case vs 页目录 PascalCase 不统一
- **风险**：`/course-planner` ↔ `Planner/`，新人迷惑
- **建议**：影响 0，遇到批改名再统一

### TD-21 · `rag_source` bucket 名硬编码 `"rag_sources"`
- **风险**：多环境（dev / prod）分名时改不了
- **建议**：单环境无影响；多环境再改 env

### TD-22 · profile fetch 与 auth.getSession 串行
- **风险**：首屏 profile 字段有 ~100–300ms 延迟
- **建议**：可接受；要优化就并行 prefetch

### TD-23 · `displayName` API 已开但 UI 未暴露
- **风险**：用户不能改名（rag_source 直接用 `file.name`）
- **建议**：要做改名 UI 时直接连接 API

### TD-24 · 排队 4c 跳过（`/schedule` 接 `rule` + `rule_conflict`）
- **风险**：`/schedule` 仍展示写死规则；与 `rule` 表脱钩
- **原因**：4c 短期只能接通骨架（按 branch 分组 + trust 三档着色 + 冲突独立），但 `rule` 表内容来自 `rag_source` 解析 pipeline；TD-2 没跑通前 `rule` 永远是手工测试数据，"接通"价值有限。本期优先做排队 2（AI provider 抽象），TD-2 解析 pipeline 推进后再回头做 4c
- **建议**：TD-2 跑通 → 4c 一起做，此时 `rule` 表已有真实内容，前端接通才有展示价值

### ~~TD-25~~ ✅ 2026-05-16 已修 · 落地页「规则透明与来源」点击后 ~1s 闪屏
- 入口实际是 `Rule Graph → /schedule`（不是 Transparency 锚点）
- 根因：`SchedulePage` 的 `isGuest = !authLoading && !user` / `isEmpty = !loading && ...` 把 loading 期判成 false → 第一帧渲染空表 → auth+hook 落地后切到 SEED，造成「空白 → SEED」两段跳变
- 修：`src/pages/Schedule/index.tsx:63-70` 引入 `isResolving = authLoading || loading`，并入 `showSeed`，第一帧直接显示 SEED
- 副作用：`canEdit` 不变（loading 期不出 CRUD 按钮）；登录有数据时仍有 `SEED → 真实数据` 一次切换，是预期不是 bug
