# AI Project Rules

Before starting any task:

1. Read:
- docs/PROJECT_OVERVIEW.md
- docs/DESIGN_SYSTEM.md
- docs/CURRENT_TASK.md

2. Follow architecture rules in:
- docs/ARCHITECTURE.md

3. Use existing components whenever possible.

4. Do not refactor unrelated files.

5. Maintain:
- low saturation
- Apple-like UI
- clean academic aesthetic

6. Mobile responsive required.

7. Avoid modifying:
- auth
- backend
- routing
unless explicitly requested.

8. 数据源文件分流：以下目录/文件**仅在排队 10 / 13 任务读**，其他任务禁 Grep / Read：
- `docs/华师大规则文件pdf/`（source of truth）
- `docs/ecnu-digests/`（5 份 v2 digest + _archive/ 旧版）
- `docs/_archive/华师大公示文件_old_md/`（已归档，不再读）
- `docs/track_kind_taxonomy.md`
- `docs/ecnu_process_rules.md`

文件用途见 `docs/CURRENT_TASK.md` 排队 10。

9. 前端安全铁律（NEVER 列表 —— 违反者直接 block）：

**前端代码 / `.env` / `.env.example` / `.env.local` / `dist/` / git 历史**中永远禁止出现：
- service_role key（Supabase 管理员密钥）
- LLM API key（Anthropic / OpenAI / DeepSeek / Qwen / Zhipu / 任何上游）
- 第三方 secret（支付 / 邮件 / 私有对象存储 / Webhook 签名）
- 数据库直连密码 / JWT 签名密钥 / 加密私钥
- 任何 `wrangler secret put` 注入的值（按定义就是 server-only）

**前端允许出现**：Supabase URL + publishable/anon key（`sb_publishable_*`，设计上可公开）+ 公开 endpoint。
`VITE_*` = 构建时常量，会内联进 bundle，**判定标准：能写进 README 给路人看的才能进 `VITE_*`**。

凡需密钥的能力 → 必须走 server route（`src/routes/api/*`），key 用 `wrangler secret put` 注入。

权限判断的边界：admin / vip / premium 等角色**绝不**只在前端判定；安全边界永远是 **server route + Postgres RLS** 双层。前端 flag 仅用于 UX 显隐，不是安全边界。

数据库授权只走 RLS：新增 user-owned 表的 migration 必须**同步**写齐 RLS policies（select/insert/update/delete）。

详细说明：`docs/ARCHITECTURE.md` §9 / `docs/PROJECT_OVERVIEW.md` 安全边界 / `docs/backend_migration_plan.md` §1。
