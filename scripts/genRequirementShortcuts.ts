/**
 * 排队 12.5 子任务 B 生成器 —— 一次性产 0010 seed SQL
 *
 * 输入：硬编码 15 用户可见 req × 2-3 shortcut（共 ~45 条），每 shortcut 含全 8 goal_mode 适配度
 * 输出：supabase/migrations/0010_seed_requirement_shortcuts.sql
 *
 * 运行：npx tsx scripts/genRequirementShortcuts.ts
 *
 * 设计原则（2026-05-26 用户拍板）：
 *  - shortcut 与 goal_mode 解耦：同一 req 的 shortcut 池对 8 个 goal 都展示，
 *    各 shortcut 的 goalFit map 标"对哪个 goal 最优 / 一般 / 不优"
 *  - 一次 UPDATE 覆盖 8 个 (goal × req) 行（WHERE requirement_id = X，无 goal_mode 过滤）
 *  - 同 jsonb 内容多 8 行同步 → 单 req 一条 UPDATE 即可
 *  - 修改任意文案 → 重跑脚本 → 新 SQL → Supabase Dashboard 重跑（幂等）
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const MIGRATIONS_DIR = resolve(REPO_ROOT, "supabase/migrations");

/* ───────────────────────── 类型 ───────────────────────── */

type GoalMode =
  | "高 GPA"
  | "最轻松毕业"
  | "保研路线"
  | "留学路线"
  | "实习优先"
  | "时间自由"
  | "低压力模式"
  | "个性化定制";

type GoalFit = "best" | "ok" | "bad";
type ShortcutFitMap = Partial<Record<GoalMode, GoalFit>>;

interface Shortcut {
  id: string;
  oneLiner: string;
  goalFit: ShortcutFitMap;
}

interface ReqShortcuts {
  code: string;
  title: string;
  shortcuts: Shortcut[];
}

/* ───────────────────────── 15 用户可见 req × 2-3 shortcut ───────────────────────── */

const REQ_SHORTCUTS: ReqShortcuts[] = [
  {
    code: "E1-3",
    title: "培养方案 4 大课程结构",
    shortcuts: [
      {
        id: "E1-3-a",
        oneLiner: "4 大块按学期均匀分布，避免单学期堆积压均分",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "ok",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "ok",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E1-3-b",
        oneLiner: "必修先扫清，选修 / 通识倒推毕业学分目标",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "best",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "ok",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
      {
        id: "E1-3-c",
        oneLiner: "任选当弹性缓冲，留实习 / 科研连续档期",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "best",
          留学路线: "best",
          实习优先: "best",
          最轻松毕业: "ok",
          时间自由: "best",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
    ],
  },
  {
    code: "E2-1",
    title: "思想政治理论课 6 门 17 学分",
    shortcuts: [
      {
        id: "E2-1-a",
        oneLiner: "全部冲 85+ 稳定均分大盘",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "ok",
          实习优先: "ok",
          最轻松毕业: "bad",
          时间自由: "bad",
          低压力模式: "bad",
          个性化定制: "ok",
        },
      },
      {
        id: "E2-1-b",
        oneLiner: "选给分宽松班次，避开严苛老师",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "best",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "best",
        },
      },
      {
        id: "E2-1-c",
        oneLiner: "时事讲座 + 易班学分叠加完成认定",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "ok",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
    ],
  },
  {
    code: "E2-2",
    title: "大学英语 8 学分（分级 A/B/C/D）",
    shortcuts: [
      {
        id: "E2-2-a",
        oneLiner: "雅思 7 / 托福 94 直进 A 班免修 2 学分",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "best",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E2-2-b",
        oneLiner: "分级 A/B 直读高班，省 2-4 学分时间",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "best",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "ok",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E2-2-c",
        oneLiner: "选语言伙伴 / 翻转课堂班，活跃度加分",
        goalFit: {
          "高 GPA": "best",
          保研路线: "ok",
          留学路线: "best",
          实习优先: "ok",
          最轻松毕业: "bad",
          时间自由: "bad",
          低压力模式: "bad",
          个性化定制: "ok",
        },
      },
    ],
  },
  {
    code: "E2-3",
    title: "公共计算机课程",
    shortcuts: [
      {
        id: "E2-3-a",
        oneLiner: "B-PT 测评免修就免，否则选给分宽松班次",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "best",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E2-3-b",
        oneLiner: "选与专业相关的语言（Python / SQL）打底",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "best",
          留学路线: "best",
          实习优先: "best",
          最轻松毕业: "ok",
          时间自由: "ok",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
      {
        id: "E2-3-c",
        oneLiner: "慕课替代 + 学分认定，零课堂出勤",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
    ],
  },
  {
    code: "E2-4",
    title: "公共体育 4 学分",
    shortcuts: [
      {
        id: "E2-4-a",
        oneLiner: "评分宽松，按时通过即可不冲第一",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E2-4-b",
        oneLiner: "体测 50 分线必须过，体测训练优先",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "best",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "best",
        },
      },
      {
        id: "E2-4-c",
        oneLiner: "选轻量项目（瑜伽 / 健步 / 太极）避免伤病",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
    ],
  },
  {
    code: "E2-5",
    title: "国情教育 3 学分",
    shortcuts: [
      {
        id: "E2-5-a",
        oneLiner: "暑期社会实践 + 国情讲座叠加认定",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "best",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "ok",
          时间自由: "best",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
      {
        id: "E2-5-b",
        oneLiner: "选低强度国情课，避开扎实写报告类",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E2-5-c",
        oneLiner: "与劳动教育实践周合并完成",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
    ],
  },
  {
    code: "E2-6",
    title: "劳动教育 2 学分",
    shortcuts: [
      {
        id: "E2-6-a",
        oneLiner: "校园岗位志愿（食堂 / 图书馆）一周覆盖",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E2-6-b",
        oneLiner: "实习算劳动学分认定，先去再补流程",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "best",
          留学路线: "best",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "ok",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
      {
        id: "E2-6-c",
        oneLiner: "选轻量劳动课（公益 / 文化类）",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
    ],
  },
  {
    code: "E2-7",
    title: "心理健康 2 学分",
    shortcuts: [
      {
        id: "E2-7-a",
        oneLiner: "学生心理协会活动认定免课",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E2-7-b",
        oneLiner: "心理大学慕课刷分免课堂",
        goalFit: {
          "高 GPA": "best",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E2-7-c",
        oneLiner: "必修 1 学分 + 主题讲座 / 团辅凑齐",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "ok",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
    ],
  },
  {
    code: "E2-8",
    title: "通识必修（劳动+心理）4 学分",
    shortcuts: [
      {
        id: "E2-8-a",
        oneLiner: "劳动 + 心理学分对齐凑齐 4 学分",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E2-8-b",
        oneLiner: "心理选低门槛大班课 + 劳动周",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E2-8-c",
        oneLiner: "实习 + 学生工作累计抵充",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "best",
          留学路线: "best",
          实习优先: "best",
          最轻松毕业: "ok",
          时间自由: "ok",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
    ],
  },
  {
    code: "E3-1",
    title: "通识教育总学分 8 学分",
    shortcuts: [
      {
        id: "E3-1-a",
        oneLiner: "6 模块均覆盖刷 GPA 高分",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "ok",
          实习优先: "ok",
          最轻松毕业: "bad",
          时间自由: "bad",
          低压力模式: "bad",
          个性化定制: "ok",
        },
      },
      {
        id: "E3-1-b",
        oneLiner: "选与专业互补的模块（理科选社科 / 文科选科技）",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "best",
          实习优先: "ok",
          最轻松毕业: "ok",
          时间自由: "best",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
      {
        id: "E3-1-c",
        oneLiner: "查老师评分曲线选课，避开 70 分平均分",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "best",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "best",
        },
      },
    ],
  },
  {
    code: "E3-2",
    title: "人类思维与学科史论",
    shortcuts: [
      {
        id: "E3-2-a",
        oneLiner: "选你专业相关的史论模块（已有基础）",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "ok",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "ok",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E3-2-b",
        oneLiner: "选大班课 + 论文型考核（给分友好）",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "best",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "ok",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E3-2-c",
        oneLiner: "跨学科选课打开思路（适合保研 / 留学）",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "best",
          留学路线: "best",
          实习优先: "ok",
          最轻松毕业: "bad",
          时间自由: "best",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
    ],
  },
  {
    code: "E3-3",
    title: "经典阅读",
    shortcuts: [
      {
        id: "E3-3-a",
        oneLiner: "选你已读过的经典领域，写报告省时间",
        goalFit: {
          "高 GPA": "best",
          保研路线: "ok",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E3-3-b",
        oneLiner: "寒暑假主动读 1-2 本，秋季选课写报告",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "best",
          实习优先: "ok",
          最轻松毕业: "ok",
          时间自由: "best",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
      {
        id: "E3-3-c",
        oneLiner: "选英文经典对接留学 SOP 素材",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "ok",
          留学路线: "best",
          实习优先: "ok",
          最轻松毕业: "bad",
          时间自由: "ok",
          低压力模式: "bad",
          个性化定制: "best",
        },
      },
    ],
  },
  {
    code: "E3-4",
    title: "模块课程 6 模块",
    shortcuts: [
      {
        id: "E3-4-a",
        oneLiner: "提前研究模块清单，按 GPA 友好度排序选课",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "best",
          实习优先: "ok",
          最轻松毕业: "ok",
          时间自由: "ok",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
      {
        id: "E3-4-b",
        oneLiner: "6 模块只选 3-4 模块，集中刷高分",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "ok",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "ok",
        },
      },
      {
        id: "E3-4-c",
        oneLiner: "选与第二专业 / 辅修衔接的模块",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "best",
          留学路线: "best",
          实习优先: "best",
          最轻松毕业: "bad",
          时间自由: "best",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
    ],
  },
  {
    code: "E4-4",
    title: "师范生课程结构",
    shortcuts: [
      {
        id: "E4-4-a",
        oneLiner: "教育实习提前联系附中，避开偏远学校",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "best",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "best",
        },
      },
      {
        id: "E4-4-b",
        oneLiner: "教育学 / 心理学集中复习，一轮搞定",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "ok",
          实习优先: "ok",
          最轻松毕业: "best",
          时间自由: "ok",
          低压力模式: "ok",
          个性化定制: "ok",
        },
      },
      {
        id: "E4-4-c",
        oneLiner: "教资理论课 + 教育实践合并准备",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "best",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "ok",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
    ],
  },
  {
    code: "E4-5",
    title: "教师教育板块 ≥ 21 学分",
    shortcuts: [
      {
        id: "E4-5-a",
        oneLiner: "教育实习 + 微课比赛 + 教研活动合并冲学分",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "best",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "ok",
          时间自由: "ok",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
      {
        id: "E4-5-b",
        oneLiner: "选实习友好导师，避开严苛带教",
        goalFit: {
          "高 GPA": "best",
          保研路线: "best",
          留学路线: "ok",
          实习优先: "best",
          最轻松毕业: "best",
          时间自由: "best",
          低压力模式: "best",
          个性化定制: "best",
        },
      },
      {
        id: "E4-5-c",
        oneLiner: "跨学科辅修教育板块加学分认定",
        goalFit: {
          "高 GPA": "ok",
          保研路线: "best",
          留学路线: "best",
          实习优先: "ok",
          最轻松毕业: "bad",
          时间自由: "ok",
          低压力模式: "ok",
          个性化定制: "best",
        },
      },
    ],
  },
];

/* ───────────────────────── 输出 SQL ───────────────────────── */

function sqlEscape(s: string): string {
  return s.replace(/'/g, "''");
}

function buildShortcutsSql(): string {
  const header = `-- ─────────────────────────────────────────────────────────────────────
-- 0010_seed_requirement_shortcuts — 排队 12.5 子任务 B 数据契约
-- AUTO-GENERATED by scripts/genRequirementShortcuts.ts —— DO NOT HAND-EDIT
-- 修文案 → 改 scripts/genRequirementShortcuts.ts → 重跑生成器
--
-- 设计原则（2026-05-26 用户拍板）：
--  - shortcut 与 goal_mode 解耦：同一 req 的 shortcut 池对 8 goal 都展示
--  - 各 shortcut 内嵌 goalFit map 标"对哪个 goal 最优 / 一般 / 不优"
--  - 单 req 一条 UPDATE 覆盖 8 个 (goal × req) 行（WHERE 不带 goal_mode 过滤）
--  - 幂等可重跑（始终覆盖 jsonb 内容）
-- ─────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_req_id uuid;
  v_updated_reqs int := 0;
  v_skipped int := 0;
BEGIN
`;

  const rows: string[] = [];
  for (const req of REQ_SHORTCUTS) {
    const payload = JSON.stringify(req.shortcuts);
    rows.push(`  -- ${req.code} (${req.title}) — ${req.shortcuts.length} shortcuts
  SELECT id INTO v_req_id FROM public.track_requirement WHERE code = '${req.code}' LIMIT 1;
  IF v_req_id IS NOT NULL THEN
    UPDATE public.requirement_advice
    SET shortcut_oneliners = '${sqlEscape(payload)}'::jsonb,
        updated_at = now()
    WHERE requirement_id = v_req_id;
    v_updated_reqs := v_updated_reqs + 1;
  ELSE
    v_skipped := v_skipped + 1;
    RAISE NOTICE 'Skipped (req not found): %', '${req.code}';
  END IF;
`);
  }

  const footer = `  RAISE NOTICE 'requirement_advice shortcuts seed done: reqs updated=%, skipped=%', v_updated_reqs, v_skipped;
END $$;
`;

  return header + rows.join("\n") + footer;
}

/* ───────────────────────── main ───────────────────────── */

function main() {
  const sql = buildShortcutsSql();
  const out = resolve(MIGRATIONS_DIR, "0010_seed_requirement_shortcuts.sql");
  writeFileSync(out, sql, "utf8");

  let totalShortcuts = 0;
  for (const r of REQ_SHORTCUTS) totalShortcuts += r.shortcuts.length;
  console.log(
    `✓ 0010 shortcuts seed: ${REQ_SHORTCUTS.length} reqs / ${totalShortcuts} shortcuts → ${out}`,
  );
}

main();
