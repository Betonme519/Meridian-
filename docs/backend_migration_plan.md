# 后端迁移规划 / Backend Migration Plan

> 本文档记录 2026-05-28 安全审计结论 + 分阶段后端迁移路线。
> Last updated: **2026-05-28**
> 路线选定：**A — Cloudflare Workers + TanStack Start server route**（TS 同栈，不引入 Python）

---

## 1. 当前安全审计结论（2026-05-28）

### 1.1 通过项（无需处理）

| 检查项 | 状态 | 证据 |
|---|---|---|
| `.env.local` 是否提交 git | ✅ 未提交 | `git log --all -- .env.local` 空 |
| `.env.example` 含真实 key | ✅ 无 | 全部 `your-*` 占位符 |
| `.gitignore` 配置 | ✅ 正确 | `*.local` + `.env` 双重覆盖 |
| 前端含 `service_role` key | ✅ 零出现 | 仅注释中提及概念，无 key 字面量 |
| 前端含 AI / Anthropic / OpenAI key | ✅ 零出现 | `anthropic.ts` 是 stub（throw），默认 `VITE_AI_PROVIDER=mock` |
| Supabase anon key 暴露 | ⚠️ 设计内 | `sb_publishable_*` 是 Supabase 新版**可公开** key，前端 bundle 中存在符合预期 |
| Admin / VIP role 伪安全 | ✅ 当前无 | 全代码 `isAdmin / vip / hasPermission` 0 业务命中 |
| RLS 启用范围 | ✅ 全表 | 15 张表全部 `ENABLE ROW LEVEL SECURITY` |
| RLS owner-only policy | ✅ 完整 | 9 张用户表 select/insert/update/delete 按 `auth.uid()=user_id` 隔离 |
| RLS 公共表 policy | ✅ 完整 | 6 张公共表 SELECT for all，写仅 service_role bypass |

### 1.2 待处理项（按优先级）

| ID | 严重度 | 问题 | 处置 |
|---|---|---|---|
| **S1** | 🟡 **中** | `storage.objects`（`rag_sources` bucket）的 RLS policy 在 0001 migration 里被注释掉，用户**可能**能下载他人 PDF | **手动**：到 Supabase Dashboard → Storage → `rag_sources` → Policies 检查；若缺则写 `0012_add_storage_rls.sql`。**不要盲目写 migration 前先确认**。 |
| **S2** | 🟢 低 | 13 个 api 文件 `throw new Error(error.message)`，Postgres 原始错误会冒到 UI（已存在的 TD-4） | Phase 4 一起处理 |
| **S3** | 🟢 低 | `guestMode` 是 localStorage flag，用户可绕过 → 但 RLS 仍拒写，**非安全问题，仅 UX 提示** | 不处理 |
| **S4** | 🟢 低 | 无 server-side rate limit / 用量统计 | Phase 2 接 AI 后做 |

### 1.3 当前架构与目标架构差距

**当前（2026-05-28）：**
```
React + Vite (浏览器)
  ↓ supabase-js (anon key + 用户 JWT)
Supabase Postgres / Storage (RLS 把关)
```

**目标（Phase 2+）：**
```
React + Vite (浏览器)
  ↓ fetch /api/*
TanStack Start server route (Cloudflare Worker)
  ↓ ① 转发上游 LLM   ② 服务端调 Supabase（带 user JWT）
LLM (DeepSeek/Qwen/Zhipu/Anthropic) + Supabase Postgres
```

**关键约束：**
- 简单 CRUD（profiles/course/plan/rule/chat_message/user_progress）**保留**走 Supabase 直连 + RLS，不强行经后端中转
- 只有"持密钥 / 重逻辑 / 防爬"的请求才走 server route：AI 调用、课程规划算法、毕业要求判断、RAG 检索、管理员接口

---

## 2. 6 阶段路线

### Phase 1 · 安全审计 + 最小后端骨架（当前）

**已完成：**
- 安全审计（本文 §1）
- 选定路线 A（Cloudflare Workers + TanStack Start server route）
- 写本文档

**本阶段产出文件：**
- `docs/backend_migration_plan.md`（本文）
- `src/routes/api/ai/chat.ts`（mock SSE stub，return 10 token + `[DONE]`）
- `src/ai/providers/remote.ts`（仅改 1 行 `ENDPOINT` 常量）
- `docs/AI_PROXY_SPEC.md`（同步路径名）

**不做：**
- 不接真 LLM
- 不改 13 个 api 文件
- 不改 RLS / migrations
- 不改前端 UI

**用户待办（手动）：**
- [ ] **S1** Supabase Dashboard → Storage → `rag_sources` 检查 RLS policy 是否启用

---

### Phase 2 · AI key 与 AI 调用迁后端

**触发条件：** ✅ 已触发（2026-05-29 用户拍板 **智谱 GLM**）

**进行中（2026-05-29）：**
1. ✅ `src/routes/api/ai/chat.ts` 已从 mock 替换为真 SSE proxy（智谱 OpenAI 兼容协议）
2. ✅ 本地 `.dev.vars` 注入 `ZHIPU_API_KEY` + `GLM_MODEL=glm-5.1`
3. ✅ 错误归一脱敏（不暴露厂商 / endpoint / raw error）
4. ⏳ 部署：`wrangler secret put ZHIPU_API_KEY` + `wrangler secret put GLM_MODEL`
5. ⏳ 前端 `.env.local` 切 `VITE_AI_PROVIDER=remote` 跑通
6. ⏳ Supabase session 校验（authorization header → `supabase.auth.getUser`）
7. ⏳ server-side rate limit（KV 存计数，每 user 每分钟上限）

**模型切换策略（同 provider 内零成本）：**
- 跑顺后改 `GLM_MODEL` 一行即可切档：`glm-5.1` → `glm-4.5-air`（便宜 75%）→ `glm-4.5-flash`（免费兜底）
- 未来换 provider（DeepSeek / Qwen）：endpoint + key 名换两处，协议本体不变（OpenAI 兼容）

**风险：** session 校验未加之前所有人都能调，**部署前必须补**。当前仅本地 dev 跑通 mock→真链路。

---

### Phase 3 · 课程规划 / 毕业要求判断迁后端

**前置：** Phase 2 完成

**任务：**
1. 把 `src/lib/trackRecommendation.ts` 的算法逻辑移到 `src/routes/api/track/recommend.ts`
2. 把毕业要求判断（散在 hooks 内的 GPA / 学分校验）抽到 `src/routes/api/requirement/check.ts`
3. 前端改成调 server route，hook 形态保留（替换实现，UI 不动）
4. server 端可访问 service_role key（写 `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`）做需要跨用户读的逻辑

**为什么移到后端：**
- 算法逻辑变重 → 前端 bundle 不可控
- 防爬 / 防作弊（用户改前端 state 不能伪造毕业达成）
- 未来"AI 协同规划"需要在同一进程内调 LLM + 算法

---

### Phase 4 · Supabase RLS 与权限策略完善

**任务：**
1. 处理 S1（storage RLS，若 Phase 1 验证发现缺失）
2. 处理 S2（错误归一：api 层不再直接抛 Postgres message，改 `failApiCall` + 用户友好 msg）
3. 加 audit log 表（`audit_log` 记录敏感写：plan 删、profile 改 trust_level 等）
4. 若未来需要 admin 角色 → 走 Postgres `auth.jwt() ->> 'role'`，**不**在前端判

---

### Phase 5 · RAG / 文件解析 / 对象存储完整接入

**任务：**
1. RAG chunk 解析 worker：上传 PDF → server route 调 unstructured.io / 自建解析 → 写入 `rag_source` + 向量
2. 检索 endpoint `src/routes/api/rag/search.ts`：用户 query → 向量召回 + rerank → return chunks
3. AI 调用时 server route 内组装 RAG context（前端只发问题，不发 chunks）
4. 对象存储分桶：用户私有桶 vs 公共规则 PDF 桶分开 policy

---

### Phase 6 · Admin 后台 + 日志监控 + 异步任务

**任务：**
1. Admin route group `src/routes/_admin/*`：用 Postgres role 判断 + server route 加 service_role 调用
2. Cloudflare Workers Logs / Tail 接入；错误送 Sentry
3. 异步任务队列：Cloudflare Queues（接收 RAG 解析任务、批量邮件等）
4. Redis 替代候选：Cloudflare KV / Durable Objects（同栈，免运维）

---

## 3. 不做事项（明确记录）

| 想做但暂不做 | 原因 |
|---|---|
| 引入 FastAPI / Python | 双语言栈成本高；Worker 路线已能覆盖所有需求 |
| 把现有 13 个 api 文件全部改成走 server route | Supabase 直连 + RLS 是官方推荐模式，强行中转徒增延迟 |
| 一次性写完 Phase 2-6 所有代码 | 用户明确"不一次性重构"；按需推进 |
| 重命名 `.env.example` 或加入更多变量 | 当前 `.env.example` 已正确 |
| 加 CSRF token | Supabase JWT + same-origin fetch 不需要；future Phase 6 再视情况加 |
| 自建 admin 用户表 | Postgres role + RLS 已能表达，Phase 4-6 时复用 |

---

## 4. 与现有文档的关系

| 现有文档 | 关系 |
|---|---|
| `docs/AI_PROXY_SPEC.md` | 仍是 Phase 2 的实施手册；本文档是**总路线**，spec 是**单点细节** |
| `docs/ARCHITECTURE.md` §4 "AI proxy 落点 TBD" | 本文档已**拍板**为 TanStack Start server route；ARCHITECTURE.md 后续可去掉 TBD（不在本轮做） |
| `docs/CURRENT_TASK.md` 排队体系 | 后端迁移**不进**现有排队，按本文档 Phase 顺序独立推进 |

---

## 5. 路径约定变更（2026-05-28）

| 旧 | 新 | 原因 |
|---|---|---|
| `POST /api/ai.chat` | `POST /api/ai/chat` | TanStack Router 文件路由对路径中的 `.` 解释为分段符；改用 `/` 与 `_app/ai-advisor.tsx` 目录风格一致 |

影响：
- `src/ai/providers/remote.ts` ENDPOINT 常量改一行
- `docs/AI_PROXY_SPEC.md` 标题与正文路径引用同步
- 其余无影响（remote provider 默认未启用）
