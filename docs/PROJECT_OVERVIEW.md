# Meridian — Project Overview

> **给接手这个项目的 AI 看。一份就够，不要重新解释项目是什么。**

---

## 一句话定位

**Meridian — Academic Decision Engine**：让学业不成为你的全部。用最高效的方式完成学业，把时间留给生活与爱好。

---

## 核心理念（最重要，先读这段）

学生大量时间被浪费在**信息不对称**上：本校的绩点公式、学分构成、培养方案、各课压分历史，都散落在 PDF 手册、教务系统、学长口耳之间。Meridian 用 AI + 大数据把这些规则全部解析、聚合、量化，然后告诉学生：

> **"在你学校的规则下，达成你的目标（保研 / 奖学金 / 留学 / 顺利毕业）的最低成本路径是什么。"**

**说白了，就是基于规则与数据帮学生"合理钻空子"——选最划算的课、避开压分最狠的坑、用最少的总学分压力换最高的 GPA / 最短毕业路径。**

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
- 状态：**React Context**（`src/context/`）
- 前端 API 调用层：`src/api/`
- 业务逻辑：`src/services/`
- mock 数据：`src/data/`

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

---

## 当前进度（截至 2026-05）

- ✅ 落地页 9 个 section（Hero / 笔记本展示 / Flow / Explain / GpaMath / Honesty / Control / Feedback / FinalCTA）
- ✅ 笔记本滚动动画（CSS 3D 伪笔记本 + hover 上抬）
- ✅ 首页 SplitText 字符级动画
- ✅ 自适应 Nav（dark Hero 透明 / 白底 sections 反色）
- ✅ 项目结构按多 agent 协作整理（每 section 一文件）
- 🚧 CourseAnalyzer / Dashboard 页面骨架
- 🚧 Cloudflare Worker 后端接入
- 🚧 学校手册解析 pipeline

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

## 文件入口

- 落地页：`src/pages/Home/`（每 section 一文件，详见 `ARCHITECTURE.md`）
- 设计令牌：`src/styles/variables.css`（详见 `DESIGN_SYSTEM.md`）
- 业务立项书：`docs/20260427AI选课顾问_项目立项说明.md`（市场 / RICE / 法务 / 6周路线图）

## 文档体系（AI 接手阅读顺序）

```
docs/
├─ CURRENT_TASK.md   ★★★ 本会话边界，最先读
├─ AI_MEMORY.md      ★★  长期状态 + 踩过的坑 + TBD
├─ PROJECT_OVERVIEW.md  ← 你正在看
├─ ARCHITECTURE.md   文件结构 / 数据流 / API
└─ DESIGN_SYSTEM.md  颜色 / 字体 / 动画，写 UI 前必读
```

- `CURRENT_TASK.md` 每会话更新
- `AI_MEMORY.md` 每里程碑更新
- 后三份稳定，几周才更新一次
