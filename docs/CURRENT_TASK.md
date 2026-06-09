# Current Task — Meridian sprint

> 短期工作内存。**AI 接手优先读这份**，再按需查 `AI_MEMORY.md` / `TECH_DEBT.md`。
> 铁律：只做下方「排队」里的事，做完停下汇报。「不要修改」当只读。

> Last updated: **2026-06-09**

---

## 目标

**已闭环**：排队 5/6/7/8/9 + 10 全部 + 11 + 12 + 13 mock + **13.5 静态路径库** + **12.5 全部子任务 0-E** + **14 全部五批 UI 重设计** + **后端骨架 Phase 1**（2026-05-28）+ **排队 13.2 backend Phase 2 完整闭环**（2026-05-29~30 GLM-5.1 SSE proxy + session 校验 + rate limit + 401/429 实测通过）+ **TD-10a target_gpa UI**（2026-05-29）+ **Landing 落地页重命名**（2026-05-30）+ **Dashboard 内嵌 AI 对话**（2026-05-30）+ **排队 13.8 A+B 全闭环**（2026-05-30 个人文档解析 + 手册 RAG 624 块灌库完成）。详见下方「最近完成」+ AI_MEMORY § 9 + 各 commit。
**当前推进**：**连接图重做 + TD-10b + 画布建议层微调全闭环并 commit**（2026-05-31，commit `93dc411`，用户已在 Supabase 跑过 0013）。
- **连接图**：读 5 份 digest 系统抽取，`requirement_link` 40 条/35 规则 → **137 条/覆盖 117/198 规则**，0 dangling、只存事实关系（无目标字段）。`0013_seed_requirement_link_full.sql` 取代 0008（幂等）✅ 已灌库。
- **TD-10b** ✅ goal_weights 改 AI 派生 + 静默存储（删手动滑块）。
- **画布微调** ✅ 论文/第二课堂补 milestone 级建议捷径（`MILESTONE_SHORTCUTS`）；规则节点去数字角标、左 icon 改箭头示意可展开。纯前端。
- **TD-50** ❌ 自由备注画布做完即弃（便利贴价值不足，已回滚）。
**新优先级**（2026-05-31）：
1. **C2b** wrangler secret put + 真部署到 Cloudflare Worker（等真要上线时做）← **下一条候选**
2. （可选）接轻量 AI 层：GLM-5.1 按目标在这张连接图上挑可执行组合 / 精简 advice 文案
**最近 commit**：`4766d32` workspace 兴趣→AI推荐接通 + 切换/重叠修复 + 一级聚焦；home 决策卡底图重做 + 极光背景（详见下方 ✅ 表 2026-06-09 行；极光后续微调待 commit）；`66152a2` workspace 思维导图画布精致化（点阵背景 + 浮动毛玻璃图例 + 节点端口圆点/柔光 + 推荐线 gold→maya 渐变）；`93dc411` 连接图重做 + TD-10b 权重 AI 派生 + 画布建议层微调；`02e6167` splitSeedSql + gitignore 向量 seed；`8c72623` 13.8-B 手册 RAG 代码；`106f530` 13.8-A 个人文档解析；`cbea9fd` Dashboard 内嵌 AI 对话。
**架构转向（2026-05-25）**：用户拍板"静态路径库 + AI 连接"。改原 AI runtime 生成 reason 为 Claude 预编译 (goal × req) → 280 advice + 40 link 关系，DB 查询替代 runtime AI 调用。
**UI 重设计（排队 14）**：✅ 已闭环（2026-05-28）。五批迭代见下方排队 14 段落 + 最近完成第一条。

用户 2026-05-14 历史决策（已生效，留作背景）：

1. **先收尾跟毕业路径无关或基本无关的后端**（已完成）—— typed client（TD-3）/ chat_message 接入 / rule + rule_conflict 接入。
2. **再做毕业路径主线** —— 三问同根（画布主线分支 / AI 锁既定逻辑 / 何时灌学校数据），都卡在结构化 schema 不存在。

**TD-1（真 LLM provider）✅ 已闭环 = 排队 13.2**（2026-05-29~30 GLM-5.1 SSE proxy 完整跑通）。骨架 provider-agnostic（DeepSeek/Qwen/Zhipu/Anthropic 任一家可接），当前接 Zhipu GLM-5.1。
**TD-2（解析 pipeline）✅ 已闭环 = 排队 13.8**（2026-05-30 A 个人文档解析 + B 手册 RAG 624 块灌库）。

---

## 状态总览

> 一屏看清"哪些做完了 / 卡在哪 / 下一条做什么"。详细描述见下方各「排队 N」节或 `AI_MEMORY.md § 9`。

### ✅ 已闭环（近期优先）

| ID | 阶段 | 完成日期 | 关键 commit / 文件 |
|---|---|---|---|
| **C2b 真部署 Cloudflare Worker**（`wrangler.jsonc` name 改 `meridian`；`npm run build` → `wrangler deploy` 创建 Worker；`wrangler secret put` 注入 4 个 server 密钥 ZHIPU_API_KEY / GLM_MODEL / SUPABASE_URL / SUPABASE_ANON_KEY；workers.dev 子域 `betonme519` 注册；上线 **https://meridian.betonme519.workers.dev**；CF 账号 betonme519@gmail.com / account `3b61235a162cae8e508e1d23826a3eca`） | 后端/上线 | 2026-06-09 | `wrangler.jsonc` name 改动待 commit；重部署 = build+deploy |
| **workspace 兴趣→AI推荐接通 + 切换/重叠修复 + 一级聚焦**（① 兴趣→AI 推荐课程接通真 LLM：`interestCoursePrompt` + `chat` 流式，ShortcutDetail 兴趣框启用 ② 修复「全部路径/只看推荐」切换点不动：DashboardLayout header 整体 `pointer-events-none`、两侧交互簇 `pointer-events-auto` ③ 修复思维导图节点竖向重叠：非 course milestone 捷径排版前 `bucketY = max(bucketY, requirementY)` ④ 一级聚焦模型：只有聚焦的 milestone 展开到深层、其余只显示一级（`activeMilestone`） ⑤ 规则标题主干/补充拆分 `splitRequirementTitle`、明细+「还差 N」移到右侧「补充说明」、隐藏「N 模块」内部标注、删 Upload 反向勾选提示、时间后果→时间成本）；**home 更新了 UI**（决策卡底图素材 + 圆形箭头跳转键、空态居中单行提问框、对话态右栏右移加宽、底部极光背景 Aurora(ogl)：半圆穹顶入场 + 点击像素荡漾波纹） | 二/三 | 2026-06-09 | `4766d32` + 极光迭代待 commit |
| **workspace 画布布局微调**（纯前端 UI 优化：右面板右移一点 / 目标 + 全部路径·只看推荐 切换并入右上一行靠"2026 春季学期"，左上 chip 只留 学校·年级 + 计数 / 画布滚动容器 `top-0` 顶到整屏（边界=整个 workspace）+ TOP_PAD 84 避让 header / 展开右侧分支按右面板**真实左边界**测量跟随滚动（替死值 inset）/ 双指横滑左右平移 = `overscroll-x-contain` 挡浏览器翻页 + 内容区右侧预留 `CANVAS_RIGHT_RESERVE 440` 保证横向滚动量把被面板挡住的右节点拉出来。曾试 click-drag 平移已回滚——灰层是浏览器双指翻页手势非本程序问题） | 二 | 2026-06-09 | `src/pages/Planner/index.tsx`，本 session 待 commit |
| **排队 13.8-B** 手册 RAG（migration 0012 pgvector+rag_chunk+match RPC / genHandbookChunks 脚本 / chat.ts 检索注入 / **624 块向量灌库完成**） | 后端 | 2026-05-30 | `8c72623` + `02e6167` |
| **排队 13.8-A** 个人文档解析 → 塞 prompt（pdfjs 浏览器抽文字 + parsed_text 写回 + Dashboard system 上下文喂 GLM-5.1） | 后端 | 2026-05-30 | `106f530` |
| **Dashboard 内嵌 AI 对话**（同页 ChatGPT 式流式 + 双栏布局 + 决策卡竖列 + Enter 发送 + 多轮 UI 微调） | 三 | 2026-05-30 | `cbea9fd` + 后续微调待 squash |
| **Landing 落地页改名**（src/pages/Home → src/pages/Landing；6 docs 路径同步） | 工程 | 2026-05-30 | `54137b2` |
| **排队 13.2 Phase 2 完整闭环**（GLM-5.1 SSE proxy + Supabase session 校验 + per-user rate limit + 401/429 实测通过） | 后端 | 2026-05-29~30 | `4eb0db7` + `3cb7668`（+ 用户 2026-05-30 本地 C2a 实测通过） |
| **画布建议层微调**（论文/第二课堂补 milestone 级建议捷径 `MILESTONE_SHORTCUTS`；规则节点去数字角标 + 左 icon 改箭头示意可展开；纯前端） | 二 | 2026-05-31 | `93dc411` |
| **连接图重做** `requirement_link` 全 198 系统抽取（读 5 digest，40→137 条/覆盖 117 规则；扩 `genRequirementAdvice.ts` LINKS + 产 `0013_seed_requirement_link_full.sql` 取代 0008；端点 0 dangling；连接只存事实关系；用户已灌库） | 二 | 2026-05-31 | `93dc411` |
| **TD-10b** goal_weights AI 派生 + 静默存储（AIAdvisor 分析判「个性化定制」→ AI 吐 7 轴权重行 → page `parseGoalWeights` 静默写 goal_weights jsonb，**无手动 UI**；prompts.ts 加权重契约 + mock `analyzePersonalized` 多目标产权重） | 三 | 2026-05-31 | `93dc411` |
| **TD-10a** target_gpa UI（Upload 个人设置 aside 加滑块） | 三 | 2026-05-29 | 本 session 待 commit |
| **后端骨架 Phase 1**（安全审计 + AI server stub + 三处安全锚点） | 后端 | 2026-05-28 | `docs/backend_migration_plan.md` + `src/routes/api/ai/chat.ts` mock stub |
| **排队 14** 全局功能页 UI 重设计五批 | 三 | 2026-05-28 | `341e651` · `9961fa8` · `89b7973` · `b626a4b` |
| **排队 12.5** workspace 二改（子任务 0-E） | 二 | 2026-05-27 | `58b09cc` · `3e2f832` · `6155a0e` |
| **排队 13 mock** + **排队 13.5 静态路径库** | 二 | 2026-05-25 | `60ac5dc`（含 0007/0008 migration + `requirementAdviceApi`） |
| **排队 12** 画布 v4 → v5 重写（自绘 SVG + 5 组件） | 二 | 2026-05-20 | `1c76e50` (v4) · `974c21b` + `6f8b241` (v5) |
| **排队 11** `course` API + UI 入口 | 二 | 2026-05-17 | `1c76e50` |
| **排队 10** 华师大 2023 级 seed SQL（A 23 + B 48 + C 56 + D 49 + E 22 = 198 条）| 二 | 2026-05-17 | `1bdb113` (phase 4) · `3cae3f4` · `2fba113` (phase 3) |
| **排队 9** 0002 track schema migration + DATA_MODEL 入口 | 二 | ≤2026-05-17 | `4bb156b` + `e0df73b` |
| **排队 8** 毕业路径五层结构契约（UI 推迟到 14） | 二 | ≤2026-05-17 | `71c184e` |
| **排队 5/6/7** typed client / chat_message / rule + rule_conflict | 一 | ≤2026-05-17 | `9571ea5`+`c36f3c4` / `44b00b6` / `9fb712e` |

### ⏳ 未启动 / 阻塞中（按优先级）

| 优先级 | ID | 状态 | 卡点 |
|---|---|---|---|
| 1 | **C2c** 自定义域名 `meridianedu.xyz` 绑定 Worker | 🚧 阻塞（外部） | **workers.dev 国内被 GFW 在 TLS/SNI 层阻断**（实测：同机抓 developers.cloudflare.com ✅、抓 *.workers.dev → SSL alert 40 handshake_failure），WiFi/流量都打不开 → 必须绑自有域名才能国内访问。域名阿里云/腾讯云买，**当前卡在 .xyz 强制实名审核**（已提交待审）。审核通过后三步：①CF 后台 Add Site `meridianedu.xyz`(Free) 拿 2 个 ns.cloudflare.com →②阿里/腾讯控制台改 DNS 服务器 →③`wrangler.jsonc` 加 `routes`(custom_domain) + deploy。用户有 VPN 可开 CF 后台。预计实名次日（约 2026-06-10）继续 |

---

## 排队（按优先级，一次开一条）

### 第一阶段 · 无关基础 ✅ 全闭环

> 排队 5（typed client / 原 TD-3）→ commit `9571ea5` + `c36f3c4`（4 API 改 `Omit<XxxRow, …> & {…}` 派生 + db.ts 重 gen 743 行）
> 排队 6（chat_message 接 /ai-advisor）→ commit `44b00b6`（chatMessageApi + useChatMessages + abort metadata + 历史列表 UI）
> 排队 7（rule + rule_conflict 接 /schedule）→ commit `9fb712e`（原 TD-24 收尾）
>
> ⚠️ **CURRENT_TASK 旧描述"排队 6 = TD-7 余尾"是历史用语漂移**：TD-7 在 commit `c36f3c4` 重新分配为「Dashboard 写死 const + Schedule SEED_POLICIES」，跟 chat_message 无关。

---

### 第二阶段 · 毕业路径主线（前段 ✅ 已闭环）

> 排队 8（毕业路径五层结构契约 + UI 推迟到排队 14）→ commit `71c184e`
> 排队 9（0002 track schema migration + verify + DATA_MODEL 入口）→ commit `4bb156b` + 后续 `e0df73b`（0003 scope 三档）+ `a2b955f`（0004 source_ref）+ `6c91af5`（0006 kind 12 档 + metadata jsonb）

#### 排队 10 — 学校种子数据 seed SQL（华师大 2023 级）✅ 2026-05-17

- ✅ 阶段 1-2（digest A/B/C/D/E v2，data source 切 PDF）→ `ef06fe2` · `cd6c7f4` · `63252e5`
- ✅ 阶段 3（0005_seed_ecnu_2023.sql 198 条 track_requirement 落库，用户 Supabase Dashboard 跑通）→ `3cae3f4` + `2fba113`
- ✅ 阶段 4（`docs/ecnu_process_rules.md` 323 行 / 9 章过程规则精炼，喂排队 13 `gradPathAdvisorPrompt`）→ `1bdb113`

> **详细子任务展开 / 4 批分组 / D-track-8 决策 / 旧 md 归档**：见 `AI_MEMORY.md § 9`（L240-279）+ `track_kind_taxonomy.md`。
> **数据源文件分流约束**（仅本任务 / 排队 13 读）：见 `CLAUDE.md` 第 8 条。

#### 排队 11 — `course` 表接 API + UI 入口 ✅ 2026-05-17

- ✅ `src/api/courseApi.ts`（typed 派生 + COURSE_STATUSES / COURSE_CATEGORIES 与 DB CHECK 同源 + listCourses 按 semester desc nulls last + create/update/delete + errorBus）
- ✅ `src/hooks/useCourses.ts`（三件套 race 守卫 + 派生 view：coursesBySemester / coursesByStatus / **courseCodeMap** + **completedCodes** Set；后两者排队 12 画布命中判定直用）
- ✅ UI 入口：Profile 页已删 → 落 Upload 页新增 Section「我已修的课」`src/pages/Upload/CourseManager.tsx`（添加表单 + 列表 + 删除，复用 Section 6 视觉），主页 import 一行接入
- 画布要读这个判断"哪些 option 已完成"，排队 12 前置 ✅ 解锁

#### 排队 12 — 画布改造（思维导图体验）✅ 2026-05-17 v4 / ✅ 2026-05-20 v5 重写

> ⚠️ **v1-v4 思路已废弃**（2026-05-25 用户拍板"我就是要现在这版"）。当前活跃实现 = v5 + post-v5 拆件重构（commit `974c21b` + `6f8b241`），下一步 = **排队 12.5** workspace 二次重构（见下方）。

- ✅ v5 抛 React Flow → 自绘 SVG path + 绝对定位 DIV 卡；5 命名组件 WorkbenchHeader / PathGraph / ImpactPanel / EvidencePanel；三层 root → milestone(3) → bucket → requirement
- ✅ v5 核心交互：`strategyForItem` 9 档策略短句（替代课名）/ `FocusMode` 双视图切换（全部路径 / 只看推荐）/ `ImpactPanel` take/delay/switch 模拟器 + before/after delta / 8 种 `goal_mode` `GOAL_COPY`
- ✅ 配套底座：`trackApi` + `userProgressApi`（5 表 read-only + upsert/delete）/ `useTrack` + `useUserProgress` 三件套 / `trackSimulation` + `trackRecommendation` + `trackUserView`
- ⚠️ **数据空洞**：30 cat + 198 req ✅，**0 track_option**（0005 没录课程清单）；推迟到 0007 seed
- 推迟项（捷径变体下钻 / 捷径×目标适配标签 / 兴趣维度）→ 全部并入 **排队 12.5**

> **v1-v5 全演进 / 各 commit 详细变更 / plan 解耦决策** 见 `AI_MEMORY.md` L88 + L130-134 + L212+。

#### 排队 13 — AI 接 track + user_progress + course（schema 锁逻辑）✅ 2026-05-25 mock 落地

- ✅ `src/ai/schema.ts` 加 `PathSuggestionSchema`（含 `shortcuts[]` 12.5 占位）/ `OptionRankingSchema` / `RequirementGapSchema` / `GradPathAdvisorResponseSchema`
- ✅ `src/ai/prompts.ts` 加 `gradPathAdvisorPrompt(input)` + `GRAD_PATH_ADVISOR_MARKER`；system prompt 硬编码"只能基于 user 消息 JSON 数据回答 / 不在数据里写'需查阅手册'"；198 条 requirement 全量 JSON 喂
- ✅ `src/ai/providers/mock.ts` 识别 marker → 8 goal × 5 bucket = 40 句矩阵 + 8 × 2 milestone(second/thesis) = 16 句 → JSON.stringify 输出
- ✅ `src/lib/trackRecommendation.ts` 加 `fetchAdvisorRecommendation(args, signal?)` async 版：启发式产骨架 → AI 升级 reason → 失败回退骨架不闪屏
- ✅ Planner index.tsx：useMemo `recommendation` 改 `baselineRecommendation` + `useState` + 两个 useEffect（输入变回落启发式 / 异步升级 reason）
- 选项决策（2026-05-25 用户拍板 A/A/A/C/A）：全量 JSON / shortcuts[] 预留 / goal×bucket 矩阵 / process_rules 留 13.8 RAG / 替换 trackRecommendation 函数体
- `tsc --noEmit` 0 新错（仅 CardSwap 历史遗留）

**不在 13 范围**：真 LLM（13.2）/ shortcut 层（12.5）/ rankings / gaps 字段填充（13.2）/ ecnu_process_rules.md 喂入（13.8）

#### 排队 13.5 — 静态路径库 ✅ 2026-05-25 完成（NEW 同日拍板 + 同日落地）

**起因**：2026-05-25 用户反思 13 mock —— 「AI runtime 生成 reason 不稳定，能不能 Claude 现在预编译所有路径，运行时只查表」。从 dynamic-AI 转 static-library 架构。link 表是关键创新：扁平 advice 表编码不了 req↔req 关系（如 E2-6 劳动可被 C6-1 创新创业顶 ≤ 2 分），独立 link 表能存。

**两张表**：
- `requirement_advice`（0007）—— (goal_mode, requirement_id) → one_liner / goal_fit / shortcut_oneliners jsonb / priority / source_ref
- `requirement_link`（0008）—— (from_req, to_req, kind) 5 档：substitute / prerequisite / excludes / cross_ref / triggers

**已交付**：
- ✅ `supabase/migrations/0007_add_requirement_advice.sql` + `0007_verify.sql`（8 段）
- ✅ `supabase/migrations/0008_add_requirement_link.sql` + `0008_verify.sql`（6 段）
- ✅ `supabase/migrations/0007_seed_requirement_advice.sql` —— 280 INSERT（35 reqs × 8 goals），自动生成 4778 行
- ✅ `supabase/migrations/0008_seed_requirement_link.sql` —— 40 INSERT（真实存在的关系，自环已跳）
- ✅ `scripts/genRequirementAdvice.ts` —— TS 生成器 660 行，所有文案 + link 全在此（修文案 → `npx tsx scripts/genRequirementAdvice.ts` → 新 SQL 幂等覆盖）

**35 reqs 覆盖范围**：
- 15 用户可见（画布显示）：E1-3 / E2-1~8 / E3-1~4 / E4-4 / E4-5
- 20 关键规则（AI 后台用）：A1-10 A1-12 A2-1 A3-2 A3-3 A4-2 / B3-1 B3-4 B4-4 B5-9 / C1-9 C2-6 C3-3 C5-2 C6-1 C9-1 C9-3 / D3-6 D4-11 D4-12

**40 link 实际数量分布**：
- substitute 1（E2-6 ↔ C6-1）
- cross_ref 14（E2-8 → E2-6/E2-7；E3-1 → E3-2/3/4；A2-1 ↔ A1-12；C2-6/C1-9 → A3-2；等）
- prerequisite 12（E2-1/2/4/5/6/7 → A2-1；C9-1 → C9-3；B5-9 → A1-12；等）
- excludes 2（E4-4 ↔ E1-3；C3-3 ↔ C9-1）
- triggers 11（A1-10 → A1-12；B3-1 → B3-4；D4-12 → D4-11 → A2-1；B5-9 → A1-12；等）

**用户 2026-05-25 跑通 6 份 SQL** → 落库 280 advice + 40 link ✅

**代码层 2026-05-25 同日落地**：
- ✅ `src/api/requirementAdviceApi.ts` —— listAdvice(goal, reqIds[]) + listLinksForRequirements(reqIds[])（两次 IN UNION 而非 OR，避免索引退化）+ GOAL_FITS / LINK_KINDS / AdviceShortcut 类型与 SQL CHECK 同源
- ✅ `src/hooks/useRequirementAdvice.ts` —— requestIdRef + cacheKey（goal + sorted req ids）race 守卫 + 派生四个 view（adviceByReqId / linksFromReqId / linksToReqId / linksByReqId）+ LINK_KIND_LABELS 中文标签
- ✅ `src/types/db.ts` 手动补 requirement_advice + requirement_link 类型块（Row/Insert/Update/Relationships 全套，对齐 supabase gen 格式）
- ✅ Planner index.tsx：删 fetchAdvisorRecommendation 异步 useEffect + AbortController；改用 useRequirementAdvice hook 拉 DB advice + useMemo 合并启发式骨架（adviceByReqId 空时退回启发式）；新增 reqMetaById 全 req 索引（含隐藏规则 req，给 link target 标题查找用）
- ✅ Planner EvidencePanel：加 `<RelatedRulesBlock>` 子组件，按 (selfId is from/to) 计算 link 方向 + emerald/blue/rose/slate/amber 5 色 pill + 中文 kind 标签 + metadata JSON 显示
- ✅ `tsc --noEmit` 0 新错（仅 CardSwap 历史遗留）
- mock AI 矩阵代码保留作 fallback（fetchAdvisorRecommendation 不删，13.2 真 LLM 可换）

#### 排队 13.2 — TD-1 接真 LLM provider（**14 之后**）

**2026-05-26 重排**：12.5 A-E 静态库 + 路径建议层落地后，用户拍板先做 14 UI 重设计（纯前端无外部依赖），13.2 等用户定上游 provider + 充值后再启动。
**2026-05-25 推迟原因**：静态路径库可能 90% 场景够用，真 LLM 只解决"用户课表 × 兴趣 → 具体课程 chip 推荐"这种 runtime 变量。先看 13.5 跑通后剩多少缺口。

- 用户拍板 LLM 上游：DeepSeek / Qwen / Zhipu / Anthropic 任一家
- 写 `src/routes/api/ai.chat.ts` server route，按 `docs/AI_PROXY_SPEC.md` 4 家 SSE 协议骨架转发
- providers/remote.ts 已就绪，只需把 mock 换成真 SSE

#### 排队 12.5 — workspace 二次重构（核心呈现层换思路 + 进度收集反向勾选）

**起因**：2026-05-25 用户重新思考画布的核心价值。v5（commit `974c21b`）做完后用户发现**当前呈现并不直接 ——「学生要的不是 9 档启发式策略短句，而是 AI 看完学校全部规章 + 个人课表 + 兴趣后给出的、针对该条规则的、具体可执行的多条捷径」**。这把原排队 13.5（捷径变体下钻 + goalFit 标签）从延伸需求提到主线核心，并新增**兴趣维度**作为第三个输入信号。

**2026-05-25 二次扩 = 合并 11.5 进度收集子模块**：用户提出现实约束 —— 学校开课表 / 项目表 / 第二课堂 ingest 全不现实，无 API 无爬虫。学生填"还剩几学分"颗粒度太细 → 用户放弃。**反向勾选**心智模型："默认全已完成，取消勾选 = 还没做"。大三大四 95% 已完成只需取消 1-2 条；大一大二全部取消一次性几下完事。心智从"我做了什么"翻转到"我还差什么"。
- 数据：现有 `user_progress` 表 + `useUserProgress` hook 直接用
- UI 位置：合并到 12.5 的画布 / 或单出独立 Import 页 Section（拍板时定）
- 副作用：删 Planner 里 `这条目前只有规则级判断 ... 补充 option seed 后` 提示（option seed 永远不会有）+ 改「待补充候选 / 已有可执行候选」字眼

##### 核心思路差距

| 层 | v5 现在 | 12.5 目标 |
|---|---|---|
| requirement 卡 title | `strategyForItem()` 9 档硬编码策略短句 | 就显规则名（"公共必修"四个字） |
| requirement 下一级 | 叶子（点了进 ImpactPanel） | **可展开** → 2-4 条 AI 生成捷径 |
| 捷径来源 | 关键词匹配 | AI 看 `track_requirement` × `course`（已修） × `ecnu_process_rules.md` × **用户兴趣** 现算 |
| 候选课 | `track_option` 表 hardcode（且 seed 未录） | AI 输出 chips，藏在捷径下 |
| 兴趣维度 | ❌ 无 | **点开捷径那一层时 AI 问"你对什么感兴趣？"**（不进 onboarding，按需触发） |
| ImpactPanel / EvidencePanel / FocusMode | ✅ 已有 | ✅ 全部保留不动 |

##### 用户讲的形态（"公共必修"示例）

```
[公共必修] ← 点击展开
  ├─ 💡 不计 APF → 不为分数选，挑你感兴趣的
  │   └─ "你对什么感兴趣？" → AI 列 3 门兴趣命中 + 时段空闲
  ├─ 💡 周二有专必 + 周五实习意向 → 公必塞周二下午
  │   └─ AI 列该时段可选公共课
  ├─ 💡 大三下轻量学期一次冲完
  │   └─ AI 算届时学分对齐组合
  └─ 💡 体育 + 体测合并选课，单次出勤双覆盖
```

##### 实施清单

- **0 · 反向勾选式进度收集器** ✅ 2026-05-25 落地
  - ✅ 0009 migration: `user_requirement_done` 表（独立于 user_progress，**只存"未完成"行**；空表 = 全部完成）+ RLS owner-only + idx_urd_user/req + trg_urd_updated_at
  - ✅ `src/api/userRequirementDoneApi.ts`：listIncomplete / markIncomplete / unmarkIncomplete / batchSetIncomplete（保留旧行 note 不全删重建）
  - ✅ `src/hooks/useUserRequirementDone.ts`：requestIdRef + loadedUserIdRef 三件套 + 乐观 mark/unmark/toggle/batchSet + `incompleteReqIds` Set 派生
  - ✅ `src/types/db.ts` 加 user_requirement_done 类型块
  - ✅ `src/pages/Upload/RequirementProgress.tsx`（Section 8）：按 category 分组 grid + emerald ✓ / rose ○ 圆圈 toggle + 已完成/待完成 双 pill 计数；访客只读
  - ✅ Planner isUnmet 改语义：`incompleteReqIds.has(id)` 为单一真相（不再依赖 calcRequirementProgress 推导，因为 option seed 永远没有）
  - ✅ 改 Planner amber 提示语 → slate 提示"去 Upload 页 Section 8 反向勾选"

- **A · 画布加第 4 层 `shortcut`（路径建议）** ✅ 2026-05-26
  - root → milestone → bucket → requirement → **shortcut**（第 5 列 x=1050 w=320 h=52）
  - canvas 总宽改 1400；PathGraph 加 `expandedRequirements` Set + toggleRequirement
  - 点 requirement → 同时 select + 展开 shortcut 子节点；点 shortcut → onShortcutSelect
  - GraphNodeButton 加 shortcut 视觉：Lightbulb 图标 + amber-50/70 弱填充 + line-clamp-2

- **B · 路径建议数据契约 + 静态库 seed** ✅ 2026-05-26
  - 复用 `requirement_advice.shortcut_oneliners` jsonb（13.5 已预留）—— 不新建表
  - `scripts/genRequirementShortcuts.ts`：15 用户可见 req × 2-3 shortcut = 45 entries
  - `supabase/migrations/0010_seed_requirement_shortcuts.sql`：15 UPDATE（一条覆盖 8 个 goal 行）
  - `supabase/migrations/0010_verify.sql`：4 段校验 SQL
  - `RecommendedPath` + `VisibleRequirement` 加 `shortcuts: AdviceShortcut[]` 字段

- **C · 兴趣 input（占位模式）** ✅ 2026-05-26
  - 不收集到 profile（按用户拍板）
  - `ShortcutDetail` 组件内置兴趣 textarea + "AI 推荐" 按钮 **disabled**，hover 提示「13.2 接真 LLM 后启用」
  - 真接入留 13.2（启发式生不出"不计 APF 任选兴趣"动态推理）

- **D · goalFit 标签** ✅ 2026-05-26
  - `ShortcutDetail` 内 8 个 goal chip 阵列（GOAL_CHIP_LABEL：GPA / 轻松 / 保研 / 留学 / 实习 / 时间 / 低压 / 自定）
  - 三色：emerald(best ✓) / slate(ok —) / rose(bad ✗)
  - 数据源：`shortcut.goalFit[goalMode]`，每条 shortcut 自带全 8 goal 适配 map
  - ImpactPanel 顶层在 selected 有 shortcut 时显示一个「N 条路径建议 · 点击查看」chip 提示

- **E · `RecommendedPath.shortcuts` 字段** ✅ 2026-05-26
  - `trackRecommendation.RecommendedPath` 加 `shortcuts?: AdviceShortcut[]`
  - `computeRecommendation` 启发式不动（13.5 已替代了原 E 的"函数体替换"）
  - Planner advice merge useMemo 把 `adviceByReqId.get(reqId).shortcut_oneliners` 注入 VisibleRequirement

##### 落地前提（已重新决策）

- ~~排队 13 + 13.2 必须先通~~ → **改：静态库 jsonb 填真数据**（用户 2026-05-26 拍板），UI 框架 + chip + 兴趣占位先跑，等 13.2 接真 LLM 后填动态 candidates

##### 不在 12.5 范围

- UI 视觉大改（留排队 14）
- track 选择器 / 多 track 跨校对比
- 兴趣持久化（用户拍板暂不进 profile）
- option seed 0007 补录（AI 接通后 track_option 表降级为兜底）

#### 排队 13.8 — TD-2 解析 pipeline + RAG（拆 A 个人文档 ✅ / B 手册 RAG ⏳）

✅ **前置已满足**：13.2 Phase 2 完整闭环（GLM-5.1 真 SSE + session 校验 + rate limit + 401/429 实测）

**2026-05-30 拍板收口**：只做文字版（图片课表暂不做，等视觉档）；成绩单只抽文字给 AI 读（不写 course 表）；A 先跑通再动 B。

##### A — 个人文档解析 → 塞 prompt ✅ 2026-05-30 闭环

- ✅ `pdfjs-dist` v5 依赖（client-side lazy）
- ✅ `src/lib/docExtract.ts`：`extractText(file)` 浏览器抽文字（PDF 逐页 getTextContent / 文本 file.text() / 图片→`UnsupportedDocError`）；worker 走 Vite `?url`
- ✅ `src/api/ragSourceApi.ts` 加 `downloadRagSource`（Storage→Blob）+ `updateParseResult`（写回 parsed_status/parsed_text/parse_error/parsed_at；**复用 0001 已建的列，无新 migration**）
- ✅ `src/hooks/useRagSources.ts` 加 `parseSource`（乐观 parsing→download→extract→写回，race-guard）+ `parsedDocs` 派生
- ✅ `src/pages/Upload/index.tsx`：每行解析按钮 + 状态徽章（带 parsing spinner）+ failed parse_error 显示 + 图片灰态「图片暂不支持」
- ✅ `src/lib/personalDocContext.ts`：`buildPersonalDocBlock`（预算截断 单文档 4k / 总 12k）+ `personalDocsForAdvisor`
- ✅ 注入：Dashboard 对话 handleAsk prepend system 块（主）+ `GradPathAdvisorInput.personalDocs` 字段 + prompts system 指令 + trackRecommendation 透传（次）
- ✅ `tsc --noEmit` 0 新错（仅 CardSwap + PathLoader 历史）；dev server 烟测 3 路由 200 无 transform 错

##### B — 手册 RAG / pgvector 向量化 ✅ 全闭环 2026-05-30（代码 + 624 块灌库 + verify 通过）

**目标**：两本公共手册 PDF（`public/docs/ecnu-2025-{guide,handbook}.pdf` 5.5M + 9.5M）→ 向量化入 rag_chunk → advisor 运行时 RAG 检索引用（个人文档走 A，不进 B）。

**决策（已定）**：embedding-3 `dimensions=1024`；段落感知 ~700 字窗口 + 120 重叠；top-K=5，min_similarity=0.3。

**已交付（代码 + 实测）**：
- ✅ `supabase/migrations/0012_add_handbook_rag.sql`：`create extension vector` + `rag_chunk(source_key, heading, chunk_index, content, embedding vector(1024))` + **authed 可读 RLS**（手册共享非 user-owned）+ `match_handbook_chunks` RPC（SECURITY DEFINER cosine `<=>`，grant anon/authed）+ `0012_verify.sql`（6 段）
- ✅ `scripts/genHandbookChunks.ts`：pdfjs legacy 抽文字（Windows worker 用 `pathToFileURL` 修 file:// 协议）→ 段落感知分块 → 批 embedding-3 → 产 `0012_seed_handbook_chunks.sql`（per-row INSERT ON CONFLICT 幂等）。**`--dry` 实测过**：guide 215 块 + handbook 409 块 = 624 块
- ✅ `src/routes/api/ai/chat.ts`：step 4.5 `retrieveHandbookContext`（embed query → `match_handbook_chunks` RPC top-K → prepend system；全 try/catch best-effort，失败/无命中/未灌库静默跳过）+ GET health 加 rag 字段
- ✅ `tsc --noEmit` 0 新错

**✅ 用户已跑通（2026-05-30）**：
1. ✅ Supabase 跑 `0012_add_handbook_rag.sql`（pgvector + rag_chunk + match RPC）
2. ✅ `npx tsx scripts/genHandbookChunks.ts` 真 embedding 产 seed（脚本自动读 .dev.vars 里 ZHIPU_API_KEY）
3. ✅ seed 7MB 超 Editor 上限 → `scripts/splitSeedSql.ts` 切 8 片（each ~875KB）逐片贴入；verify § 5 确认 guide 215 + handbook 409 = 624 块
- 之后 Home 对话自动带手册检索（前提 `VITE_AI_PROVIDER=remote` + server 有 key）
- 向量 seed 文件（`0012_seed_handbook_chunks*.sql`）已 gitignore，本地留作免费重灌备份

**踩坑记录**：① `0012_verify.sql` § 3 原写 `polname` → `pg_policies` 视图列名是 `policyname`（已修）；② pdfjs node worker 在 Windows 必须 `pathToFileURL` 转 file://（裸 `E:\` 被 ESM loader 拒）；③ seed 超 Editor 上限要切片。

**不在 B 范围**：个人文档（走 A）/ 课表图片（等视觉档）/ 公告 RSS（无数据源）/ 增量更新（手册变了整本重灌）

---

### 第三阶段 · UI 重设计 ✅ 已闭环（2026-05-28）

#### 排队 14 — 全局功能页前端视觉重设计 ✅ 2026-05-28 五批迭代全部完成

- ✅ **触发条件已满足**：排队 12 + 12.5 全闭环（画布 v5 + 路径建议层 + 反向勾选都跑通），数据层稳定，可启动 UI 重设计。
- 用户 2026-05-15 决定：「现在改 UI = 白做」—— 2026-05-26 解锁：track schema + 画布交互模型已锁，开始批量对齐视觉。
- 范围：`/dashboard` / `/ai-advisor` / `/schedule` / `/import` / `/course-planner` 五个功能页（落地页 + 路由 + 全局布局仍在「不要修改」清单）。
- 准备工作（可以提前做，不阻塞主线）：
  - 更新 `docs/DESIGN_SYSTEM.md` 风格指南（颜色 / 字体 / 间距 / 卡片 / 动效原则）—— 稳定层，schema 变也不失效。
  - 排队 8 完成（schema 锁了）后可以画 Figma 稿，但**不要动代码**。
- 完成标准：五个功能页对齐新视觉；保持 CLAUDE.md 的 "low saturation / Apple-like / clean academic"；mobile responsive。

##### 第一批 — 配色重置 + Dashboard 收敛 + PathLoader（2026-05-27, commit `b626a4b`）

- 全功能页换项目 palette（`flame / gold / maya / sapphire`）;大块底色降级为白底 + colored border。
- Dashboard 删 Section 1/3,加 GPT-style 提问入口（`sessionStorage` 跨页传草稿到 AIAdvisor）。
- Planner WorkbenchHeader 拆三段裸行 + GraphNodeButton tone 重做 + 新组件 PathLoader 替 Loader2。

##### 第二批 — 五页 layout 单屏化 + 去嵌套（2026-05-27 ~ 28, commit `6155a0e`）

- Planner / AIAdvisor 单屏化（`xl:h-[calc(100vh-5rem)]`）;右栏去嵌套;Planner 加双向跟踪滚动。
- Schedule 改两列「左树 + 右 PDF」,删 Trust 三列;Upload section 顺序重排;RequirementProgress 重写为折叠 + 内嵌滑块。
- 整体「不要框中套着框」铁律贯穿,所有 sub-block 改 `border-t / border-l-2` 细线分层。
- 配套 SQL 0011_clean_e3_title(待 Supabase Dashboard 跑)。

##### 第三批 — UI 微调（2026-05-28）

- Dashboard menu label「AI Feed」→「Home」;hover title/intro 去 "AI" 换 "系统"。
- Dashboard 布局:hero card row-span-2(`xl` 下左 1 大 + 右 2×2);对话框居中偏上;卡片加 hover 交互(translate / 高光条 / icon scale / arrow translate)。
- 首页 Feedback + Transparency chip 去 Tailwind emerald/amber/blue/violet,换项目 palette。
- 文案:submit 按钮 sapphire;helper 去 "Cmd/Ctrl+Enter" + 去句号;textarea placeholder 去 "例如:";决策状态 header 去 "N 项"。

##### 第四批 — UI 微调（续）2026-05-28 commit `9961fa8` + 本次

- **LogoFace 组件**（`src/components/effects/LogoFace.tsx`）：呼吸 + 变脸循环动画,挂到 Dashboard "你今天想问点什么?" 标题左侧;几何 1:1 对齐 PathLoader；useGSAP scope 自动清理 + prefers-reduced-motion；CSS `transform-box: fill-box` 修变脸时 transform-origin 缓存错位导致的闪烁。
- **品牌渐变 utility**：`src/styles/globals.css` 加 `.bg-brand-gradient`（135° linear,gold→maya→sapphire）+ `.scrollbar-thin`（8px / slate 半透明，Firefox + WebKit 双覆盖）。统一调用点：Dashboard 发送按钮 / Goal "听听你的想法" / Workspace toggle 激活态 / Workspace "推荐路径" chip / Workspace 画布 + 模拟器 aside scrollbar / AIAdvisor "当前启用逻辑"卡 / Upload 授权登录按钮。
- **课程码全替为华师大风格中文课名**：HIST 118 → 中国近现代史纲要 / MATH 233 → 大学英语 / CS 241 → 数据结构 / MUS 102 → 艺术导论 / CS 245 → 专业核心；"drop CS 241 模拟" → "模拟退掉数据结构后"。
- **Phase 标签清理**：Dashboard 下一步建议卡 meta 删 "Phase N · " 内部研发阶段前缀,只留主题。
- **Workspace 画布去 count badge**：root / milestone / bucket 三层数字 badge 全去（在"路径画布"语境下被读成"N 路径"）；改为 requirement 节点右下角 sapphire outline 圆显示 shortcuts 数；图例补一项 "N = 可展开的分支数"。
- **ImpactPanel 精简**：删"判断 [目标重算]"行 + "目标：N 学分。分类目标：未设定。"段落 + "有 N 条路径建议 · 在画布上点开此卡查看"提示。
- **Schedule (Rule Graph) 重构**：删用户"新建规则"全套（按钮 + 空态横幅 + 立即新建 + NewRuleForm 子组件 + per-row 删除按钮 + ruleFormOpen state + removeRule destructure）。学校官方规则是只读参考资料,不再让用户增删。
  - 左树头部"示例 · 培养方案 v2024" → `<select>` 切换 PDF;右栏占位 → `<iframe>` 嵌真 PDF。
  - PDF 临时方案：`docs/华师大规则文件pdf/*.pdf` 复制到 `public/docs/`（ecnu-2025-guide.pdf 5.5M + ecnu-2025-handbook.pdf 9.5M）,iframe 走浏览器原生 viewer。
  - **待办**（写入 memory `project_rulegraph_pdf_temp`）：未来 PDF 改从 Supabase Storage 拉 + Import 页加管理员上传入口（同校共享一份）+ 结构树节点点击跳 PDF 章节。
- **Import 页大改**：
  - **毕业要求完成情况语义翻转**：默认全部 **不打勾**（DB 表 user_requirement_done 内成员现在表示"已完成",hook 名 isReqIncomplete 不改源码,在组件内 alias 成 isReqDone）；hint 改简短"完成的要求自己打勾"；图标态翻转（未完成 slate-300 灰圈、已完成 maya 实心打勾）；待完成 chip 走 slate-100 而不是 flame 警示色。
  - **学分滑块**：step 0.5 → **1**（整数）；颜色 `accent-slate-950` → `accent-sapphire`；chevron 上的 "{N} 学分" 文字移到滑块展开区,折叠态只留 chevron icon（消除"N 学分"被误读成"N 路径"的可能）。
  - **个人设置**：删「显示名」字段 + name state + handleNameBlur（不让用户填真名）。
  - **教务系统连接器**：schoolOptions 加 **华东师范大学**（第 2 位最显眼）；授权登录按钮 `bg-slate-950` → `bg-brand-gradient`。
  - **文件导入**：desc "AI 自动解析" → "**系统**自动解析"；删右上"PDF · Excel · 图片"角标；3 张 file slot 卡 hover 三色（培养方案 gold / 成绩单 sapphire / 课表 maya）,默认 dashed slate-300 不变。
- **typecheck 0 新错**（CardSwap + PathLoader 历史 9 条不动）。

##### 第五批 — 撤回的尝试

- **"最轻松毕业" → "轻松毕业" rename**：用户提出后试过（前端 6 文件,profileApi / prompts / mock / trackRecommendation / AIAdvisor / Planner）,但 DB 那边波及 `profiles.goal_mode` CHECK + `requirement_advice.goal_mode` CHECK + `0007_seed_requirement_advice.sql` 几十条 INSERT + `0010_seed_requirement_shortcuts.sql` jsonb `goalFit` key 嵌套,用户认为改动面太大,**全部回滚**。0012 migration 文件被 Write 中断时部分写出,已 `rm`。

---

## 并行/穿插（不阻塞主线，但要做）

- 暂无（TD-1 / TD-2 已挪入主线 13.2 / 13.8）

---

## 当前阻塞

**C2b 真部署 ✅ 已闭环（2026-06-09，上线 https://meridian.betonme519.workers.dev）。**

当前外部阻塞：

1. **C2c** 绑自定义域名 `meridianedu.xyz` 🚧 —— workers.dev 国内被墙（TLS/SNI 阻断，实测 SSL alert 40），必须绑自有域名。卡在 **.xyz 实名审核**（阿里/腾讯，已提交待审）；通过后做 Add Site→改 NS→wrangler routes custom_domain。**约 2026-06-10 继续。** 详见上方 ⏳ 表 C2c 行。

> TD-10b ✅ 已闭环（2026-05-31 AI 派生静默权重）。TD-50 ❌ 做完即弃（用户认为便利贴价值不足，已回滚）。

> **历史主线顺序**：13 mock ✅ → 13.5 静态路径库 ✅ → 12.5 workspace 二次重构 ✅ → 14 UI 重设计 ✅ → 13.2 真 LLM ✅ → 13.8-A 个人文档解析 ✅ → 13.8-B 手册 RAG ✅（624 块灌库 2026-05-30）

## 已采纳决策（2026-05-25 静态路径库相关）

- **架构转向**：dynamic AI runtime → static library + 后期 AI 连接（不再每次让 AI 生成 reason，预编译查表）
- **粒度**：(goal × req) 1584 → 实际 35 reqs × 8 goal = 280 行（中间方案：15 可见 + 20 关键规则）
- **存储**：Supabase migration 0007 / 0008，可 join 可查询
- **生成方式**：TS 生成器 → 输出 SQL，两份都进 git
- **link 表新增**：5 档 kind 关系（substitute/prerequisite/excludes/cross_ref/triggers），独立表可查询
- **link 数量**：40 真实关系（不注水）vs 计划 60-100，使用后再增量加

### ⏳ 已采纳决策（不再追问，留备份）

- C3 强基计划独立办法在新 PDF 未收录 → 接受 4 条散见现状
- E2 公共必修「约 40 学分」→ AI 顾问直接引用指南，不强制求和
- 师范学院 track 颗粒度 = 单一 `college='师范学院'`，不按具体师范专业拆

> 阶段 3 详细分布 / kind 统计已挪到 `AI_MEMORY.md § 9` + commit `3cae3f4` / `2fba113`。

---

## 不要修改

- 全局 `src/components/layout/`（Navbar / Footer / DashboardLayout / UserMenu）
- 落地页 `src/pages/Landing/*`（原 `Home/`，2026-05-29 改名，避免跟菜单第一项 label 「Home」 撞名）
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

> 详细技术债见 `TECH_DEBT.md`；项目时间线（5-15 ~ 5-25 各排队 N 详细 / 5-17 基础设施大波次 / 5-16 数据源切 PDF / 5-15 digest 录入 等）见 `AI_MEMORY.md § 9`（L210+）+ git log。

- **2026-06-09** — C2b 真部署上线 Cloudflare Worker（`wrangler.jsonc` name 改 `meridian` 待 commit）
  - `npm run build`（✓ 3.71s）→ `wrangler deploy` 创建 Worker；`wrangler secret put` 注入 4 密钥（ZHIPU_API_KEY/GLM_MODEL/SUPABASE_URL/SUPABASE_ANON_KEY，源自 `.dev.vars`，一次性永久）；注册 workers.dev 子域 `betonme519`
  - 上线 **https://meridian.betonme519.workers.dev**（CF 账号 betonme519@gmail.com / account `3b61235a162cae8e508e1d23826a3eca`）
  - **发现卡点 C2c**：workers.dev 国内被 GFW TLS/SNI 阻断（实测同机 developers.cloudflare.com ✅ vs *.workers.dev SSL alert 40），WiFi/流量都打不开 → 必须绑自有域名
  - 已买 `meridianedu.xyz`（阿里/腾讯），卡在 .xyz 实名审核；通过后 Add Site→改 NS→wrangler routes 绑定。安装了 Cloudflare 官方 Claude Code 插件（skills + 7 MCP）。详见 memory `project_deploy_cloudflare_live`

- **2026-05-30** — 排队 13.8-B 手册 RAG 全闭环（commit `8c72623` + `02e6167`）
  - `0012_add_handbook_rag.sql`：pgvector + rag_chunk（authed 可读 RLS，非 user-owned）+ match_handbook_chunks RPC（SECURITY DEFINER cosine）+ 0012_verify（修 `polname`→`policyname`）
  - `scripts/genHandbookChunks.ts`：pdfjs legacy 抽字（pathToFileURL 修 Windows worker）+ 段落感知分块 + 批 embedding-3（自动读 .dev.vars key）→ seed SQL；实测 guide 215 + handbook 409 = 624 块
  - `chat.ts` step 4.5 retrieveHandbookContext（embed query → match RPC top-K → prepend system，best-effort 失败静默）
  - **用户跑通**：0012 migration + 真 embedding；seed 7MB 超 Editor → `splitSeedSql.ts` 切 8 片逐贴；verify §5 确认 624 块灌库。向量 seed gitignore

- **2026-05-30** — 排队 13.8-A 个人文档解析 → 塞 prompt（commit `106f530`）
  - `pdfjs-dist` v5 + `src/lib/docExtract.ts` 浏览器抽文字（PDF/文本，图片抛 UnsupportedDocError）；worker 走 Vite `?url`
  - `ragSourceApi` 加 downloadRagSource + updateParseResult（复用 0001 已建 parsed_text 等列，**零 migration**）；`useRagSources` 加 parseSource（乐观 race-guard）+ parsedDocs
  - Upload 页每行解析按钮 + 状态徽章（parsing spinner）+ failed parse_error + 图片灰态
  - `personalDocContext.ts`（预算截断 4k/12k）；Dashboard 对话 prepend system 块喂 GLM-5.1（主）+ GradPathAdvisorInput.personalDocs + prompts 指令 + trackRecommendation 透传（次）
  - `tsc --noEmit` 0 新错（仅 CardSwap + PathLoader 历史）；dev server 烟测 / /dashboard /import 均 200

- **2026-05-29** — 后端骨架 Phase 1 + 文档安全锚点 + CURRENT_TASK 瘦身（本 session，尚未 commit）
  - 新增 `docs/backend_migration_plan.md`（安全审计 + 6 阶段后端迁移路线）+ `src/routes/api/ai/chat.ts` mock SSE stub（GET 健康检查 / POST 返 10 token + `[DONE]`）
  - CLAUDE.md §9 / PROJECT_OVERVIEW.md 安全边界 / ARCHITECTURE.md §9 三处加前端安全铁律（NEVER 列表 + RLS + server-route 边界）
  - 归档 `_archive/ARCHITECTURE_AUDIT.md` + `_archive/20260427AI选课顾问_项目立项说明.md`，9 处反向引用同步路径
  - 本文件加 §状态总览（一屏全任务 ✅/⏳/❌）+ 排队 10/12 trim + 最近完成节砍到 5 条合规

- **2026-05-28** — 排队 14 第四批 + 第五批撤回（commit `341e651` + `9961fa8`）
  - LogoFace 呼吸/变脸（`transform-box: fill-box` 修闪烁）+ `.bg-brand-gradient` / `.scrollbar-thin` 单源 utility
  - Schedule 删用户"新建规则"全套 + iframe 嵌 PDF（public/docs 临时静态）；Import 默认全不打勾（语义翻转，user_requirement_done 表"已完成"）；课程码全替为华师大风格中文名
  - **撤回**："最轻松毕业" → "轻松毕业" rename（DB 2 表 CHECK + jsonb 嵌套改动面太大）

> 更早条目（排队 14 第一批 / 排队 12.5 子任务 A-E / 排队 12.5 sub-0 反向勾选 / 排队 13 mock advisor / 排队 13.5 静态路径库 / 排队 12 v5 workspace / 排队 11 / 排队 10 / 5-17 基础设施大波次 / 5-16 数据源切 PDF + TD-25 / 5-15 digest 录入）已全部由 `AI_MEMORY.md § 9` + git log 覆盖，本节不再保留。
