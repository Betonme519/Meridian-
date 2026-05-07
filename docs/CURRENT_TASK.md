# Current Task

> AI 接手必读，**优先级高于其它三份文档**。

---

## AI 阅读规则

**顺序：** 这份 → `PROJECT_OVERVIEW.md` → `ARCHITECTURE.md` → 改 UI 再读 `DESIGN_SYSTEM.md`。

**铁律：**

- ✅ 只做「需要做」列表里的事；做完停下汇报，不自己加戏
- ✅ 「不要修改」区域当只读——即使能顺手优化也不要动
- ❌ 不动列表外文件 / 配置 / 路由 / 全局样式 / 已有 commit 历史
- ❌ 不装新依赖，除非「需要做」明确要求
- ⚠️ 「不要修改」区有阻塞问题 → **报告，不要绕开**

---

## 当前任务（Last updated: 2026-05-07）

> 新任务覆盖此区，旧的挪到「完成归档」。

### 目标

> 一句话，要具体到能验证。

落地页第二屏改"建立信任 / 计算你的整个学业路径"文案 + 4 项分析点滚动顺序打钩；
原"一个 AI 凭什么帮我选课？"transparency 块并入"诚实性" section 作为其 hero。

### 需要做

> 每条要小到能在一次会话内完成。

- [x] `HeroLaptopShowcase.tsx` 第二屏左侧文案换为"建立信任"新文本（含 4 项分析维度）
- [x] 第二屏 4 项小灰点 → 圆圈+勾，GSAP timeline scrub stagger 顺序勾选（反向取消勾选）
- [x] `Honesty.tsx` 顶部追加 trust hero（"一个 AI 凭什么帮我选课？" + 4 transparency points），保留下方 3 列"确定/估算/未知"
- [x] `Home/index.tsx` 移除独立 `<Trust />` 挂载（Trust.tsx 保留 unmounted 备用）
- [x] `tsc --noEmit` 干净通过

### 不要修改

- 全局 Nav / Footer (`src/components/layout/`)
- 落地页 (`src/pages/Home/*`)
- 路由根与配置 (`src/routes/__root.tsx`、`src/router.tsx`、`src/routes/_app.tsx`)
- 路由分组 (`src/routes/_app/*` pathless layout 结构)
- 菜单单一真理 (`src/config/menu.ts`)
- 设计令牌 (`src/styles/variables.css`、`globals.css`)
- 笔记本相关 (`src/components/effects/EmbeddedLaptop.*`、`GridMotion.*`)
- 自动生成 (`src/routeTree.gen.ts`)
- 已有 commit 历史（禁 `git reset` / `git rebase`）

### 完成标准

- [ ] `tsc --noEmit` 干净通过
- [ ] 视觉符合 `DESIGN_SYSTEM.md`（圆角 / 字号 / 按钮 / 语气）
- [ ] 所有「需要做」打钩
- [ ] 没碰「不要修改」
- [ ] commit 已提，message 写清做了什么

### 备注 / 参考

- 持续技术债追踪：`docs/TECH_DEBT.md`
- 一次性深度审计：`docs/ARCHITECTURE_AUDIT.md`

---

## 完成归档

> 保留最近 5–10 条；权威记录在 `git log`，这里只留人话摘要。

- **2026-05-07** — 落地页第二屏文案重写 + 诚实性/Trust 真融合：`HeroLaptopShowcase.tsx` 左侧文案改为"建立信任 / 计算你的整个学业路径"，4 项分析维度用圆圈+勾，GSAP scrub stagger 滚动顺序打钩；`Honesty.tsx` 把原 Trust 块（"一个 AI 凭什么帮我选课？"+ 4 transparency points）与原 3 列（确定/估算/未知）互嵌而非堆叠：trust 主题问句留作 H2，4 transparency 中"每个推荐来自哪条规则"压成 hero 引导语，另外 3 条作为 3 列卡片各自的"提问行"，原 Honesty H2"我们不会假装什么都知道"降为底部收束句；`index.tsx` 卸载独立 `<Trust />`。`tsc --noEmit` clean。
- **2026-05-07** — 一级结构债收敛（不动 UI）：`src/config/menu.ts` 单一真理，`routes/_app.tsx` pathless layout 把 DashboardLayout 上提，6 个功能页 route 移入 `routes/_app/` 并去掉 page 内 import；删除 `components/Navbar`、`components/Sidebar` 旧 stub；`__root.tsx` 加 pass-through Providers 壳。`tsc --noEmit` clean，URL 不变。
- **2026-05-06** — 项目结构整理：`src/pages/Home/index.tsx` 730 行拆分（一 section 一文件），抽 Nav/Footer 到 `layout/`，新增 CourseAnalyzer/Dashboard 骨架，自适应 Nav，Hero SplitText 字符级动画 · `1c26d5f`
- **2026-05-06** — 笔记本细节：`embedded-laptop-base-3d` 加 `transform-style: preserve-3d`，前缘厚度，5×14 真实键独立厚度，hover -2vh（scroll progress > 0.7 才启用） · `db63087`
- **2026-05-06** — CSS 笔记本展示初版：Hero 嵌入 EmbeddedLaptop，ScrollTrigger pin/scrub 缩放+旋转到第二页右侧，GridMotion 改 marquee · `72a8a3b`
