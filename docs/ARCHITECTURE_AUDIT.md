# Meridian 架构审计报告

> 合并版 = 2026-05-09 + 2026-05-16 两轮审计。已修条目剪除，未解决条目保留并配落地方案。
> 审计目标：识别技术债 / 未来必爆点 / 不合理抽象 / 重复逻辑
> 输出原则：只描述、不动业务代码；按"炸药当量"排序

---

## 0. 一句话结论

**架构骨架健康，但正处在一个危险的过渡期。** 三件事同时悬空：(a) Track schema 仍在剧烈演进（6 个 migration / 5 个月内 4 次破坏性变更）；(b) AI provider 是 stub，但前端流式 UI 已经接到 hook；(c) Cloudflare Worker BFF 路线在 wrangler 里写明意图但 `src/server/` 不存在。**任何一件先动都会让另两件被迫连带动**。需要先排序、再落地，不要并行。

同时：**项目文档已经与代码漂移**——`PROJECT_OVERVIEW.md` / `ARCHITECTURE.md` 还在写 `services/`、`useCourses` 等 5-09 之前的状态。**文档漂移本身就是一级技术债**，因为新接手的 AI 会被旧文档带歪。

---

## 1. 已修完成度时间线

下表是历史摘要——**只列已修**，未修的下面 §3 起单独详写。

| 时间 | 已修 |
|---|---|
| **2026-05-07** 之前 → 5-09 | `MENU_ITEMS` 抽到 `config/menu.ts` 单一真理；删除旧 `components/Navbar/` `Sidebar/` 残骸；功能页改由 `_app.tsx` pathless layout 自动包；`AuthProvider` 挂到 `__root.tsx`；`useAuth` 接通 `AuthContext`；mock 鉴权（localStorage） |
| **5-09 → 5-16** | **R1**：`_app.tsx` beforeLoad 三层守卫（SSR / 未配置 / guest）；**真 Supabase auth + guestMode** 替换 mock；**TD-3**：`types/db.ts` typed client 落地（**但已再次漂移**，见 §10）；**TD-8**：beforeLoad context；**12 个死文件**全清（`PageShell` / `MainLayout` / `ChatPanel` / `CourseCard` / `GPAChart` / `UploadBox` / `common/` / `Profile` / `Courses` / `CourseAnalyzer` / `UserContext` / `mockCourses`）；`useCourses` `usePlanner` 假 hook 删除，换成 7 个真接 Supabase 的 hooks；`aiApi/courseApi/plannerApi` stub 删除，换成 7 个薄壳 api；`services/` 整目录删；4 个功能页（AIAdvisor / Planner / Schedule / Upload）接通 hooks；**TD-1 余尾**：`src/ai/{stream,schema,prompts,providers/{mock,anthropic}}` 骨架完成 |

**上轮审计 80% 的红黄项已修**。本轮重点是 **新债**（schema pivot 留下）+ **文档漂移** + **仍冻结未动的旧债**。

---

## 2. 当前现状速览（仅作上下文）

```
src/
├─ pages/        8 个目录（无死页）
├─ routes/       10 个 route（公共 + _app 子组）
├─ components/   layout(3) · effects(5) · ui(46 shadcn)
├─ layouts/      DashboardLayout（仅此 1 个）
├─ context/      AuthContext · ProfileContext
├─ hooks/        useAuth · useProfile · useUserProfile · useRagSources
│                · useRules · usePlans · useChatMessages · use-mobile
├─ api/          authApi · profileApi · ragSourceApi · ruleApi · ruleConflictApi
│                · planApi · chatMessageApi
├─ ai/           index · stream · schema · prompts · providers/{mock,anthropic}
├─ lib/          supabase · guestMode · utils
├─ config/       menu.ts
├─ types/        db.ts（typed client，已漂移）
├─ styles/       globals · variables · animations
├─ router.tsx · routeTree.gen.ts
└─ data/ · utils/ · assets/   （存在但内容已极少）
supabase/migrations/  6 个（0001 init / 0002 track / 0003 relax / 0004 source_ref / 0005 seed / 0006 extend kinds）
```

---

## 3. Router 架构

### 现状
- TanStack 文件式 + `_app.tsx` pathless layout，扩页成本最低
- `_app.tsx` beforeLoad 三层守卫已上：SSR / Supabase 未配置 / guestMode → fail-soft；其余 → `getSession()` 强制鉴权重定向 `/login`
- `router.tsx`：`getRouter()` 注入 `defaultErrorComponent` / `defaultPreloadStaleTime: 0` / 空 `context: {}`

### 仍存在的问题

| # | 严重度 | 问题 |
|---|---|---|
| R1 | 🟡 中 | **`context: {}` 仍是空对象**。等 `queryClient` / `aiClient` / `auth` 需要在 route loader 里读取时，没接口位。一旦排队 11/13 开始写 loader-driven 数据，重构面会扩散到所有 `_app/*` 文件。 |
| R2 | 🟢 低 | `defaultPreloadStaleTime: 0` 关掉 preload 缓存；真接 API 后会引发不必要重复 fetch。 |
| R3 | 🟢 低 | **路由 kebab vs 页目录 Pascal 不统一**：`/course-planner` ↔ `pages/Planner/`、`/import` ↔ `pages/Upload/`、`/ai-advisor` ↔ `pages/AIAdvisor/`。接手 AI 在 grep 时双查易蒙圈。 |
| R4 | 🟢 低 | `pages/Login` 与 `pages/Register` 无 `_auth` layout 分组。未来加 SSO / 忘记密码 / 邮箱确认就会冗余。 |

---

## 4. Layout 系统

### 现状

| 名称 | 路径 | 调用方 | 状态 |
|---|---|---|---|
| `Navbar` | `components/layout/Navbar.tsx` | Home inline | ✅ |
| `Footer` | `components/layout/Footer.tsx` | Home | ✅ |
| `UserMenu` | `components/layout/UserMenu.tsx` | Navbar + DashboardLayout 共用 | ✅ |
| `DashboardLayout` | `layouts/DashboardLayout.tsx` | `_app.tsx` 唯一调用 | ✅ |

旧 `PageShell` / `MainLayout` 已删 ✅。

### 仍存在的问题

| # | 严重度 | 问题 |
|---|---|---|
| L1 | 🟡 中 | **Drawer 三件套（open + scroll-lock + Esc + close-on-route）在 Navbar.tsx 和 DashboardLayout.tsx 各写一份**。证据：Navbar.tsx line 20–47 与 DashboardLayout.tsx line 23–48 几乎一致。被 CLAUDE.md "不要修改"清单冻结，需要用户显式授权才能动 Navbar / DashboardLayout。 |
| L2 | 🟡 中 | **`src/layouts/` vs `src/components/layout/` 双目录共存**。前者 1 个文件，后者 3 个。两个名字相近的目录长期并存是误导。 |
| L3 | 🟢 低 | DashboardLayout 的 icon-rail 仅 `lg+` 显示；移动端只剩 hamburger。 |
| L4 | 🟢 低 | Home / Login / Register 无共用 layout 壳；加 SSO / 重置密码后会冗余。 |

---

## 5. 状态管理

### 现状

```
AuthContext       ✅ 已挂、真 Supabase、onAuthChange 订阅、loading 完整
ProfileContext    ✅ 已挂、嵌入 AuthProvider 内、updateProfile 走 profileApi
useAuth           ✅ re-export AuthContext
useProfile        ✅ re-export ProfileContext
useRagSources useRules usePlans useChatMessages useUserProfile
                  ✅ 页面级，各自调 api 模块
@tanstack/react-query  ❌ 已于 5-09 移除
zustand / jotai / valtio  ❌ 未引入
```

### 仍存在的问题

| # | 严重度 | 问题 |
|---|---|---|
| S1 | 🟡 中 | **`useProfile` 与 `useUserProfile` 同名相邻**。两份 hook 名字差别仅一个词，读 grep 易把"用户基本资料"和"profile 表"混淆。 |
| S2 | 🟡 中 | **2 Context + 5 页面级 hook 已经接近 React Context 心智天花板**。Planner / Schedule 跨页跳转（点 rule → 打开 Workspace 节点）就会触发跨页共享需求，到那时考虑升 Zustand。 |
| S3 | 🟢 低 | 7 个 api 全是 imperative fetch，没有缓存 / 去重 / refocus 失活机制。短期 OK；接 BFF / 多页同读相同表 时会暴露。 |
| S4 | 🟡 中 | **URL state 范式不一致**：Planner 用 `useSearch` 把状态写进 URL，Schedule / AIAdvisor 没同款。"数据态可分享"在不同页处理范式不一致 = 一种"重复但分歧"。 |

---

## 6. 组件复用

### 现状
- shadcn `ui/` 46 primitives 齐全，但**功能页仍在写裸 Tailwind**（TD-9 旧债仍在）
- `MENU_ITEMS` / `UserMenu` 单一真理 ✅

### 仍存在的重复

| # | 重复点 | 出现位置 | 建议落点 |
|---|---|---|---|
| C1 | Drawer 三件套 | Navbar.tsx · DashboardLayout.tsx | `src/hooks/useDrawer.ts` |
| C2 | Page hero（H1 + 描述 + `mx-auto max-w-7xl px-5 py-8 ...`） | 5 个功能页 | `<PageHeader>` |
| C3 | 卡片基线（`rounded-xl border border-slate-200 bg-white p-5`） | 所有功能页 | shadcn `<Card>`（已存在却没用） |
| C4 | CTA（`rounded-full bg-black ... transition-colors`） | 所有页 | shadcn `<Button>` |
| C5 | "guest / loading / empty / data" 状态机（`isResolving / isGuest / showSeed`） | Schedule line 79–86，Planner / Upload 推测同款 | `useGuestAwareData()` hook |
| C6 | Trust / status / tone 颜色映射 | Schedule(TRUST_META) · Upload(STATUS_CLS) · Dashboard(toneClass) | 集中或加 lint 规则 |
| C7 | ISO 日期 → `YYYY-MM-DD` slice | Upload `formatDate` | `lib/format.ts`，Schedule / Dashboard 也会用 |

---

## 7. 页面职责

| Page | Route | Layout | 数据 | 接 hook? |
|---|---|---|---|---|
| Home | `/` | inline | section const | useAuth |
| Login | `/login` | inline | useAuth | ✅ |
| Register | `/register` | inline | useAuth | ✅ |
| **Dashboard** | `/dashboard` | `_app` | **写死 5 张卡 const** + useProfile（只读） | **半接** |
| AIAdvisor | `/ai-advisor` | `_app` | useProfile · useChatMessages · GOAL_MODES | ✅ |
| Planner | `/course-planner` | `_app` | useAuth · usePlans · SEED_MERIDIAN_NODES（视觉占位） | ✅ |
| Schedule | `/schedule` | `_app` | useAuth · useRules · SEED_RULES（访客/空态用） | ✅ |
| Upload | `/import` | `_app` | useProfile · useRagSources | ✅ |

### 仍存在的问题

| # | 严重度 | 问题 |
|---|---|---|
| P1 | 🔴 高 | **Dashboard 是 5 功能页里唯一仍 100% 写死的页**。`importShortcuts` / `decisionCards`（5 张卡 line 80–124）全是占位文案 + 假数字。**未来必爆**：用户第一次登录第一眼看 Dashboard，与其他 4 页接真数据的体验差异巨大；新接手 AI 不知 5 张卡该接哪些表。 |
| P2 | 🟡 中 | **Schedule 跨表语义已在 page 硬写**：注释明示"学校特殊政策：暂走 SEED，不入库（属 track_* 范畴）"。track schema 第二次 pivot 后 Schedule 还得跟随。 |
| P3 | 🟡 中 | **Planner 用 SEED_MERIDIAN_NODES 占位**——排队 12（画布改造）启动时要替换。 |
| P4 | 🟢 低 | 图标自由组合，没有"概念 → 图标"映射规范。 |

---

## 8. 可扩展性

| 任务 | 成本 | 备注 |
|---|---|---|
| 加新功能页 | 🟢 低 | pages/X + routes/_app/x.tsx + MENU_ITEMS 一行 |
| 加独立鉴权页（forgot-password 等） | 🟢 低 | 仿照 `routes/login.tsx` |
| 加 Toast | 🟢 低 | sonner 已装，在 Providers 挂 `<Toaster />` |
| 加 Theme | 🟡 中 | tokens 是 oklch + `@theme inline`，dark mode 需手建 token alias |
| 加新表 | 🟡 中 | migration → gen types → api → hook → page，6 步手动 |
| 接真鉴权 | ✅ 完成 | |
| 接 AI 流式 | 🔴 高 | 见 §9：BFF 路径 + Token union 未决 |
| 接路由级鉴权 | ✅ 完成 | |
| 接真数据 | 🟡 中 | 已有 7 张表骨架，但 schema 还在 pivot |

### 阻碍可扩展性的点

| # | 严重度 | 问题 |
|---|---|---|
| X1 | 🔴 高 | **`src/types/db.ts` 与 schema 已漂移**。CURRENT_TASK 阶段 3 明示"db.ts 暂不含 0003 列（scope_level / college）"，0005 已 seed，0006 又扩 kinds。写 `track.scope_level` 必 TS 报错。 |
| X2 | 🟡 中 | **migration 单向、无 down**。6 个文件，没有任何 rollback 脚本。 |
| X3 | 🟡 中 | **track schema 演进密度过高**：5 个月 4 次破坏性变更。schema 没稳定前**任何跨表 AI 推理代码都不应写死表名/列名**。 |
| X4 | 🟡 中 | **`docs/` 已 14+ 份 markdown**。新接手 AI 必读列表已超出其上下文窗口预算。 |

---

## 9. AI API 接入预留

### 现状（已显著进步）
- ✅ `src/ai/{index, stream, schema, prompts, providers/{mock, anthropic}}` 骨架完成
- ✅ `Chat = (opts) => AsyncIterable<Token>` 协议清晰，AbortController 已通过 `signal` 暴露
- ✅ Provider 通过 `VITE_AI_PROVIDER` env 选择，默认 mock
- ✅ `collect(stream)` 非流式收集，方便单测
- ✅ `recommendModePrompt()` 输出格式契约固定（mock + 真 provider 共用同一份解析正则）
- ✅ `anthropic.ts` stub 写明上线前必做的 5 件事

**这一段在所有审计维度里是最干净的**。

### 仍存在的问题

| # | 严重度 | 问题 |
|---|---|---|
| AI1 | 🔴 高 | **API key 放哪没有落地点**。`anthropic.ts` 注释正确指出"key 不能放 VITE_*"，但 `src/server/` 不存在，`wrangler.jsonc` 又明确写"不要在这里加 vars"。**先决策 §10 BFF 路线**才能动 TD-1 余尾。 |
| AI2 | 🟡 中 | **`Token = string` 当前只覆盖纯文本流**。Anthropic SSE 还有 `content_block_*` / `message_delta` / `tool_use_delta` / `citation_block` 等事件。RAG 上线后引用块（citation）必须能传出来；那时 `Token` 升级 union，所有 page 端 `for await` 消费代码要重写。 |
| AI3 | 🟡 中 | **prompts 目前只有 1 个**（recommendModePrompt）。等 RAG / 课程排序 / GPA 模拟接上，prompts/ 会迅速膨胀到 10+。当前 `prompts.ts` 单文件 + `schema.ts` 单文件的扁平结构顶不住第 3 个 use-case。 |
| AI4 | 🟢 低 | **mock provider 的启发式正则**（`recommendMode`）与 prompt 模板**重复维护两份关键词**。"双份真理"雏形。 |

---

## 10. Supabase 接入合理性

### 现状
- `lib/supabase.ts` 单例 + typed client + fail-soft，写得干净
- `api/*.ts` 7 份薄壳，全部走 `supabase.from("table")...`
- 7 张用户私有表 + 5 张公共 track 表，**RLS 全部到位**
- 三层鉴权（Supabase auth + guestMode + SSR 守卫）路径清晰

### 三条路线对比（5-09 写过，仍有效）

| 路线 | 优 | 劣 |
|---|---|---|
| **Supabase 全栈**（auth + Postgres + Storage + Realtime + Edge Function） | 上线最快；auth + RLS + 文件 + 实时即开即用；AI key 走 Edge Function 自然 | 与 Cloudflare Workers 部署互斥（Edge Function ≠ Worker）；Vendor lock-in 更深；RAG pgvector 需 Pro 等级 |
| **CF Workers BFF**（自建 `src/server/`） | 与 wrangler.jsonc 一致；冷启动快；TanStack Start SSR 原生支持；可一并接 D1 / Vectorize / R2 / KV | AI / proxy / 限流全要自己写；交付速度慢 |
| **混合**（CF 前端 + Supabase 数据层 + CF 上一层 BFF 转发 AI） | 保持 CF SSR + 拿 Supabase 数据福利 | 两份 vendor 关系；决策点更多 |

### 仍存在的问题

| # | 严重度 | 问题 |
|---|---|---|
| SB1 | 🔴 高 | **types/db.ts 漂移**（同 X1） |
| SB2 | 🔴 高 | **AI proxy server-side endpoint 不存在**（同 AI1） |
| SB3 | 🟡 中 | **service_role 写公共表手动跑 SQL**。0005 seed 走 Dashboard SQL Editor，没自动化 pipeline。换学校时这条路径要重复，易错。 |
| SB4 | 🟡 中 | **API 错误不暴露 UI**（TD-4 旧债）。profile / rag_source / 未来 AI 调用失败用户只看空态，不知是 RLS 还是网络。 |
| SB5 | 🟡 中 | **`chat_message` 表与 AI provider Message 类型**是否完全契合还要看 `messages` JSON 是否同时兼容"用户原话 / AI 流式拼接 / 引用块"三态。 |
| SB6 | 🟢 低 | **Realtime / 多 tab 同步缺失**（TD-6）。Phase 1 不阻塞。 |

---

## 11. 重复逻辑清单（同 §6，可立即抽离）

1. **Drawer hook** — Navbar + DashboardLayout（C1）
2. **状态四态机** — guest / loading / empty / data（C5）
3. **Page hero / Card / CTA / Metric** — shadcn 已装却没用（C2-C4）
4. **色彩 token 映射**（tone / trust / status） — 3 页各一份（C6）
5. **ISO 日期切片**（C7）

---

## 12. 不合理抽象清单

| # | 抽象 | 状态 | 处置 |
|---|---|---|---|
| A1 | `src/layouts/` 单文件目录 | 半死目录 | 并入 `components/layout/` 或显式定义其唯一用途 |
| A2 | `src/data/` 空目录 | 死目录 | 删；真有 seed 时再建 |
| A3 | `useProfile` vs `useUserProfile` 命名 | 命名病 | 合并或重命名 |
| A4 | Drawer 三件套 | 重复未抽 | 抽 `useDrawer()` |
| A5 | Schedule 页"跨表占位"（rule + track 临时同壳） | 临时抽象 | track schema 稳后归位 |
| A6 | Dashboard 5 张静态卡片 | "我先把房间盖好" | 决策 5 张卡片数据契约 |
| A7 | `ai/prompts.ts` 单文件 | 早期合理 | 第 3 个 prompt 前改成 `prompts/<use-case>.ts` |
| A8 | mock keyword vs prompt keyword | 双份真理雏形 | 抽 `goalModeKeywords.ts` |

---

## 13. 技术债总评 + 落地方案

> **一级 = 接下一条主线前必须解决；二级 = 业务接入半年内会爆**。
> 每条带 ✅ 解决方案：动哪个文件 / 谁来做 / 验证方式。

---

### 💣 一级炸药（接下一条主线前必修）

#### 🔴 SB1 / X1 — `types/db.ts` 与 schema 漂移

**影响**：写 `track.scope_level` / 新 kind metadata 必 TS 报错；阻塞排队 11（course API + UI）。

✅ **解决方案**（用户跑，Claude 不能）
1. 项目根放 `.env.local`，含 `SUPABASE_ACCESS_TOKEN=...`（在 https://supabase.com/dashboard/account/tokens 拿）
2. 用 memory 中 `feedback_supabase_gen_types_safe` 的**两步重定向**安全跑法：
   ```bash
   bunx supabase gen types typescript \
     --project-id <your-project-id> --schema public \
     > src/types/db.ts.tmp && mv src/types/db.ts.tmp src/types/db.ts
   ```
   **不要**直接 `> src/types/db.ts` —— 若命令失败 shell 会先把 db.ts truncate 成空，之前发生过（commit `387e5ba` 恢复）
3. 验证：
   ```bash
   grep -E "scope_level|college" src/types/db.ts   # 应有命中
   bunx tsc --noEmit                                # 应 0 报错
   ```
4. 提交：`chore: regen db.ts after 0006 extend_requirement_kinds`

**优先级**：排队 11 启动前必修。

---

#### 🔴 SB2 / AI1 — AI proxy server-side endpoint 不存在

**影响**：阻塞 TD-1 余尾（接真 Anthropic）+ TD-2 解析 pipeline。

✅ **解决方案**（**用户必须先决策路线**）

**Step 1：拍板路线**（用户做，无法代决）

| 选 | 落点 | 理由 |
|---|---|---|
| **A. TanStack Start server-routes（推荐）** | `src/routes/api/ai.chat.ts` server-only `createFileRoute` + server fn | 与 `wrangler.jsonc` 既有部署一致；SSR + server fn 同一 entry；CF Worker 内置 secret 注入 |
| B. Supabase Edge Function | `supabase/functions/ai-chat/index.ts` | 与 RLS 同源；但与 CF 部署互斥 |
| C. 自建 CF Worker（另起项目） | 独立 wrangler 项目 | 隔离度最高；但维护两份部署 |

**Step 2：路线 A 的具体动作**（推荐路径；Claude 可写骨架）
1. 在 `wrangler.jsonc` 添加 `vars`（**非 `VITE_*`**）：`ANTHROPIC_API_KEY` → `wrangler secret put`
2. 新建 `src/routes/api/ai.chat.ts` —— TanStack server route，body 接前端 messages，proxy 到 Anthropic Messages API，SSE 流式回写
3. 改 `src/ai/providers/anthropic.ts`：fetch 本地 `/api/ai.chat`（**不直连 Anthropic**），消费 SSE 把 `content_block_delta` → `Token` yield 出去
4. 验证：`.env.local` 切 `VITE_AI_PROVIDER=anthropic`，AIAdvisor 页面流式输出真 Anthropic 回答
5. CI/CD：build 前 `wrangler secret put ANTHROPIC_API_KEY` 灌 Worker 环境，**不写进 bundle**

**优先级**：TD-1 余尾启动前必修。

---

#### 🔴 P1 — Dashboard 仍 100% 写死 const

**影响**：用户登录第一眼即看到的页面与其他 4 页脱节；新接手 AI 不知 5 张卡接哪些表。

✅ **解决方案**（**用户必须先拍板数据契约**，然后 Claude 实施）

**Step 1：决策 5 张卡片数据源**（用户做，建议提案）

| 卡片 | 当前写死 | 建议数据源 |
|---|---|---|
| 当前目标 | "高 GPA 模式 · 保研路线" | `profile.goal_mode` + `profile.target_gpa` + `profile.goal_weights` |
| AI 最近一次推荐 | 假课程名 | `chat_message` 表最新一条 `role=assistant`（截前 N 字） |
| 最近风险变化 | "压分风险 ↓ 12%" | **新建 schema**：`risk_snapshot(user_id, computed_at, risk_score, delta)`，由 AI provider 定期写 |
| 卡住的 requirement | "第二课堂 还差 2 分" | `user_progress` ⨝ `track_requirement` ⨝ `track_category`，过滤 `kind in (count, credits)` 且 cumulative < threshold |
| 下一步建议 | "拖动 CS 241 看连锁影响" | 短期：固定文案；长期：AI provider 输出 |

**Step 2：Claude 写 `docs/DASHBOARD_DATA_CONTRACT.md` 草稿**（拿到决策后做）

**Step 3：分两阶段实施**
- 短期（排队 11 后即可）：卡 1 / 卡 2 / 卡 4 接通，卡 3 / 卡 5 留 SEED 提示"暂未生成"
- 长期（排队 13 真 AI 接入后）：卡 3 / 卡 5 自动化

**优先级**：排队 13 之前必须做完短期方案，否则 demo 给用户看就是穿帮。

---

#### 🔴 文档漂移 — `PROJECT_OVERVIEW.md` / `ARCHITECTURE.md`

**影响**：新接手 AI 读旧文档会被带歪 —— `services/` 早删但还在画，`useCourses` 早删但还在文档里。

✅ **解决方案**（Claude 立刻可做，本轮已执行）

1. `docs/PROJECT_OVERVIEW.md` "数据" 段：
   - 删 "业务逻辑：src/services/"、"mock 数据：src/data/"
   - 改为 "数据访问：src/api（薄壳，调 supabase-js）+ src/hooks（页面级状态）"
2. `docs/ARCHITECTURE.md` §3 数据流图：
   - 删 "services/（GPA 计算 / 推荐打分 / RAG 检索）" 一层
   - 改为 `UI → hooks → context（全局态）` + `UI → hooks → api → Supabase` 两条线
3. `docs/AI_MEMORY.md`：检查是否还有 `services/` 字眼

---

### 💥 二级炸药（业务接入半年内会爆）

#### 🟡 L1 / C1 — Drawer 三件套抽 hook

✅ **解决方案**（**需要用户授权**，因为 Navbar / DashboardLayout 在"不要修改"清单）

1. Claude 写 `src/hooks/useDrawer.ts`（**无需授权，新建文件**）：
   ```ts
   export function useDrawer(opts?: { closeOnRouteChange?: boolean }) {
     const [open, setOpen] = useState(false);
     useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
     useEffect(() => { if (!open) return; const fn = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); }, [open]);
     useRouterState({ select: s => s.location.pathname, ... }) // close on route change if opt set
     return { open, setOpen, toggle: () => setOpen(v => !v), close: () => setOpen(false) };
   }
   ```
2. **用户授权后**：在 Navbar.tsx 与 DashboardLayout.tsx 各删 30 行 drawer 状态，import `useDrawer` 替换
3. 验证：手测两处 drawer 行为不变（开 / Esc / 路由切换 / scroll lock）

---

#### 🟡 X3 — track schema 写死风险

**影响**：track schema 5 个月 4 次 pivot，前端若写死 `track_requirement.kind === "count"` 等字面量，下一次 0007/0008 会连环 break。

✅ **解决方案**（Claude 立刻可做）

1. 新建 `src/types/trackEnums.ts`：
   ```ts
   import type { Database } from "./db";
   type Req = Database["public"]["Tables"]["track_requirement"]["Row"];
   export type RequirementKind = Req["kind"];      // 由 DB CHECK 推断
   export const REQUIREMENT_KIND_META: Record<RequirementKind, { label: string; ... }> = { ... };
   ```
2. 前端任何用 `kind === "xxx"` 的地方走 `REQUIREMENT_KIND_META[r.kind]`
3. 验证：`bunx tsc --noEmit` —— `kind` 字面量集合由 db.ts 自动同步，schema pivot 后只需 regen + 补 meta 一行

---

#### 🟡 X2 — migration 无 down

**影响**：误跑回滚只能人工 SQL；0003 / 0004 / 0006 都改了 CHECK 约束或字段。

✅ **解决方案**（Claude 立刻可做）

1. 新建 `supabase/migrations/_template.sql` —— 模板含：UP 段 + 末尾注释段 "-- DOWN (manual, do not exec)" 写逆向 SQL
2. 在 `docs/DATA_MODEL.md` §10 加 "Migration 演进规约"：约定"新 migration 必须配 DOWN 注释段，已有 6 个不回填"
3. 验证：下一条 0007 / 0008 跑前先看 _template.sql

---

#### 🟡 SB4 / TD-4 — API 错误不暴露 UI

**影响**：profile / rag_source / 未来 AI 调用失败，用户只看空态。

✅ **解决方案**（Claude 立刻可做，**需用户授权改 7 个 api 文件 + 1 个 root**）

1. Claude 新建 `src/lib/errorBus.ts`（sonner 已装）：
   ```ts
   import { toast } from "sonner";
   export function reportApiError(scope: string, err: unknown) {
     const msg = err instanceof Error ? err.message : String(err);
     console.error(`[${scope}]`, err);
     toast.error(`${scope}：${msg}`);
   }
   ```
2. Claude 在 `routes/__root.tsx` `Providers` 内挂 `<Toaster richColors />`（注释列表里已留挂点）
3. **用户授权后**：7 个 `api/*Api.ts` 把 `throw new Error(...)` 之前先 `reportApiError(scope, err)`，或在 hooks 层 catch 时统一调用
4. 验证：手动断网，profile 拉取应弹出 toast

---

#### 🟡 AI2 — `Token = string` 没留 union 扩展位

**影响**：RAG 上线后引用块必须能传出来；那时所有 page 端 `for await` 消费代码要重写。

✅ **解决方案**（Claude 立刻可做，**前向兼容性改动**）

1. 改 `src/ai/stream.ts`：
   ```ts
   export type TextDelta = { type: "text"; value: string };
   export type Token = TextDelta;            // 当前 union 只 1 个 case
   // 未来：export type Token = TextDelta | CitationBlock | ToolUseDelta;
   ```
2. 改 `mockChat` / `anthropicChat`：yield `{ type: "text", value: char }` 而非裸 string
3. 改 `collect()`：`out += t.type === "text" ? t.value : ""`
4. 改 AIAdvisor 消费方：取 `t.value` 而非 `t`
5. 验证：mock 流式输出视觉无差异，TS 0 报错

**何时做**：当前调用面小（mock + 1 个消费方），改起来不痛；越晚改面越大。

---

#### 🟡 R1 — Router context `{}` 空对象

**影响**：排队 11/13 写 loader-driven 数据时再重构 → 涉及所有 `_app/*` 文件。

✅ **解决方案**（**用户决策时机**，本轮先标记）

- 不立刻改。但**在排队 11 启动会议**时回头评估：是否注入 `{ supabase, queryClient?, auth }` 进 router context？
- 替代方案：保留 `context: {}`，loader 内通过 `import { supabase }` 静态调 —— 也可行，但对 SSR + 用户隔离不友好
- 标 TODO：`router.tsx` line 60 `context: {}` 加注释 "排队 11/13 启动前决策"

---

### 🔥 三级（累计影响 / 当下不阻塞）

- **F1 / A1**：双 layout 目录
- **F2 / A2**：`src/data/` 空目录
- **S1 / A3**：`useProfile` vs `useUserProfile` 命名病
- **AI3 / A7**：prompts 单文件 —— 第 3 个 prompt 前改 `prompts/<use-case>.ts`
- **AI4 / A8**：mock 关键词与 prompt 关键词双源 —— 抽 `goalModeKeywords.ts`
- **C2–C7**：状态机 / 色彩 / 日期 / Page hero / Card / CTA 重复（多数依赖排队 14 UI 重设计）
- **P2**：Schedule 跨表占位（track schema 稳后归位）
- **P3**：Planner SEED 占位（排队 12 会解）
- **SB3**：service_role 写公共表自动化 pipeline（落 `scripts/seed.ts`）
- **TD-9**：shadcn primitives 在功能页 0 引用（依赖排队 14）

### 💨 四级（小烦恼）

- **R2**：preload 缓存关闭
- **R3**：路由 kebab vs 页 Pascal
- **R4 / L4**：Login/Register 共用 layout
- **L3**：DashboardLayout 移动端 rail 隐藏
- **S2 / S3**：Context vs Zustand / react-query 升级时机
- **S4**：URL state 范式不一致
- **P4**：图标自由组合
- **SB6 / TD-6**：多 tab 同步缺失

---

## 14. 推荐决策顺序

**立刻**（本轮 Claude 已做 / 可立即做）：
1. ✅ 修文档漂移（PROJECT_OVERVIEW / ARCHITECTURE / AI_MEMORY）
2. ✅ 写 `src/types/trackEnums.ts`（X3 解决方案）
3. ✅ 写 `src/hooks/useDrawer.ts`（L1 文件部分；动 Navbar/DashboardLayout 仍待授权）
4. ✅ 写 `src/lib/errorBus.ts` + 挂 `<Toaster />`（SB4 一半；改 api/* 仍待授权）
5. ✅ 改 `src/ai/stream.ts` Token union（AI2）

**用户决策**（拍板后 Claude 实施）：
6. 🔴 重 gen `types/db.ts`（SB1） — 用户跑命令
7. 🔴 选 AI BFF 路线（A / B / C） — 用户拍板，Claude 写骨架
8. 🔴 Dashboard 5 张卡片数据契约 — 用户拍板，Claude 写 `DASHBOARD_DATA_CONTRACT.md`

**排队 11 启动前回头评估**：
9. 🟡 Router context 形状（R1）

**只在用户授权后做**（动"不要修改"清单内文件）：
10. 🟡 Navbar / DashboardLayout 接 useDrawer
11. 🟡 7 个 api/*.ts 接 errorBus

---

## 15. 项目优势（保留勿动）

- **TanStack 文件式 route + pathless `_app`**：扩页成本最低
- **`MENU_ITEMS` 单一真理**：5-07 修过的债到今天仍干净
- **`_app.tsx` 三层 beforeLoad 守卫**：SSR / 配置 / guest fallback 写得到位
- **Supabase fail-soft 单例**：env 缺失不影响 Home / Login 启动
- **AI 抽象骨架 + `AsyncIterable<Token>` 协议**：在 mock / 真 provider / 单测三处共用 1 个接口
- **`GOAL_MODES` `TRUST_LEVELS` 等枚举从 api 模块导出**：前端枚举与 DB CHECK 同源（最佳实践）
- **migrations 全部幂等**：DROP IF EXISTS + CREATE IF NOT EXISTS，失败回滚重跑
- **CLAUDE.md 数据源分流**：明确"哪些目录禁 Grep"，节省 AI 上下文
- **`AuthContext` "4 函数体替换即切真后端"形状**：少数做对的预留
- **Home GSAP / SplitText / TiltedCard / CardSwap 视觉系统**

---

> **本文件 = 合并版**（2026-05-09 + 2026-05-16）。下一次审计应在：(a) 排队 11 完成后做"接 API 后"快照；(b) 排队 13（AI 接 track）后做"AI 真接入后"快照。
