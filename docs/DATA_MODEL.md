# Data Model — Supabase Postgres Schema

> 5 张主表 + 1 张可选表（RAG）。读完应能直接在 Supabase Dashboard 建表。
>
> Last updated: **2026-05-10**
> Related: `docs/ARCHITECTURE.md` § 5（状态管理）/ `docs/AI_MEMORY.md` § Supabase 接入决策 / `docs/CURRENT_TASK.md` 排队 3
>
> 本文档不是最终落地 SQL —— 字段定型后再走一轮 `supabase/migrations/` 生成迁移文件。

---

## 0. 设计原则

1. **单一真理源是 `auth.users`**。所有用户私有表都用 `user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE`，删账号即清干净。
2. **RLS 默认开启**，每张表都有 `OWNER ONLY` 模板（`auth.uid() = user_id`）；要共享数据再单独写策略。
3. **JSONB 用于"图状 / 树状 / 用户自定义形状"** 的数据（plan 的 ReactFlow nodes/edges、ai chat 的 metadata），**绝不**用来存能查询的关系字段。
4. **timestamps**：每表都有 `created_at timestamptz default now()` + `updated_at timestamptz default now()`，`updated_at` 由 trigger 维护（见 §7）。
5. **主键统一 `uuid default gen_random_uuid()`**（Postgres 13+ 内置，不需要 `uuid-ossp` extension）。
6. **软删不做** —— 删就是真删，业务层别依赖回滚。
7. **enum 用 `text` + `CHECK`** 而非 Postgres ENUM 类型 —— 改起来不用 ALTER TYPE 反复折腾。

---

## 1. 决策点（已于 2026-05-10 用户确认）

| ID | 题 | 选定 | 理由 |
|---|---|---|---|
| **D1**（升级） | 建 `profiles` 表？原 D1=a 决定不建（名字塞 metadata） | ✅ **建** | 排队 3 起就有 school / major / grade / target_gpa 要存，metadata 已不够用 |
| **D5** | `course` 是「学校官方 catalog」还是「用户私有修课记录」？ | ✅ **(a) 用户私有修课记录** | catalog 数据来自 `rag_source` 里 PDF 解析，AI 检索时按需用；建独立 catalog 表要先做学校手册爬虫，超出 MVP |
| **D6** | `plan` 用 JSONB 整存 ReactFlow graph，还是拆 `plan_node` / `plan_edge` 两张表？ | ✅ **(a) JSONB 整存** | round-trip 干净（直接喂 `<ReactFlow nodes={} edges={}>`），未来要做"哪些 plan 包含 CS 241"再拆 |
| **D7** | `rule` 是「同校共享」还是「用户私有」？ | ✅ **(a) 用户私有** | RLS 简单（owner only）；未来加 `school_rules` public 表共享，规则按 `school_id` 去重 |
| **D8** | 规则冲突放进 `rule.conflicts_with text[]`，还是单独 `rule_conflict` 表？ | ✅ **(b) 单独** | 冲突有 judgement 文本和置信度；单独表写 RLS 不需要数组解构 |
| **D9** | `chat_message` 是否要 parent `chat_conversation` 表？ | ✅ **(a) 不要，`conversation_id` 字段直接在 message 上** | 5 表预算就这么多；conversation 是 derived view（`SELECT DISTINCT conversation_id`），加 parent 表得不偿失 |

**回头要改的成本：** 多数 (a)→(b) 不破坏 API，加表迁移即可；(b)→(a) 要数据合并，难度高。所以先 (a)。

---

## 2. 表清单速览

```
auth.users                  ← Supabase 内置，不动
  └── profiles              (1:1)  用户资料：学校 / 专业 / 年级 / 目标 GPA / 当前模式
  └── course                (1:N)  用户修课记录：每条 = 某学期某门课的状态 + 成绩
  └── plan                  (1:N)  规划工作区：每条 = 一张 ReactFlow 决策图
  └── rule                  (1:N)  规则知识库：trust 分级 + source 出处
  │     └── rule_conflict   (M:N)  规则之间的冲突 + AI judgement
  └── chat_message          (1:N)  AI 对话历史，按 conversation_id 分组
  └── rag_source            (1:N)  上传文件清单（培养方案 / 成绩单 / 课表 / ...）
                                   实际文件在 Supabase Storage，本表只存元数据 + 解析状态

(独立公共表族 — 学校客观规则，见 docs/TRACK_SCHEMA.md)
track                       公共表，无 user_id
  └── track_category        (1:N)  一级分类（专业必修 / 公选 / ...）
       └── track_requirement (1:N)  具体要求（如 "数学基础 4 门"）
            └── track_option (1:N)  可选项（课程 / 抵学分 / project）

user_progress               (1:N)  用户在 track 中的进度，option 级
  ← auth.users / track / track_option
```

> **track_* 五张表的 schema 详情、决策点、迁移路径** 全部见 `docs/TRACK_SCHEMA.md`。
> 本文件仅维护 7 张 user-owned 表；track_* 是独立公共表族，文档分开避免互相挤占。

---

## 3. 表详情

### 3.1 `profiles`

**用途：** auth.users 1:1 扩展。Supabase 推荐写法（参考官方 Auth 文档），用 trigger 在 `auth.users` insert 时自动创建对应 profiles 行。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | uuid | ✅ | — | PK，**等于** `auth.users.id`（不用 `default gen_random_uuid()`） |
| `name` | text | ❌ | `null` | 旧账号 fallback 走 `auth.users.user_metadata.name`；新账号写本字段 |
| `school` | text | ❌ | `null` | 学校名（ASCII / 中文都行）。MVP 用自由文本，未来加 `schools` 字典表 |
| `major` | text | ❌ | `null` | 专业名 |
| `grade` | smallint | ❌ | `null` | 入学年份（如 2024、2025），不是大几 |
| `target_gpa` | numeric(3,2) | ❌ | `null` | 4.00 制，如 3.85；范围 0.00–4.30（部分学校 4.3 制） |
| `goal_mode` | text | ❌ | `'高 GPA'` | 当前推荐模式，CHECK IN (`'高 GPA'`,`'最轻松毕业'`,`'保研路线'`,`'留学路线'`,`'实习优先'`,`'时间自由'`,`'低压力模式'`,`'个性化定制'`) |
| `goal_weights` | jsonb | ❌ | `'{}'::jsonb` | 当 `goal_mode = '个性化定制'` 时存权重，shape `{ "保研": 60, "留学": 30, "实习": 10 }` |
| `created_at` | timestamptz | ✅ | `now()` | |
| `updated_at` | timestamptz | ✅ | `now()` | 由 trigger 自动维护 |

**RLS**

```
SELECT  : auth.uid() = id
INSERT  : auth.uid() = id  -- 实际由 trigger 写入，policy 兜底
UPDATE  : auth.uid() = id
DELETE  : false           -- 删账号才会删 profiles，不允许直接 DELETE
```

**索引**

无业务索引（PK 自动；无别的查询路径）。

**Trigger**

```
on_auth_user_created  : auth.users INSERT → profiles INSERT (id, name = NEW.raw_user_meta_data->>'name')
on_profiles_update    : profiles UPDATE → SET updated_at = now()
```

---

### 3.2 `course`

**用途：** 用户的修课记录。一行 = 用户 × 某学期 × 某门课。**不是**学校 catalog（catalog 数据从 `rag_source` 里的 PDF 由 AI 解析后供检索，不入表）。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | uuid | ✅ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ✅ | — | FK `auth.users(id) ON DELETE CASCADE` |
| `code` | text | ✅ | — | 课程代码，如 `CS 241`、`MATH 233`、`HIST 118` |
| `name` | text | ✅ | — | 课程中文名 |
| `credits` | numeric(3,1) | ❌ | `null` | 学分，如 3.0 / 1.5 |
| `category` | text | ❌ | `null` | CHECK IN (`'必修'`,`'选修'`,`'公选'`,`'通识'`,`'体育'`,`'实践'`,`'第二课堂'`)，未填 = 未分类 |
| `semester` | text | ❌ | `null` | 学期，如 `'2025-fall'`、`'2026-spring'`；用字符串避免学校学期表达不一 |
| `status` | text | ✅ | `'planned'` | CHECK IN (`'planned'`,`'enrolled'`,`'completed'`,`'dropped'`,`'failed'`) |
| `grade_letter` | text | ❌ | `null` | 字母分，如 `'A'` / `'A-'` / `'B+'` / `'P'` / `'F'`；P/F 课用 `'P'` |
| `grade_point` | numeric(3,2) | ❌ | `null` | 4.00 制绩点；`P` / `F` / 体育课等不计 GPA 的留 null |
| `counts_in_gpa` | boolean | ✅ | `true` | P/F 课 / 体育课设 false（影响下游 GPA 计算） |
| `instructor` | text | ❌ | `null` | 任课老师名（学生评价用） |
| `notes` | text | ❌ | `null` | 用户备注 |
| `created_at` | timestamptz | ✅ | `now()` | |
| `updated_at` | timestamptz | ✅ | `now()` | |

**RLS**

```
all CRUD : auth.uid() = user_id
```

**索引**

```
idx_course_user_semester    (user_id, semester)         -- 列学期成绩单
idx_course_user_status      (user_id, status)           -- 区分已修 / 计划中
idx_course_user_code        (user_id, code)             -- 重复修课 / 替代规则查询
```

**注意**

- 没有 `UNIQUE (user_id, code, semester)` 约束 —— 允许同一门课在同一学期出现两次（用户撤选后重选 / 数据导入纠错）；业务层去重。
- `grade_point` 与 `grade_letter` 都存 —— letter 是真值，point 是冗余的 numeric 缓存（避免每次查 GPA 都要做 letter→point map）。

---

### 3.3 `plan`

**用途：** 用户在 `/course-planner` 页面建的决策图。一行 = 一张完整的 ReactFlow 工作区快照。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | uuid | ✅ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ✅ | — | FK `auth.users(id) ON DELETE CASCADE` |
| `name` | text | ✅ | `'未命名规划'` | 用户起的名字，如「保研路线 2026 春」 |
| `goal_mode` | text | ❌ | `null` | 这张 plan 关联的目标模式（同 profiles.goal_mode 取值集），可与 profiles 当前模式不同 |
| `nodes` | jsonb | ✅ | `'[]'::jsonb` | ReactFlow 的 nodes 数组，shape 见下方注释 |
| `edges` | jsonb | ✅ | `'[]'::jsonb` | ReactFlow 的 edges 数组 |
| `viewport` | jsonb | ❌ | `null` | `{ x, y, zoom }`，下次打开恢复视口 |
| `is_archived` | boolean | ✅ | `false` | 归档不删，列表默认过滤 |
| `created_at` | timestamptz | ✅ | `now()` | |
| `updated_at` | timestamptz | ✅ | `now()` | |

**JSONB shape — `nodes`**

```jsonc
[
  {
    "id": "n_1",
    "type": "meridian",                            // 与 Planner.tsx 的 nodeTypes 对应
    "position": { "x": 120, "y": 40 },
    "data": {
      "kind": "course",                            // course | requirement | gpa | risk | goal | workload | abroad | internship | second-class | volunteer | alternative
      "label": "CS 241",
      "value": "压分严重",                          // 可选副文案
      "source": "课评网",                           // 可选出处
      "trust": "low"                               // high | med | low（与 rule.trust 同义）
    }
  }
]
```

**JSONB shape — `edges`**

ReactFlow 标准 edge：`{ id, source, target, type?, label?, markerEnd? }`。

**RLS**

```
all CRUD : auth.uid() = user_id
```

**索引**

```
idx_plan_user_active  (user_id, is_archived)        -- 列出用户的活跃 plan
idx_plan_user_updated (user_id, updated_at DESC)    -- "最近编辑" 排序
```

**注意**

- 不为 nodes / edges 内字段建 GIN 索引 —— 暂时没有"按节点 kind 跨 plan 查询"的需求，加了也是浪费写入。
- 对 nodes 长度做软限制（前端层面 max 100 节点），DB 层不卡。

---

### 3.4 `rule`

**用途：** 用户的规则知识库。每行 = 一条规则（例：「必修课全部计入 GPA」），带 trust 分级 + 出处。来自 AI 解析培养方案 + 用户手动录入 + 社区抓取。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | uuid | ✅ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ✅ | — | FK `auth.users(id) ON DELETE CASCADE`（D7=a 用户私有） |
| `branch` | text | ✅ | — | 分组名，如 `'GPA 计算规则'` / `'学分结构'` / `'第二课堂'`；前端用来折叠树 |
| `title` | text | ✅ | — | 规则简述，如 `'必修课全部计入 GPA'` |
| `body` | text | ❌ | `null` | 详细解释；可以为空（标题已够） |
| `trust` | text | ✅ | `'med'` | CHECK IN (`'high'`,`'med'`,`'low'`)。high=官方规则；med=AI 推测；low=学生评价 |
| `source` | text | ❌ | `null` | 自由文本，如 `'培养方案 v2024 第 6 页 §3.1'`、`'教务处官网'`、`'匿名社区'` |
| `source_page` | text | ❌ | `null` | 页码或章节号；可与 source 拆开方便定位 |
| `rag_source_id` | uuid | ❌ | `null` | FK `rag_source(id) ON DELETE SET NULL`，规则从哪份文档抽出来的（可空，手动录入的没有） |
| `created_at` | timestamptz | ✅ | `now()` | |
| `updated_at` | timestamptz | ✅ | `now()` | |

**RLS**

```
all CRUD : auth.uid() = user_id
```

**索引**

```
idx_rule_user_branch  (user_id, branch)             -- 按分支折叠
idx_rule_user_trust   (user_id, trust)              -- 按 trust 过滤
```

---

### 3.5 `rule_conflict`

**用途：** 两条规则之间的冲突 + AI 给出的判断（D8=b）。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | uuid | ✅ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ✅ | — | FK `auth.users(id) ON DELETE CASCADE`，冗余字段方便 RLS（不用 join rule 表） |
| `rule_a_id` | uuid | ✅ | — | FK `rule(id) ON DELETE CASCADE` |
| `rule_b_id` | uuid | ✅ | — | FK `rule(id) ON DELETE CASCADE` |
| `title` | text | ✅ | — | 冲突主题，如 `'体育课是否计入 GPA'` |
| `judgement` | text | ❌ | `null` | AI 判断，如 `'AI 倾向教务处口径'` |
| `confidence` | text | ❌ | `null` | CHECK IN (`'high'`,`'med'`,`'low'`)；与 trust 同义但独立字段（判断置信度 ≠ 规则置信度） |
| `resolved_by` | text | ❌ | `null` | CHECK IN (`'a'`,`'b'`,`'unresolved'`)；用户拍板用哪条 |
| `created_at` | timestamptz | ✅ | `now()` | |
| `updated_at` | timestamptz | ✅ | `now()` | |

**RLS**

```
all CRUD : auth.uid() = user_id
```

**约束 + 规范化（防数据歧义）**

```
CHECK (rule_a_id < rule_b_id)              -- 强制 a < b 字典序，A↔B 与 B↔A 必属同一行
UNIQUE (rule_a_id, rule_b_id)              -- 同一对规则不能录两次
-- 上两条联合 → 不会出现 (A,B) 又 (B,A) 两行同义重复
```

**Trigger（用户一致性校验）**

```sql
-- 防止用户用别人的 rule_id 拼凑 conflict（不会泄漏数据，但污染表）
CREATE OR REPLACE FUNCTION check_rule_conflict_owner()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT user_id FROM rule WHERE id = NEW.rule_a_id) <> NEW.user_id
  OR (SELECT user_id FROM rule WHERE id = NEW.rule_b_id) <> NEW.user_id THEN
    RAISE EXCEPTION 'rule_a/rule_b must belong to the same user_id';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_rule_conflict_owner
  BEFORE INSERT OR UPDATE ON rule_conflict
  FOR EACH ROW EXECUTE FUNCTION check_rule_conflict_owner();
```

**索引**

```
idx_rule_conflict_user  (user_id)
idx_rule_conflict_a     (rule_a_id)
idx_rule_conflict_b     (rule_b_id)
```

**前端注意**：插入时必须先把 `(a, b)` 排序成 `(min, max)` 再写入，否则 CHECK 失败。可以在插入前 `if (aId > bId) [aId, bId] = [bId, aId];`。

---

### 3.6 `chat_message`

**用途：** AI advisor 的对话历史。`conversation_id` 把消息分组成会话（D9=a 不开 parent 表）。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | uuid | ✅ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ✅ | — | FK `auth.users(id) ON DELETE CASCADE` |
| `conversation_id` | uuid | ✅ | `gen_random_uuid()` | 同一会话所有消息共用一个 id；前端起新对话时生成新值 |
| `role` | text | ✅ | — | CHECK IN (`'user'`,`'assistant'`,`'system'`) |
| `content` | text | ✅ | — | 消息正文（markdown 允许） |
| `mode` | text | ❌ | `null` | 触发该轮对话的 goal_mode 快照（同 profiles.goal_mode 取值） |
| `metadata` | jsonb | ❌ | `'{}'::jsonb` | 流式 token 计数、引用的 rule_id 列表、模型名等运行时杂项 |
| `created_at` | timestamptz | ✅ | `now()` | 排序键 |

> 没有 `updated_at` —— chat_message 历史不可变。要修改 = 删了重建。

**RLS**

```
SELECT  : auth.uid() = user_id
INSERT  : auth.uid() = user_id
UPDATE  : false
DELETE  : auth.uid() = user_id   -- 用户可清空对话
```

**索引**

```
idx_chat_user_conv_created  (user_id, conversation_id, created_at)   -- 拉取一个会话的所有消息按时间序
idx_chat_user_created       (user_id, created_at DESC)               -- "最近对话" 列表
```

---

### 3.7 `rag_source`（可选 / 推荐建）

**用途：** 上传文件的元数据 + 解析状态。实际文件 bytes 在 Supabase Storage（推荐 bucket：`rag_sources`，对应 D3 决策延伸）。本表只存 path + 状态。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | uuid | ✅ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ✅ | — | FK `auth.users(id) ON DELETE CASCADE` |
| `name` | text | ✅ | — | 用户看到的文件名，如 `'培养方案 v2024.pdf'` |
| `kind` | text | ✅ | — | CHECK IN (`'培养方案'`,`'成绩单'`,`'课表'`,`'手册'`,`'其它'`) |
| `mime` | text | ❌ | `null` | `'application/pdf'` / `'image/png'` / ... |
| `size_bytes` | bigint | ❌ | `null` | |
| `storage_path` | text | ✅ | — | Supabase Storage **bucket 内**路径（不含 bucket 名），格式 `<auth_uid>/<rag_source_id>.<ext>`，例如 `'5f8c.../9a3e....pdf'`。bucket 名固定 `rag_sources`，由代码常量持有不入库 |
| `parsed_status` | text | ✅ | `'pending'` | CHECK IN (`'pending'`,`'parsing'`,`'parsed'`,`'failed'`) |
| `parsed_text` | text | ❌ | `null` | 解析出的纯文本；MVP 直接塞这里，未来超 1MB 再拆 `rag_chunk` 表加 pgvector embedding |
| `parse_error` | text | ❌ | `null` | failed 时的错误摘要 |
| `parsed_at` | timestamptz | ❌ | `null` | parsed_status 进入终态时写入 |
| `created_at` | timestamptz | ✅ | `now()` | |
| `updated_at` | timestamptz | ✅ | `now()` | |

**RLS**

```
all CRUD : auth.uid() = user_id
```

**Storage RLS（同步配置）**

```
INSERT  : auth.uid()::text = (storage.foldername(name))[1]   -- 只能往 自己的子目录 写
SELECT  : auth.uid()::text = (storage.foldername(name))[1]
UPDATE  : auth.uid()::text = (storage.foldername(name))[1]
DELETE  : auth.uid()::text = (storage.foldername(name))[1]
```

**索引**

```
idx_rag_user_kind     (user_id, kind)
idx_rag_user_status   (user_id, parsed_status)
```

**注意**

- `parsed_text` 是 MVP 取巧 —— 短文档直接塞文本字段，AI 检索时 `WHERE id = ?` 拉全文。文档大或要 embedding 检索时再升级到 `rag_chunk` 表 + pgvector。
- 解析任务由 Edge Function / Worker 异步处理；本表的 `parsed_status` 是状态机轮询点。

---

## 4. RLS 总览

每张表都开 RLS（`ENABLE ROW LEVEL SECURITY`），策略名建议 `<table>_<verb>_owner`，例如 `profiles_select_owner`。

**通用模板（适合 course / plan / rule / rule_conflict / chat_message / rag_source）：**

```sql
-- 把 <table> 替换成实际表名
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY <table>_select_owner ON <table>
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY <table>_insert_owner ON <table>
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY <table>_update_owner ON <table>
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY <table>_delete_owner ON <table>
  FOR DELETE USING (auth.uid() = user_id);
```

**chat_message 特殊**：UPDATE 策略不建（消息不可改）；前端层禁用编辑按钮。

**profiles 特殊**：DELETE 策略不建；删除走 `auth.users` 级联，profiles 是被动跟删。

---

## 5. 触发器与函数

### 5.1 `set_updated_at`

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;
```

挂在每张有 `updated_at` 字段的表（profiles / course / plan / rule / rule_conflict / rag_source）上：

```sql
CREATE TRIGGER trg_<table>_updated_at
  BEFORE UPDATE ON <table>
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### 5.2 `handle_new_user`

注册时自动建 profiles 行，把 metadata 里的 name 顺手抄过来：

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

> `SECURITY DEFINER` 必需 —— `auth.users` 表只有 supabase_auth_admin 能写，trigger 函数得以 owner 权限运行才有权 INSERT 到 public schema。

### 5.3 其他 trigger

- **`check_rule_conflict_owner`**（见 § 3.5）：插入 `rule_conflict` 时校验 `rule_a` / `rule_b` 都属于同一 user，防 ID 拼凑。

---

## 5b. 后端 service_role bypass RLS（注意事项）

Cloudflare Worker 端跑 AI 抽数据 / RAG 解析时会用 `SUPABASE_SERVICE_ROLE_KEY` 直连，**绕过所有 RLS**。这条路径要单独审计，原则：

- service_role 只在 server-side 用，**绝不**进 client bundle（Vite `VITE_*` 会被字面量替换 → 直接泄漏给前端）
- 写入业务表时手动校验 `user_id`（RLS 帮不了你）
- 与排队 2（AI provider 抽象）一起设计；DATA_MODEL 本文档只覆盖 anon-key 浏览器端的情况

---

## 6. 命名 / 类型规范

- 表名：单数（`course` 而非 `courses`）。Supabase 客户端 `.from("course")` 读起来更像句子。
- 字段名：`snake_case`，全小写。
- 时间戳：`*_at` 后缀（`created_at` / `updated_at` / `parsed_at`）。
- 布尔：`is_*` / `has_*` 前缀（`is_archived`、`has_warning`）。例外：`counts_in_gpa`（动词在前更自然）。
- 枚举字段：`text + CHECK IN (...)`，**不**用 Postgres ENUM 类型（迁移成本高）。
- JSONB：仅用于不查询的形状自由字段；要查就拆列。
- FK 命名：`<other_table>_id`（`user_id` / `rag_source_id`）。

---

## 7. 迁移路径（与当前代码的衔接）

**当前状态：** Supabase auth 接入跑通，但只用了 `auth.users`，业务表全空 const。

**第一波（建议合并一个 migration）：**
1. 建 6 张表（含 trigger）
2. 开 RLS + 写 policies
3. 给 `auth.users` 接 `on_auth_user_created` trigger（注意：旧账号不会回填，要补一个 backfill SQL：`INSERT INTO profiles (id) SELECT id FROM auth.users ON CONFLICT DO NOTHING`）
4. Supabase Storage 建 `rag_sources` bucket + RLS
5. 验证：用现有测试账号登录，检查 profiles 行已自动建

**第二波（功能页接数据）：**
- `/import` 接 `rag_source` + Storage（排队 4 推荐起点）
- `/course-planner` 接 `plan`
- `/schedule` 接 `rule` + `rule_conflict`
- `/dashboard` 聚合上述
- `/ai-advisor` 接 `chat_message`（依赖排队 2 的 AI provider 抽象先就位）

---

## 8. 不在本轮做（明确推迟）

- **学校字典 `schools` 表**：先用 profiles.school 自由文本；用户量起来再做去重 + 别名归一
- **学期字典 `semesters` 表**：同上
- **`school_rules` public 表（D7=b 升级路径）**：等多用户场景验证规则确实能共享再拆
- **`rag_chunk` + pgvector embedding**：等用户上传的文档体量超过单字段 1MB 阈值再做
- **审计 / 操作日志 `audit_log` 表**：MVP 不做，未来合规要求时加
- **partial index / BRIN / 物化视图**：当前数据量根本碰不到，等慢查询出现再优化
- **多语言 `locale` 字段**：UI 是中文 + Inter 英数混排，schema 不需要 i18n 标签

---

## 9. SQL 速查附录（**未经审定，仅供下一轮 SQL 落地参考**）

> 下一轮专门走一遍 SQL Editor 验证 + 落到 `supabase/migrations/<timestamp>_init_schema.sql`。这里只是把字段表翻成可执行 DDL 方便本轮一次性扫一眼对应关系，**不要**直接复制到生产。
>
> **建表顺序 ≠ 编号顺序**：因为 `rule.rag_source_id` 是 FK，落地时按 `profiles → rag_source → course → plan → rule → rule_conflict → chat_message` 顺序执行（编号 9.1 → 9.7 → 9.2 → 9.3 → 9.4 → 9.5 → 9.6）。或者：先建 `rule` 不带 FK，最后再 `ALTER TABLE rule ADD CONSTRAINT ... FOREIGN KEY ...`。

### 9.1 `profiles`

```sql
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text,
  school      text,
  major       text,
  grade       smallint,
  target_gpa  numeric(3,2),
  goal_mode   text DEFAULT '高 GPA' CHECK (goal_mode IN
                ('高 GPA','最轻松毕业','保研路线','留学路线','实习优先',
                 '时间自由','低压力模式','个性化定制')),
  goal_weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### 9.2 `course`

```sql
CREATE TABLE course (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code          text NOT NULL,
  name          text NOT NULL,
  credits       numeric(3,1),
  category      text CHECK (category IN ('必修','选修','公选','通识','体育','实践','第二课堂')),
  semester      text,
  status        text NOT NULL DEFAULT 'planned'
                CHECK (status IN ('planned','enrolled','completed','dropped','failed')),
  grade_letter  text,
  grade_point   numeric(3,2),
  counts_in_gpa boolean NOT NULL DEFAULT true,
  instructor    text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_user_semester ON course (user_id, semester);
CREATE INDEX idx_course_user_status   ON course (user_id, status);
CREATE INDEX idx_course_user_code     ON course (user_id, code);
```

### 9.3 `plan`

```sql
CREATE TABLE plan (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL DEFAULT '未命名规划',
  goal_mode    text,
  nodes        jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges        jsonb NOT NULL DEFAULT '[]'::jsonb,
  viewport     jsonb,
  is_archived  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_user_active  ON plan (user_id, is_archived);
CREATE INDEX idx_plan_user_updated ON plan (user_id, updated_at DESC);
```

### 9.4 `rule`

```sql
CREATE TABLE rule (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch         text NOT NULL,
  title          text NOT NULL,
  body           text,
  trust          text NOT NULL DEFAULT 'med' CHECK (trust IN ('high','med','low')),
  source         text,
  source_page    text,
  rag_source_id  uuid REFERENCES rag_source(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rule_user_branch ON rule (user_id, branch);
CREATE INDEX idx_rule_user_trust  ON rule (user_id, trust);
```

### 9.5 `rule_conflict`

```sql
CREATE TABLE rule_conflict (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_a_id    uuid NOT NULL REFERENCES rule(id) ON DELETE CASCADE,
  rule_b_id    uuid NOT NULL REFERENCES rule(id) ON DELETE CASCADE,
  title        text NOT NULL,
  judgement    text,
  confidence   text CHECK (confidence IN ('high','med','low')),
  resolved_by  text CHECK (resolved_by IN ('a','b','unresolved')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (rule_a_id < rule_b_id),                  -- 规范化：强制 a < b 字典序，避免反向重复
  UNIQUE (rule_a_id, rule_b_id)
);

CREATE INDEX idx_rule_conflict_user ON rule_conflict (user_id);
CREATE INDEX idx_rule_conflict_a    ON rule_conflict (rule_a_id);
CREATE INDEX idx_rule_conflict_b    ON rule_conflict (rule_b_id);
```

### 9.6 `chat_message`

```sql
CREATE TABLE chat_message (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  role            text NOT NULL CHECK (role IN ('user','assistant','system')),
  content         text NOT NULL,
  mode            text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_user_conv_created ON chat_message (user_id, conversation_id, created_at);
CREATE INDEX idx_chat_user_created      ON chat_message (user_id, created_at DESC);
```

### 9.7 `rag_source`

```sql
CREATE TABLE rag_source (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text NOT NULL,
  kind           text NOT NULL CHECK (kind IN ('培养方案','成绩单','课表','手册','其它')),
  mime           text,
  size_bytes     bigint,
  storage_path   text NOT NULL,
  parsed_status  text NOT NULL DEFAULT 'pending'
                 CHECK (parsed_status IN ('pending','parsing','parsed','failed')),
  parsed_text    text,
  parse_error    text,
  parsed_at      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rag_user_kind   ON rag_source (user_id, kind);
CREATE INDEX idx_rag_user_status ON rag_source (user_id, parsed_status);
```

> **依赖顺序**：`rag_source` 在 `rule` 之前建（rule 有 FK 引用），其余无依赖。
