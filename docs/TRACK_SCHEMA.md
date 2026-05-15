# Track Schema — 毕业路径五层结构

> 学校客观规则（培养方案 / 学分要求 / 课程清单）的结构化层。**与 `rule` 表分工**：
> `rule` 是用户主观偏好与零散知识（"我想保研"、"体育课压分"），track 是学校官方规则。
> 决策依据见 [project memory: track schema pivot 2026-05-14]。
>
> Last updated: **2026-05-15**
> Related: `docs/DATA_MODEL.md`（前 7 张表）/ `docs/CURRENT_TASK.md` 排队 8–13 / `docs/AI_MEMORY.md`
>
> 本文档不是最终落地 SQL —— 字段定型后由排队 9 写 `0002_add_track_schema.sql`。

---

## 0. 设计原则

1. **track_* 四张表是「学校公共数据」**：所有登录用户 `SELECT` 可读，写权限只给 service_role（后端手动 SQL seed / 管理员脚本）。**这是与 DATA_MODEL.md 现有 7 张表的根本区别**。
2. **`user_progress` 是用户私有数据**，沿用 DATA_MODEL.md 通用模板（owner-only RLS）。
3. **track 按 (school, major, year) 三元组唯一**：培养方案每届修订就开新 track；老届毕业生数据不被覆盖。
4. **option 是「可选项」**，不一定是课程：用 `kind: 'course' | 'alt' | 'project'` 字段区分（D-track-4）。
5. **结构平铺**：category → requirement → option 三层固定，不允许 requirement 嵌套 requirement（D-track-3）。复杂表达留 schema v2。
6. **`order_index`** 字段统一控同级排序，前端按它渲染。
7. 沿用 DATA_MODEL.md 通用规范：`uuid default gen_random_uuid()` / `text + CHECK` 代替 ENUM / `timestamptz` + trigger 维护 `updated_at` / 软删不做。

---

## 1. 决策点（已于 2026-05-15 用户确认）

| ID | 题 | 选定 | 理由 |
|---|---|---|---|
| **D-track-1** | track / category / requirement / option 谁能写？ | ✅ **公共表 + service_role 写** | 学校规则录一份所有用户读；user_progress 仍 owner-only。与 `rule`（D7=a 用户私有）分工清晰：rule 是主观偏好，track 是客观规则 |
| **D-track-2** | track 颗粒度？ | ✅ **(school, major, year)** | 培养方案每届有差异，按入学年份分版本最贴行业惯例；老届毕业生数据可保留 |
| **D-track-3** | requirement 是否嵌套？ | ✅ **平铺** | 三层 category → requirement → option 够用；嵌套留 schema v2 |
| **D-track-4** | option 表达力？ | ✅ **`kind` 区分 course / alt / project** | 兼容比赛抵学分、海外交换、转专业等非课程项 |
| **D-track-5** | user_progress 粒度？ | ✅ **option 级** | 状态由数据推导（修了哪几个 option → requirement 满足度计算），最细可信 |
| **D-track-6** | AI 怎么读 track？ | ✅ **整 track JSON 一次性喂 prompt** | 学校 schema 约几千 token，Claude 4 完全吃得下。RAG 留 TD-2 |
| **D-track-7** | prerequisite 怎么表达？ | ✅ **option 加 `prerequisites text[]`** | 弱实现，存先修课代码数组；复杂逻辑（AND/OR、成绩门槛）留 schema v2 升级独立表 |

**回头要改的成本：** D-track-1/2/3/5 改动伤筋动骨（要数据迁移 + UI 重写）；D-track-4/6/7 改动局部（D-track-4 加 kind 值、D-track-6 改 prompt、D-track-7 独立 prerequisite 表）。所以核心四个先稳定。

---

## 2. 表清单速览

```
auth.users
  └── user_progress         (1:N)  用户在某 track 的某 option 上的进度
                            ↓ FK option_id
                            ↓
  track                     ←──┐ 学校 + 专业 + 入学届 = 一条
   └── track_category       (1:N)  专业必修 / 公选 / 通识 ...
        └── track_requirement (1:N)  具体要求（如「数学基础 4 门」）
             └── track_option (1:N)  可选项（课程 / 比赛抵 / project）

公共表：track / track_category / track_requirement / track_option
私有表：user_progress
```

排队 9 落 SQL 后，本仓 DB 共计 7（DATA_MODEL.md）+ 5（本文档）= **12 张业务表**。

---

## 3. 表详情

### 3.1 `track`

**用途：** 一条 track = 「某学校某专业某入学届的毕业要求快照」。同 (school, major, year) 唯一。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | uuid | ✅ | `gen_random_uuid()` | PK |
| `school` | text | ✅ | — | 学校名（自由文本；未来引 `schools` 字典表再迁） |
| `major` | text | ✅ | — | 专业名（自由文本） |
| `year` | smallint | ✅ | — | 入学年份（如 `2024`），不是大几 |
| `name` | text | ✅ | — | 对外展示名（如 `"上理 CS 2024 级培养方案"`） |
| `version` | text | ❌ | `null` | 培养方案版本号（如 `"v2024.1"`） |
| `source_url` | text | ❌ | `null` | 原文链接（PDF / 教务网页） |
| `total_credits` | numeric(5,1) | ❌ | `null` | 毕业总学分要求（如 `158.0`） |
| `description` | text | ❌ | `null` | 备注（如「含暑期学期」） |
| `created_at` | timestamptz | ✅ | `now()` | |
| `updated_at` | timestamptz | ✅ | `now()` | trigger 维护 |

**RLS**

```
SELECT  : true             -- 公共可读（已登录任意用户均可）
INSERT  : false            -- service_role bypass RLS 写，普通用户拒
UPDATE  : false
DELETE  : false
```

**约束**

```
UNIQUE (school, major, year)
CHECK (year BETWEEN 1990 AND 2099)
```

**索引**

```
idx_track_school_major  (school, major)   -- 按学校专业找所有届
```

---

### 3.2 `track_category`

**用途：** track 内的一级分类（专业必修 / 公选 / 通识 / 第二课堂 / ...）。前端横向排列的主线节点。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | uuid | ✅ | `gen_random_uuid()` | PK |
| `track_id` | uuid | ✅ | — | FK `track(id) ON DELETE CASCADE` |
| `code` | text | ✅ | — | 机器名（如 `'major-required'` / `'general-ed'`），同 track 内唯一 |
| `title` | text | ✅ | — | 中文展示名（如 `'专业必修课'`） |
| `order_index` | smallint | ✅ | `0` | 同 track 内排序，前端按它从左到右画 |
| `credit_target` | numeric(5,1) | ❌ | `null` | 该 category 学分目标（如 `60.0`） |
| `description` | text | ❌ | `null` | |
| `created_at` | timestamptz | ✅ | `now()` | |
| `updated_at` | timestamptz | ✅ | `now()` | trigger 维护 |

**RLS**

公共可读 + service_role 写（同 §3.1 模板，下同不再重复）。

**约束**

```
UNIQUE (track_id, code)
```

**索引**

```
idx_track_category_track_order  (track_id, order_index)
```

---

### 3.3 `track_requirement`

**用途：** category 下的具体要求（"数学基础 4 门" / "完成 1 个毕设" / "公选 ≥ 8 学分"）。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | uuid | ✅ | `gen_random_uuid()` | PK |
| `track_id` | uuid | ✅ | — | FK `track(id) ON DELETE CASCADE`；冗余字段方便 RLS / 查询不用 join category |
| `category_id` | uuid | ✅ | — | FK `track_category(id) ON DELETE CASCADE` |
| `code` | text | ✅ | — | 机器名（如 `'math-foundation'`），同 category 内唯一 |
| `title` | text | ✅ | — | 中文展示名（如 `'数学基础'`） |
| `order_index` | smallint | ✅ | `0` | 同 category 内排序 |
| `kind` | text | ✅ | `'count'` | CHECK IN (`'count'`,`'credits'`,`'one_of'`,`'all_of'`)。语义见下 |
| `threshold` | numeric(5,1) | ❌ | `null` | kind=count → 门数；kind=credits → 学分；one_of → `1`；all_of → `null` |
| `description` | text | ❌ | `null` | |
| `created_at` | timestamptz | ✅ | `now()` | |
| `updated_at` | timestamptz | ✅ | `now()` | trigger 维护 |

**`kind` 语义**

- `count`：从下属 option 里至少修 `threshold` 门（如「四选二」）
- `credits`：从下属 option 累计至少 `threshold` 学分
- `one_of`：必选 1 门（`threshold=1`）
- `all_of`：下属 option 全部必修（`threshold=null`）

**约束**

```
UNIQUE (category_id, code)
CHECK (kind IN ('count','credits','one_of','all_of'))
CHECK (kind = 'all_of' OR threshold IS NOT NULL)
```

**索引**

```
idx_track_requirement_track     (track_id)
idx_track_requirement_category  (category_id, order_index)
```

---

### 3.4 `track_option`

**用途：** requirement 下的具体可选项。可以是课程、抵学分项目、project / 实习。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | uuid | ✅ | `gen_random_uuid()` | PK |
| `track_id` | uuid | ✅ | — | FK `track(id) ON DELETE CASCADE`；冗余方便 join |
| `requirement_id` | uuid | ✅ | — | FK `track_requirement(id) ON DELETE CASCADE` |
| `kind` | text | ✅ | `'course'` | CHECK IN (`'course'`,`'alt'`,`'project'`) |
| `code` | text | ✅ | — | course → 课程代码（`'MATH 101'`）；alt → 项目代码（`'CONTEST-MATH'`）；project → 自由代码 |
| `name` | text | ✅ | — | 中文展示名（如 `'数学分析 I'`） |
| `credits` | numeric(4,1) | ❌ | `null` | 学分；alt / project 可空 |
| `semester_hint` | text | ❌ | `null` | 建议修读学期（如 `'大一上'` / `'2024-Fall'`） |
| `prerequisites` | text[] | ❌ | `'{}'::text[]` | 先修课代码数组（D-track-7 弱实现），如 `ARRAY['MATH 101']`；复杂逻辑留 schema v2 |
| `description` | text | ❌ | `null` | 课程说明 / 抵学分条件描述 |
| `created_at` | timestamptz | ✅ | `now()` | |
| `updated_at` | timestamptz | ✅ | `now()` | trigger 维护 |

**`kind` 语义**

- `course`：学校课程，`code` = 学校课程代码，`credits` 必填
- `alt`：抵学分项目（数模国赛、志愿者证书），`credits` = 可抵学分
- `project`：研究 / 毕设 / 实习，`credits` 可空

**约束**

```
UNIQUE (requirement_id, code)
CHECK (kind IN ('course','alt','project'))
CHECK (kind <> 'course' OR credits IS NOT NULL)   -- course 必须填学分
```

**索引**

```
idx_track_option_track          (track_id)
idx_track_option_requirement    (requirement_id)
idx_track_option_code           (track_id, code)   -- 按代码查（AI 查重 / prerequisite 解析用）
```

---

### 3.5 `user_progress`

**用途：** 用户在某 track 的某 option 上的进度。option 级跟踪（D-track-5）。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | uuid | ✅ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ✅ | — | FK `auth.users(id) ON DELETE CASCADE` |
| `track_id` | uuid | ✅ | — | FK `track(id) ON DELETE CASCADE`；冗余方便 RLS / 切 track 查询 |
| `option_id` | uuid | ✅ | — | FK `track_option(id) ON DELETE CASCADE` |
| `status` | text | ✅ | `'planned'` | CHECK IN (`'planned'`,`'enrolled'`,`'done'`,`'waived'`,`'dropped'`) |
| `grade` | text | ❌ | `null` | 等第（`'A'` / `'B+'` / `'P'`），done 时填 |
| `semester` | text | ❌ | `null` | 实际修读学期（如 `'2024-Fall'`） |
| `note` | text | ❌ | `null` | 用户备注 |
| `created_at` | timestamptz | ✅ | `now()` | |
| `updated_at` | timestamptz | ✅ | `now()` | trigger 维护 |

**`status` 语义**

- `planned`：还没修，计划要修
- `enrolled`：本学期在修
- `done`：已修完（应填 `grade`）
- `waived`：抵学分 / 免修
- `dropped`：退课 / 放弃

**RLS**（沿用 DATA_MODEL.md owner-only 模板）

```
all CRUD : auth.uid() = user_id
```

**约束**

```
UNIQUE (user_id, option_id)   -- 一个 option 一个用户一条记录；改状态走 UPDATE 不 INSERT
CHECK (status IN ('planned','enrolled','done','waived','dropped'))
```

**索引**

```
idx_user_progress_user_track  (user_id, track_id)         -- 按当前 track 拉全部进度
idx_user_progress_user_status (user_id, status)           -- 拉「已修完」"在修中" 列表
idx_user_progress_option      (option_id)                 -- 反查某 option 哪些用户修了（统计用，未来加）
```

---

## 4. RLS 总览

| 表 | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| `track` | 公共（`true`） | service_role only |
| `track_category` | 公共 | service_role only |
| `track_requirement` | 公共 | service_role only |
| `track_option` | 公共 | service_role only |
| `user_progress` | `auth.uid() = user_id` | `auth.uid() = user_id` |

**service_role 写示例**（在 Supabase SQL Editor 跑 seed 时自动 bypass RLS，参考 DATA_MODEL.md § 5b）：

```sql
-- 排队 10 seed SQL 直接 INSERT，不需要切角色，SQL Editor 默认就是 service_role
INSERT INTO track (school, major, year, name) VALUES (...);
```

**前端写防护**：四张公共表写策略全 `false`，普通用户的 supabase-js client 任何 INSERT/UPDATE/DELETE 都会被 RLS 拒，不需要应用层守卫。

---

## 5. 关系图

```
                   ┌────────────────────┐
                   │      track         │  (school, major, year) UNIQUE
                   │  公共表             │
                   └────────┬───────────┘
                            │ 1:N
                            ▼
                   ┌────────────────────┐
                   │  track_category    │  排专业必修 / 公选 / 通识
                   │  公共表             │
                   └────────┬───────────┘
                            │ 1:N
                            ▼
                   ┌────────────────────┐
                   │ track_requirement  │  kind: count/credits/one_of/all_of
                   │  公共表             │
                   └────────┬───────────┘
                            │ 1:N
                            ▼
                   ┌────────────────────┐
                   │   track_option     │  kind: course/alt/project
                   │  公共表             │  prerequisites text[]
                   └────────┬───────────┘
                            │ 1:N
                            ▼
                   ┌────────────────────┐
                   │   user_progress    │  status, grade, semester
                   │  私有表 (owner)     │  UNIQUE (user_id, option_id)
                   └────────────────────┘
                            ▲
                            │
                       auth.users
```

**冗余 track_id 链路**：requirement / option / user_progress 都直接挂 `track_id`，避免 join。RLS 与查询性能都受益。

---

## 6. 不在本轮做（明确推迟）

| 项 | 何时做 | 备注 |
|---|---|---|
| **prerequisite 关系表** | schema v2 | 当前用 `track_option.prerequisites text[]` 弱实现。要 AND/OR 表达或成绩门槛时升级 |
| **requirement 嵌套** | schema v2 | 当前平铺，category 下直接挂 requirement。复杂培养方案再考虑 |
| **goal-specific path 选择** | 排队 13 在 prompt 层做 | 不在 track 表里分保研/留学/工作子树。goal_mode 已在 `profiles`，AI 用它过滤推荐即可 |
| **schools / majors 字典表** | TD-后续 | 当前 `track.school` / `track.major` 是 free text，未来加 `schools` / `majors` reference 表 |
| **course catalog 公共表** | 已弃（见 D5） | catalog 由 `track_option` 间接承担（每个学校的 option 就是该校的课程清单）|
| **AI RAG 公告 / 培养方案 PDF** | TD-2 | 走 `rag_source` 表 + 解析 pipeline，挂到 requirement / option 的 `description` 字段做增强 |

---

## 7. 排队 9 起的迁移路径

**排队 9 — `0002_add_track_schema.sql`：**
1. 建 5 张表 + 约束 + 索引（按本文档 §3）
2. 写 5 套 RLS policies（按 §4）
3. 5 张表都接 `set_updated_at` trigger（沿用 DATA_MODEL.md § 5.1）
4. **不写 seed**：seed 留排队 10。

**排队 10 — 学校种子数据：**
1. 用户提供原始培养方案（PDF / 网页 / 手抄列表）
2. 我手工转 SQL：`INSERT INTO track ...`、`INSERT INTO track_category ...`、`INSERT INTO track_requirement ...`、`INSERT INTO track_option ...`
3. 文件命名：`supabase/migrations/0003_seed_<school>_<major>_<year>.sql`
4. 在 Supabase SQL Editor 跑（service_role 自动 bypass RLS）

**排队 11 — `course` 表接 UI**（注意区别）：
- `course` 表（DATA_MODEL.md § 3.2）= 用户「已修过的课」**自由记录**，与 `track_option` 解耦
- `user_progress` 表（本文档 § 3.5）= 用户在 track 中的进度，**绑定 option**
- 排队 11 给 `course` 表做 UI；排队 12 画布读 `user_progress`

**排队 12 — 画布改造**：读 `track_category` → `track_requirement` → `track_option`，与 `user_progress` join 染色。

**排队 13 — AI 接 track**：整 track JSON 喂 prompt，AI 输出锁在 zod schema（PathSuggestion 引用 option_id，不允许编造）。
