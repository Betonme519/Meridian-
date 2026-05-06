# Meridian — Design System

> 风格说明 + token 清单。新接手的 AI 接进来先读这一份再写任何 UI。

---

## 风格关键词

```
✅ Clean   ✅ Academic   ✅ Apple-like   ✅ Calm
✅ 低饱和   ✅ 大量留白    ✅ 文字密度高   ✅ 可信

❌ Cyberpunk  ❌ 霓虹  ❌ 渐变光晕  ❌ 拟物
❌ 重投影     ❌ 满屏动画  ❌ 营销腔  ❌ 弹跳卡通
```

**心智模型：** 像 Linear、Apple 产品页、Stripe Docs 的混合。**不像** Vercel Geist 那种激进、不像 Webflow 模板那种花哨。

---

## 1. 颜色

### 实现：oklch 色彩空间

颜色定义在 `src/styles/variables.css`，注册到 `globals.css` 的 `@theme inline` 后映射成 Tailwind 工具类（`bg-primary`, `text-foreground` 等）。

### 语义层（建议优先用这层）

| Token | Light (oklch) | Dark | 用途 |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` 纯白 | `oklch(0.129 0.042 264.695)` | 页面底色 |
| `--foreground` | `oklch(0.129 ...)` 近黑 | 近白 | 主要文字 |
| `--muted-foreground` | `oklch(0.554 ...)` 中灰 | 浅灰 | 次要文字 / 注释 |
| `--card` | 白 | 暗 | 卡片底色 |
| `--border` | `oklch(0.929 ...)` 浅灰 | 半透白 10% | 卡片 / 输入框边 |
| `--primary` | 近黑 | 浅灰 | 主按钮 |
| `--secondary` | 浅灰 | 中暗 | 次按钮 |
| `--accent` | 浅灰 | 中暗 | 高亮区域 |
| `--destructive` | 红 | 红 | 删除 / 警告 |

### 语义标记色（仅用于"确定/估算/未知"或类似分类）

| 类别 | Tailwind 类 | 实际色 |
|---|---|---|
| 确定 / 推荐 / 正面 | `bg-emerald-50 text-emerald-700 border-emerald-200` | 翠绿 |
| 估算 / 风险 / 中性 | `bg-amber-50 text-amber-700 border-amber-200` | 琥珀 |
| 未知 / 数据来源 | `bg-gray-100 text-gray-700 border-gray-300` | 灰 |
| 错误 | `bg-red-50 text-red-700` | 红 |

**铁律：**
- 大面积纯色背景 → **只用 `--background` / 白 / 深黑**
- 标记色 **永远只在小色块** 上（pill / icon / 边框），不能撑成整个 section 背景

### 笔记本 / 工业件配色

`src/components/effects/EmbeddedLaptop.css` 用了固定灰阶模拟铝合金：

```
铝盖渐变      #2c2c2c → #0a0a0a       (lid 外壳)
铝底渐变      #d6d6d6 → #b8b8b8 → #5a5a5a   (base 主面)
铝边高光      #d4d4d4 → #6a6a6a       (前缘 lip)
键盘井底      #0a0a0a → #1a1a1a       (键盘背板)
键面渐变      #2a2a2a → #1a1a1a → #0e0e0e
```

不要往金属件里加蓝紫色调。

---

## 2. 字体

### 主字体：Inter

通过 Google Fonts 在 `src/routes/__root.tsx` 引入，权重 400 / 500 / 600 / 700。

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
```

**body 全局 `font-family: 'Inter', sans-serif;`**（在 `globals.css` 的 `@layer base` 里）

### 字号阶（Tailwind 默认 + 自定义大字）

| 用途 | 类 | 像素 |
|---|---|---|
| 顶级标题 | `text-4xl md:text-6xl lg:text-[68px]` | 36 / 60 / 68 |
| 区段大标题 | `text-3xl md:text-5xl` | 30 / 48 |
| 子标题 | `text-xl` | 20 |
| 正文 | `text-base` | 16 |
| 小字 | `text-sm` | 14 |
| 注释 / 标签 | `text-xs` | 12 |

### 字重 + tracking 默认

- 标题 → `font-semibold tracking-tight`
- 正文 → 默认（`font-normal`），不要 `font-bold`
- 小标签 / uppercase → `font-medium tracking-widest`

```jsx
<p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
  建立信任
</p>
```

这套 `text-xs + tracking-widest + uppercase + 灰色` 是项目里所有 section "kicker" 的标准写法。

---

## 3. 间距 + 半径

### 间距语言（Tailwind spacing scale）

- Section 上下 padding：`py-24`（landing 标准）/ `py-28`（重要 CTA）
- 元素 gap：`gap-3 / gap-4 / gap-6 / gap-8`
- 段落间 margin：`mb-4 / mb-6 / mb-10`
- 容器最大宽：`max-w-md / max-w-2xl / max-w-4xl / max-w-5xl / max-w-6xl / max-w-7xl`

**铁律：** 与其加内容，不如加留白。section 之间的呼吸 > 信息密度。

### 圆角

```
--radius: 0.625rem  /* 10px 基线 */
```

派生：

| Token | px | 用途 |
|---|---|---|
| `rounded-md` | 6 | 输入框 / 小按钮 |
| `rounded-lg` | 8 | 标准按钮 |
| `rounded-xl` | 12 | 卡片 |
| `rounded-2xl` | 16 | 重要卡片 / 图卡（landing 主流） |
| `rounded-3xl` | 24 | 大型展示块 |
| `rounded-full` | — | pill / 头像 / CTA 按钮 |

**项目里 `rounded-2xl` 是落地页卡片默认。** `rounded-full` 用在 CTA 按钮上。

---

## 4. 按钮

### 主按钮（Primary）

```jsx
<a className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
  开始分析
</a>
```

### 次按钮（在深色背景上）

```jsx
<a className="text-black px-7 py-3.5 rounded-full text-base font-medium transition-colors"
   style={{ background: 'rgba(255,255,255,0.95)' }}>
  开始分析
</a>
```

### Final CTA（大按钮）

```jsx
<a className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors">
  立即开始
  <ArrowRight className="w-4 h-4" />
</a>
```

### 形状规范

- **永远 `rounded-full`**（Apple/Linear 风）
- padding：`px-5 py-2.5`（小）/ `px-7 py-3.5`（中）/ `px-8 py-4`（大 CTA）
- 文字：`text-sm font-medium` / `text-base font-medium`
- hover：颜色 +10~15% 暗，**不要 scale，不要 shadow 跳变**

---

## 5. 卡片

### 标准卡片

```jsx
<div className="bg-white rounded-2xl border border-gray-200 p-6">
  ...
</div>
```

### Hover 卡片（流程步骤、风险卡）

```jsx
<div className="rounded-xl border border-gray-200 hover:border-black transition-colors p-5">
  ...
</div>
```

`hover` 仅换边框颜色，**不要变 shadow / 变 scale**。

### 高亮卡（强调一项）

```jsx
<div className="bg-white rounded-2xl border-amber-300 ring-2 ring-amber-100 p-6">
  ...
</div>
```

### 暗色对比卡（GPA 公式那种）

```jsx
<div className="bg-black text-white rounded-2xl p-8 md:p-12">
  ...
</div>
```

**项目里所有卡都是 `rounded-2xl` + `border` + 内 padding `p-5/p-6/p-7`，统一这个比例。**

---

## 6. 阴影

### 落地页 — 几乎不用 box-shadow

文字 / 卡片 / 按钮上 **不加阴影**。靠 border + 留白制造层次。

### 例外 1：笔记本展示

`EmbeddedLaptop` 的 lid 用了 3 层叠加投影做工业感（产品页常见）：

```css
box-shadow:
  0 2vw 4vw rgba(0, 0, 0, 0.35),
  0 5vw 10vw rgba(0, 0, 0, 0.18),
  0 8vw 18vw rgba(0, 0, 0, 0.08);
```

紧 + 中 + 远，三层叠出 ambient grounding。

### 例外 2：弹层 / Modal（shadcn 自带）

shadcn 的 `Dialog` / `DropdownMenu` 自带 shadow，不要覆盖。

### 例外 3：键盘键厚度

`box-shadow` 用 solid offset 模拟实心边：

```css
box-shadow:
  inset 0 0.04vw 0 rgba(255, 255, 255, 0.10),  /* 顶部高光 */
  inset 0 -0.03vw 0 rgba(0, 0, 0, 0.5),         /* 底面阴影 */
  0 0.06vw 0 #050505,                            /* 实心底边 = 厚度 */
  0 0.10vw 0.08vw rgba(0, 0, 0, 0.45);           /* 投影 */
```

**记住：阴影不是装饰，是结构表达。**

---

## 7. 动画规范

### 时长

| 类别 | 时长 | ease |
|---|---|---|
| 微交互（hover 变色） | `0.2s` ~ `0.3s` | `ease` / `transition-colors` |
| 卡片浮起 / Nav 切换 | `0.3s` ~ `0.55s` | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| 入场（fade-up） | `0.6s` ~ `0.9s` | `power3.out` / `power2.out` |
| 滚动驱动转场 | `1.2s` 时间线，`scrub: 1` | `power2.out` |

**铁律：所有交互动画都是 `out` 或 `inOut`，绝对不用 `bounce` / `back` / `elastic`。** 学术感的项目要"稳"。

### GSAP 用法

```tsx
gsap.to(el, {
  scale: 0.32,
  duration: 1.2,
  ease: "power2.out",
});
```

### ScrollTrigger 滚动驱动

笔记本展示用 `pin + scrub` 模式：

```tsx
ScrollTrigger.create({
  trigger: containerRef.current,
  start: "top top",
  end: "bottom bottom",
  scrub: 1,
});
```

### SplitText 字符级入场

首页大标题用：

```tsx
<SplitText
  text="..."
  splitType="chars"
  delay={40}                      // ms 字间 stagger
  duration={0.9}                  // s 单字
  from={{ opacity: 0, y: 50 }}
  to={{ opacity: 1, y: 0 }}
  ease="power3.out"
/>
```

### CSS keyframes（`styles/animations.css`）

预定义的工具类：

| 类 | 效果 | 时长 |
|---|---|---|
| `.animate-fade-in-up` | 从 30px 下方淡入 | 0.6s |
| `.animate-fade-in-overlay` | 渐显 | 0.4s |
| `.animate-slide-up-overlay` | 渐显 + 居中 transform | 0.5s |

入场延迟用 inline `animationDelay`：

```jsx
<div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.2s" }}>
```

### Hover 动效原则

- **位移而不是变形**：`translateY(-2vh)` 卡片浮起 OK；`scale(1.05)` 别滥用
- **颜色变化柔和**：`transition-colors` (Tailwind 默认 150ms) 够用
- **不连锁**：单一元素一个 hover 动效，不要又位移又变色又投影又旋转

---

## 8. 图标

**用 lucide-react，不混用其它图标库。**

```tsx
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";

<CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
```

尺寸约定：

- 内联文字旁 `w-3.5 h-3.5` ~ `w-4 h-4`
- 卡片内主图标 `w-5 h-5`
- 大型 feature 图标 `w-8 h-8` ~ `w-11 h-11`（带圆角块底 `rounded-xl`）

颜色：默认 `text-current` 继承父级。语义图标用 `text-emerald-500` / `text-amber-500` 等。

---

## 9. 写作风格（UI copy）

> 这是设计系统的一部分。文字写错了再美的视觉也不会救。

### 语气

- **直接，不绕弯**：✅ "这不是黑箱，这是流程" ❌ "我们致力于打造透明可信的智能化解决方案"
- **承认局限**：项目专门有 "我们不会假装什么都知道" section
- **用"你"不用"您"**
- **数字要绝对**：✅ "通过率 78%" ❌ "通过率较高"
- **句子短**：> 25 字的句子拆开

### 标点

- 中文用全角逗号 `，`、句号 `。`
- 句子里穿插英文 / 数字时，前后**不加空格**：✅ "选课前 3 分钟搞清规则" ❌ "选课前3分钟"
- 等等，反例错了，规则是**英数字两侧加空格**：✅ "选课前 3 分钟" ✅ "GPA 4.0 学生" — 这是项目实际用法

### 引号

- 中文用直引号 `"..."`（项目里用的是这个）
- 不要用 `「...」` `『...』`

### 永远不写的词

```
❌ 全方位赋能 / 一站式 / 颠覆性 / 智能化 / 数字化转型
❌ 极致 / 卓越 / 震撼 / 突破
❌ 让 ... 变得简单（陈词滥调）
```

### 鼓励写的词

```
✅ 看清 / 搞清 / 算清
✅ 风险 / 偏差 / 估算 / 来源
✅ 你的学校 / 你的规则 / 你的决定
```

---

## 10. 响应式断点

```
sm   640px   小手机横屏
md   768px   平板 + 大手机横屏（项目主断点）
lg   1024px  小笔记本（许多布局开始 grid）
xl   1280px  桌面
```

### 项目实际用法

- 标题大字 `text-4xl md:text-6xl lg:text-[68px]` — 三档
- 卡片 grid 主流 `grid md:grid-cols-2` 或 `grid md:grid-cols-3`
- 隐藏在小屏 `hidden md:flex`（导航链接）
- 移动端不写复杂 hover（默认就够）

---

## 11. 检查清单（PR 前过一遍）

- [ ] 用了 token 而不是写死颜色（`bg-background` 而不是 `bg-white`）
- [ ] 圆角是 `rounded-2xl` / `rounded-full`，不要中间值
- [ ] 没加多余 box-shadow
- [ ] hover 只动一个属性
- [ ] 动画 ease 是 `out` / `inOut`，不是 `bounce`
- [ ] 标题用 `font-semibold tracking-tight`
- [ ] 小 kicker 是 `text-xs font-medium tracking-widest uppercase`
- [ ] 没用禁词（"全方位赋能" 等）
- [ ] 中英文之间有空格
- [ ] 视口断点是 `md:` 优先

---

## 文档同步

修改了任何设计令牌（`variables.css`）、加了新动画工具类（`animations.css`）、引入了新视觉 pattern——**改完顺手更新这份文档**。否则下一个 agent 接手会风格漂移。
