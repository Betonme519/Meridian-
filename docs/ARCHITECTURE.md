# Meridian — Architecture

> 文件结构 / 数据流 / API / 状态管理。新接手 AI 读这份立刻清醒。

---

## 1. 目录结构

```
.
├─ public/                 静态资源（直接公开访问）
├─ src/                    应用代码（见下）
├─ docs/                   项目文档
├─ package.json            scripts: dev / build / build:dev / preview / lint / format（bun + npm 兼容）
├─ tsconfig.json           strict + 路径别名 @/* → ./src/*
├─ vite.config.ts          @lovable.dev/vite-tanstack-config 一行预设
├─ wrangler.jsonc          Cloudflare Workers 部署
└─ components.json         shadcn/ui CLI

src/
├─ pages/                  业务页面，一页一目录
│  ├─ Home/                落地页（已实现）
│  │  ├─ index.tsx                    section shell（30 行）
│  │  ├─ Hero / HeroLaptopShowcase    Hero 区 + 滚动笔记本（GSAP ScrollTrigger）
│  │  ├─ Trust                        建立信任（保留未挂载，复用）
│  │  ├─ Flow / Explain / GpaMath     三步流程 / 课程卡示例 / GPA 公式
│  │  ├─ Honesty / Control / Feedback 确定/估算/未知 / 风险与控制 / 真实反馈
│  │  ├─ FinalCTA                     底部 CTA
│  │  └─ Home.css                     占位
│  ├─ CourseAnalyzer/      骨架：index + UploadPanel + AnalysisResult + .css
│  ├─ Dashboard/           骨架：index + GPAWidget + RiskCard + .css
│  └─ Planner / Courses / Upload / AIAdvisor / Profile/   早期占位，待整合
│
├─ components/
│  ├─ layout/              全站壳：Navbar.tsx ★（自适应透明↔白底）+ Footer + PageShell
│  ├─ effects/             视觉效果
│  │  ├─ EmbeddedLaptop.{tsx,css}     3D 伪笔记本（lid + 键盘 + 厚度）
│  │  ├─ GridMotion.{tsx,css}         Hero 背景图墙，自动循环
│  │  ├─ SplitText.tsx                字符级 fade-up
│  │  ├─ LaptopFrame.{tsx,css}        旧版独立笔记本，已不用，留 fallback
│  │  └─ ⚠ LiquidEther.css            悬挂文件，无对应 .tsx，确认无引用后可删
│  ├─ ui/                  shadcn/ui 46 个 Radix primitives — 不要重写
│  ├─ common/              业务通用 UI（当前空，placeholder）
│  └─ ⚠ ChatPanel / CourseCard / GPAChart / Navbar / Sidebar / UploadBox/
│                          散装 domain 组件，部分与 layout/ 重复（Navbar/Sidebar），
│                          后续应整合到 common/ 或对应页面下
│
├─ context/                AuthContext / UserContext（待接入）
├─ hooks/                  useAuth / useCourses / usePlanner / use-mobile（shadcn 自带）
├─ api/                    前端调 Worker 的薄壳：authApi / courseApi / plannerApi / aiApi
├─ services/               业务规则：gpaService / ragService / recommendationService
├─ data/                   Mock：mockCourses / userProfile
├─ utils/                  纯函数：calculateGPA / format
├─ assets/                 import 引用的图片 / icons / logos
├─ styles/
│  ├─ globals.css                    Tailwind 入口 + @theme inline
│  ├─ variables.css                  设计令牌（oklch + radius）
│  └─ animations.css                 @keyframes + .animate-* 工具类
├─ layouts/                旧版页面骨架（DashboardLayout / MainLayout），待与 components/layout 整合
├─ lib/utils.ts            shadcn 标配 cn()
├─ routes/                 TanStack Router 文件式
│  ├─ __root.tsx                     根布局 + Provider 挂载点
│  └─ index.tsx                      `/` → 渲染 Home
├─ router.tsx              createRouter 配置
└─ routeTree.gen.ts        自动生成，禁手改
```

---

## 2. 每层职责（一句话）

| 层 | 干什么 | 不能干什么 |
|---|---|---|
| `pages/*/` | 页面级组合 + section JSX | 不写复用组件、不直接 fetch |
| `components/layout/` | 全站布局壳 | 不写业务逻辑 |
| `components/effects/` | 视觉特效 | 不写业务数据 |
| `components/ui/` | shadcn 原子组件 | 不要改 / 不要重写 |
| `hooks/` | React 状态封装（订阅 context / API） | 不写组件 |
| `context/` | 全局 Context 实例 + Provider | 不写业务计算 |
| `api/` | 调 Worker 的薄壳，typed Promise | 不判业务条件 / 不缓存 |
| `services/` | 业务规则、跨 API 协调、数据映射 | 不直接 fetch（走 api 层） |
| `data/` | Mock / 种子 | 不写函数 |
| `utils/` | 纯函数 | 不引 React / 不引 fetch |
| `styles/` | 全局样式 + token | 不写组件级（用 Tailwind / 同名 .css） |

---

## 3. 数据流

```
User → pages/*/  →  hooks/  ←→  context/
                          │
                          ▼
                      services/   （GPA 计算 / 推荐打分 / RAG 检索）
                          │
                          ▼
                        api/      （fetch 封装 / 错误处理 / 类型）
                          │ HTTPS
                          ▼
                Cloudflare Worker  （路由 + 业务执行 + KV/D1/R2 + AI 调用）
```

**单向铁律：**

- UI 只读 hooks，hooks 订阅 context（唯一 Provider）
- 写操作走 services；组件不直接调 api
- api 只做传输：不判业务、不缓存
- services 是业务的家：GPA / 风险 / 推荐计算都在这层

---

## 4. API 约定

```ts
// src/api/courseApi.ts
export async function listCourses(params: ListCoursesParams): Promise<Course[]> {
  return fetchJson("/api/courses", params);
}
```

- 文件：`src/api/<domain>Api.ts`，函数名 `<verb><Noun>`
- 路径前缀：`/api/`（Worker 路由）
- 错误结构：`{ error: { code, message } }`
- 鉴权：cookie session（Worker 颁发）

**TBD：** Worker 骨架未建（计划与 `src/` 平级 `workers/`）；DB 选型 D1 vs KV；RAG 用 Cloudflare Vectorize 还是外部库。

---

## 5. 状态管理（React Context）

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

Provider 挂载在 `src/routes/__root.tsx`：

```tsx
<AuthProvider>
  <UserProvider>{children}</UserProvider>
</AuthProvider>
```

| Context | 内容 |
|---|---|
| `AuthContext` | login / logout / 当前用户 id / token |
| `UserContext` | 用户画像（学校 / 专业 / 年级 / 目标 GPA） |
| 后续 | `PlannerContext`（选课草稿）/ `ToastContext`（全局提示） |

**升级到 Zustand / Redux：当前规模不需要。**

---

## 6. 路由（TanStack Router 文件式）

```
src/routes/
├─ __root.tsx       根布局（HTML / head / Provider 挂载）
└─ index.tsx        `/`
```

**新加路由：**

```tsx
// src/routes/dashboard.tsx
import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "@/pages/Dashboard";
export const Route = createFileRoute("/dashboard")({ component: DashboardPage });
```

`routeTree.gen.ts` 自动重生成，**禁手改**。

---

## 7. 多 agent 协作

| 区域 | 谁能改 |
|---|---|
| `pages/Home/<Section>.tsx` | 任意 agent，互不冲突 |
| `pages/Home/index.tsx` | 加新 section 时是协调点，约定一人改 |
| `components/layout/Navbar.tsx` | layout owner |
| `styles/globals.css` `variables.css` | design system owner |
| `package.json` | 慎用 `bun add` |
| `routes/__root.tsx` | 路由 owner |
| `services/*` | 一业务一 owner |

**分支：** `feature/<page>-<area>` / `fix/<area>` / `chore/<thing>`
**Lock：** 项目用 bun，但 `bun.lockb` 与 `node_modules` 历史上混用过 npm。主分支若异常先 `bun install` 重生 lockb。

---

## 8. 构建 / 部署

```bash
bun dev                # vite dev server
bun run build          # 生产构建
bun run build:dev      # dev mode build
bun run preview        # 本地预览构建产物
bun run lint           # eslint
bun run format         # prettier
```

**部署目标：Cloudflare Workers**（`wrangler.jsonc`）—— 前后端同栈。

---

## 9. 常见任务速查

| 想做 | 改哪里 |
|---|---|
| 加新落地页 section | `src/pages/Home/<Name>.tsx` + `index.tsx` 引入 |
| 加新页面 | `src/pages/<Name>/` + `src/routes/<name>.tsx` |
| 加新 API | `src/api/<domain>Api.ts` + `src/services/<domain>Service.ts` |
| 加新色号 | `styles/variables.css` 加 `--<name>` + `globals.css` `@theme inline` 注册 |
| 加新动画 | `styles/animations.css` 加 keyframe + `.animate-*` 工具类 |
| 加新 shadcn 组件 | `bunx shadcn add <name>` 自动放入 `components/ui/` |
| 全局状态 | 新建 `context/<Name>Context.tsx` + 在 `__root.tsx` 包 Provider |
