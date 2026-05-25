# Meridian — Architecture

> 文件结构 / 数据流 / API / 状态管理。新接手 AI 读这份立刻清醒。
> Last updated: **2026-05-16**（与代码同步，删 services/ 层、补 Supabase 接入面）

---

## 1. 目录结构

```
.
├─ public/                 静态资源
├─ src/                    应用代码（见下）
├─ supabase/migrations/    schema 演进（0001..0006）
├─ docs/                   项目文档
├─ package.json            scripts: dev / build / build:dev / preview / lint / format（bun + npm 兼容）
├─ tsconfig.json           strict + 路径别名 @/* → ./src/*
├─ vite.config.ts          @lovable.dev/vite-tanstack-config 一行预设
├─ wrangler.jsonc          Cloudflare Workers 部署
└─ components.json         shadcn/ui CLI

src/
├─ pages/                  业务页面，一页一目录
│  ├─ Home/                落地页（9 个 section + index + Home.css）
│  ├─ Login / Register/    鉴权页（独立壳，不进 _app）
│  ├─ Dashboard/           AI Feed（卡片网格，仍写死 const ⚠️）
│  ├─ AIAdvisor/           Goal Mode 设置 + 流式对话（接 useChatMessages）
│  ├─ Planner/             Track Workspace 思维导图（自绘 SVG + 绝对定位 DIV；v5 已抛 ReactFlow；接 useTrack + useUserProgress + useCourses + useProfile）
│  ├─ Schedule/            Rule Graph（接 useRules + ruleConflict + SEED 兜底）
│  └─ Upload/              Import 数据接入（接 useRagSources + useProfile）
│
├─ routes/                 TanStack Router 文件式（详见 §6）
│  ├─ __root.tsx                       根 HTML + Providers
│  ├─ _app.tsx                         pathless layout + beforeLoad 三层守卫
│  ├─ _app/{5 子路由}.tsx              功能页 createFileRoute
│  ├─ index.tsx · login.tsx · register.tsx
│  └─ routeTree.gen.ts                 自动生成，**禁手改**
│
├─ components/
│  ├─ layout/              Navbar · Footer · UserMenu（Navbar / DashboardLayout 共用 UserMenu）
│  ├─ effects/             EmbeddedLaptop · GridMotion · SplitText · TiltedCard · CardSwap
│  └─ ui/                  shadcn 46 个 primitives — 不要重写
│
├─ layouts/                DashboardLayout（仅此 1 个；由 _app.tsx 唯一调用）
├─ context/                AuthContext · ProfileContext（全局态，挂在 __root）
├─ hooks/                  useAuth · useProfile · useUserProfile · useRules
│                          · useTrack · useUserProgress · useCourses
│                          · useRagSources · useChatMessages · use-mobile
│                          （usePlans 已删；planApi 保留供 TD-50 plan 表语义切换）
├─ api/                    Supabase 薄壳，一表一文件
│                          authApi · profileApi · ragSourceApi · ruleApi · ruleConflictApi
│                          · planApi · chatMessageApi
├─ ai/                     AI 抽象层（详见 §4）
│  ├─ index.ts                         统一入口，按 VITE_AI_PROVIDER 选 provider
│  ├─ stream.ts                        Chat / Token / Message / collect()
│  ├─ schema.ts · prompts.ts
│  └─ providers/{mock, anthropic}.ts   mock 默认；anthropic 仍 stub
├─ lib/                    supabase（typed client 单例 + fail-soft）· guestMode · utils
├─ config/                 menu.ts —— Navbar + DashboardLayout 共用单一真理
├─ types/                  db.ts —— `supabase gen types` 生成；**可能漂移，定期 regen**
├─ styles/                 globals · variables · animations
├─ router.tsx              createRouter + DefaultErrorComponent
└─ data/ · utils/ · assets/   （存在但内容极少，待清理）

⚠️ 历史已删：services/ · UserContext · useCourses/usePlanner · aiApi/courseApi/plannerApi
   · MainLayout · PageShell · CourseAnalyzer/Courses/Profile pages · 等共 12 项死代码
   完整变更见 docs/ARCHITECTURE_AUDIT.md §1
```

---

## 2. 每层职责（一句话）

| 层 | 干什么 | 不能干什么 |
|---|---|---|
| `pages/*/` | 页面级组合 + section JSX | 不写复用组件、不直接调 supabase |
| `routes/` | 路由 + beforeLoad 守卫 + Outlet 包 layout | 不写页面 UI（component 引 pages/*） |
| `layouts/` · `components/layout/` | 布局壳 | 不写业务逻辑 |
| `components/effects/` | 视觉特效（GSAP / 3D / SplitText） | 不写业务数据 |
| `components/ui/` | shadcn 原子组件 | 不要改 / 不要重写 |
| `hooks/` | 页面级状态 + 调 api 模块 + 缓存形态 | 不写组件 / 不直接 fetch |
| `context/` | 全局 Context（Auth / Profile） + Provider | 不写业务计算 |
| `api/` | Supabase 薄壳，一表一文件，typed Promise | 不判业务条件 / 不缓存 / 不跨表 join |
| `ai/` | AI provider 抽象 + 流式协议 + prompt 模板 | 不持有 API key（key 走 server-side） |
| `lib/` | 单例 / 工具（supabase client / guestMode / cn） | 不写业务规则 |
| `config/` | 配置常量（menu / 枚举） | 不引 React |
| `types/` | 由 `supabase gen types` 生成 db.ts + 手写共享类型 | 不手改 db.ts |
| `utils/` | 纯函数 | 不引 React / 不引 supabase |
| `styles/` | 全局样式 + token | 不写组件级（用 Tailwind / 同名 .css） |

**业务规则去哪了？** 5-09 删了 `services/` 层。当前约定：
- 计算型业务（如 GPA 公式）放 `utils/` 或 hooks 内部 helper
- 跨表协调放 hooks（譬如 `useRules` 同时调 ruleApi + ruleConflictApi）
- 真有"业务很厚"的需求出现时再讨论复活某个 `services/` 文件，不要预先盖空房间

---

## 3. 数据流

```
                    ┌────────────────────────────┐
                    │  pages/*  (功能页 / 落地页)  │
                    └──────────────┬─────────────┘
                                   │ 调
                ┌──────────────────┴──────────────────┐
                ▼                                      ▼
      ┌──────────────────┐                  ┌────────────────────┐
      │  context/         │                  │  hooks/            │
      │  AuthContext      │  ◄─ useAuth ─    │  useRules          │
      │  ProfileContext   │  ◄─ useProfile ─ │  useTrack          │
      └────────┬─────────┘                   │  useUserProgress   │
               │                              │  useCourses        │
               │                              │  useRagSources     │
               │                              │  useChatMessages   │
               │                              └─────────┬──────────┘
               │                                        │
               └─────────────┬──────────────────────────┘
                             ▼
                    ┌──────────────────────┐
                    │  api/<table>Api.ts   │（薄壳）
                    └──────────┬───────────┘
                               │ supabase.from(...)
                    ┌──────────▼──────────┐
                    │  lib/supabase.ts    │ typed client（泛型 Database）
                    └──────────┬──────────┘
                               │ HTTPS + JWT
                    ┌──────────▼──────────┐
                    │  Supabase Postgres  │ RLS / Auth / Storage
                    └─────────────────────┘

AI 调用走另一条并行流（详见 §4）：
   pages/AIAdvisor  →  src/ai/index.ts (chat)  →  providers/{mock, anthropic}
                                                      │
                                                      ▼ (anthropic 真接入时)
                                            server-side proxy → Anthropic API
                                            （proxy 位置待决：TanStack server route / Edge Function / 另起 Worker）
```

**单向铁律：**

- UI 只读 hooks / context；不直接 import `lib/supabase`
- 跨表协调在 hook 内做（譬如 `useRules` 调 ruleApi + ruleConflictApi）
- api 是 supabase.from(...) 的薄壳：不判业务、不缓存、不跨表 join
- AI key 永远不能进浏览器 bundle（不放 `VITE_*`）

---

## 4. API 约定

### Supabase 表 API（`src/api/<table>Api.ts`）

```ts
// 模式：一表一文件，函数名 listX / getX / createX / updateX / deleteX
import { supabase } from "@/lib/supabase";

export async function listRules(userId: string): Promise<Rule[]> {
  const { data, error } = await supabase
    .from("rule")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
```

- 文件：`src/api/<table>Api.ts`
- 鉴权：浏览器侧 `supabase-js` 自管 localStorage（D3=a），RLS 在 Postgres 端把守
- 错误：直接抛 `Error(error.message)`（暴露到 UI 仍是 TD-4，见 ARCHITECTURE_AUDIT.md §13 SB4）
- 枚举（如 `TRUST_LEVELS` / `GOAL_MODES`）从对应 api 模块导出，**前端与 DB CHECK 同源**

### AI API（`src/ai/`）

```ts
// 调用方
import { chat } from "@/ai";
const stream = chat({ messages, signal });
for await (const token of stream) { /* ... */ }

// Provider 切换：.env.local 设 VITE_AI_PROVIDER=mock | anthropic
```

- `Chat = (opts) => AsyncIterable<Token>` —— 协议核心
- `Token = string`（**TODO**：留 union 扩展位以容纳 citation / tool_use 等，见 ARCHITECTURE_AUDIT.md AI2）
- Provider strategy：`src/ai/providers/{mock, anthropic}.ts`，mock 默认，anthropic 仍 stub
- 真接入路径：API key 走 server-side proxy，**不能 `VITE_*` 暴露**

**TBD（仍需用户决策）：** AI proxy 落点（TanStack server route vs Supabase Edge Function vs 自建 Worker） —— 见 ARCHITECTURE_AUDIT.md §13 SB2/AI1。

---

## 5. 状态管理（React Context + 页面级 hooks）

```ts
// src/context/AuthContext.tsx —— 全局态
export const AuthContext = createContext<AuthContextValue | null>(null);

// src/hooks/useAuth.ts —— re-export AuthContext
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
```

Provider 挂载在 `src/routes/__root.tsx`：

```tsx
<AuthProvider>
  <ProfileProvider>{children}</ProfileProvider>
</AuthProvider>
```

### 当前真实存在的 Context（全局）

| Context | 内容 |
|---|---|
| `AuthContext` | login / register / logout / 当前用户 / loading / Supabase session |
| `ProfileContext` | 用户画像（学校 / 专业 / 年级 / goal_mode / target_gpa）+ updateProfile |

### 页面级 hooks（不进 Context，按需取）

| Hook | 用在 | 调的 api |
|---|---|---|
| `useRules` | Schedule | ruleApi + ruleConflictApi |
| `useTrack` | Planner | trackApi（read-only：track + categories + requirements + options） |
| `useUserProgress` | Planner | userProgressApi（upsert/delete user_progress） |
| `useCourses` | Planner + Upload | courseApi（completedCodes 给画布命中判定） |
| `useRagSources` | Upload | ragSourceApi |
| `useChatMessages` | AIAdvisor | chatMessageApi |
| `useUserProfile` | （TODO 合并到 useProfile） | profileApi |

### 升级路径

- **升 Zustand**：等 Planner / Schedule 跨页跳转出现跨页共享需求（譬如点 rule → 打开 Workspace 节点）时再做。
- **react-query**：5-09 已移除依赖。短期 imperative fetch 够用；接 BFF / 多页同读相同表 时再装回。
- 详见 ARCHITECTURE_AUDIT.md §5。

---

## 6. 路由（TanStack Router 文件式）

```
src/routes/
├─ __root.tsx                 根 HTML + <AuthProvider><ProfileProvider>
├─ _app.tsx                   pathless layout：包 DashboardLayout + beforeLoad 三层守卫
├─ _app/
│  ├─ dashboard.tsx           AI Feed
│  ├─ ai-advisor.tsx          Goal Mode / 流式对话
│  ├─ course-planner.tsx      Workspace
│  ├─ schedule.tsx            Rule Graph
│  └─ import.tsx              数据接入
├─ index.tsx                  /  → Home
├─ login.tsx · register.tsx
└─ routeTree.gen.ts           自动生成，禁手改
```

### beforeLoad 三层守卫（`_app.tsx`）

```ts
beforeLoad: async ({ location }) => {
  if (typeof window === "undefined") return;   // SSR fallback（D3 = 浏览器 auth）
  if (!isSupabaseConfigured) return;           // env 缺失 fail-soft
  if (isGuestMode()) return;                   // 访客模式放行
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw redirect({ to: "/login", search: { redirect: location.href } });
}
```

### 新加路由

```tsx
// src/routes/_app/<new-page>.tsx
import { createFileRoute } from "@tanstack/react-router";
import NewPage from "@/pages/<NewPage>";
export const Route = createFileRoute("/_app/<new-page>")({ component: NewPage });

// 同时在 src/config/menu.ts 加 MenuItem（Navbar + DashboardLayout 自动同步）
```

`routeTree.gen.ts` 自动重生成，**禁手改**。

### 命名不统一（已知）

路由 kebab-case ↔ 页目录 PascalCase 当前不强制对齐（`/course-planner` ↔ `pages/Planner/`），见 ARCHITECTURE_AUDIT.md R3。grep 时需双查。

---

## 7. 多 agent 协作

| 区域 | 谁能改 |
|---|---|
| `pages/Home/<Section>.tsx` | 任意 agent，互不冲突 |
| `pages/Home/index.tsx` | 加新 section 时是协调点，约定一人改 |
| `components/layout/*` · `layouts/*` | layout owner |
| `config/menu.ts` | menu owner（Navbar + DashboardLayout 共用） |
| `styles/globals.css` `variables.css` | design system owner |
| `routes/__root.tsx` · `_app.tsx` · `router.tsx` | 路由 owner（CLAUDE.md "不要修改"清单内，需用户授权） |
| `lib/supabase.ts` · `api/authApi.ts` · `context/AuthContext.tsx` | Supabase 接入面 owner（同样需授权） |
| `ai/*` · `api/<table>Api.ts` · `hooks/use<X>.ts` | 一业务一 owner |
| `supabase/migrations/*.sql` | schema owner（用户 Dashboard 跑） |
| `package.json` | 慎用 `bun add` |

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
| 加新功能页 | `src/pages/<Name>/` + `src/routes/_app/<name>.tsx` + `src/config/menu.ts` 加 MenuItem |
| 加新独立鉴权页 | `src/routes/<name>.tsx`（仿 `login.tsx`，不进 `_app`） |
| 加新表 | (1) 写 `supabase/migrations/000X_add_<table>.sql` + `_verify.sql` → (2) 用户 Supabase Dashboard 跑 → (3) `bunx supabase gen types` 安全跑法重生 `src/types/db.ts` → (4) 写 `src/api/<table>Api.ts` 薄壳 → (5) 写 `src/hooks/use<X>.ts` → (6) 页面消费 |
| 加新 AI use-case | `src/ai/prompts.ts` 加 prompt 函数 + `src/ai/schema.ts` 加 zod schema；第 3 个 use-case 起改为 `prompts/<use-case>.ts` 目录形 |
| 加新色号 | `styles/variables.css` 加 `--<name>` + `globals.css` `@theme inline` 注册 |
| 加新动画 | `styles/animations.css` 加 keyframe + `.animate-*` 工具类 |
| 加新 shadcn 组件 | `bunx shadcn add <name>` 自动放入 `components/ui/` |
| 全局状态 | 新建 `context/<Name>Context.tsx` + 在 `__root.tsx` Providers 包 Provider |
| 页面级状态 | 新建 `hooks/use<X>.ts`（调对应 `api/<x>Api.ts`） |

---

## 10. 相关文档

| 文档 | 作用 |
|---|---|
| `PROJECT_OVERVIEW.md` | 项目定位 / 技术栈 / 商业模式 |
| `ARCHITECTURE.md` ← 本文 | 文件结构 / 数据流 / 路由 / 状态管理 |
| `ARCHITECTURE_AUDIT.md` | 已知技术债 + 落地方案（合并版 5-09 + 5-16） |
| `DATA_MODEL.md` | 7 张 user-owned 表的 schema 契约 |
| `TRACK_SCHEMA.md` | 5 张公共 track 表的 schema 契约 |
| `TECH_DEBT.md` | TD-1..26 backlog（与 AUDIT 互补） |
| `DESIGN_SYSTEM.md` | 颜色 / 字体 / 动画 |
| `CURRENT_TASK.md` | 本会话边界 |
| `AI_MEMORY.md` | 长期项目记忆 |
