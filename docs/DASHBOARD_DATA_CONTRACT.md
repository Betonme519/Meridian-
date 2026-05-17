# Dashboard Data Contract — `/dashboard`

> 4 张快捷入口 + 5 张决策卡各自接哪份数据。
> 用户已拍板（2026-05-17），等排队 11/13 接通后归档到 `docs/_archive/`。
> Last updated: **2026-05-17（已锁定）**

---

## 已锁定决策（2026-05-17 用户拍板）

| 待决 | 选择 | 影响 |
|---|---|---|
| 卡 3 风险变化路线 | **A · 短期占位 + 长期 risk_snapshot schema** | 排队 13 完成后新建 schema，期间显示"AI 还没生成风险评估" |
| Section 1 "同步教务" shortcut | **删除** | 立项书严禁爬学校系统；本轮已在 `src/pages/Dashboard/index.tsx` 删 importShortcuts[2] + 移除 Link2 import。Section 1 从 5 个 → 4 个 |
| 卡 5 短期文案 | **Claude 起草 8 句文案池**（已实施） | 见 `Dashboard/index.tsx` 的 `NEXT_STEP_POOL`，按小时 hash 轮换；用户后期可自改 |

---

## 背景

`/dashboard` 是用户登录后第一眼看到的页面（AI Feed），当前是 5 功能页里**唯一仍 100% 写死 const** 的页（`src/pages/Dashboard/index.tsx` line 41-124，`importShortcuts` + `decisionCards`）。
其他 4 页（AIAdvisor / Planner / Schedule / Upload）都接 hooks 拉真数据，Dashboard 不接 = 体验断层。

本契约决定 5 张卡每张的数据源 + 接入阶段，让 Dashboard 真接通的工作可拆成 PR 推进。

---

## Section 1 · Import shortcuts（5 个快捷入口）

当前是 5 个**静态导航卡片**：上传培养方案 / 导入成绩单 / 同步教务 / 导入课表 / 输入目标。
每个带 `status` 字段（已上传 / 已上传 / 未连接 / 未导入 / 高 GPA）。

### 决策契约

| 字段 | 数据源 | 派生方式 |
|---|---|---|
| **title / desc / to / icon** | 写死 const（保留现状） | 视觉布局，与数据无关 |
| **status 上传培养方案** | `rag_source` 表 | `WHERE kind='培养方案' AND user_id=auth.uid()` 有行 → "已上传" / 否 → "未上传" |
| **status 导入成绩单** | `rag_source` 表 | `WHERE kind='成绩单' ...` 同上 |
| **status 同步教务** | 暂无 schema | 短期：写死 "未连接"；长期：等"教务对接" feature schema |
| **status 导入课表** | `rag_source` 表 | `WHERE kind='课表' ...` 同上 |
| **status 输入目标** | `profile.goal_mode` | 直接显示当前 mode 名（"高 GPA"/"保研路线" 等 8 档其一） |

**实施**：Section 1 可以排队 11 完成后立即接（依赖只有 `useProfile` + `useRagSources`）。

---

## Section 2 · Decision cards（5 张主卡）

### 卡 1 · 当前目标

**当前写死**：标题 "当前目标"，正文 "高 GPA 模式 · 保研路线"，meta "上次更新 12h 前"。

**决策契约**：
- 数据源：`profile.goal_mode` + `profile.target_gpa` + `profile.goal_weights`
- 标题：固定 "当前目标"
- 正文：`${goal_mode}${target_gpa ? ` · 目标 GPA ${target_gpa}` : ""}`
- meta：`上次更新 ${formatRelative(profile.updated_at)} 前`
- tone：`neutral`
- cta：`{ label: "调整目标权重", to: "/ai-advisor" }`

**实施**：排队 11 即可接（依赖 `useProfile`，无新 schema）。

---

### 卡 2 · AI 最近一次推荐

**当前写死**：正文 "建议本学期保留 HIST 118 与 MATH 233，谨慎同修 CS 241。"

**决策契约**：
- 数据源：`chat_message` 表
- 查询：`SELECT * FROM chat_message WHERE user_id=auth.uid() AND role='assistant' AND metadata->>'aborted' IS NOT TRUE ORDER BY created_at DESC LIMIT 1`
- 正文：取 `content` 前 80 字 + "…"
- meta：`基于 ${mode} · ${formatRelative(created_at)} 前`
- tone：`good`
- cta：`{ label: "查看完整对话", to: "/ai-advisor?conv=" + conversation_id }`
- **空态**：`chat_message` 为空 → 显示 "暂无 AI 推荐" + cta "去 AI Advisor 开始一次对话"

**实施**：依赖 `useChatMessages`（已有）。排队 11 后即可接。

---

### 卡 3 · 最近风险变化 ⚠️ 需要新 schema

**当前写死**：正文 "压分风险 ↓ 12%（drop CS 241 模拟）"，meta "近 7 天 · 含 3 次模拟"。

**问题**：数据库**没有**"风险快照"表。Phase 1 是没办法做到"真实风险数字"。

**两条路线**：

**路线 A（短期占位 + 长期补 schema）**：
- 短期：卡片显示 "AI 还没生成风险评估"，cta 引导用户去 `/import` 上传更多数据
- 长期：等排队 13（AI 接 track）完成后，新建 schema：
  ```sql
  CREATE TABLE risk_snapshot (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    risk_score  numeric not null,   -- 0-100，越高越危险
    delta       numeric,             -- 与上一次比的变化量
    summary     text not null,       -- AI 生成的一句话解释
    computed_at timestamptz not null default now()
  );
  ```
  由 AI provider 在用户每次"模拟操作"后写入。

**路线 B（彻底删卡）**：
- 把 "最近风险变化" 这张卡删掉，5 张减成 4 张。理由：风险不是用户主动想看的指标。

**决策待定**：建议路线 A。⚠️ **等用户拍板**。

---

### 卡 4 · 卡住的 requirement

**当前写死**：正文 "第二课堂 还差 2 分 · 劳动教育 1 学分"，meta "毕业进度 86%"。

**决策契约**：
- 数据源：`user_progress` ⨝ `track_requirement` ⨝ `track_category`
- 查询逻辑：
  ```sql
  -- 找出所有"未完成且差距最大"的 requirement
  WITH user_done AS (
    SELECT track_requirement_id,
           COUNT(*) FILTER (WHERE status IN ('done','enrolled')) AS done_count,
           SUM(track_option.credits) FILTER (WHERE status IN ('done','enrolled')) AS done_credits
    FROM user_progress
    JOIN track_option ON user_progress.option_id = track_option.id
    WHERE user_progress.user_id = auth.uid()
    GROUP BY track_requirement_id
  )
  SELECT r.title, r.threshold, ud.done_count, ud.done_credits
  FROM track_requirement r
  LEFT JOIN user_done ud ON ud.track_requirement_id = r.id
  WHERE r.kind IN ('count','credits') AND
        COALESCE(
          CASE r.kind
            WHEN 'count' THEN ud.done_count
            WHEN 'credits' THEN ud.done_credits
          END, 0) < r.threshold
  ORDER BY (r.threshold - COALESCE(...)) DESC
  LIMIT 3;
  ```
- 正文：拼前 2 条："${title} 还差 ${gap}${unit}"
- meta：`毕业进度 ${整体完成度百分比}%`（同样 user_progress 聚合）
- tone：`warn`
- cta：`{ label: "前往规则", to: "/schedule" }`
- **空态**：用户没有 `track_id` 或 `user_progress` 全空 → 显示 "未匹配培养方案" + cta 去选学校 / 专业

**实施**：依赖 ① 排队 11 完成（`course` 表 + UI） ② SB1 重 gen types（让 track_* 进 db.ts） ③ 写 `usePathProgress()` hook 包装上面那条 SQL。**排队 13 期间做**。

---

### 卡 5 · 下一步建议

**当前写死**：正文 "在 Workspace 拖动 CS 241 看连锁影响"，meta "AI 综合判断置信度 中-高"。

**决策契约**：
- 短期（排队 13 前）：写死一组**轮换文案**（5-10 句），按 `Math.floor(Date.now() / 1000 / 3600) % LENGTH` 取，每小时变一次。比卡死一句强、又不需要 AI。
- 长期（排队 13 后）：AI provider 在生成卡 2/3 时同时输出 "next_step"，写到 `chat_message.metadata.next_step`。卡 5 从 `chat_message` 同条记录取。

**实施**：短期 1 个 PR 完成（写死 + 时间轮换），长期等 AI provider 接通。

---

## 阶段分组

### 阶段 1（排队 11 完成后立即可做）

可接通的卡 / Section：
- ✅ Section 1（5 个 import shortcut 的 status）—— 依赖 `useProfile` / `useRagSources`
- ✅ 卡 1（当前目标）—— 依赖 `useProfile`
- ✅ 卡 2（AI 最近推荐）—— 依赖 `useChatMessages`
- 🟡 卡 5（下一步建议）—— 写死轮换文案，不依赖 hook

**未接通**：卡 3 / 卡 4 留 SEED 占位 + 标识 "暂未生成"，提示用户 "上传更多数据后自动生成"。

### 阶段 2（排队 13 完成后）

- ✅ 卡 4（卡住的 requirement）—— 依赖 track_* schema + user_progress 联表
- ✅ 卡 5（下一步建议）—— 升级到 AI provider 输出

### 阶段 3（最后补）

- 新建 `risk_snapshot` schema（migration `000N_add_risk_snapshot.sql`）
- AI provider 在模拟操作时写 risk_snapshot
- ✅ 卡 3（最近风险变化）—— 接 risk_snapshot

---

## 状态：已锁定

3 个待决全部于 2026-05-17 拍板（见顶部表格）。本文件进入"实施跟踪"阶段；
排队 11/13 完成后归档到 `docs/_archive/`。
