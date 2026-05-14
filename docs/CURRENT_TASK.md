# Current Task — Meridian sprint

> 短期工作内存。**AI 接手优先读这份**，再按需查 `AI_MEMORY.md` / `TECH_DEBT.md`。
> 铁律：只做下方「排队」里的事，做完停下汇报。「不要修改」当只读。

> Last updated: **2026-05-14**

---

## 目标

排队 4b 已完成（`/course-planner` 接 `plan` 表 + URL `?id=` 同步 + debounce 自动保存 + 多 plan 切换 / 新建 / 重命名）。
下一步进 4c（`/schedule` 接 `rule` + `rule_conflict`），由用户启动。

---

## 排队（按优先级，一次开一条）

- [ ] **🟡 排队 4c** — `/schedule` 接 `rule` + `rule_conflict`（约半天）
  - 规则树按 branch 分组拉取，trust 三档着色保留
  - 冲突独立从 `rule_conflict` 加载
  - 真发挥价值要等 4a 解析 pipeline 跑通后；现在初期只能用手工测试数据

- [ ] **🔴 排队 2（暂缓）** — AI provider 抽象 + streaming 协议骨架（约 1–2 小时）
  - 4b / 4c 跑通后再做（业务表写入稳了再叠 AI 抽象层）
  - 详见 `TECH_DEBT.md` TD-1

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

- **2026-05-14** — 排队 4b — `/course-planner` 接 `plan` 表
  - 新建 `planApi.ts`（list/get/create/updateGraph/rename/**delete**）+ `usePlans.ts`（list / current / debounce save 800ms / 空态自动建 / **remove 删当前自动切下一张、删空再补一张**）+ `seedGraph.ts`（types / lane 骨架 / SEED_*data 抽出）；Planner 页删 initial state，加 header bar（plan 名 inline 编辑 + 切换下拉 + 新建 + **删除（下拉每项垃圾桶 hover + window.confirm，禁删最后一张）** + 保存状态 + 画布锁挪过来）；URL `?id=<uuid>` 同步，刷新 / 直链 / 多 plan 切换都可恢复；800ms debounce 自动保存；空账号自动建「我的第一张规划」（用 seed 12 节点 + 13 边）；lane 骨架渲染时拼接，**不入 DB**。**访客模式**（`!authLoading && !user`）改成喂 SEED 只读预览（不入 DB，header 显示「访客预览 · 登录后保存」+「示例规划」），保 4b 之前的视觉感。`course-planner` route 加 `validateSearch` 暴露 `?id=` 类型；Dashboard / Schedule 的 Link 同步加 `search={{ id: undefined }}`。`tsc --noEmit` 干净（除 CardSwap 历史遗留）；`vite build` 通过。

- **2026-05-11** — 排队 4a — `/import` 接通 Storage + `rag_source` 表
  - 新建 `ragSourceApi.ts` + `useRagSources.ts`，改 Upload 页接通拖拽 / 选文件 / 列表读 DB / 删除；审计修 3 条中度问题（button→label、useEffect dep 守卫、loading 初值 true）

- **2026-05-10** — `profiles` 表前端接通
  - 新建 `profileApi.ts` + `ProfileContext.tsx` + `useProfile.ts`；4 处页面接入（Upload / AIAdvisor / Dashboard / UserMenu）

- **2026-05-10** — `docs/DATA_MODEL.md` 起草 + SQL migration 落地
  - 6 主表 + 1 RAG 表 schema + 6 决策确认 + 工程审计；`0001_init_schema.sql` 跑通；Storage bucket + RLS 已建

- **2026-05-10** — 路由鉴权门禁 + 访客模式 + 退出回首页
  - `_app.tsx` beforeLoad 4 道守卫；`guestMode.ts` localStorage 薄壳；Login 「暂时跳过」按钮；Home CTA 鉴权
