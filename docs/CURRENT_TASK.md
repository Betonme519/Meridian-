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

## 当前任务（Last updated: 2026-05-06）

> 新任务覆盖此区，旧的挪到「完成归档」。

### 目标

> 一句话，要具体到能验证。

待填（例：完成 Dashboard 页面真实数据流接入 + 移动端布局）

### 需要做

> 每条要小到能在一次会话内完成。

- [ ] 待填项 1
- [ ] 待填项 2

### 不要修改

- 全局 Nav / Footer (`src/components/layout/`)
- 落地页 (`src/pages/Home/*`)
- 路由根与配置 (`src/routes/__root.tsx`、`src/router.tsx`)
- 设计令牌 (`src/styles/variables.css`、`globals.css`)
- 笔记本相关 (`src/components/effects/EmbeddedLaptop.*`、`GridMotion.*`)
- 已有 commit 历史（禁 `git reset` / `git rebase`）

### 完成标准

- [ ] `tsc --noEmit` 干净通过
- [ ] 视觉符合 `DESIGN_SYSTEM.md`（圆角 / 字号 / 按钮 / 语气）
- [ ] 所有「需要做」打钩
- [ ] 没碰「不要修改」
- [ ] commit 已提，message 写清做了什么

### 备注 / 参考

- 待填

---

## 完成归档

> 保留最近 5–10 条；权威记录在 `git log`，这里只留人话摘要。

- **2026-05-06** — 项目结构整理：`src/pages/Home/index.tsx` 730 行拆分（一 section 一文件），抽 Nav/Footer 到 `layout/`，新增 CourseAnalyzer/Dashboard 骨架，自适应 Nav，Hero SplitText 字符级动画 · `1c26d5f`
- **2026-05-06** — 笔记本细节：`embedded-laptop-base-3d` 加 `transform-style: preserve-3d`，前缘厚度，5×14 真实键独立厚度，hover -2vh（scroll progress > 0.7 才启用） · `db63087`
- **2026-05-06** — CSS 笔记本展示初版：Hero 嵌入 EmbeddedLaptop，ScrollTrigger pin/scrub 缩放+旋转到第二页右侧，GridMotion 改 marquee · `72a8a3b`
