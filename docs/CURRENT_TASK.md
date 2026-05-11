# Current Task — Meridian sprint

> 短期工作内存。**AI 接手优先读这份**，再按需查 `AI_MEMORY.md` / `TECH_DEBT.md`。
> 铁律：只做下方「排队」里的事，做完停下汇报。「不要修改」当只读。

> Last updated: **2026-05-11**

---

## 目标

排队 4a 已完成（`/import` 接通 Supabase Storage + `rag_source` 表 + 审计修了 3 条中度问题）。
下一步进 4b（`/course-planner` 接 `plan` 表）或 4c（`/schedule` 接 `rule` + `rule_conflict`），由用户指定。

---

## 排队（按优先级，一次开一条）

- [ ] **🟡 排队 4b** — `/course-planner` 接 `plan` 表（约半天）
  - 把 ReactFlow 写死 nodes / edges 改成读 `plan` 表 + 自动保存（debounce）
  - 「新建 plan」按钮 → `INSERT INTO plan` → 跳到该 plan
  - 依赖：profiles 接入已完成；schema 已落地

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

- **2026-05-11** — 排队 4a — `/import` 接通 Storage + `rag_source` 表
  - 新建 `ragSourceApi.ts` + `useRagSources.ts`，改 Upload 页接通拖拽 / 选文件 / 列表读 DB / 删除；审计修 3 条中度问题（button→label、useEffect dep 守卫、loading 初值 true）

- **2026-05-10** — `profiles` 表前端接通
  - 新建 `profileApi.ts` + `ProfileContext.tsx` + `useProfile.ts`；4 处页面接入（Upload / AIAdvisor / Dashboard / UserMenu）

- **2026-05-10** — `docs/DATA_MODEL.md` 起草 + SQL migration 落地
  - 6 主表 + 1 RAG 表 schema + 6 决策确认 + 工程审计；`0001_init_schema.sql` 跑通；Storage bucket + RLS 已建

- **2026-05-10** — 路由鉴权门禁 + 访客模式 + 退出回首页
  - `_app.tsx` beforeLoad 4 道守卫；`guestMode.ts` localStorage 薄壳；Login 「暂时跳过」按钮；Home CTA 鉴权

- **2026-05-09** — Supabase auth 接入（mock 退役） + 死文件清扫 + 架构审计
  - 21 文件 + 8 目录死代码清；react-query 移除；`AuthContext` 公共 API 保稳
