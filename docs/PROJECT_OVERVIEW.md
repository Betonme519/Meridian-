# Meridian — Project Overview

> **给新接手的 AI 看这一份就够。** 不要重新解释项目是什么。

---

## 一句话定位

**Meridian — Academic Decision Engine**：帮中国高校学生在选课前 3 分钟搞清自己学校的所有规则，看清每门课的风险与决策依据，做出有把握的选课决定。

---

## 项目目标

**让大学生不再为成绩焦虑，把"选课"从盲选变成可解释的决策过程。**

- 大多数学生四年都没完全搞清自己学校的绩点、学分、培养方案规则
- 现有信息分散在 PDF 手册、教务系统、口碑、学姐学长经验里
- Meridian 的角色：**把这些规则统一解析、计算、可视化，每条推荐都附带"为什么"**

---

## 核心功能（按优先级）

### P0 — MVP 必须

1. **上传学校手册 / 培养方案** → 自动提取绩点规则、学分权重、先修课、毕业要求
2. **GPA 计算器** → 解析学校的 WGPA 公式（§4.2 等级换算 / §3.1 学分定义 / §4.5 P/F 规则等），透明展示每一步
3. **课程推荐 + 解释** → 输入选课意向，输出每门课的：
   - 推荐原因（命中哪条规则）
   - 风险提示（历史平均分、通过率）
   - 数据来源（学校手册章节 / 估算 / 个人输入）
4. **三类标注**：每条信息标记为 `确定` / `估算` / `未知`，绝不假装什么都知道

### P1 — 增长期

5. **方案对比** → 把不同选课组合横向比较 GPA 期望、风险、毕业进度
6. **导出** → 一键 PDF / CSV，能拿去和导师讨论
7. **评价社区** → 真实学生反馈课程难度（含偏差案例）

### P2 — B2B 转化

8. **学校 dashboard**：聚合本校学生的选课模式、风险预警，卖给教务处 / 学院

---

## 用户画像

| 阶段 | 用户 | 痛点 | 触发场景 |
|---|---|---|---|
| 大一新生 | 第一次面对培养方案 | 不知道哪门课是核心 / 选修 / 先修 | 开学前 / 选课前 |
| 大二在读 | 想冲 GPA / 转专业 | 不知道哪门课压分严重 | 期末 + 下学期选课 |
| 转专业学生 | 学分要重新规划 | 不知道哪些课能算抵 | 提交转专业申请前 |
| 准毕业学生 | 担心毕业要求 | 算不清还差多少学分 | 大三下 / 大四 |
| 学校教务（B2B） | 想了解学生选课模式 | 没有数据视角 | 季度 / 学期复盘 |

---

## 商业模式

**先 B2C 个人增长，再 B2B 学校变现。**

### Phase 1：B2C 免费（当前）

- 个人学生免费访问
- 不强制注册（首页明确写 "免费 · 无需注册 · 支持导出"）
- 目标：拉用户量、积累不同学校手册的解析数据

### Phase 2：B2C Pro（增长后）

- 高级功能付费：方案对比、AI 长期跟踪、考试预测等
- 价格点参考：~30-50 元 / 月学生价

### Phase 3：B2B SaaS（数据成熟后）

- 把聚合的本校学生选课模式 / 风险数据卖给学校教务处
- B 端单价远高于 C 端，是真正的盈利来源

---

## 技术栈

### Runtime

- **React 19** + **TypeScript 5.8**
- **Vite 7**（构建）
- **TanStack Start + Router**（SSR / 路由 / 文件式 routes）
- **Bun**（包管理 + 本地脚本）
- **Cloudflare Workers**（后端，已配 `wrangler.jsonc` 和 `@cloudflare/vite-plugin`）

### 样式 + UI

- **Tailwind CSS 4**（@theme inline + oklch tokens）
- **shadcn/ui**（50+ Radix primitives 在 `src/components/ui/`，不要重复写）
- **lucide-react** 图标
- **tw-animate-css** 动画工具

### 动画

- **GSAP 3.15**（核心动画）
  - `ScrollTrigger` — 滚动驱动的 pin / scrub（笔记本展示）
  - `SplitText` — 字符级 fade-up（首页大标题）
  - **@gsap/react** — `useGSAP` hook
- 自定义 CSS keyframes（`src/styles/animations.css`）

### 数据 + 状态

- **状态管理：React Context**（`src/context/`）
- **后端 API：Cloudflare Workers**（`src/api/` 是前端调用层）
- **业务逻辑：services 层**（`src/services/`）
- **mock 数据：`src/data/`**（真接口接好前用）

### 工具链

- **ESLint 9** + **Prettier 3** + 严格 TS
- 路径别名：`@/*` → `./src/*`

---

## 设计风格关键词

> 风格漂移是 AI 接手项目最常见的事故。把这几个词内化。

**要：**

- **Clean** — 大量留白，元素间距宽
- **Academic** — 学术感，不浮夸，配色克制
- **Apple-like** — 卡片 + 圆角 + 柔投影；hover 有微动效不喧宾夺主
- **Calm** — 慢动画、power2.out / cubic-bezier，绝不弹跳卡通
- **低饱和** — oklch 灰阶为主体，emerald / amber 仅做语义标记（推荐 / 风险）
- **可信** — 文字密度高于图，每个数字都有 §章节引用

**不要：**

- ❌ Cyberpunk / 霓虹 / 渐变光晕
- ❌ 拟物 / 重投影 / 过度立体
- ❌ 满屏动画 / 过度交互
- ❌ 营销腔（"震撼"、"颠覆"、"全方位赋能"）
- ❌ 中文混英文炫技（除了课程代码 CS 101 这种约定俗成的）

**语气：**

- 直接，承认局限（首页有专门的 "我们不会假装什么都知道" section）
- 用 "你" 而不是 "您"
- 数据用绝对值（"5.4 学分"），避免模糊词（"很多"）

---

## 当前进度（截至 2026-05）

- ✅ 落地页 9 个 section 完整（Hero / 笔记本展示 / Flow / Explain / GpaMath / Honesty / Control / Feedback / FinalCTA）
- ✅ 笔记本滚动动画（CSS 3D 伪笔记本，鼠标 hover 上抬）
- ✅ 首页大字 SplitText 字符级动画
- ✅ 自适应 Nav（dark Hero 上透明 / 白底 sections 上白底深字）
- ✅ 项目结构按多 agent 协作整理（每个 section 一文件）
- 🚧 CourseAnalyzer 页面（骨架已建）
- 🚧 Dashboard 页面（骨架已建）
- 🚧 后端 Cloudflare Worker 接入
- 🚧 学校手册解析 pipeline

---

## 文件入口

- 落地页：`src/pages/Home/`（每个 section 一文件，详见 `ARCHITECTURE.md`）
- 设计令牌：`src/styles/variables.css`（详见 `DESIGN_SYSTEM.md`）
- 立项说明（业务侧）：`docs/20260427AI选课顾问_项目立项说明.md`

## 文档体系（按 AI 接手时的阅读优先级）

```
docs/
├─ CURRENT_TASK.md       ← ★ 本会话/今天要做什么、不要碰什么。最先读。
├─ PROJECT_OVERVIEW.md   ← 你正在看：项目是什么 / 用户 / 商业 / 风格关键词
├─ ARCHITECTURE.md       ← 文件结构 / 数据流 / API / 状态管理
└─ DESIGN_SYSTEM.md      ← 颜色 / 字体 / 动画规范，写 UI 前必读
```

**`CURRENT_TASK.md` 优先级最高。** 它告诉 AI 这次会话的边界。其它三份是稳定参考，几周才更新一次；CURRENT_TASK 每次任务前更新。
