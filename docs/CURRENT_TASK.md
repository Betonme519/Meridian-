# Current Task — Meridian sprint

> 短期工作内存。**AI 接手优先读这份**，再按需查 `AI_MEMORY.md` / `TECH_DEBT.md`。
> 铁律：只做下方「排队」里的事，做完停下汇报。「不要修改」当只读。

> Last updated: **2026-05-26**

---

## 目标

**已闭环**：排队 5/6/7/8/9 + 10 全部 + 11 + 12 + 13 mock + **13.5 静态路径库** + **12.5 全部子任务 0-E**。详见下方「最近完成」+ AI_MEMORY § 9 + 各 commit。
**当前推进**：无主线在跑。下一条等用户挑：13.2（真 LLM provider）/ 13.8（解析 pipeline + RAG）/ 14（UI 重设计）。
**最近 commit**：`3e2f832` 反向勾选式进度收集器（2026-05-25）；待提交：12.5 A-E shortcut 层 + goalFit chip + 兴趣 input 占位（2026-05-26）。
**架构转向（2026-05-25）**：用户拍板"静态路径库 + AI 连接"。改原 AI runtime 生成 reason 为 Claude 预编译 (goal × req) → 280 advice + 40 link 关系，DB 查询替代 runtime AI 调用。
**UI 重设计（排队 14）**：等排队 12 跑通后启动。

用户 2026-05-14 历史决策（已生效，留作背景）：

1. **先收尾跟毕业路径无关或基本无关的后端**（已完成）—— typed client（TD-3）/ chat_message 接入 / rule + rule_conflict 接入。
2. **再做毕业路径主线** —— 三问同根（画布主线分支 / AI 锁既定逻辑 / 何时灌学校数据），都卡在结构化 schema 不存在。

**TD-1（真 LLM provider）用户主动后放**。骨架已升级 provider-agnostic（DeepSeek/Qwen/Zhipu/Anthropic 任一家可接），等用户拍板上游再写 server route。
**TD-2（解析 pipeline）依赖 TD-1**，也后放。

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

#### 排队 10 — 学校种子数据 seed SQL（华师大 2023 级）

**进度**：
- ✅ 阶段 1（4 份 digest A/B/C/D 录入） → commit `ef06fe2`
- ✅ 阶段 2（数据源切 PDF + digest v2 重写为 5 份 A/B/C/D/E）→ commit `cd6c7f4` + `63252e5`
- ✅ 阶段 3（0005_seed_ecnu_2023.sql 198 条 track_requirement 落库，用户 Supabase Dashboard 跑通）→ commit `3cae3f4` + `2fba113`
- ✅ 阶段 4（`docs/ecnu_process_rules.md` 323 行 / 9 章，过程类规则精炼版喂排队 13 的 `gradPathAdvisorPrompt`）→ 2026-05-17

**数据源文件清单**（CLAUDE.md 第 8 条禁扫名单，仅本任务 / 排队 13 读）：

| 路径 | 用途 |
|---|---|
| `docs/华师大规则文件pdf/*.md` + `*.toc.txt` | **source of truth**（codex 敏感词清洗版本科生手册 + 学习指南 + PDF 目录抽取），AI 读这里；PDF 原件在 .gitignore，仅本地 |
| `docs/_archive/华师大公示文件_old_md/` | 旧 23 份 md（已归档，digest v1 来源，**保留可回滚但不再 Grep**）|
| `docs/ecnu-digests/ecnu_rules_digest_{A,B,C,D,E}.md` | **5 份 digest v2**，~227 条 track_requirement 候选 + 6 项设计决策（A 末尾段）|
| `docs/ecnu-digests/_archive/` | 旧 4 份 digest（v1，已归档，**仅作历史对照**）|
| `docs/track_kind_taxonomy.md` | D-track-8 归并方案（98 自由 kind → 8 canonical kind，+ 4 现有 = 12 档）+ metadata 形态 |
| `docs/ecnu_process_rules.md` | 过程类规则精炼版（~500 行内），阶段 4 生成，喂排队 13 的 `gradPathAdvisorPrompt`（尚未写）|

---

- 手动 SQL `0005_seed_ecnu_2023.sql` —— 把培养方案录成 ~50-200 行 insert（首条 track 用 `scope_level='school'` 全校通用）。
- **不做 RAG，不做爬虫**。

**2026-05-16 数据源升级**：旧 34 份 md (`docs/华师大公示文件/`) → 新 2 份 PDF (`docs/华师大规则文件pdf/`)。**PDF 是 source of truth**，md 仅历史佐证。旧 md 处置：99 条录完 0005 后一次性 `git mv` 到 `docs/_archive/华师大公示文件_old_md/`，**禁止现在 rm**（digest 的 `source_ref` 还指着旧文件名 § 章节）。两份 PDF：
- `华东师范大学2025年本科生手册.pdf`（64 篇规章原文，对应旧 md）
- `华东师范大学2025年本科生学习指南.pdf`（FAQ + 培养方案 + 学分构成核心数据 + 师范生 + 微专业 + 卓越学院）

**前置子任务（2026-05-15 拍板，分 4 批读 + 双层记录 + schema 加 source_ref）**：

1. **分批读 + 逐批校验** — 34 个 md 分 4 批，每批读完先出 digest 让用户拍板，再进下一批：
   - 批 A · 毕业资格核心（5 个）：学籍管理 / 毕业资格审核 / 学士学位授予 / 成绩及学分认定 / 课程考核
   - 批 B · 学业规则类（6 个）：选课退课 / 成绩管理 / 学业预警 / 考勤 / 体质健康 / 学分制收费
   - 批 C · 特殊计划/加分（7 个）：辅修 / 双学位 / 强基计划 / 个性化培养 / 转专业 / 创新创业学分 / 学科竞赛
   - 批 D · 过程类（5 个）：注册 / 休学复学 / 实习 / 毕业论文 / 创新训练
   - 跳过：研究生免试 / 师范生教育教学考核 / 第二学士学位 / 少数民族预科 / 境外联合培养 / 学籍学历电子注册 / 学生证 / 学分制收费(老版) / 本科论文抽检
2. **两层记录**：
   - 人读层 `docs/ecnu-digests/ecnu_rules_digest_{A,B,C,D}.md` —— 每条规则 4 字段：规则中文 / 原文片段 / 来源(文件名 §章节) / 落地(入 track_requirement / 入 prompt / 不入)
   - 机读层 `supabase/migrations/0005_seed_ecnu_2023.sql` —— 可结构化的入 track_requirement / track_option，每行 INSERT 带 `-- source:` 注释
3. **schema 加 source_ref（在 seed 之前）** — 新建 `supabase/migrations/0004_add_source_ref.sql`：
   - `track_requirement.source_ref text` 可空
   - `track_option.source_ref text` 可空
   - 自由字符串，存 "文件名 §章节"；AI 输出时引；UI hover 显示
4. **过程类规则** — 单出 `docs/ecnu_process_rules.md` 精炼版（~500 行内）：选课退课流程、转专业流程、考勤等不入 track_* 但 AI 顾问要知道的内容。排队 13 写 `gradPathAdvisorPrompt` 时一起喂。

**触发顺序**：用户说「开始批 A」→ 读 5 个 md → 写 digest A → 停 → 用户拍板 → 同样跑 B/C/D → 4 个 digest 都过 → 写 0004 + 0005 + ecnu_process_rules.md → 排队 13 接 AI prompt + UI 展示 citations。

**只做本科生内容**，硕士/博士相关全跳。

#### 排队 11 — `course` 表接 API + UI 入口 ✅ 2026-05-17

- ✅ `src/api/courseApi.ts`（typed 派生 + COURSE_STATUSES / COURSE_CATEGORIES 与 DB CHECK 同源 + listCourses 按 semester desc nulls last + create/update/delete + errorBus）
- ✅ `src/hooks/useCourses.ts`（三件套 race 守卫 + 派生 view：coursesBySemester / coursesByStatus / **courseCodeMap** + **completedCodes** Set；后两者排队 12 画布命中判定直用）
- ✅ UI 入口：Profile 页已删 → 落 Upload 页新增 Section「我已修的课」`src/pages/Upload/CourseManager.tsx`（添加表单 + 列表 + 删除，复用 Section 6 视觉），主页 import 一行接入
- 画布要读这个判断"哪些 option 已完成"，排队 12 前置 ✅ 解锁

#### 排队 12 — 画布改造（思维导图体验）✅ 2026-05-17 v4 / ✅ 2026-05-20 v5 重写（**捷径策略卡 + FocusMode 双视图 + ImpactPanel**）

> ⚠️ **v1-v4 思路已废弃**（2026-05-25 用户拍板"我就是要现在这版，不要以前那版了"）。下面 v1-v4 描述仅作历史记录，**禁止作为"可参考备选方案"**。当前活跃实现 = v5 + post-v5 拆件重构（commit `974c21b` + `6f8b241`），下一步目标 = **排队 12.5「workspace 二次重构」**（见下方）。

**v1 CSS 卡片 → v2 A/B/C/D/E 段 → v3 学生友好分类 → v4 预计算推荐路径 → v5 捷径策略卡 + 双视图**：用户五次反馈。v5（commit `974c21b`）抛 React Flow，自绘 SVG + 绝对定位 DIV；requirement 卡从"课名"切到"可执行策略短句"；加 FocusMode `全部路径 / 只看推荐` toggle；右侧 `ImpactPanel`（选择模拟器）take/delay/switch 三动作 + before/after delta。

- ✅ `src/api/trackApi.ts` + `src/api/userProgressApi.ts`（5 表 read-only + user_progress upsert/delete）
- ✅ `src/hooks/useTrack.ts`（硬编码取首个 track + 并发拉 cat/req/opt + 派生 view）
- ✅ `src/hooks/useUserProgress.ts`（三件套 + 乐观 upsert/remove + doneOptionIds/progressByOptionId）
- ✅ `src/lib/trackSimulation.ts`（pickRecommendedOption 启发式占位 + simulatePick 三 delta + calcRequirementProgress / calcCategoryCredits）
- ✅ **新增 `src/lib/trackUserView.ts`**：`classifyCategory(code, title)` 启发式按 title 关键词分类（管理规则全 hide / 公必/通识/专必/专选/任选 / 二课/论文）；`isUserVisibleRequirement(req)` 仅留 4 档 course-kind requirement，rule-kind 全过滤
- ✅ Planner 页 **v3 全文重写为 6 类节点 / 4-5 层** ：root → 3 user-milestone（上课/二课/论文）→ (上课下) 5 bucket → category → requirement → option。新增 `meridian-bucket` 节点类型。点击逐层 toggle 展开/折叠（layered X：0/260/540/820/1100/1400），点 option → Drawer 弹三动作。MiniMap + Controls + dot background
- ✅ **隐藏：退课/休学/学籍/警示/收费/学位授予/转专业/强基/辅修 等管理规则**（用户视野完全不可见，AI 后台仍可 SELECT 这些 row 做约束计算）
- ✅ 头卡文案改"毕业路径"/"点击节点逐层展开 · 上课 → 类别 → 选项"，删 A/B/C/D/E 段相关字眼
- ✅ useTrack 改默认取 **`scope_level='school'` 全校通用 track**（避开师范学院专属，用户拍板"用普通学生做"）
- ✅ 删 `seedGraph.ts` + `usePlans.ts`；planApi.ts 保留供未来 TD-50
- ✅ menu.ts Workspace 文案更新
- ✅ **v4 新增 `src/lib/trackRecommendation.ts`**：`computeRecommendation({...goalMode})` 返 `{paths, pathNodeIds, pathEdgeIds, badges}` —— 每个 milestone 选 1 条主推荐路径（按 goal_mode 重排 bucket 优先级；保研/高 GPA → 专必/通识 优先；留学 → 公必/英语优先；实习 → 专必/专选优先；最轻松毕业/时间自由 → 必修先扫清）；每层 unmet count 用于节点数字徽章
- ✅ **v4 Planner 接 useProfile + recommendation**：节点 data 加 `badgeCount` + `onPath`；推荐路径上的节点 `border-amber-400 bg-amber-50/60`，边 `stroke: rgb(245 158 11)`（amber-500）；节点右上角加 `<Badge>` 数字徽章（App 通知 style，>99 → "99+"）；root 节点加 "AI 已规划 N 条主路径" chip
- ✅ **v5 重写（commit `974c21b`）**：抛 React Flow → 自绘 SVG path + 绝对定位 DIV 卡（`buildGraph`/`edgePath`/`GraphNodeButton`），三层结构 root → milestone(3) → bucket → requirement（option 层暂未渲染，等 0007 seed）；展开状态用 `expandedMilestones` / `expandedBuckets` 两个 Set 维护
- ✅ **v5 `strategyForItem()`**：requirement 卡 title 从"课名"切到"可执行策略短句"，按 bucket + keyword 分支 ——「把体育与体测放进低冲突学期」/「用通过成本低的公共课先清掉硬性缺口」/「公共必修按低负担组合完成」/「先锁定会卡后续学期的专业必修」等 9 档；meta 行带"已有可执行候选 / 待补充具体候选"提示
- ✅ **v5 `FocusMode` toggle**：头卡右上 `全部路径 / 只看推荐` 圆角药丸切换；"只看推荐" 过滤到 `isOnPath`；"全部路径" 全规则图显示，非推荐边走 slate dashed `5 7`（仍可见但弱化）
- ✅ **v5 `GOAL_COPY`**：8 种 `goal_mode` 各一句目标说明（高 GPA / 最轻松毕业 / 保研 / 留学 / 实习优先 / 时间自由 / 低压力 / 个性化），在头卡 goal pill 下方一行小字解释当前高亮逻辑
- ✅ **v5 `ImpactPanel` 选择模拟器**：右侧栏选中 requirement 后显示 strategy.title/meta + `take/delay/switch` 三 action 圆角分段；before/after credits delta + category delta + target 对比；接 `simulatePick`
- ✅ **v5 头卡指标 chip**：推荐 N 条 / 可见节点 N / 待处理 N + 学分进度条（earned / target）
- ✅ **v5 Playwright 验证**：4 份 `.playwright-mcp/page-2026-05-20T*.yml` snapshot 入 commit，开发期浏览器实测
- **数据空洞**：30 category + 198 requirement ✅，**0 track_option** ⚠️（0005 没录课程清单）→ 点 requirement 节点目前无 option 子节点。补 0007 option seed 留排队 14 前置
- 推迟（v5 后明确）：
  - **捷径变体下钻**：requirement 卡再点开一层"多条并列具体策略"（"公必塞已有课的那天" / "公必不计 APF 任选课" / "体育放在轻量学期" 等并列变体），目前 requirement 是叶子节点
  - **捷径 × 目标适配标签**：单卡显式标"此捷径对 实习优先 最优 / 对 保研 一般"，目前只有整路径按当前 goal 高亮，没在单卡上写匹配度
  - 上两条 + 兴趣维度全部并入 **排队 12.5**（2026-05-25 用户重新思考核心呈现方式后）
  - plan 表语义切换 → TD-50；track 选择器；option seed 补录；展开状态持久化

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

#### 排队 13.2 — TD-1 接真 LLM provider（推迟，13.5 后看是否还需要）

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

#### 排队 13.8 — TD-2 解析 pipeline + RAG 公告（12.5 后接）

- 依赖 TD-1（真 LLM）已落地
- 非结构化数据（公告 / 手册细节）入口，挂到 requirement 上做 RAG 增强
- 跟「公告 RAG」一起做

---

### 第三阶段 · UI 重设计（在主线全部跑通后）

#### 排队 14 — 全局功能页前端视觉重设计

- **触发条件：排队 12 完成（画布改造跑通、数据层稳定）后才启动**。在此之前不动功能页 UI。
- 用户 2026-05-15 决定：「现在改 UI = 白做」，等 track schema + 画布交互模型确定再批量对齐视觉。
- 范围：`/dashboard` / `/ai-advisor` / `/schedule` / `/import` / `/course-planner` 五个功能页（落地页 + 路由 + 全局布局仍在「不要修改」清单）。
- 准备工作（可以提前做，不阻塞主线）：
  - 更新 `docs/DESIGN_SYSTEM.md` 风格指南（颜色 / 字体 / 间距 / 卡片 / 动效原则）—— 稳定层，schema 变也不失效。
  - 排队 8 完成（schema 锁了）后可以画 Figma 稿，但**不要动代码**。
- 完成标准：五个功能页对齐新视觉；保持 CLAUDE.md 的 "low saturation / Apple-like / clean academic"；mobile responsive。

---

## 并行/穿插（不阻塞主线，但要做）

- 暂无（TD-1 / TD-2 已挪入主线 13.2 / 13.8）

---

## 当前阻塞

**无。等用户拍板下一波方向。** 候选：

1. **排队 12.5** workspace 二次重构（shortcut 层 + 兴趣维度）—— 现在 link 表已就位，shortcut_oneliners jsonb 字段已预留，可在 12.5 启用
2. **排队 13.2** TD-1 真 LLM provider —— 推迟评估：静态库可能 90% 够用，真 LLM 只解决"用户课表 × 兴趣 → 具体课程 chip"runtime 变量
3. **排队 14** 全局功能页 UI 重设计 —— 12 + 13 都跑通了，可以启动
4. **TD-10** target_gpa / goal_weights UI（需用户拍板：放 Upload 设置区还是新建 Settings 页）
5. **TD-50** plan 表语义切换（"自由备注画布"模式，决定 plan.nodes 新 shape）

> **新主线顺序（2026-05-25 二次调整后）**：13 mock ✅ → 13.5 静态路径库 ✅ → 12.5 workspace 二次重构（shortcut 层用 link 数据填）/ 13.2 真 provider（推迟）/ 14 UI 重设计 三选一

## 已采纳决策（2026-05-25 静态路径库相关）

- **架构转向**：dynamic AI runtime → static library + 后期 AI 连接（不再每次让 AI 生成 reason，预编译查表）
- **粒度**：(goal × req) 1584 → 实际 35 reqs × 8 goal = 280 行（中间方案：15 可见 + 20 关键规则）
- **存储**：Supabase migration 0007 / 0008，可 join 可查询
- **生成方式**：TS 生成器 → 输出 SQL，两份都进 git
- **link 表新增**：5 档 kind 关系（substitute/prerequisite/excludes/cross_ref/triggers），独立表可查询
- **link 数量**：40 真实关系（不注水）vs 计划 60-100，使用后再增量加

### ⏳ 已采纳决策（不再追问，留备份）

### ⏳ 已采纳决策（不再追问，留备份）

- C3 强基计划独立办法在新 PDF 未收录 → 接受 4 条散见现状
- E2 公共必修「约 40 学分」→ AI 顾问直接引用指南，不强制求和
- 师范学院 track 颗粒度 = 单一 `college='师范学院'`，不按具体师范专业拆

> 阶段 3 详细分布 / kind 统计已挪到 `AI_MEMORY.md § 9` + commit `3cae3f4` / `2fba113`。

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
> 早于 2026-05-14 的里程碑（排队 5 / 2 / 4b / 4a / profiles / DATA_MODEL）已挪到 `docs/AI_MEMORY.md` § 9。

- **2026-05-26** — 排队 12.5 子任务 A-E ✅ shortcut 第 4 层 + goalFit chip + 兴趣 input 占位
  - **数据**：`scripts/genRequirementShortcuts.ts` 15 用户可见 req × 2-3 shortcut = 45 entries；每条 shortcut 自带全 8 goal 适配 map（与 goal_mode 解耦：同一 req 的 shortcut 池对 8 goal 都展示，各 shortcut 内嵌 goalFit）
  - **SQL**：0010_seed_requirement_shortcuts.sql 15 UPDATE（一条覆盖 8 行 goal × req，WHERE 仅 requirement_id）+ 0010_verify.sql 4 段校验
  - **架构选择**：复用 13.5 已建的 advice.shortcut_oneliners jsonb 字段（不新建表）；不接 mock provider（用户路径走 13.5 DB 库）
  - **类型**：`RecommendedPath.shortcuts?: AdviceShortcut[]` + `VisibleRequirement.shortcuts: AdviceShortcut[]`
  - **画布**：canvas 1080 → 1400；buildGraph 加 shortcut 列（x=1050 w=320 h=52）；PathGraph 加 expandedRequirements + toggleRequirement；点 requirement 同时 select + 展开 shortcut；shortcut 视觉 amber-50/70 + Lightbulb
  - **ImpactPanel**：selected 有 shortcut 时显示「N 条路径建议」chip；shortcut 选中切换到 ShortcutDetail：标题 oneLiner + 8 goal chip（GPA / 轻松 / 保研 / 留学 / 实习 / 时间 / 低压 / 自定，emerald/slate/rose 三色）+ 兴趣 textarea disabled + 「AI 推荐」按钮 disabled（hover 提示 13.2 启用）+ 「返回 requirement 视图」链接
  - **待跑**：用户 Supabase Dashboard 跑 0010 seed + verify
  - **下一条**：13.2 / 13.8 / 14 三选一

- **2026-05-25** — 排队 12.5 sub-task 0 ✅ 反向勾选式进度收集器（用户洞察 + 同日落地）
  - **设计动机**：学校 ingest 不现实（无 API / 无爬虫），让学生填"还差几学分"颗粒度太细。**反向打勾**：默认全 requirement 视为已完成，取消勾选 = 还没做 → 写一行入表。心智从"我做了什么"翻转到"我还差什么"。高年级 95% 已完成只需取消 1-2 条；新生全部取消一次性勾几下。
  - **0009 migration**：`user_requirement_done` (id / user_id / requirement_id / note / created_at / updated_at)；unique (user_id, requirement_id)；FK on delete cascade；RLS owner-only ALL；trg_urd_updated_at
  - **API 设计**：四个函数 listIncomplete / markIncomplete / unmarkIncomplete / **batchSetIncomplete**（保存按钮用：算 diff 只发 add/remove 而非全删重建，保留旧 note）
  - **hook**：乐观更新（mark 立即插假行，DB 回填用真 created_at 替换）+ toggle 一句话切换 + 三件套 race 守卫
  - **UI Section 8**：按 category 分组 2-col grid + emerald ✓ / rose ○ 圆圈 toggle + 头部双 pill（已完成 N/M + 待完成 N，>0 时显示）+ 访客只读 + Loading/Empty state
  - **Planner 集成**：isUnmet 改为 `incompleteReqIds.has(id)` 单一真相（option seed 永远没有，calcRequirementProgress 推导不再有效）；amber 提示语改 slate 引导文案"去 Upload Section 8 反向勾选"
  - **tsc 0 新错**；用户 Supabase Dashboard 跑通 0009 + verify

- **2026-05-25** — 排队 13.5 ✅ 静态路径库 + 代码层全栈落地（同日提案 + 同日完成）
  - **架构转向（用户反思 13 mock）**：AI runtime 生成 reason 视觉无差异、不稳定、要钱 → Claude 现在预编译所有 (goal × req) → 文案静态库，运行时只查表。link 表 5 档关系（substitute/prerequisite/excludes/cross_ref/triggers）独立存 req↔req 关系，AI 后期只用不挖
  - **0007 / 0008 DDL**：requirement_advice (goal_mode × requirement_id) 唯一 + shortcut_oneliners jsonb 占位（12.5 用）+ priority 0-100 排序键；requirement_link (from, to, kind) 唯一 + 自环 CHECK + 5 档 kind
  - **0007 / 0008 seed**：280 advice INSERT（35 reqs × 8 goal，全部 ON CONFLICT DO UPDATE 幂等）+ 40 link INSERT；都用 PL/pgSQL DO 块 + code lookup（避免硬编码 UUID）+ RAISE NOTICE 报 inserted/skipped 计数
  - **scripts/genRequirementAdvice.ts 660 行**：ADVICE_MATRIX 8×35 嵌套 record + LINKS array + sqlEscape / buildAdviceSql / buildLinkSql 三段；运行 `npx tsx scripts/genRequirementAdvice.ts` → 2 文件覆盖（跑 0.4s）
  - **35 reqs 范围**：15 用户可见（E1-3 + E2-1~8 + E3-1~4 + E4-4/5）+ 20 关键规则（A1-10/12, A2-1, A3-2/3, A4-2 / B3-1/4, B4-4, B5-9 / C1-9, C2-6, C3-3, C5-2, C6-1, C9-1/3 / D3-6, D4-11/12）
  - **40 link 关系（真实存在不注水）**：substitute 1 / cross_ref 14 / prerequisite 12 / excludes 2 / triggers 11
  - **同时修 UI bug**：EvidencePanel「AI 理由」从右栏下方提到 ImpactPanel 顶部紫色高亮框 + Sparkles 图标，用户点击节点必看到
  - **用户跑通 6 份 SQL**（4 DDL + verify + 2 seed）落库 280 advice + 40 link
  - **代码层落地**：requirementAdviceApi.ts（两次 IN UNION 避索引退化）+ useRequirementAdvice hook（cacheKey race 守卫 + 派生四 view）+ db.ts 手补两表类型块 + Planner 删 fetchAdvisorRecommendation 改 hook 合并骨架 + EvidencePanel 加 RelatedRulesBlock 5 色 pill 显示 link
  - **tsc 0 新错**（仅 CardSwap 历史遗留）；mock AI 矩阵代码保留作 fallback 不删
  - **解锁**：12.5 shortcut 层（shortcut_oneliners jsonb 已预留）/ 13.2 推迟（先看够不够）

- **2026-05-25** — 排队 13 ✅ AI mock advisor 落地（模板化 rationale，未接真 LLM）
  - **schema** `src/ai/schema.ts` 加 4 个 zod：`PathSuggestionSchema`（含 `shortcuts[]` 12.5 占位强制 [])` / `OptionRankingSchema` / `RequirementGapSchema` / `GradPathAdvisorResponseSchema`。`AdvisorMilestoneSchema` 三档 enum 与 `trackUserView.UserMilestoneCode` 对齐（不 import 防循环）
  - **prompt** `src/ai/prompts.ts` 加 `gradPathAdvisorPrompt(input)` + 导出 `GRAD_PATH_ADVISOR_MARKER`。system prompt 硬编码"你只能基于下面 user 消息里的 JSON 数据回答"+ 不知道写"需查阅手册"+ 输出单行 JSON 不要 markdown 围栏。input shape：`{goalMode, categories[], requirements[], completedCodes[], skeleton[]}`，requirements 用精简 shape（id/category_id/code/title/kind/threshold/source_ref）避免把整 DB 行（含 metadata jsonb）喂 LLM
  - **mock** `src/ai/providers/mock.ts` 识别 marker → 解析 user JSON → 8 goal × 5 bucket = 40 句 `ADVISOR_BUCKET_RATIONALE` + 8 × 2 milestone = 16 句 `ADVISOR_MILESTONE_RATIONALE` + 8 句 fallback → JSON 一次性输出（不按字符流，advisor 不需要打字感）。解析失败兜底返 `{paths:[],rankings:[],gaps:[]}`
  - **trackRecommendation** `src/lib/trackRecommendation.ts` 加 `fetchAdvisorRecommendation(args, signal?)` async 版：流程 = 启发式 `computeRecommendation` 产骨架 → 组装 `GradPathAdvisorInput` → `chat({messages: gradPathAdvisorPrompt(input), signal}) + collect` → `JSON.parse + GradPathAdvisorResponseSchema.safeParse` → 按 requirementId 索引 AI paths 覆盖骨架 reason。失败 / abort / parse 错全部回退骨架不闪屏
  - **Planner** `src/pages/Planner/index.tsx`：useMemo `recommendation` 拆为 `baselineRecommendation` (useMemo 启发式即刻产首帧) + `useState recommendation` + 两个 useEffect。第一个 effect 输入变回落启发式（避免显过期 AI reason）；第二个 effect 调 fetchAdvisorRecommendation，AbortController 在 cleanup 触发组件卸载 abort。useEffect deps 含 `completedCodes` （Set 引用稳定靠 useCourses 已实现）
  - **选项决策（2026-05-25 用户 A/A/A/C/A）**：全量 JSON 塞（mock 不收钱，13.2 切片）/ shortcuts[] 预留（12.5 无返工）/ goal×bucket 矩阵硬编码 40 句（不复用 strategyForItem 因 12.5 要删它）/ process_rules 留 13.8 RAG（13 只验证 track_requirement 这条路）/ 替换 trackRecommendation 函数体（画布自动跑，AIAdvisor 留 chat 流）
  - **数据流验证**：mock 收到 marker → 解 user JSON → skeleton 每条按 (milestone, bucket, goalMode) 查表 → 拼新 reason → JSON 一次性 yield。Planner 首帧 = 启发式 reason；~50ms 后 AI reason 覆盖（mock 无网络延迟）；真实 LLM 接入时此延迟变 500-2000ms，组件已能 abort 不悬挂
  - **解锁 13.2 + 12.5**：schema 形状已对齐真 LLM 输出契约；shortcut[] 字段已在 path 里占位；mock 与真 provider 互换只需切 `VITE_AI_PROVIDER=remote`
  - `tsc --noEmit` 0 新错（仅 CardSwap 历史遗留 1 条）

- **2026-05-20** — 排队 12 v5 ✅ Workspace 大改（commit `974c21b`，merge `c9efedd` 从 `auth-system` 分支并入）
  - **抛 React Flow**：`src/pages/Planner/index.tsx` 1121 行重写为自绘 SVG path + 绝对定位 DIV 卡（`buildGraph` / `edgePath` / `GraphNodeButton`），不再依赖 reactflow MiniMap / Controls
  - **三层导图结构**：root「我的目标」→ milestone(上课/第二课堂/论文项目，3 个) → bucket(公共必修/通识必修/专业必修/专业选修/任选) → requirement；`expandedMilestones` / `expandedBuckets` 两个 Set 做层级展开
  - **核心改动 `strategyForItem()`**：requirement 卡 title 从"课名"切换到"可执行策略短句"，按 bucket + keyword 分 9 档：
    - 公必 + 体育 →「把体育与体测放进低冲突学期 · 不和核心课、实习周抢精力」
    - 公必 + 英语 →「用通过成本低的公共课先清掉硬性缺口」
    - 公必 其他 →「公共必修按低负担组合完成 · 优先选不额外占用整天的安排」
    - 通识 →「用通识模块补齐学分，同时控制绩点风险」
    - 专必 →「先锁定会卡后续学期的专业必修」
    - 专选 →「把专业选修对齐当前目标方向 · GPA、保研、实习按收益排序」
    - 任选 →「用任选学分填平剩余缺口」
    - second milestone →「用项目型经历一次覆盖第二课堂要求」
    - thesis →「把论文和实习排进课业压力较低的窗口」
  - **`FocusMode` toggle**：头卡右上"全部路径 / 只看推荐"圆角药丸；"全部"非推荐边走 slate dashed `5 7`（弱化但可见），"只看推荐" 过滤到 `isOnPath`
  - **`GOAL_COPY` 8 档**：每个 `goal_mode` 一句话目标说明显示在头卡 pill 下方（实习优先 →「不挤压连续实习时间的安排」/ 保研 →「排名、核心课与科研时间之间的取舍」等）
  - **右侧 `ImpactPanel` 选择模拟器**：take/delay/switch 三 action 圆角分段 + before/after credits delta + category delta + target 对比，接 `simulatePick`
  - **视觉**：推荐路径 amber #d97706 实线 strokeWidth 2.4；非推荐 slate dashed；完成态 emerald-50/200；选中态 ring-2 ring-slate-950
  - **附 4 份 `.playwright-mcp/page-2026-05-20T*.yml` snapshot**：开发期用 Playwright MCP 浏览器实测过
  - **设计原则演进**（用户口述记录）：学生要的是"看到所有捷径"+"做选择看影响"两件事；捷径对不同目标不同，需要标注；不能只展示推荐 3 条，其他变体也得在图上可见
  - **延伸需求 → 排队 13.5**：(A) requirement 卡再下钻"多条并列具体捷径变体"，(B) 每条捷径标"对哪种目标最优"标签；都依赖排队 13 AI 真推荐落地后做

- **2026-05-17** — 排队 12 ✅ Track Workspace 思维导图（**v4 预计算路径 + 徽章**，四轮迭代）
  - **v1**：CSS-only 三层 + Drawer → 用户："这不是思维导图，回 ReactFlow"
  - **v2**：ReactFlow + A/B/C/D/E 段 5 milestone（手册原结构）→ 用户："不要可视化规则手册，AI 后台懂就行"
  - **v3**：学生友好分类（上课/二课/论文 3 milestone + 上课下 5 bucket）+ 24 个 HIDE 关键词过滤管理规则 + rule-kind requirement 全过滤；新增 `src/lib/trackUserView.ts` (`classifyCategory` + `isUserVisibleRequirement`) → 用户："多数情况无需导入，AI 预计算 + 路径上色 + 模块数字徽章"
  - **v4（采纳）**：v3 基础 + `src/lib/trackRecommendation.ts` `computeRecommendation({goalMode})` —— goal-aware 重排 milestone / bucket 优先级（保研/高 GPA → 专必/通识；留学 → 公必/英语；实习 → 专必/专选 + thesis 提前；轻松毕业 → 必修先扫）；每 milestone 选 1 条主路径，返 `{paths, pathNodeIds, pathEdgeIds, badges}`；节点接 `useProfile.goal_mode` 后自动重算
  - **视觉**：onPath 节点 amber border + bg-amber-50/60；onPath 边 stroke amber-500 strokeWidth=2；节点右上角 `<Badge>` 数字徽章（App 通知 style，>99 → "99+"）；root 节点加 "AI 已规划 N 条主路径" amber chip
  - 数据层 5 文件：`trackApi.ts` / `userProgressApi.ts` / `useTrack.ts` / `useUserProgress.ts` / `lib/trackSimulation.ts` v1-v4 共用；v3 新增 `trackUserView.ts`；v4 新增 `trackRecommendation.ts`
  - **useTrack 改默认 track 选择**：优先 `scope_level='school'` 全校通用（避开师范学院专属，"用普通学生做"）
  - **数据空洞**：0005 seed 30 category + 198 requirement + **0 option** → option 层节点目前永远空，path 截止到 requirement 层。补 0007 option seed 留排队 14 前置
  - **6 类自定义节点**：root / milestone(3) / bucket(5 仅"上课"下) / category / requirement / option，layered X 轴：0/260/540/820/1100/1400
  - 解锁排队 13：替换 `computeRecommendation` 函数体即接入 AI（签名稳定）；`pickRecommendedOption` / `simulatePick` 同款替换点
  - `tsc --noEmit` 0 新错（仅 CardSwap 老错）；eslint --fix 后 0 error / 0 warning

- **2026-05-17** — 排队 11 ✅ `course` 表接通 + Upload 页「我已修的课」UI 入口
  - `src/api/courseApi.ts` 仿 ruleApi：typed `Course` = `Omit<CourseRow, 'status'|'category'> & {...}` 派生；`COURSE_STATUSES` / `COURSE_CATEGORIES` 与 DB CHECK 同源（5 档 status / 7 档 category，null 单算未分类）；listCourses 走 `semester desc nullsFirst:false` + `created_at desc` 双索引（idx_course_user_semester / idx_course_user_status）；createCourse 仅 set 显式传入字段，让 DB 默认（`status='planned'` / `counts_in_gpa=true`）生效；错误全走 `failApiCall` errorBus
  - `src/hooks/useCourses.ts` 三件套（requestIdRef / loadedUserIdRef / authLoading 短路）+ 乐观 CRUD（create 头插 / update map / remove filter，失败回滚）+ 派生 view：`coursesBySemester` / `coursesByStatus` / **`courseCodeMap`**（code → Course[]，重修允许多行）/ **`completedCodes`**（Set<string>，排队 12 画布最常用查询，单独缓存避免每帧扫全表）
  - `src/pages/Upload/CourseManager.tsx`（Profile 页历史已删，按 ARCHITECTURE 注释 §1 确认）→ 落 Upload 页 Section 7：添加表单（代码*/名称*/类别/学期/学分/状态/成绩，默认 status='completed'）+ 列表 + 删除；视觉完全复用 Section 6「已导入的数据」既有 grid + slate + emerald/amber/rose pill 色板（避免风格漂移）；空数字校验静默忽略不弹 toast
  - `tsc --noEmit` 0 新错（仅 CardSwap 老错保留）；eslint --fix 后净，无 react-hooks 警告
  - 解锁排队 12：画布 option 命中判定可直接 `completedCodes.has(option.code)`

- **2026-05-17** — 排队 10 阶段 4 ✅ `docs/ecnu_process_rules.md` 落地
  - 5 份 digest（A/B/C/D/E）"阶段 4 边界"段汇总 → 单 md / 323 行 / 9 章
  - 章节：(1) 培养方案结构 (2) 注册学籍 (3) 选课与免修免听 (4) 转专业 (5) 学籍变动（休学/复学/退学/试读/毕业类）(6) 考核/补考 (7) 辅修/双学位/拔尖 (8) 创新训练 CTP (9) 公共课特殊流程 (10) AI 引用规约
  - 关键约定：与 0005 track_requirement 数据冲突 → 优先 track_requirement；source_ref 同 0005；院系细则不收录 → AI 回"查院系公示"；严重事项（作弊/退学/撤销学位）AI 先重声严肃后果再引规则
  - 解锁排队 13 `gradPathAdvisorPrompt`：本 md + 198 条 track_requirement = AI 顾问 schema 锁定逻辑的两个数据源

- **2026-05-17** — 文档漂移同步 + uuid bug 修
  - **uuid bug**：`useChatMessages.ts:88` `genConversationId` 兜底分支生成 `${Date.now}-{rand}` base36 串（非合法 UUID），DB `conversation_id uuid` 列拒收 → `chat.insert：invalid input syntax for type uuid`。同款 bug 潜伏于 `ragSourceApi.ts:114` 的 id 兜底。修法：抽 `src/lib/uuid.ts` `randomUUID()` 三层兜底（`crypto.randomUUID` → `crypto.getRandomValues` → `Math.random`，永远返合法 UUID v4 字面量），useChatMessages + ragSourceApi 两处 import。tsc 干净。
  - **文档漂移同步**：本文 + AI_MEMORY 多处把已闭环任务仍写"待做"。本次同步：(1) 排队 5/6/7/8/9 小节删 / 标已闭环（指 commit hash）；(2) 排队 10 标阶段 1-3 完成 / 阶段 4 待启；(3) L12 目标段改成「已闭环 + 当前推进」二段；(4) "TD-7 = chat_message 余尾"旧用法标注（实际 TD-7 已重新分配）；(5) AI_MEMORY § 5 决策表 / § 6 已完成 / § 8 中期 / § 9 时间线 同步。

- **2026-05-17** — 基础设施 + TD 清理大波次（架构审计 + 16 条 TD 闭环）
  - **架构审计**：合并 `docs/ARCHITECTURE_AUDIT.md`（5-09 + 5-16 两轮），删冗余日期版，AUDIT = 历史快照 / TECH_DEBT = 唯一权威 backlog
  - **文档漂移修**：`PROJECT_OVERVIEW.md` / `ARCHITECTURE.md` 删 services/ + 老 hooks 描述，对齐当前 api + hooks 三层架构；`SCHEMA_EVOLUTION` 合进 `DATA_MODEL §10`
  - **AI 抽象升级 v2**（用户决定 LLM 未定 → provider-agnostic）：`Token` discriminated union（留 citation / tool_use 扩展位）+ 新 `providers/remote.ts` 走 `/api/ai.chat` server proxy + 新 `docs/AI_PROXY_SPEC.md`（4 家 LLM SSE 协议速记）。server route 待用户拍 LLM 上游再写
  - **错误暴露 UI**：`src/lib/errorBus.ts` (`reportApiError` / `failApiCall`) + `__root.tsx` 挂 `<Toaster richColors />` + 6 个 api/*.ts 接 errorBus（authApi 不接，避免 Login 红字双重显示）
  - **Drawer 抽 hook**：`src/hooks/useDrawer.ts`（scroll-lock + Esc + 可选 closeOnRouteChange），Navbar + DashboardLayout 各删 ~30 行
  - **track schema 字面量**：`src/types/trackEnums.ts`（12 档 kind + 3 档 scope/option + 5 档 status）与 SQL CHECK 同源，db.ts 漂移期间唯一可信来源
  - **db.ts 重 gen**（SB1 解锁）：从 471 行（0002 前快照）→ 743 行（含 track_* / user_progress / scope_level / 12 档 kind）
  - **Migration 规约**：`supabase/migrations/_template.sql`（UP + DOWN 注释段）+ `DATA_MODEL §10` 规约（幂等 / verify / DOWN / 命名 / CHECK 修改）
  - **ProfileContext race**：`updateProfile` 接共享 `requestIdRef`，spam-click / logout / 切账号期间过期响应丢弃
  - **useRagSources 防护**：`MAX_UPLOAD_BYTES = 50MB` 预检 + upload 抛错（不再返 null）+ remove deps 改 `[]` + drop 路径加 `matchesAccept()` 类型校验
  - **Dashboard 部分接通**：删教务 shortcut（立项书严禁爬学校系统）+ 卡 5「下一步建议」接 `NEXT_STEP_POOL` 8 句文案池按小时轮换 + Navbar/DashboardLayout 接 `useProfile` 让头像/名称跟随 profile.name + Upload 加显示名输入字段
  - **小修**：`components.json` css 入口 `src/styles.css` → `src/styles/globals.css`；ragSourceApi 删死代码 catch；bucket 名走 `VITE_SUPABASE_RAG_BUCKET` env；grade 无效输入 reset
  - **TD 状态**：TD-3/4/5/14/15/16/17/19/21/23/24/25 + TD-27~30 共 16 条闭环 → 直接从 TECH_DEBT.md 删除（按规约"完成即删，git 历史可追溯"）；剩 4 条部分余尾（TD-1/11/12/13）精简描述
  - 验证：`tsc --noEmit` 0 新错误（仅 CardSwap 原 effects bug）；eslint 0 真错误（CRLF 噪声是项目级老问题）

- **2026-05-16** — 阶段 3 — 0005 seed SQL ✅ 落库（198 条 requirement / 用户 Supabase Dashboard 跑通）
  - `supabase/migrations/0005_seed_ecnu_2023.sql` 全段 —— 2 track（school + 师范学院 college）+ 30 category（A1-A5/B1-B6/C1-C9/D1-D6/E1-E3 + E4）+ **198 track_requirement**。整片 PL/pgSQL DO 块 + `ON CONFLICT (category_id, code) DO UPDATE` 幂等可重跑。
  - 段分布：A 23 + B 48 + C 56 + D 49 + E全校 14 + E师范 8 = 198。
  - 实施策略：用户拍板单文件分批 Edit（A 方案）——skeleton + A 段（已有 23 行）+ 5 次 Edit 注入 B/C/D/E全校/E师范，避免一次 Write 几千行卡顿。
  - 198 个 metadata JSON 全部 `JSON.parse` 通过（D4-6 一处 `"key:value":value` 误写修复）；198 INSERT 段分布精确符合计划。
  - `supabase/migrations/0005_verify.sql` 扩 8 段 → 15 段全段验证：基本结构（§ 1-5）+ 完整性（§ 6-7）+ 5 个抽样段（A1-10 / B3-1 / C6-6 三档赛事 / C7-2 A 类奖金 / D4-12 重复率两档 / E2-3 计算机分支 / E4 师范全部 8 条）+ § 15 module metadata 分布。
  - 12 档 kind 分布（已验证）：program_rule 56 / assessment_rule 37 / status_gate 31 / time_limit 21 / credits 13 / gpa_threshold 11 / score_scheme 11 / warning_threshold 8 / tuition 8 / all_of 2 / count + one_of 0。
  - **用户 Supabase Dashboard 跑通**（2026-05-16）：seed + verify 两份均 OK，零反馈修复，落库零错。
  - 解锁后续：阶段 4 `docs/ecnu_process_rules.md`（prompt 类规则精炼版给 `gradPathAdvisorPrompt` 用）+ 排队 13 AI 顾问真正能从 198 条结构化规则中取数。

- **2026-05-16** — 数据源切 PDF + 旧 md 处置方案 + CLAUDE.md 分流条 + TD-26 入册
  - 用户提供 2 份新 PDF（`docs/华师大规则文件pdf/2025本科生手册.pdf` + `2025本科生学习指南.pdf`），PDF 是 source of truth，旧 34 份 md 仅历史佐证。
  - 全局 CLAUDE.md 加「数据源文件分流」条：规则源文件只在排队 10 / 13 读，其他任务禁 Grep。
  - 旧 md 处置：99 条录完 0005 后一次性 `git mv` 到 `docs/_archive/`，禁止现在 rm（digest `source_ref` 链）。
  - 两本 PDF 目录已盘点：手册 64 篇（21 已 digest 覆盖 / 5 跳过 / 14 新内容 / 15 奖励处分多半 prompt / 14 学习生活多半跳）；学习指南 P0 核心数据在 二.03/04/05（培养方案 + 公共必修 + 通识学分构成）。
  - 师范生入 track（scope=college）/ 微专业单独 track（2026-05-16 拍板）。
  - 新增 TD-26：PDF 内联预览 + source_ref 精确到页码，推到排队 14 UI 重设计统一做。

- **2026-05-16** — TD-25 修 — `/schedule` 闪屏（"先一个界面，~1s 后跳到另一个"）
  - 入口溯源：导航「Rule Graph · 规则透明与来源」`menu.ts:55-62` → `/schedule`，**不是落地页 Transparency 锚点**（TECH_DEBT 原描述指错了）。
  - 根因：`SchedulePage` 的状态分支 `isGuest = !authLoading && !user` / `isEmpty = !loading && ...` 把 loading 期判成 false → 第一帧渲染空 Trust 列 + 空树 → 等 auth+hook（约 800ms-1s）落地后才切到 SEED 或真实数据。两段跳变 = 用户感知的"闪屏"。
  - 修：`src/pages/Schedule/index.tsx:63-70` 引入 `isResolving = authLoading || loading`，并入 `showSeed = isResolving || isGuest || isEmpty`。第一帧直接显示 SEED；访客 / 登录空态全程 SEED 无跳变；登录有数据 → SEED → 真实数据一次切换（预期，不算 bug）。
  - `canEdit = !isGuest && !authLoading` 保持原样 → loading 期 SEED 上不出 CRUD 按钮，避免点了未鉴权按钮。
  - `tsc --noEmit`：仅 CardSwap 历史遗留错（允许）。零新增类型错误。
  - TECH_DEBT.md TD-25 段标 ✅ 2026-05-16 已修并写明修法 / 副作用。

- **2026-05-15** — 排队 10 前置 — 华师大 23 个 md → 4 份 ECNU 规则 digest 录入完毕
  - **AI 一次性读完 23 个 md（剔除硕博/二学位等不相关 11 个）→ 写 4 份 digest**：
    - `docs/ecnu-digests/ecnu_rules_digest_A.md` 毕业资格核心（学籍管理 / 毕业资格 / 学士学位 / 成绩学分认定 / 课程考核）
    - `docs/ecnu-digests/ecnu_rules_digest_B.md` 学业规则（选课退课 / 成绩管理 / 学业预警 / 考勤 / 体质健康 / 学分制收费）
    - `docs/ecnu-digests/ecnu_rules_digest_C.md` 特殊计划（辅修 / 双学位 / 强基 / 个性化 / 转专业 / 创新创业学分 / 学科竞赛）
    - `docs/ecnu-digests/ecnu_rules_digest_D.md` 过程类（注册 / 休学复学 / 实习 / 毕业论文 / 创新训练）
  - **每条规则强制 4 字段**：规则中文 / 原文片段 / 来源(§条款) / 落地(track_requirement 或 prompt)。结构稳定，下游 seed SQL 可机器扫描。
  - **用户审阅工作流**：用户在 IDE 直接改 4 份 md 补 ⚠️ / 修正规则行 → AI 收 system-reminder 同步「落地」行去 ⚠️ / 升级到 track_requirement 结构 → chat 互验 typo（A2-2 肄业 → 毕业 这种被 AI 主动质询）。
  - **工具补强：AI OCR**：用户把表格放桌面 `C:\Users\J-R-N\Desktop\Cx-y.png` 命名 → AI Read 读图 → 录入 markdown 表 + 落地行结构。批 C 三张表（C6-5 项目 / C6-6 竞赛 / C6-9 论文专利著作）就是这样录入。
  - **拍板覆盖度**：A/B/C/D 4 份的「待用户拍板要点」段几乎全部 ⚠️ 解决；剩余 2-3 条不影响 track 结构化（D2-8 因病医药费 / D5-8 教师工作量）。
  - 修两个 typo：A2-2 落地行同步「肄业→毕业」；D3-6 用户重复粘贴的句子去重。
  - **解锁 task #4**：写 `0004_add_source_ref.sql`（schema 加 source_ref 列）+ `0005_seed_ecnu_2023.sql`（按 4 份 digest 把 track_requirement 候选录成 INSERT）+ `docs/ecnu_process_rules.md`（过程类精炼版给 AI prompt 用）。
  - 新增技术债：TD-25 落地页「规则透明与来源」section 闪屏 bug（用户报）。

