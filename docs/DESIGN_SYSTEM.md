# Meridian — Design System

---

## 风格关键词

```
✅ Clean   ✅ Academic   ✅ Apple-like   ✅ Calm
✅ 低饱和   ✅ 大量留白    ✅ 文字密度高   ✅ 可信
✅ 一点生活感（微小温度，不冷冰冰）

❌ Cyberpunk  ❌ 霓虹  ❌ 渐变光晕  ❌ 拟物
❌ 重投影     ❌ 满屏动画  ❌ 营销腔  ❌ 弹跳卡通
```

**心智模型：** 像 Linear、Apple 产品页、Stripe Docs 的混合。**不像** Vercel Geist 那种激进、不像 Webflow 模板那种花哨。

**生活感的边界：** 主调依然克制学术，仅允许在**微交互温度**和**极少量暖色点缀**上松一点（hover 慢一点、文案更亲、emerald/amber 之外可考虑一抹淡 peach 做友好提示）。**不动**配色铁律、不动圆角铁律、不动动画 ease 铁律。

---

## 1. 颜色

颜色定义在 `src/styles/variables.css`，注册到 `globals.css` 的 `@theme inline` 后映射成 Tailwind 工具类（`bg-primary` / `text-foreground` 等）。**用 token，不写死颜色。**

### 语义层（首选）

| Token | Light (oklch) | Dark | 用途 |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` 纯白 | `oklch(0.129 0.042 264.695)` | 页面底色 |
| `--foreground` | 近黑 | 近白 | 主要文字 |
| `--muted-foreground` | 中灰 | 浅灰 | 次要文字 |
| `--card` | 白 | 暗 | 卡片底色 |
| `--border` | 浅灰 | 半透白 10% | 边框 |
| `--primary` | 近黑 | 浅灰 | 主按钮 |
| `--secondary` / `--accent` | 浅灰 | 中暗 | 次按钮 / 高亮区 |
| `--destructive` | 红 | 红 | 删除 / 警告 |

### 语义标记色（仅用于"确定/估算/未知"等分类）

| 类别 | Tailwind |
|---|---|
| 确定 / 推荐 / 正面 | `bg-emerald-50 text-emerald-700 border-emerald-200` |
| 估算 / 风险 / 中性 | `bg-amber-50 text-amber-700 border-amber-200` |
| 未知 / 数据来源 | `bg-gray-100 text-gray-700 border-gray-300` |
| 错误 | `bg-red-50 text-red-700` |

### 铁律

- 大面积纯色背景 **只用** `--background` / 白 / 深黑
- 标记色 **永远只在小色块**（pill / icon / 边框），不能撑成整个 section 背景

> 笔记本铝合金 / 键盘等工业件配色见 `EFFECTS_LAPTOP.md`。

---

## 2. 字体

主字体 **Inter**（Google Fonts，权重 400/500/600/700，在 `src/routes/__root.tsx` 引入），body 全局 `font-family: 'Inter', sans-serif;`。

### 字号阶

| 用途 | 类 |
|---|---|
| 顶级标题 | `text-4xl md:text-6xl lg:text-[68px]` |
| 区段大标题 | `text-3xl md:text-5xl` |
| 子标题 | `text-xl` |
| 正文 | `text-base` |
| 小字 | `text-sm` |
| 注释 / 标签 | `text-xs` |

### 字重 + tracking

- 标题 → `font-semibold tracking-tight`
- 正文 → 默认（`font-normal`），**不要 `font-bold`**
- 小标签 / kicker → `font-medium tracking-widest uppercase`

**项目所有 section "kicker" 标准写法：**

```jsx
<p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
  建立信任
</p>
```

---

## 3. 间距 + 半径

### 间距

- Section padding：`py-24`（标准）/ `py-28`（重要 CTA）
- 元素 gap：`gap-3 / 4 / 6 / 8`
- 容器宽度：`max-w-md` ~ `max-w-7xl`

**铁律：与其加内容，不如加留白。**

### 圆角

```
--radius: 0.625rem  /* 10px 基线 */
```

| Token | 用途 |
|---|---|
| `rounded-md` | 输入框 |
| `rounded-lg` | 标准按钮 |
| `rounded-xl` | 小卡片 |
| `rounded-2xl` | **落地页卡片默认** |
| `rounded-3xl` | 大型展示块 |
| `rounded-full` | **CTA 按钮 / pill** |

**只用 `rounded-2xl` 和 `rounded-full`**，中间值不要乱跳。

---

## 4. 按钮

**形状铁律：永远 `rounded-full`（Apple/Linear 风），hover 只换颜色，不要 scale，不要 shadow 跳变。**

代表样式（主按钮）：

```jsx
<a className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
  开始分析
</a>
```

尺寸阶（padding）：

| 大小 | padding | text |
|---|---|---|
| 小 | `px-5 py-2.5` | `text-sm font-medium` |
| 中 | `px-7 py-3.5` | `text-base font-medium` |
| 大 CTA | `px-8 py-4` | `text-base font-medium` |

深色背景上的次按钮把底色换成 `rgba(255,255,255,0.95)` + `text-black`。Final CTA 加 `<ArrowRight className="w-4 h-4" />`。

---

## 5. 卡片

**统一规格：`rounded-2xl` + `border` + 内 padding `p-5/p-6/p-7`。**

代表样式：

```jsx
<div className="bg-white rounded-2xl border border-gray-200 p-6">...</div>
```

### Hover 卡（流程 / 风险卡）

`hover` **只换边框颜色**，不变 shadow / 不变 scale：

```jsx
<div className="rounded-xl border border-gray-200 hover:border-black transition-colors p-5">
```

### 高亮 / 暗色对比变体

- 高亮：`border-amber-300 ring-2 ring-amber-100`
- 暗色对比（GPA 公式那种）：`bg-black text-white rounded-2xl p-8 md:p-12`

---

## 6. 阴影

**落地页几乎不用 box-shadow。靠 border + 留白制造层次。**

例外：
- shadcn 的 `Dialog` / `DropdownMenu` 自带 shadow，**不要覆盖**
- 笔记本展示 / 键帽厚度 → `EFFECTS_LAPTOP.md`

> 阴影不是装饰，是结构表达。一般 UI 不需要结构表达。

---

## 7. 动画规范

### 时长 + ease

| 类别 | 时长 | ease |
|---|---|---|
| 微交互（hover 变色） | 0.2s ~ 0.3s | `transition-colors` |
| 卡片浮起 / Nav 切换 | 0.3s ~ 0.55s | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| 入场（fade-up） | 0.6s ~ 0.9s | `power3.out` / `power2.out` |
| 滚动驱动转场 | 1.2s 时间线，`scrub: 1` | `power2.out` |

**铁律：所有交互一律 `out` 或 `inOut`，绝对不用 `bounce` / `back` / `elastic`。**

### 代表用法（GSAP）

```tsx
gsap.to(el, { scale: 0.32, duration: 1.2, ease: "power2.out" });
```

首页大字 SplitText（字符级 fade-up，stagger 40ms，单字 0.9s，`from {opacity:0, y:50}`，`ease: power3.out`）。

### CSS keyframes 工具类（`styles/animations.css`）

| 类 | 效果 | 时长 |
|---|---|---|
| `.animate-fade-in-up` | 从 30px 下方淡入 | 0.6s |
| `.animate-fade-in-overlay` | 渐显 | 0.4s |
| `.animate-slide-up-overlay` | 渐显 + 居中 transform | 0.5s |

延迟用 inline `animationDelay`：

```jsx
<div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.2s" }}>
```

### Hover 原则

- **位移而不是变形**：`translateY(-2vh)` OK，`scale(1.05)` 别滥用
- **颜色变化柔和**：Tailwind `transition-colors` 默认 150ms 够用
- **不连锁**：单一元素一个 hover 动效，不要又位移又变色又投影又旋转

---

## 8. 图标

**lucide-react，不混用其它图标库。** 颜色默认 `text-current` 继承父级。

```tsx
import { ArrowRight, CheckCircle2 } from "lucide-react";
<CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
```

尺寸：

| 场景 | 尺寸 |
|---|---|
| 内联文字旁 | `w-3.5` ~ `w-4` |
| 卡片内主图标 | `w-5` |
| 大型 feature（带 `rounded-xl` 块底） | `w-8` ~ `w-11` |

---

## 9. 写作风格（UI copy）

> 文字写错了再美的视觉也不会救。

### 语气

- **直接，不绕弯**：✅ "这不是黑箱，是流程"　❌ "致力于打造透明可信的智能化解决方案"
- **承认局限**：项目有专门的 "我们不会假装什么都知道" section
- **用"你"，不用"您"**
- **数字要绝对**：✅ "通过率 78%"　❌ "通过率较高"
- **句子短**：> 25 字拆开
- **生活感的允许尺度**：可以更亲，但不能撒娇——避免任何"嘿~""走起""快来玩转 GPA 吧"这种语气

### 标点 + 排版

- 中文用全角 `，` `。`，引号用直引号 `"..."`（不要 `「」` `『』`）
- **英数字两侧加空格**：✅ "选课前 3 分钟" / "GPA 4.0 学生"

### 永远不写的词

```
❌ 全方位赋能 / 一站式 / 颠覆性 / 智能化 / 数字化转型
❌ 极致 / 卓越 / 震撼 / 突破
❌ 让 ... 变得简单
❌ 刷分 / 钻空子 / 绕过规则     （合规红线，对外文案严禁）
```

### 鼓励写的词

```
✅ 看清 / 搞清 / 算清
✅ 风险 / 偏差 / 估算 / 来源
✅ 你的学校 / 你的规则 / 你的决定
✅ 把时间留给生活 / 不焦虑 / 高效
```

---

## 10. 响应式断点

```
sm   640px      md   768px ★主断点
lg   1024px     xl   1280px
```

实际用法：

- 标题大字 `text-4xl md:text-6xl lg:text-[68px]` — 三档
- 卡片 grid 主流 `grid md:grid-cols-2` 或 `grid md:grid-cols-3`
- 小屏隐藏 `hidden md:flex`（导航链接）
- **移动端不写复杂 hover**

---

## 文档同步

改了 `variables.css` / `animations.css` / 引入新视觉 pattern → **顺手更新这份文档**。否则下一个 agent 接手会风格漂移。
