# Current Task — Meridian sprint

> 短期工作内存。**AI 接手优先读这份**，再按需查 `AI_MEMORY.md` / `TECH_DEBT.md`。
> 铁律：只做下方「排队」里的事，做完停下汇报。「不要修改」当只读。

> Last updated: **2026-05-14**

---

## 目标

排队 2 骨架已完成（`src/ai/` 抽象层 + mock provider + `/ai-advisor` 流式 UI）。Anthropic 真 provider 留 stub，等 TD-2 解析 pipeline 启动时再实现。
当前**无活跃排队**。下一步候选：(a) 接真 Anthropic provider（TD-1 剩余）；(b) `chat_message` 表接 `/ai-advisor` 对话历史；(c) TD-2 解析 pipeline；(d) TD-4 全局错误 Toaster。由用户启动。

---

## 排队（按优先级，一次开一条）

_（暂无活跃排队，等用户指派）_

---

## 当前阻塞

无。

（4a 的"Storage bucket 需手动建"已由用户确认完成。）

---

## 不要修改

- 全局 `src/components/layout/`（Navbar / Footer / DashboardLayout / UserMenu）
- 落地页 `src/pages/Home/*`
- 路由根与分组：`src/routes/__root.tsx` · `src/router.tsx` · `src/routes/_app.tsx` · `src/routes/_app/*`（除非任务要求加 beforeLoad）
- 菜单单一真理 `src/config/menu.ts`（除非要新增菜单项 / 调整 title 文案）
- 设计令牌 `src/styles/variables.css` · `globals.css`
- 笔记本相关 effects（EmbeddedLaptop / GridMotion / CardSwap / TiltedCard）
- Supabase 接入面 `src/lib/supabase.ts` · `src/api/authApi.ts` · `src/context/AuthContext.tsx`（公共 API 已稳定）
- 自动生成 `src/routeTree.gen.ts`
- 已有 commit 历史（禁 `git reset` / `git rebase`）

---

## 完成标准（对任一排队任务）

- [ ] `tsc --noEmit` 干净（允许 CardSwap.tsx 历史遗留错）
- [ ] 视觉符合 `DESIGN_SYSTEM.md`
- [ ] 没碰「不要修改」清单里的文件
- [ ] 已记入「最近完成」+ 必要的技术债已挪到 `TECH_DEBT.md`

---

## 最近完成（最多 5 条）

> 详细技术债见 `TECH_DEBT.md`；项目时间线见 `AI_MEMORY.md` § 9。

- **2026-05-14** — 排队 2 — AI provider 抽象 + streaming 协议骨架
  - 新建 `src/ai/{stream,schema,prompts,providers/mock,providers/anthropic,index}.ts` 6 文件；定 `chat({ messages, signal }) => AsyncIterable<Token>` 签名 + 3 个 zod schema（`Recommendation` / `ChatMessage` / `RagAnswer`，与 DATA_MODEL § 3.6 对齐）+ `recommendModePrompt` 模板；mock provider 沿用原 `recommendMode` 正则 + 模板化 rationale，18ms/字 流式 yield、signal aborted 时优雅 return；Anthropic stub 抛"未实现"错。`profileApi.GoalMode` 改成从 `GOAL_MODES as const` 数组派生，给 zod `z.enum` 复用。AIAdvisor `handleParse` 改成 async：abort 上一轮 → for-await 流式累加到 `parsedNote` → 正则解析「推荐：<mode>」→ 写 profile；按钮 streaming 态禁用 + 「分析中…」 + spinner；parsedNote multi-line + `▍` 光标；卸载 abort；切模式 abort。`VITE_AI_PROVIDER` env 切 provider（默认 mock）。`tsc --noEmit` 干净（除 CardSwap 历史遗留）；`vite build` 通过。

- **2026-05-14** — 排队 4b — `/course-planner` 接 `plan` 表
  - 新建 `planApi.ts`（list/get/create/updateGraph/rename/**delete**）+ `usePlans.ts`（list / current / debounce save 800ms / 空态自动建 / **remove 删当前自动切下一张、删空再补一张**）+ `seedGraph.ts`（types / lane 骨架 / SEED_*data 抽出）；Planner 页删 initial state，加 header bar（plan 名 inline 编辑 + 切换下拉 + 新建 + **删除（下拉每项垃圾桶 hover + window.confirm，禁删最后一张）** + 保存状态 + 画布锁挪过来）；URL `?id=<uuid>` 同步，刷新 / 直链 / 多 plan 切换都可恢复；800ms debounce 自动保存；空账号自动建「我的第一张规划」（用 seed 12 节点 + 13 边）；lane 骨架渲染时拼接，**不入 DB**。**访客模式**（`!authLoading && !user`）改成喂 SEED 只读预览（不入 DB，header 显示「访客预览 · 登录后保存」+「示例规划」），保 4b 之前的视觉感。`course-planner` route 加 `validateSearch` 暴露 `?id=` 类型；Dashboard / Schedule 的 Link 同步加 `search={{ id: undefined }}`。`tsc --noEmit` 干净（除 CardSwap 历史遗留）；`vite build` 通过。

- **2026-05-11** — 排队 4a — `/import` 接通 Storage + `rag_source` 表
  - 新建 `ragSourceApi.ts` + `useRagSources.ts`，改 Upload 页接通拖拽 / 选文件 / 列表读 DB / 删除；审计修 3 条中度问题（button→label、useEffect dep 守卫、loading 初值 true）

- **2026-05-10** — `profiles` 表前端接通
  - 新建 `profileApi.ts` + `ProfileContext.tsx` + `useProfile.ts`；4 处页面接入（Upload / AIAdvisor / Dashboard / UserMenu）

- **2026-05-10** — `docs/DATA_MODEL.md` 起草 + SQL migration 落地
  - 6 主表 + 1 RAG 表 schema + 6 决策确认 + 工程审计；`0001_init_schema.sql` 跑通；Storage bucket + RLS 已建
