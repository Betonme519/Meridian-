# Meridian — Project Overview

> **给接手这个项目的 AI 看。一份就够，不要重新解释项目是什么。**

---

## 一句话定位

**Meridian — Academic Decision Engine**：让学业不成为你的全部。用最高效的方式完成学业，把时间留给生活与爱好。

**线上地址**：https://meridianedu.xyz （自定义域名已接入，绑到 Cloudflare worker `meridian`；旧 `meridian.betonme519.workers.dev` 仍可用）。

---

## 核心理念（最重要，先读这段）

学生大量时间被浪费在**信息不对称**上：本校的绩点公式、学分构成、培养方案、各课压分历史，都散落在 PDF 手册、教务系统、学长口耳之间。Meridian 用 AI + 大数据把这些规则全部解析、聚合、量化，然后告诉学生：


> **"在你学校的规则下，达成你的目标（保研 / 奖学金 / 留学 / 转专业 / 顺利毕业 / 充足自由时间）的最低成本路径是什么。"**

**说白了，就是基于规则与数据帮学生"合理钻空子"——选最划算的课、避开压分最狠的坑。动态计算：哪种路径收益最高、哪种路径风险最低、哪种路径时间成本最低、哪种路径最适合当前阶段。用最少的总学分压力换最高的 GPA / 最短毕业路径。**

> ⚠️ **对外宣传严格使用"学业规划工具"定位**，避免"刷分""钻空子""绕过规则"等措辞（合规要求，详见立项书 §七）。**这份文档是项目内部 AI 文档，可以直白；任何用户可见文案不要带这个调子。**

---

## 目标用户

有明确成绩诉求、且不想把所有时间花在学业上的学生：

- 准备保研 / 奖学金 / 海外留学申请的——绩点是硬指标
- 想顺利毕业、把时间留给科研 / 实习 / 兴趣 / 副业的
- 转专业 / 想冲 GPA / 担心毕业要求的中段学生

---

## 核心功能（按优先级）

### P0 — MVP 必须

1. **政策解析器**：上传学校手册 / 培养方案 PDF → AI 提取绩点公式、学分权重、先修、补考 / 重修、毕业要求
2. **GPA 计算器 + 模拟器**：基于本校实际公式（WGPA / P-F / 等级换算）透明计算与多场景模拟
3. **选课推荐 + 解释**：输入意向课程，按「高分潜力 / 工作量比」排序，每条推荐附带：
   - 命中哪条规则
   - 历史分数 / 通过率（来自众包 + 公开数据）
   - 数据来源（手册章节 / 估算 / 个人输入）
4. **三类标注**：每条信息标记 `确定` / `估算` / `未知`，绝不假装什么都知道
5. **路径优化**: 基于用户目标、学校规则、课程结构、毕业要求、时间成本与 GPA 风险，动态生成：“当前阶段的最优学业路径”。

### P1 — 增长期

5. **方案对比**：多组选课组合横向对比 GPA 期望、风险、毕业进度
6. **导出**：PDF / CSV，可拿去和导师讨论
7. **政策 RAG 问答**：自然语言问"补考几次后强制重修？"等
8. **课程评价社区**：真实学生反馈，含偏差案例

### P2 — B2B 转化

9. **学校 dashboard**：聚合本校学生选课模式 / 风险预警，售予教务处 / 学院

---

## 商业模式

**先 B2C 个人增长，再 B2B 学校变现。**

| 阶段 | 形态 | 价格 |
|---|---|---|
| Phase 1（当前） | B2C 免费，无需注册，免费导出 | 0 |
| Phase 2 | B2C Pro：方案对比 / 长期跟踪 / 高级模拟 | ~30–50 元/月 |
| Phase 3 | B2B SaaS：聚合数据卖给学校教务 | B 端单价远高于 C 端 |

**市场参考**（立项书）：TAM ≈ $26亿（全球 2.64 亿大学生），SAM ≈ $8亿（中英文 8000 万），SOM ≈ $800万 ARR。MVP 现金投入近零，仅 API 费 ~$50–200/月。

---

## 技术栈

### Runtime
- **React 19** + **TypeScript 5.8** + **Vite 7**
- **TanStack Start + Router**（SSR / 文件式 routes）
- **Bun**（包管理 + 本地脚本）
- **Cloudflare Workers**（后端，`wrangler.jsonc` + `@cloudflare/vite-plugin`）

### UI
- **Tailwind CSS 4**（@theme inline + oklch tokens）
- **shadcn/ui**（50+ Radix primitives 在 `src/components/ui/`，不要重复写）
- **lucide-react** 图标 + **tw-animate-css**

### 动画
- **GSAP 3.15** + **@gsap/react** `useGSAP`
  - `ScrollTrigger`：笔记本 pin / scrub
  - `SplitText`：首页大字字符级 fade-up
- 自定义 CSS keyframes：`src/styles/animations.css`

### 数据
- 后端：**Supabase**（Postgres + Auth + Storage + RLS）
- 客户端单例：`src/lib/supabase.ts`（typed client，泛型 `<Database>` 由 `src/types/db.ts` 提供）
- 数据访问薄壳：`src/api/`（一表一文件，仅做 `supabase.from(...)` 转译，**不放业务逻辑**）
- 状态：`src/context/`（全局：Auth / Profile）+ `src/hooks/`（页面级：Rules / Plans / RagSources / ChatMessages / UserProfile）
- 鉴权与守卫：`_app.tsx beforeLoad` 三层（SSR / 未配置 / guest mode → fail-soft；其余 → Supabase session）
- **不再有 `src/services/` 层**（5-09 已删，业务计算合进 hooks 或 api 薄壳）；`src/data/` 仅作未来 seed 占位

### AI 能力（待实现）
| 能力 | 实现 |
|---|---|
| PDF 解析 | Claude / GPT + PDF parser |
| RAG 检索 | 向量库 + 语义检索（防幻觉、附溯源） |
| 课程排序 | LLM + 自定义评分（高分潜力 vs 工作量） |
| GPA 模拟 | 规则引擎 + AI 辅助 |

### 工具链
- ESLint 9 + Prettier 3 + 严格 TS
- 路径别名：`@/*` → `./src/*`

---

## 设计风格关键词

> 风格漂移是 AI 接手项目最常见事故。把这几个词内化。

**要：** Clean（大量留白） · Academic（克制配色） · Apple-like（圆角 + 柔投影 + 微 hover） · Calm（慢动画 power2.out，绝不弹跳） · 低饱和（oklch 灰阶为主，emerald / amber 仅做语义） · 可信（文字密度高于图，每个数字附 §章节引用）

**不要：** Cyberpunk / 霓虹 / 渐变光晕 · 拟物 / 重投影 · 满屏动画 · 营销腔（"震撼""颠覆""赋能"） · 无意义中英混杂

**语气：** 直接，承认局限；用"你"不用"您"；数据用绝对值（"5.4 学分"），避免"很多"等模糊词。

**UI 文案禁词（前端用户可见任何位置都不允许）：**

- ❌ **捷径** / **快捷径** / **shortcut**（中文面） → ✅ **路径建议** / **建议**
- ❌ **钻空子** / **绕开** / **走后门** / **薅羊毛** → ✅ **合规优化** / **可执行方案** / **节省学分**
- ❌ **套路** / **攻略**（带功利贬义）→ ✅ **策略** / **做法**
- ❌ **包过** / **必过** / **稳过**（虚假承诺）→ ✅ **建议优先** / **学校规则允许**
- ❌ **躺平** / **摆烂** / **混过** → ✅ **低压力** / **轻量学期**

**原则：** 把"教学生钻规则缝隙"的语义换成"在规则内做更聪明的安排"。学术产品调性 = 克制 + 顾问感，不要任何"内幕、技巧、走捷径"的暗示。代码侧标识符（`Shortcut` / `shortcut_oneliners` / `ShortcutDetail` / 文件名 / 变量名）保留以避免大规模重命名 —— **本节只约束用户能看到的中文文案 + i18n key 的展示值**。

新增功能合并前，AI 必须 `grep -i '捷径\|钻空子\|套路\|包过\|躺平\|攻略\|薅羊毛'` 检查 src/ + 用户可见文案，命中即替换。

---

## 当前进度（截至 2026-05-16）

- ✅ 落地页 9 个 section（Hero / 笔记本展示 / Flow / Explain / GpaMath / Honesty / Control / Feedback / FinalCTA）
- ✅ 笔记本滚动动画（CSS 3D + hover 上抬） · SplitText 字符级动画 · 自适应 Nav
- ✅ 5 个功能页（Dashboard / AIAdvisor / Planner / Schedule / Upload）+ Login / Register
- ✅ Supabase 真鉴权 + guestMode + `_app.tsx` 三层 beforeLoad 守卫
- ✅ 6 张用户私有表（profile / rag_source / rule / rule_conflict / plan / chat_message）+ 5 张公共 track 表 RLS 完整
- ✅ AI 抽象骨架（`src/ai/{stream, schema, prompts, providers/{mock, anthropic}}`） + mock provider 流式 UI
- ✅ 0005 华师大 2023 级培养方案 seed 落库（198 条 track_requirement）
- ✅ 排队 11：`course` 表 + UI 入口（commit `1c76e50`，2026-05-17）
- ✅ 排队 12：画布改造 v5 Track Workspace（自绘 SVG + 5 命名组件，commit `974c21b` + `6f8b241`，2026-05-20）
- 🚧 Dashboard 数据契约（5 张卡片仍写死 const，唯一未接通页）
- 🚧 排队 13：AI 接 track + user_progress + course mock（`gradPathAdvisorPrompt` + zod schema）
- 🚧 排队 13.2 / TD-1：接真 LLM provider（需先拍板 DeepSeek/Qwen/Zhipu/Anthropic 上游）
- 🚧 排队 12.5：workspace 二次重构（requirement 加 shortcut 层 + AI 现算捷径 + 兴趣 input，依赖 13 + 13.2）

---

## 风险与止损（来自立项书）

| 风险 | 对策 |
|---|---|
| PDF 格式混乱 | 先测 10 所学校 + 人工审核流程 |
| 政策准确性 | RAG + 溯源标注 |
| API 成本失控 | Prompt 缓存 + 免费版用量限制 |
| 选课季节性 | 每年两次选课季推送提醒 |
| 学校官方施压 | 严守"学业规划工具"定位 |
| 爬学校系统 | **严禁**，只处理用户主动上传的公开 PDF |

**止损：** PDF 解析准确率 < 70%，**或**上线 3 个月活跃用户 < 100 → 停 / 复盘 / 转向。

---

## 安全边界（写代码前必读）

> 完整规则见 `ARCHITECTURE.md` §9。本节是给非技术读者也能看懂的版本。

**项目对前端的最高约束**：浏览器里跑的任何代码都视作公开。
凡是不能给路人看的东西，都不能进前端。

### 永远禁止出现在前端的东西

- **service_role key**（Supabase 后台管理员密钥，能绕过所有权限）
- **LLM API key**（Anthropic / OpenAI / DeepSeek / Qwen / Zhipu / 任何上游）
- **第三方服务 secret**（支付 / 邮件 / 私有对象存储 / Webhook 签名）
- **数据库直连密码 / JWT 签名密钥 / 加密私钥**

载体清单（任意一处出现都算泄露）：前端源码、`.env`、`.env.example`、`.env.local`、构建产物 `dist/`、git 提交历史。

### 前端允许出现的东西

- Supabase URL + publishable / anon key（`sb_publishable_*`，设计上可公开）
- 公开 CDN / 公共 API endpoint URL
- `VITE_*` 中的非密钥配置（feature flag / 公开 bucket 名）

`VITE_*` 是构建时常量，会被字面量内联进 bundle —— **等同公开**。
判定标准：**能写进 README 给路人看的，才能进 `VITE_*`**。

### 凡需密钥的能力都走 server route

```
前端 (fetch /api/*)
   ↓
TanStack Start server route  (src/routes/api/*)
   ↓                                  ↓
key（wrangler secret put 注入）   Supabase (service_role 可选)
   ↓
上游 LLM / 第三方 / 文件解析
```

| 场景 | 走法 |
|---|---|
| AI 调用 | `src/routes/api/ai/chat.ts`（Phase 1 已建 mock stub） |
| RAG 检索 / 文件解析 | `src/routes/api/rag/*`（Phase 5） |
| 课程规划 / 毕业判断（防作弊） | `src/routes/api/track/*`、`/requirement/*`（Phase 3） |
| 管理员操作 / 跨用户读 | `src/routes/api/admin/*`（Phase 6） |

### 权限判断只信 server + RLS

- admin / vip / premium 等角色**绝不**只在前端判定 —— 用户改前端 state 就能伪造。
- 安全边界永远是 **server route + Postgres Row Level Security（RLS）** 双层。
- 前端的 `isGuest` / `isPremium` / `canEdit` 等只用于 UX 显隐，不是安全边界。

### 数据库授权只走 RLS

- 当前 15 张表全部启用 RLS（见 `supabase/migrations/`）
- 新增 user-owned 表的 migration **必须**同步写齐 policies（select/insert/update/delete）
- `supabase/migrations/_template.sql` 已含 RLS 模板

更详细的审计基线与后端迁移路线，见 [`backend_migration_plan.md`](./backend_migration_plan.md)。

---

## 文件入口

- 落地页：`src/pages/Landing/`（每 section 一文件，详见 `ARCHITECTURE.md`；原 `Home/`，2026-05-30 改名）
- 设计令牌：`src/styles/variables.css`（详见 `DESIGN_SYSTEM.md`）
- 业务立项书：`docs/_archive/20260427AI选课顾问_项目立项说明.md`（市场 / RICE / 法务 / 6周路线图；**已归档**，仅历史参考）

## 文档体系（AI 接手阅读顺序）

```
docs/
├─ CURRENT_TASK.md            ★★★ 本会话边界，最先读
├─ AI_MEMORY.md               ★★  长期状态 + 踩过的坑 + TBD
├─ PROJECT_OVERVIEW.md        ← 你正在看（含安全边界）
├─ ARCHITECTURE.md            文件结构 / 数据流 / API / 前端安全铁律 §9
├─ backend_migration_plan.md  后端迁移 6 阶段路线 + 安全审计基线
├─ AI_PROXY_SPEC.md           /api/ai/chat server route 实施手册（Phase 2）
├─ DATA_MODEL.md              9 张 user-owned 表的 schema 契约
├─ TRACK_SCHEMA.md            5 张公共 track 表的 schema 契约
├─ TECH_DEBT.md               TD-1..26 列表
├─ DESIGN_SYSTEM.md           颜色 / 字体 / 动画，写 UI 前必读
└─ _archive/                  归档：ARCHITECTURE_AUDIT.md（5-09/5-16 审计快照）+ 立项书
```

- `CURRENT_TASK.md` 每会话更新
- `AI_MEMORY.md` 每里程碑更新
- 后几份稳定，几周才更新一次
