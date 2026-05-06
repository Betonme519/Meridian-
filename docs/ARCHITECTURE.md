# Meridian — Architecture

> 文件结构、数据流、API、状态管理。新接手的 AI 读这份立刻清醒。

---

## 1. 顶层目录结构

```
.
├─ public/                           ← 静态资源（图片直接公开访问，如 "首页 (1).jpg"）
├─ src/                              ← 全部应用代码（详见下方）
├─ docs/                             ← 项目文档（你正在看）
├─ .tanstack/                        ← TanStack 构建产物（.gitignore）
├─ package.json                      ← bun + npm 兼容
├─ tsconfig.json                     ← strict + 路径别名 @/* → ./src/*
├─ vite.config.ts                    ← @lovable.dev/vite-tanstack-config 一行预设
├─ wrangler.jsonc                    ← Cloudflare Workers 部署配置
└─ components.json                   ← shadcn/ui CLI 配置
```

---

## 2. src/ 详细结构

```
src/
├─ pages/                            ← 业务页面，一页一目录
│  ├─ Home/                          ← 落地页（已实现）
│  │  ├─ index.tsx                   ← 组合各 section 的 shell（30 行）
│  │  ├─ Hero.tsx                    ← Hero 区（GridMotion 背景 + 大标题 + CTA）
│  │  ├─ HeroLaptopShowcase.tsx      ← 滚动驱动的笔记本展示（GSAP ScrollTrigger）
│  │  ├─ Trust.tsx                   ← 建立信任 section（暂未挂载，保留复用）
│  │  ├─ Flow.tsx                    ← 三步流程
│  │  ├─ Explain.tsx                 ← 可解释性课程卡示例
│  │  ├─ GpaMath.tsx                 ← GPA 公式展示
│  │  ├─ Honesty.tsx                 ← 确定/估算/未知三栏
│  │  ├─ Control.tsx                 ← 风险与控制权
│  │  ├─ Feedback.tsx                ← 真实反馈卡（含偏差案例）
│  │  ├─ FinalCTA.tsx                ← 底部 CTA
│  │  └─ Home.css                    ← Home 专用 CSS（占位）
│  │
│  ├─ CourseAnalyzer/                ← 课程分析页（骨架）
│  │  ├─ index.tsx
│  │  ├─ UploadPanel.tsx
│  │  ├─ AnalysisResult.tsx
│  │  └─ CourseAnalyzer.css
│  │
│  ├─ Dashboard/                     ← 学生仪表盘（骨架）
│  │  ├─ index.tsx
│  │  ├─ GPAWidget.tsx
│  │  ├─ RiskCard.tsx
│  │  └─ Dashboard.css
│  │
│  └─ Planner / Courses / Upload / AIAdvisor / Profile / ← 早期占位，待整合
│
├─ components/
│  ├─ common/                        ← 业务通用组件（暂占位）
│  ├─ layout/                        ← 跨页面布局组件
│  │  ├─ Navbar.tsx                  ← 自适应顶栏（透明 ↔ 白底）
│  │  ├─ Footer.tsx                  ← 站点底部
│  │  └─ PageShell.tsx               ← Nav + main + Footer 标准壳
│  ├─ effects/                       ← 视觉效果组件
│  │  ├─ GridMotion.tsx + .css       ← Hero 背景图墙，自动循环滚动
│  │  ├─ EmbeddedLaptop.tsx + .css   ← 3D 伪笔记本（lid + 键盘 + 厚度）
│  │  ├─ LaptopFrame.tsx + .css      ← 旧版独立笔记本（已不用，留作 fallback）
│  │  └─ SplitText.tsx               ← 字符级 fade-up 文字动画
│  └─ ui/                            ← shadcn/ui 50+ Radix primitives，不要重复写
│
├─ context/                          ← React Context 全局状态
│  ├─ AuthContext.tsx                ← 用户登录状态（待接入）
│  └─ UserContext.tsx                ← 用户画像 / 偏好（待接入）
│
├─ hooks/                            ← 自定义 React hooks
│  ├─ useAuth.ts                     ← 包装 AuthContext
│  ├─ useCourses.ts                  ← 课程列表 hook
│  ├─ usePlanner.ts                  ← 规划器 hook
│  └─ use-mobile.tsx                 ← shadcn 自带视口检测
│
├─ api/                              ← 前端调用 Cloudflare Worker 的封装
│  ├─ authApi.ts                     ← 登录 / 注册（待接入）
│  ├─ courseApi.ts                   ← 课程 CRUD
│  ├─ plannerApi.ts                  ← 选课规划
│  └─ aiApi.ts                       ← AI 推荐 / 解析
│
├─ services/                         ← 业务逻辑层（不直接 fetch）
│  ├─ recommendationService.ts       ← 推荐打分逻辑
│  ├─ gpaService.ts                  ← GPA 计算引擎
│  └─ ragService.ts                  ← 学校手册 RAG 检索
│
├─ data/                             ← Mock 数据 / 种子数据
│  ├─ mockCourses.ts
│  └─ userProfile.ts
│
├─ utils/                            ← 纯函数工具
│  ├─ calculateGPA.ts                ← 加权平均计算
│  └─ format.ts                      ← 数字 / 日期 / 文本格式化
│
├─ assets/                           ← 项目内静态资源（与 public 区分）
│  ├─ images/  icons/  logos/        ← 通过 import 引用的资源
│
├─ styles/
│  ├─ globals.css                    ← Tailwind 入口 + @theme inline
│  ├─ variables.css                  ← 设计令牌（oklch 色阶 + radius）
│  └─ animations.css                 ← @keyframes + .animate-* 工具类
│
├─ layouts/                          ← 旧版页面骨架（待与 components/layout 整合）
├─ lib/utils.ts                      ← shadcn 标配 cn() 等工具
├─ routes/                           ← TanStack Router 文件式路由
│  ├─ __root.tsx                     ← 根布局（HTML shell + meta + 错误页）
│  └─ index.tsx                      ← `/` 路由 → 渲染 Home
├─ router.tsx                        ← createRouter 配置（错误组件 / 滚动恢复）
├─ routeTree.gen.ts                  ← 自动生成，不要手改
└─ styles.css                        ← 已弃用（已迁到 styles/globals.css）
```

---

## 3. 每层职责（一句话）

| 层 | 干什么 | 不能干什么 |
|---|---|---|
| `pages/*/` | 页面级组合 + section JSX | 不写复用组件、不直接 fetch |
| `components/layout/` | 全站布局壳（Nav / Footer） | 不写业务逻辑 |
| `components/common/` | 业务通用 UI（卡片包装等） | 不嵌入特定页面状态 |
| `components/effects/` | 视觉特效（动画、3D） | 不写业务数据 |
| `components/ui/` | shadcn 原子组件（不要改不要重写） | — |
| `hooks/` | React 状态封装（订阅 context、订阅 API） | 不写组件 |
| `context/` | 全局 React Context 实例 + Provider | 不写业务计算 |
| `api/` | 调 Cloudflare Worker 的薄壳，返回 typed Promise | 不写业务规则、不缓存 |
| `services/` | 业务规则、跨 API 协调、数据映射 | 不直接 fetch（用 api 层） |
| `data/` | Mock / 种子数据 | 不写函数 |
| `utils/` | 纯函数（无副作用） | 不引用 React、不引用 fetch |
| `styles/` | 全局样式 + token | 不写组件级样式（用 Tailwind / 同名 .css） |

---

## 4. 数据流

### 总图

```
┌────────────────────────────────────────────────────────────────────┐
│                          User (Browser)                            │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│          pages/*/  (UI components, JSX 编排)                       │
│                                 │                                  │
│                                 ▼                                  │
│  hooks/ (useAuth, useCourses…)  ←──  context/  ←── React Provider  │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│      services/  (业务规则: GPA 计算、推荐打分、RAG 检索)           │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│         api/  (前端 SDK：fetch 封装、错误处理、类型定义)           │
└────────────────────────────────────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│   Cloudflare Worker  (后端: 路由 + 业务执行 + 数据库连接)          │
│        ├─ KV / D1 / R2  (持久化)                                   │
│        ├─ AI 调用 (RAG, embeddings, 学校手册解析)                  │
│        └─ 第三方 API                                               │
└────────────────────────────────────────────────────────────────────┘
```

### 单向数据流原则

- **UI 只读 hooks** → hooks 订阅 context → context 唯一 Provider
- **写操作走 services**：组件不直接调 api，组件 → services → api
- **api 只负责传输**：不在 api 层判业务条件、不缓存
- **services 是业务的家**：所有 GPA / 风险 / 推荐计算都在 services 写

---

## 5. API 怎么走

### 命名约定

```
src/api/<domain>Api.ts
```

每个 domain 一个文件，导出函数命名 `<verb><Noun>`：

```ts
// src/api/courseApi.ts
export async function listCourses(params: ListCoursesParams): Promise<Course[]> {
  return fetchJson("/api/courses", params);
}

export async function getCourse(id: string): Promise<Course> {
  return fetchJson(`/api/courses/${id}`);
}
```

### 与后端约定

- 路径前缀：`/api/`（Worker 路由）
- 返回 JSON，错误结构统一：`{ error: { code, message } }`
- 鉴权：cookie session（Worker 颁发）

### TBD（待定）

- ⏳ Worker 项目骨架还没建（`/workers/` 目录会和 `/src/` 平级）
- ⏳ 数据库选型：D1 (SQLite) vs KV，看场景
- ⏳ 学校手册 RAG：用 Cloudflare Vectorize 还是外部向量库

---

## 6. 状态管理

### 选型：React Context（项目当前规模够用）

```ts
// src/context/AuthContext.tsx
export const AuthContext = createContext<AuthContextValue | null>(null);

// src/hooks/useAuth.ts
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
```

### Provider 挂载点

`src/routes/__root.tsx` 的 `RootShell` 是包所有 Provider 的地方：

```tsx
<AuthProvider>
  <UserProvider>
    {children}
  </UserProvider>
</AuthProvider>
```

### 拆 Context 的原则

| Context | 内容 |
|---|---|
| `AuthContext` | login / logout / 当前用户 id / token |
| `UserContext` | 用户画像（学校、专业、年级、目标 GPA） |
| 后续可加 `PlannerContext` | 当前选课草稿 |
| 后续可加 `ToastContext` | 全局提示 |

### 什么时候升级到 Zustand / Redux？

- Context 触发的 re-render 影响性能
- 需要跨页面 atomic update（不太可能）
- 当前项目**短期不需要**

---

## 7. 路由

### TanStack Router 文件式

```
src/routes/
├─ __root.tsx       ← 根布局（HTML / head / meta / Provider 挂载点）
├─ index.tsx        ← `/`
└─ (auto-gen) routeTree.gen.ts
```

### 增加新路由

直接在 `routes/` 创建 `.tsx`：

```tsx
// src/routes/dashboard.tsx
import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "@/pages/Dashboard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});
```

`routeTree.gen.ts` 自动重生成，不要手改。

---

## 8. 多 agent 协作（这个项目的真实使用场景）

### 协作约定

| 区域 | 风险 | 谁能改 |
|---|---|---|
| `pages/Home/<Section>.tsx` | 各自独立 | 任意 agent，不冲突 |
| `pages/Home/index.tsx` | 加新 section 时改 | 协调点，约定一人改 |
| `components/layout/Navbar.tsx` | 全站影响 | layout owner |
| `styles/globals.css` `variables.css` | 设计系统全局 | design system owner |
| `package.json` | 依赖锁定 | 慎用 `bun add` |
| `routes/__root.tsx` | 路由根 | 路由 owner |
| `services/*` | 业务规则 | 一个业务一个 owner |

### 分支命名

```
feature/<page>-<area>     → feature/home-feedback, feature/dashboard-gpa
fix/<area>                → fix/laptop-front-edge
chore/<thing>             → chore/upgrade-deps
```

### 锁文件

项目用 `bun`，但当前 `bun.lockb` 跟 `node_modules` 可能不同步（混用过 npm）。**主分支建议先 `bun install` 重生 lockb 后再让 agent 各自拉分支。**

---

## 9. 构建 / 部署

### 本地开发

```bash
bun dev          # 或 npm run dev — 启动 Vite 开发服 (默认 8080)
bun run lint     # eslint
bun run format   # prettier
```

### 生产构建

```bash
bun run build              # SSR build for production
bun run build:dev          # dev mode build
bun run preview            # 本地预览构建产物
```

### 部署目标

**Cloudflare Workers**（`wrangler.jsonc`）—— Vite 构建产物直接部署，前后端同栈。

---

## 10. 常见任务速查

| 想做什么 | 改哪里 |
|---|---|
| 加新落地页 section | `src/pages/Home/<Name>.tsx` + 在 `index.tsx` 引入 |
| 加新页面 | `src/pages/<Name>/` + `src/routes/<name>.tsx` |
| 加新 API | `src/api/<domain>Api.ts` + `src/services/<domain>Service.ts` |
| 加新色号 | `styles/variables.css` 加 `--<name>` + `globals.css` 的 `@theme inline` 注册 |
| 加新动画 | `styles/animations.css` 加 keyframe + 工具类 |
| 加新 shadcn 组件 | `bunx shadcn add <name>` 自动放进 `components/ui/` |
| 全局状态 | 新增 `context/<Name>Context.tsx` + 在 `__root.tsx` 包 Provider |
