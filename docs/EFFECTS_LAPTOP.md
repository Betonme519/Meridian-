# Effects — 笔记本展示工业件细节

> 这是 `EmbeddedLaptop` 组件特定的视觉规格，不是通用设计规则。改这个组件再来读。
> 主设计文档：`DESIGN_SYSTEM.md`。

---

## 配色（铝合金）

`src/components/effects/EmbeddedLaptop.css`：

```
铝盖渐变      #2c2c2c → #0a0a0a       (lid 外壳)
铝底渐变      #d6d6d6 → #b8b8b8 → #5a5a5a   (base 主面)
铝边高光      #d4d4d4 → #6a6a6a       (前缘 lip)
键盘井底      #0a0a0a → #1a1a1a       (键盘背板)
键面渐变      #2a2a2a → #1a1a1a → #0e0e0e
```

**铁律：不要往金属件里加蓝紫色调。** 中性灰阶才是铝合金。

---

## 阴影 1 — Lid 三层叠加投影

工业产品页常见手法，紧 + 中 + 远三层叠出 ambient grounding：

```css
box-shadow:
  0 2vw 4vw rgba(0, 0, 0, 0.35),
  0 5vw 10vw rgba(0, 0, 0, 0.18),
  0 8vw 18vw rgba(0, 0, 0, 0.08);
```

---

## 阴影 2 — 键帽厚度（solid offset 模拟实心边）

```css
box-shadow:
  inset 0 0.04vw 0 rgba(255, 255, 255, 0.10),  /* 顶部高光 */
  inset 0 -0.03vw 0 rgba(0, 0, 0, 0.5),         /* 底面阴影 */
  0 0.06vw 0 #050505,                            /* 实心底边 = 厚度 */
  0 0.10vw 0.08vw rgba(0, 0, 0, 0.45);           /* 投影 */
```

**记住：阴影不是装饰，是结构表达。** 这里每一层都对应物理上的某个面或边缘。

---

## 滚动驱动（GSAP ScrollTrigger）

笔记本进入 → 缩放定格用 `pin + scrub`：

```tsx
ScrollTrigger.create({
  trigger: containerRef.current,
  start: "top top",
  end: "bottom bottom",
  scrub: 1,
});

gsap.to(laptopEl, {
  scale: 0.32,
  duration: 1.2,
  ease: "power2.out",
});
```

Hover 上抬：`translateY(-2vh)`，**不变 scale，不变 shadow**。
