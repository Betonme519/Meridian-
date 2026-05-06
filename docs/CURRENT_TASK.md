# Current Task

> **本会话/今天要做的事，唯一的真理来源。**
> AI 接手时这份是必读，**优先级高于其它三份文档**。

---

## ⚠️ AI 阅读规则

接手时按这个顺序读：

1. **先读这份** → 知道当前要干什么、不要碰什么
2. 再读 `PROJECT_OVERVIEW.md` → 知道项目是什么
3. 再读 `ARCHITECTURE.md` → 知道代码在哪里
4. 改 UI 时再读 `DESIGN_SYSTEM.md` → 知道怎么写不漂

**铁律：**

- ✅ 只做"需要做"列表里的事
- ✅ 把"不要修改"区域**当作只读**——即使你认为可以顺手优化，也不要动
- ✅ 完成所有项之后停下来汇报，不要自己加东西
- ❌ 不要重写不在列表里的文件
- ❌ 不要因为"觉得这样更好"就动配置 / 路由 / 全局样式
- ❌ 不要装新依赖，除非"需要做"明确写了

如果发现"不要修改"区有阻塞问题——**报告，不要绕开**。

---

## 当前任务（Last updated: 2026-05-06）

> 写新任务时把下面的内容覆盖掉，保持一份。旧任务挪到底部"完成归档"。

### 目标

> 一句话写清这次会话的目标。要具体到能验证。

待填（示例：完成 Dashboard 页面的真实数据流接入 + 移动端布局）

### 需要做

> 列具体步骤。每条要小到能在一次会话内完成。完成后打钩。

- [ ] 待填项 1
- [ ] 待填项 2
- [ ] 待填项 3

### 不要修改

> 这次会话明确不动的区域。AI 看到这里就知道边界。

- 全局 Nav / Footer (`src/components/layout/`)
- 落地页 Home 任何 section (`src/pages/Home/*`)
- 路由根 (`src/routes/__root.tsx`) 和路由配置 (`src/router.tsx`)
- 设计令牌 (`src/styles/variables.css` `globals.css`)
- 笔记本动画相关 (`src/components/effects/EmbeddedLaptop.*` `GridMotion.*`)
- 任何已存在的 commit 历史 (不要 `git reset` / `git rebase`)

### 完成标准

> 怎么算"做完了"。不能含糊。

- [ ] `tsc --noEmit` 干净通过
- [ ] 视觉符合 `DESIGN_SYSTEM.md` 规范（圆角、字号、按钮、文案语气）
- [ ] 所有"需要做"项都打钩
- [ ] 没碰"不要修改"列出的文件
- [ ] 提交了 commit，commit message 写明做了什么

### 备注 / 参考

> 任何对这次任务有帮助的链接、设计稿、参考实现、约定。

- 待填

---

## 完成归档

> 已完成的任务挪到这里，新任务覆盖上方"当前任务"。
> 保留最近 5-10 条作为参考；更老的可以删。

### 2026-05-06 — 项目结构整理 + 新增 SplitText 标题动画

- 拆分 `src/pages/Home/index.tsx` 730 行 → 一 section 一文件
- 抽 Nav/Footer 到 `src/components/layout/`
- 新增 CourseAnalyzer / Dashboard 骨架页
- 自适应 Nav（透明 ↔ 白底）
- Hero 标题 SplitText 字符级动画
- Commit: `1c26d5f`

### 2026-05-06 — 笔记本前缘厚度 + 卡片 hover lift

- 修复 `embedded-laptop-base-3d` 缺 `transform-style: preserve-3d` 导致子元素 3D 旋转被压扁
- 加底座前侧立面厚度（rotateX -90 子元素）
- 键盘改成 5×14 真实 div 键，每键独立厚度
- 鼠标 hover 笔记本上抬 -2vh，scroll progress > 0.7 时启用
- Commit: `db63087`

### 2026-05-06 — CSS 笔记本展示初版

- Hero 嵌入到 EmbeddedLaptop 内
- ScrollTrigger pin/scrub 缩放 + 旋转到第二页右侧
- GridMotion 改为自动循环（marquee）
- Commit: `72a8a3b`
