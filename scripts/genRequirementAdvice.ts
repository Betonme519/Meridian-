/**
 * 排队 13.5 静态路径库生成器 —— 一次性产 0007/0008 seed SQL
 *
 * 输入：硬编码 35 reqs 元数据 + 280 advice 文案 + 137 link 关系（2026-05-31 扩为全 198 系统抽取）
 * 输出：
 *   - supabase/migrations/0007_seed_requirement_advice.sql       （280 INSERT）
 *   - supabase/migrations/0013_seed_requirement_link_full.sql   （137 INSERT，取代 0008）
 *
 * 运行：npx tsx scripts/genRequirementAdvice.ts
 *      或 bun run scripts/genRequirementAdvice.ts
 *
 * 设计原则：
 *  - 35 reqs = 15 用户可见（E1-3 + E2-1~8 + E3-1~4 + E4-4/5）+ 20 关键规则
 *  - advice 每条 30-60 字中文，区分 8 goal_mode 语气
 *  - link 按 5 档 kind 分类，写真实存在的规则关系，非凭空造
 *  - 修改任意文案 → 重跑脚本 → 新 SQL → Supabase Dashboard 重跑（ON CONFLICT 幂等）
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

const GOALS: GoalMode[] = [
  "高 GPA",
  "最轻松毕业",
  "保研路线",
  "留学路线",
  "实习优先",
  "时间自由",
  "低压力模式",
  "个性化定制",
];

type GoalFit = "best" | "ok" | "bad";
type LinkKind = "substitute" | "prerequisite" | "excludes" | "cross_ref" | "triggers";

interface AdviceCell {
  line: string;
  fit: GoalFit;
  /** 0-100，越小越优先；同 goal 下排序键 */
  priority: number;
}

interface LinkRow {
  from: string;
  to: string;
  kind: LinkKind;
  bidirectional?: boolean;
  metadata?: Record<string, unknown>;
  note: string;
  sourceRef?: string;
}

/* ───────────────────────── REQS：35 条覆盖范围 ───────────────────────── */

const REQS: { code: string; title: string }[] = [
  { code: "E1-3", title: "培养方案 4 大课程结构" },
  { code: "E2-1", title: "思想政治理论课 6 门 17 学分" },
  { code: "E2-2", title: "大学英语 8 学分（分级 A/B/C/D）" },
  { code: "E2-3", title: "公共计算机课程" },
  { code: "E2-4", title: "公共体育 4 学分" },
  { code: "E2-5", title: "国情教育 3 学分" },
  { code: "E2-6", title: "劳动教育 2 学分" },
  { code: "E2-7", title: "心理健康 2 学分" },
  { code: "E2-8", title: "通识必修（劳动+心理）4 学分" },
  { code: "E3-1", title: "通识教育总学分 8 学分" },
  { code: "E3-2", title: "人类思维与学科史论" },
  { code: "E3-3", title: "经典阅读" },
  { code: "E3-4", title: "模块课程 6 模块" },
  { code: "E4-4", title: "师范生课程结构" },
  { code: "E4-5", title: "教师教育板块 ≥ 21 学分" },
  { code: "A1-10", title: "退学情形（7 条触发）" },
  { code: "A1-12", title: "毕业/结业/肄业 三档" },
  { code: "A2-1", title: "毕业资格审核三档结果" },
  { code: "A3-2", title: "学位 GPA 阈值（本科 2.0）" },
  { code: "A3-3", title: "处分期间不可申请学位" },
  { code: "A4-2", title: "学分认定上限（≤ 40%）" },
  { code: "B3-1", title: "学业预警线" },
  { code: "B3-4", title: "第一次退学线 → 试读" },
  { code: "B4-4", title: "旷课处分阈值" },
  { code: "B5-9", title: "体测毕业门槛（< 50 按结业）" },
  { code: "C1-9", title: "辅修学位授予条件" },
  { code: "C2-6", title: "双学位授予条件" },
  { code: "C3-3", title: "强基本研衔接转段" },
  { code: "C5-2", title: "转专业不予办理情形" },
  { code: "C6-1", title: "创新创业学分适用范围" },
  { code: "C9-1", title: "推免基本资格（GPA ≥ 2.8）" },
  { code: "C9-3", title: "推免综合成绩公式" },
  { code: "D3-6", title: "实习重修阈值" },
  { code: "D4-11", title: "毕业论文不予答辩 4 触发" },
  { code: "D4-12", title: "毕业论文重复率 30%/50%" },
];

/* ───────────────────────── ADVICE：280 条文案 ───────────────────────── */
// 结构：ADVICE_MATRIX[goal][code] = { line, fit, priority }
// fit = best/ok/bad；priority = 同 goal 下排序键，0-100，小→先

const ADVICE: Record<GoalMode, Record<string, AdviceCell>> = {
  "高 GPA": {
    "E1-3": { line: "培养方案 4 大块按学期均匀分布，避免单学期堆积压低均分", fit: "ok", priority: 40 },
    "E2-1": { line: "思政 6 门 17 学分都是必修，全部冲 85+ 稳定 GPA 大盘", fit: "best", priority: 12 },
    "E2-2": { line: "雅思 7 / 托福 94 直进 A 班免修 2 学分，剩余冲高分", fit: "best", priority: 10 },
    "E2-3": { line: "计算机能 B-PT 测评免修就免，否则选给分宽松班次", fit: "best", priority: 18 },
    "E2-4": { line: "体育评分宽松不卡 GPA，按时通过即可别冲第一", fit: "ok", priority: 35 },
    "E2-5": { line: "国情教育 3 学分必修，慕课刷高分轻松进 GPA 大盘", fit: "best", priority: 22 },
    "E2-6": { line: "劳动 2 学分能用 C6-1 创新创业学分顶满 2，省时间冲专业课", fit: "ok", priority: 28 },
    "E2-7": { line: "心理健康 2 学分模块课评分宽松，稳拿满分", fit: "best", priority: 20 },
    "E2-8": { line: "通识必修 4 学分 = E2-6+E2-7，两条都按高分策略走", fit: "best", priority: 16 },
    "E3-1": { line: "通识 8 学分挑你擅长领域的模块，是 GPA 加分位", fit: "best", priority: 14 },
    "E3-2": { line: "人类思维与学科史论选你感兴趣方向，写得出高分论文", fit: "best", priority: 24 },
    "E3-3": { line: "经典阅读读熟一本写深一篇胜过浅读三本，稳拿高分", fit: "best", priority: 26 },
    "E3-4": { line: "模块课程挑你强势学科分支，避开陌生领域稳分", fit: "best", priority: 18 },
    "E4-4": { line: "师范生 4 板块按部就班，教师教育板块是 GPA 主力", fit: "best", priority: 8 },
    "E4-5": { line: "教师教育 21 学分计入学位均分，按 90+ 冲", fit: "best", priority: 6 },
    "A1-10": { line: "退学 7 条触发都跟 GPA 间接相关，守住学位线即可", fit: "bad", priority: 80 },
    "A1-12": { line: "高 GPA 路径走 '毕业' 档，'结业/肄业' 都是失败状态", fit: "bad", priority: 85 },
    "A2-1": { line: "毕业资格审核三档：你的目标是 '正常毕业 + 学位'", fit: "ok", priority: 70 },
    "A3-2": { line: "学位 GPA 2.0 是地板线，你的目标远超此线", fit: "ok", priority: 65 },
    "A3-3": { line: "处分期间不可申请学位，避免任何纪律风险", fit: "bad", priority: 75 },
    "A4-2": { line: "学分认定上限 40%，本校课程占主体保证 GPA 真实性", fit: "ok", priority: 55 },
    "B3-1": { line: "学业预警 = 14% 学分 / GPA 低于学位线，你应远离此线", fit: "bad", priority: 90 },
    "B3-4": { line: "退学 → 试读是低分触发，与你的目标完全相反", fit: "bad", priority: 95 },
    "B4-4": { line: "旷课纪律处分会冻结学位申请，按时上课守住基线", fit: "bad", priority: 85 },
    "B5-9": { line: "体测 50 分门槛是结业线，体测拿到 80+ 不影响主战场", fit: "ok", priority: 60 },
    "C1-9": { line: "辅修学位要主修学位先通过，你的 GPA 路径已锁定此前提", fit: "ok", priority: 50 },
    "C2-6": { line: "双学位需双方培养方案均达成，会分散 GPA 主力精力", fit: "bad", priority: 60 },
    "C3-3": { line: "强基本研衔接对 GPA 友好，符合本路径目标", fit: "best", priority: 30 },
    "C5-2": { line: "转专业不予办理 4 类情形，避开即可不影响 GPA", fit: "ok", priority: 70 },
    "C6-1": { line: "创新创业学分能顶 E2-6 劳动 2 学分，省时间冲专业", fit: "ok", priority: 32 },
    "C9-1": { line: "推免 GPA ≥ 2.8 远低于你的目标，本路径已满足资格", fit: "best", priority: 28 },
    "C9-3": { line: "推免综合成绩 80% 学业 + 素质加分，学业是 GPA 直接产物", fit: "best", priority: 30 },
    "D3-6": { line: "实习不及格 / 缺 1/3 触发重修，会影响最后一学期 GPA", fit: "bad", priority: 75 },
    "D4-11": { line: "毕业论文不予答辩 → 延期毕业，你的目标禁触发", fit: "bad", priority: 80 },
    "D4-12": { line: "论文重复率 30% 整改 / 50% 延期，提前查重保 GPA", fit: "bad", priority: 78 },
  },

  最轻松毕业: {
    "E1-3": { line: "培养方案 4 大块按部就班走，不超期不挂科即可", fit: "ok", priority: 35 },
    "E2-1": { line: "思政 6 门必修无法跳过，60 分及格线即满足毕业", fit: "best", priority: 10 },
    "E2-2": { line: "大学英语 8 学分按默认分级走，过即可不冲高分", fit: "best", priority: 14 },
    "E2-3": { line: "计算机选最低学分组合（非师范 0/3/5 取最低），过即可", fit: "best", priority: 16 },
    "E2-4": { line: "体育 4 学分必修，按学期分散修不集中", fit: "best", priority: 20 },
    "E2-5": { line: "国情教育 3 学分慕课刷完就过，时间成本低", fit: "best", priority: 18 },
    "E2-6": { line: "劳动 2 学分用 MOOC + 实践即可，最省事路径", fit: "best", priority: 12 },
    "E2-7": { line: "心理健康 2 学分模块课刷完即过，无门槛", fit: "best", priority: 13 },
    "E2-8": { line: "通识必修 4 学分 = 劳动 + 心理，两个都最低门槛通过", fit: "best", priority: 11 },
    "E3-1": { line: "通识 8 学分凑齐即可，不挑模块只挑评分宽松课", fit: "best", priority: 22 },
    "E3-2": { line: "人类思维 1 学分选熟悉领域刷过即可", fit: "best", priority: 30 },
    "E3-3": { line: "经典阅读 2 学分选你早读过的书省时间", fit: "best", priority: 28 },
    "E3-4": { line: "模块课程挑听过的同学推荐的高通过课", fit: "best", priority: 26 },
    "E4-4": { line: "师范生 5 板块按培养方案最低门槛逐个通过", fit: "ok", priority: 24 },
    "E4-5": { line: "教师教育 21 学分必修无法绕，按部就班通过", fit: "ok", priority: 25 },
    "A1-10": { line: "退学 7 条触发要警惕，跌破任一条都毕不了业", fit: "bad", priority: 80 },
    "A1-12": { line: "目标是 '毕业' 档，'结业/肄业' 都是失败", fit: "ok", priority: 55 },
    "A2-1": { line: "毕业资格审核 = 学分 + GPA + 思想政治 + 体测都过", fit: "ok", priority: 45 },
    "A3-2": { line: "学位 GPA 2.0 是底线，单科不及格补考通过即可", fit: "ok", priority: 60 },
    "A3-3": { line: "处分期间不可申请学位 → 守纪律避免学位资格被冻", fit: "bad", priority: 70 },
    "A4-2": { line: "学分认定上限 40%，外校学分可顶部分本校课程", fit: "ok", priority: 50 },
    "B3-1": { line: "学业预警 14% 学分线是退学前兆，每学期看看", fit: "bad", priority: 75 },
    "B3-4": { line: "第一次跌破退学线 → 试读，你的目标不允许触发", fit: "bad", priority: 85 },
    "B4-4": { line: "旷课处分阈值低，按时上课就稳", fit: "ok", priority: 65 },
    "B5-9": { line: "体测 50 分是毕业门槛，必须达，否则结业/肄业", fit: "best", priority: 38 },
    "C1-9": { line: "辅修学位增加 workload，对最轻松路径反向", fit: "bad", priority: 60 },
    "C2-6": { line: "双学位 workload 翻倍，与最轻松毕业冲突", fit: "bad", priority: 65 },
    "C3-3": { line: "强基本研衔接需高 GPA 排名，本路径无关", fit: "ok", priority: 70 },
    "C5-2": { line: "转专业增加变量，建议本路径不动专业", fit: "ok", priority: 75 },
    "C6-1": { line: "用创新创业学分顶 E2-6 劳动 2 分，能省 1-2 学期工作量", fit: "best", priority: 28 },
    "C9-1": { line: "推免 GPA ≥ 2.8 与本路径无关，可忽略", fit: "ok", priority: 80 },
    "C9-3": { line: "推免综合成绩公式与本路径无关，可跳过", fit: "ok", priority: 82 },
    "D3-6": { line: "实习不及格 / 缺 1/3 触发重修，按时签到不旷工即可", fit: "bad", priority: 55 },
    "D4-11": { line: "论文不答 → 延期毕业，本路径必避", fit: "bad", priority: 78 },
    "D4-12": { line: "论文重复率 30% 起整改，初稿就查重一次最稳", fit: "ok", priority: 50 },
  },

  保研路线: {
    "E1-3": { line: "培养方案 4 大块全部冲高分，每学期 GPA 都决定排名", fit: "best", priority: 8 },
    "E2-1": { line: "思政 6 门 17 学分计入综合分，全 90+ 拉综合", fit: "best", priority: 5 },
    "E2-2": { line: "大学英语 8 学分关乎排名，A 班高分能拉综合", fit: "best", priority: 6 },
    "E2-3": { line: "计算机能 B-PT 免修就免，剩下选给分高班次", fit: "best", priority: 14 },
    "E2-4": { line: "体育对保研排名权重低，按部就班通过即可", fit: "ok", priority: 50 },
    "E2-5": { line: "国情教育 3 学分必修，慕课刷高分计入综合", fit: "best", priority: 18 },
    "E2-6": { line: "劳动 2 学分用 MOOC 省时间，把精力留给科研", fit: "ok", priority: 30 },
    "E2-7": { line: "心理健康 2 学分模块课稳拿满分", fit: "best", priority: 22 },
    "E2-8": { line: "通识必修按 90+ 冲，每分都计入综合排名", fit: "best", priority: 12 },
    "E3-1": { line: "通识 8 学分挑你擅长领域，3 模块都拿 90+", fit: "best", priority: 10 },
    "E3-2": { line: "人类思维选目标导师方向，铺路科研话题", fit: "best", priority: 16 },
    "E3-3": { line: "经典阅读选与目标研究方向相关的书，一举两得", fit: "best", priority: 20 },
    "E3-4": { line: "模块课程优先选目标导师授课的模块", fit: "best", priority: 15 },
    "E4-4": { line: "师范生保研需教师教育板块高分 + 综合排名前列", fit: "best", priority: 4 },
    "E4-5": { line: "教师教育 21 学分是综合分主力，必须全部 90+", fit: "best", priority: 3 },
    "A1-10": { line: "退学 7 条任一触发 = 保研失败，远离任何风险线", fit: "bad", priority: 85 },
    "A1-12": { line: "保研只承认 '毕业' 档，结业/肄业 = 资格作废", fit: "bad", priority: 88 },
    "A2-1": { line: "毕业资格审核三档：保研只接受 '正常毕业'", fit: "ok", priority: 60 },
    "A3-2": { line: "学位 GPA 2.0 是底线，保研需 ≥ 2.8 + 排名前 N%", fit: "ok", priority: 70 },
    "A3-3": { line: "处分期间不可申请学位 → 保研资格直接取消", fit: "bad", priority: 92 },
    "A4-2": { line: "学分认定上限 40%，外校学分不算入排名", fit: "ok", priority: 65 },
    "B3-1": { line: "学业预警 = 保研直接失格，本路径绝对禁触发", fit: "bad", priority: 95 },
    "B3-4": { line: "退学线触发 → 保研永久失格", fit: "bad", priority: 98 },
    "B4-4": { line: "旷课处分 → 学位申请冻结 → 保研失格", fit: "bad", priority: 90 },
    "B5-9": { line: "体测 50 分是毕业门槛，保研需达，否则资格作废", fit: "ok", priority: 55 },
    "C1-9": { line: "辅修学位需主修学位通过，对保研无直接帮助", fit: "ok", priority: 55 },
    "C2-6": { line: "双学位增加 workload，可能拉低主修 GPA 排名", fit: "bad", priority: 70 },
    "C3-3": { line: "强基本研衔接是保研主路径之一，符合本路径", fit: "best", priority: 24 },
    "C5-2": { line: "转专业可能中断综合排名计算，避免", fit: "bad", priority: 80 },
    "C6-1": { line: "创新创业学分 = 综合分素质加分项，争取拿满", fit: "best", priority: 26 },
    "C9-1": { line: "推免 GPA ≥ 2.8 是基础资格，本路径目标远超此线", fit: "best", priority: 2 },
    "C9-3": { line: "推免综合 = 学业 80% + 素质加分 - 扣分，全面冲", fit: "best", priority: 1 },
    "D3-6": { line: "实习不及格 / 缺 1/3 触发重修 → 影响最后学期排名", fit: "bad", priority: 75 },
    "D4-11": { line: "论文不答 → 延期毕业 → 保研失效", fit: "bad", priority: 85 },
    "D4-12": { line: "论文重复率 30% 起整改 → 答辩延期 → 保研失效", fit: "bad", priority: 82 },
  },

  留学路线: {
    "E1-3": { line: "培养方案 4 大块均衡完成，海外算分按总均分", fit: "ok", priority: 35 },
    "E2-1": { line: "思政 6 门 17 学分计入 GPA 总分，按 85+ 走", fit: "best", priority: 18 },
    "E2-2": { line: "大学英语直接对接雅思/托福备考，A 班入读条件就是申请门槛", fit: "best", priority: 1 },
    "E2-3": { line: "计算机课程对申请帮助一般，选最低组合省时间", fit: "ok", priority: 30 },
    "E2-4": { line: "体育成绩国外不看，按通过线走把时间留给语言考试", fit: "ok", priority: 60 },
    "E2-5": { line: "国情教育与申请材料无关，刷过即可", fit: "ok", priority: 50 },
    "E2-6": { line: "劳动 2 学分用 MOOC 省时间，把精力留给托福", fit: "ok", priority: 38 },
    "E2-7": { line: "心理健康 2 学分稳过即可", fit: "ok", priority: 40 },
    "E2-8": { line: "通识必修 4 学分按部就班通过，影响均分", fit: "ok", priority: 32 },
    "E3-1": { line: "通识 8 学分挑英文授课模块，拉高均分 + 练英语", fit: "best", priority: 10 },
    "E3-2": { line: "人类思维选英语教学版，与申请方向贴合", fit: "best", priority: 14 },
    "E3-3": { line: "经典阅读选英文原著相关课程", fit: "best", priority: 16 },
    "E3-4": { line: "模块课程优先选英文授课 / 涉外方向", fit: "best", priority: 12 },
    "E4-4": { line: "师范生留学需教育学相关国际项目，板块按高分走", fit: "ok", priority: 28 },
    "E4-5": { line: "教师教育 21 学分按 85+ 冲，留学需 GPA 3.0+", fit: "best", priority: 8 },
    "A1-10": { line: "退学 7 条触发 = 申请材料缺失，本路径必避", fit: "bad", priority: 85 },
    "A1-12": { line: "留学需 '毕业 + 学士学位' 双证，缺一不可", fit: "bad", priority: 88 },
    "A2-1": { line: "毕业资格审核 → 学位证 → 留学申请的学位证明", fit: "ok", priority: 50 },
    "A3-2": { line: "学位 GPA 2.0 是底线，留学普遍要 3.0+", fit: "ok", priority: 55 },
    "A3-3": { line: "处分记录会影响国外院校 background check", fit: "bad", priority: 80 },
    "A4-2": { line: "学分认定上限 40%，外校学分申请时需说明", fit: "ok", priority: 60 },
    "B3-1": { line: "学业预警会出现在成绩单上，影响申请", fit: "bad", priority: 78 },
    "B3-4": { line: "退学 → 试读 → 留学申请基本无望", fit: "bad", priority: 92 },
    "B4-4": { line: "旷课处分会写入档案，影响 background check", fit: "bad", priority: 75 },
    "B5-9": { line: "体测 50 分是毕业门槛，达即可不影响申请", fit: "ok", priority: 58 },
    "C1-9": { line: "辅修学位增加申请筹码，证明跨学科能力", fit: "best", priority: 22 },
    "C2-6": { line: "双学位对申请非常加分，特别是国外院校重视", fit: "best", priority: 20 },
    "C3-3": { line: "强基本研衔接与留学冲突（需放弃推免）", fit: "bad", priority: 70 },
    "C5-2": { line: "转专业可能影响 GPA 历史，申请前避免", fit: "ok", priority: 65 },
    "C6-1": { line: "创新创业学分 = 申请材料中的科研经历佐证", fit: "best", priority: 26 },
    "C9-1": { line: "推免 GPA ≥ 2.8 与留学无关，本路径不走推免", fit: "ok", priority: 75 },
    "C9-3": { line: "推免综合成绩公式不影响留学，跳过", fit: "ok", priority: 78 },
    "D3-6": { line: "实习若不及格会出现在成绩单，影响申请", fit: "bad", priority: 72 },
    "D4-11": { line: "论文不答 → 延期毕业 → 申请季 timing 全乱", fit: "bad", priority: 82 },
    "D4-12": { line: "论文重复率 = 学术诚信问题，海外申请特别敏感", fit: "bad", priority: 80 },
  },

  实习优先: {
    "E1-3": { line: "培养方案 4 大块集中在大一大二完成，大三大四留实习", fit: "best", priority: 6 },
    "E2-1": { line: "思政 6 门避免分散到大四，集中冲完", fit: "best", priority: 10 },
    "E2-2": { line: "英语高级班一周仅 2 节，正好留出连续实习档期", fit: "best", priority: 8 },
    "E2-3": { line: "计算机课能 B-PT 免修就免，省时间去实习", fit: "best", priority: 4 },
    "E2-4": { line: "体育排在实习淡季学期一次冲完，避免实习季撞课", fit: "ok", priority: 25 },
    "E2-5": { line: "国情教育慕课刷完，几乎不占时间", fit: "best", priority: 12 },
    "E2-6": { line: "劳动用 C6-1 创新创业学分顶满，省时间", fit: "best", priority: 7 },
    "E2-7": { line: "心理健康选可灵活时段或线上模块", fit: "best", priority: 14 },
    "E2-8": { line: "通识必修 4 学分集中前 2 学年完成", fit: "best", priority: 9 },
    "E3-1": { line: "通识 8 学分挑可调时段 / 线上课，避开实习高峰", fit: "best", priority: 5 },
    "E3-2": { line: "人类思维选你感兴趣模块，省备考时间", fit: "ok", priority: 22 },
    "E3-3": { line: "经典阅读选你已读过的书省时间", fit: "ok", priority: 24 },
    "E3-4": { line: "模块课程挑与目标岗位技能栈对齐的", fit: "best", priority: 18 },
    "E4-4": { line: "师范生实习是培养方案一部分，可双覆盖", fit: "ok", priority: 20 },
    "E4-5": { line: "教师教育 21 学分集中大二下到大三，大四留就业", fit: "best", priority: 16 },
    "A1-10": { line: "退学 7 条任一触发 = 实习 offer 作废", fit: "bad", priority: 80 },
    "A1-12": { line: "目标 '毕业'，没学位证就业受限", fit: "bad", priority: 75 },
    "A2-1": { line: "毕业资格审核 → 顺利就业前提", fit: "ok", priority: 45 },
    "A3-2": { line: "学位 GPA 2.0 是底线，企业 HR 一般卡 3.0+", fit: "ok", priority: 50 },
    "A3-3": { line: "处分记录影响公司背景调查", fit: "bad", priority: 70 },
    "A4-2": { line: "学分认定上限 40%，跨校实习课能算上限内", fit: "ok", priority: 55 },
    "B3-1": { line: "学业预警会影响实习推荐", fit: "bad", priority: 65 },
    "B3-4": { line: "退学 → 试读 → 实习失业", fit: "bad", priority: 90 },
    "B4-4": { line: "旷课处分对就业很严重，按时上课守底线", fit: "bad", priority: 78 },
    "B5-9": { line: "体测 50 分是毕业门槛，达即可", fit: "ok", priority: 48 },
    "C1-9": { line: "辅修学位增加 workload，挤占实习时间", fit: "bad", priority: 65 },
    "C2-6": { line: "双学位严重挤占实习时间，本路径反向", fit: "bad", priority: 72 },
    "C3-3": { line: "强基本研衔接需放弃就业，与实习路径冲突", fit: "bad", priority: 75 },
    "C5-2": { line: "转专业可能延期，影响实习时间表", fit: "ok", priority: 60 },
    "C6-1": { line: "创新创业 / 实习项目可申报学分，一次双覆盖", fit: "best", priority: 11 },
    "C9-1": { line: "推免 GPA ≥ 2.8 不强求，实习路径可弃推免", fit: "ok", priority: 80 },
    "C9-3": { line: "推免综合公式与实习路径无关", fit: "ok", priority: 82 },
    "D3-6": { line: "实习不及格 / 缺 1/3 触发重修，按时签到必守", fit: "bad", priority: 30 },
    "D4-11": { line: "论文不答 → 延期毕业 → offer 失效", fit: "bad", priority: 35 },
    "D4-12": { line: "论文重复率提前查重，避免答辩季 offer 卡时", fit: "bad", priority: 38 },
  },

  时间自由: {
    "E1-3": { line: "培养方案 4 大块灵活分布，留连续空白学期探索", fit: "best", priority: 12 },
    "E2-1": { line: "思政 6 门按培养方案学期走即可", fit: "ok", priority: 25 },
    "E2-2": { line: "选你感兴趣的学术英语写作选修，不当负担", fit: "best", priority: 18 },
    "E2-3": { line: "计算机选你真感兴趣模块，AI 思维 / 数字人文都行", fit: "best", priority: 14 },
    "E2-4": { line: "体育选你真喜欢的项目，慕课灵活时段刷", fit: "best", priority: 8 },
    "E2-5": { line: "国情教育慕课在你方便时刷，不占时段", fit: "best", priority: 16 },
    "E2-6": { line: "劳动选你感兴趣的途径（4 选 1）", fit: "best", priority: 10 },
    "E2-7": { line: "心理健康选有趣的模块课程", fit: "best", priority: 11 },
    "E2-8": { line: "通识必修 4 学分按兴趣组合", fit: "best", priority: 13 },
    "E3-1": { line: "通识 8 学分纯按兴趣选，是探索新领域的机会", fit: "best", priority: 6 },
    "E3-2": { line: "人类思维选完全陌生的领域，扩展边界", fit: "best", priority: 15 },
    "E3-3": { line: "经典阅读读你一直想读的书，慢读深思", fit: "best", priority: 17 },
    "E3-4": { line: "模块课程跨专业选修，自由度最大", fit: "best", priority: 20 },
    "E4-4": { line: "师范生课程板块灵活分布到 4 年", fit: "ok", priority: 28 },
    "E4-5": { line: "教师教育 21 学分按部就班，留时间探索", fit: "ok", priority: 30 },
    "A1-10": { line: "退学 7 条触发 = 自由探索的代价过大", fit: "bad", priority: 75 },
    "A1-12": { line: "保住 '毕业' 档底线，结业/肄业 都太亏", fit: "ok", priority: 50 },
    "A2-1": { line: "毕业资格审核三档：保住正常毕业即可", fit: "ok", priority: 45 },
    "A3-2": { line: "学位 GPA 2.0 是底线，按时考试别挂科", fit: "ok", priority: 55 },
    "A3-3": { line: "守纪律保留学位资格", fit: "ok", priority: 60 },
    "A4-2": { line: "学分认定上限 40%，自由跨校 / 慕课学分可顶", fit: "best", priority: 22 },
    "B3-1": { line: "学业预警是自由探索的红线，别越界", fit: "bad", priority: 70 },
    "B3-4": { line: "退学线触发 = 自由失去", fit: "bad", priority: 85 },
    "B4-4": { line: "旷课处分阈值低，自由不等于旷课", fit: "ok", priority: 65 },
    "B5-9": { line: "体测 50 分门槛 = 自由的体能底线，必达", fit: "ok", priority: 35 },
    "C1-9": { line: "辅修学位增加约束，与时间自由反向", fit: "ok", priority: 70 },
    "C2-6": { line: "双学位 workload 翻倍，与时间自由严重冲突", fit: "bad", priority: 80 },
    "C3-3": { line: "强基本研衔接需高 GPA + 不出境，与自由冲突", fit: "ok", priority: 72 },
    "C5-2": { line: "转专业是自由探索方式之一，注意 4 类禁止情形", fit: "ok", priority: 40 },
    "C6-1": { line: "创新创业学分可由各种兴趣活动累积，自由路径友好", fit: "best", priority: 24 },
    "C9-1": { line: "推免与自由路径无关，可放弃", fit: "ok", priority: 78 },
    "C9-3": { line: "推免综合公式不影响自由路径", fit: "ok", priority: 80 },
    "D3-6": { line: "实习不及格触发重修，影响最后一年自由度", fit: "ok", priority: 50 },
    "D4-11": { line: "论文不答 → 延期 → 占用本应自由的时间", fit: "bad", priority: 68 },
    "D4-12": { line: "论文重复率早查避免答辩季被占用", fit: "ok", priority: 55 },
  },

  低压力模式: {
    "E1-3": { line: "培养方案 4 大块均匀分散到 8 学期，每学期负担最小", fit: "best", priority: 8 },
    "E2-1": { line: "思政 6 门按培养方案分批走，60+ 即可", fit: "best", priority: 12 },
    "E2-2": { line: "B/C 班按默认分级走，避免冲 A 增加备考压力", fit: "best", priority: 6 },
    "E2-3": { line: "计算机选最低学分组合，避开高难度选修", fit: "best", priority: 10 },
    "E2-4": { line: "体育选你最熟悉的项目，避免拉伤焦虑", fit: "best", priority: 14 },
    "E2-5": { line: "国情教育慕课刷完即过", fit: "best", priority: 18 },
    "E2-6": { line: "劳动用 MOOC + 实践，最轻量路径", fit: "best", priority: 4 },
    "E2-7": { line: "心理健康课本身就是减压资源", fit: "best", priority: 2 },
    "E2-8": { line: "通识必修 4 学分都走最低门槛路径", fit: "best", priority: 5 },
    "E3-1": { line: "通识 8 学分挑评分宽松、考核简单的模块", fit: "best", priority: 9 },
    "E3-2": { line: "人类思维选熟悉领域，认知负担低", fit: "best", priority: 16 },
    "E3-3": { line: "经典阅读读熟悉的书 / 短篇，避免长读疲劳", fit: "best", priority: 20 },
    "E3-4": { line: "模块课程挑同班同学一起上的，互相支撑", fit: "best", priority: 18 },
    "E4-4": { line: "师范生板块分散到 4 年，避免学期堆积", fit: "best", priority: 22 },
    "E4-5": { line: "教师教育 21 学分尽量分散，每学期 4-5 学分", fit: "ok", priority: 25 },
    "A1-10": { line: "退学线触发 = 极端压力源，远离一切诱因", fit: "bad", priority: 70 },
    "A1-12": { line: "目标 '毕业' 档，结业/肄业 都意味着失败压力", fit: "ok", priority: 50 },
    "A2-1": { line: "毕业资格审核 → 顺利毕业减少不确定性", fit: "ok", priority: 45 },
    "A3-2": { line: "学位 GPA 2.0 是底线，单科补考通过即可", fit: "best", priority: 30 },
    "A3-3": { line: "处分 = 心理压力源，守纪律避免", fit: "bad", priority: 60 },
    "A4-2": { line: "学分认定上限 40%，可顶部分难课减压", fit: "ok", priority: 35 },
    "B3-1": { line: "学业预警是压力红线，每学期主动监控", fit: "bad", priority: 65 },
    "B3-4": { line: "退学 → 试读触发 = 重度心理压力", fit: "bad", priority: 80 },
    "B4-4": { line: "旷课处分阈值低，按时上课比补救更轻松", fit: "ok", priority: 40 },
    "B5-9": { line: "体测 50 分门槛低，按时锻炼即可", fit: "ok", priority: 38 },
    "C1-9": { line: "辅修学位增加 workload，与低压力反向", fit: "bad", priority: 70 },
    "C2-6": { line: "双学位重度增加压力，本路径必避", fit: "bad", priority: 85 },
    "C3-3": { line: "强基本研衔接竞争压力大，本路径反向", fit: "bad", priority: 75 },
    "C5-2": { line: "转专业带来适应压力，建议本路径不动", fit: "ok", priority: 55 },
    "C6-1": { line: "创新创业学分可顶劳动减少课程数", fit: "best", priority: 24 },
    "C9-1": { line: "推免 GPA ≥ 2.8 与本路径无关", fit: "ok", priority: 78 },
    "C9-3": { line: "推免综合公式不影响本路径", fit: "ok", priority: 80 },
    "D3-6": { line: "实习不及格触发重修 = 重度压力源，按时签到", fit: "bad", priority: 48 },
    "D4-11": { line: "论文不答 → 延期 = 重度压力，提前规划", fit: "bad", priority: 62 },
    "D4-12": { line: "论文初稿就查重，避免答辩前重大整改", fit: "ok", priority: 28 },
  },

  个性化定制: {
    "E1-3": { line: "培养方案 4 大块按你的 goal_weights 加权决定优先级", fit: "ok", priority: 35 },
    "E2-1": { line: "思政 6 门必修无法跳过，按权重分配时间", fit: "ok", priority: 22 },
    "E2-2": { line: "英语按你的目标决定 A/B/C/D 班，分级考一次定档", fit: "ok", priority: 18 },
    "E2-3": { line: "计算机按你的技能权重选选修", fit: "ok", priority: 24 },
    "E2-4": { line: "体育按你的兴趣 + 时段权重选项目", fit: "ok", priority: 28 },
    "E2-5": { line: "国情教育按部就班，权重低", fit: "ok", priority: 32 },
    "E2-6": { line: "劳动 4 路径按你的实习 / 项目 / MOOC 权重选", fit: "ok", priority: 20 },
    "E2-7": { line: "心理健康按你的压力权重决定深度", fit: "ok", priority: 25 },
    "E2-8": { line: "通识必修按 E2-6 + E2-7 权重组合", fit: "ok", priority: 26 },
    "E3-1": { line: "通识 8 学分按你的多维兴趣权重选模块", fit: "best", priority: 14 },
    "E3-2": { line: "人类思维按你的兴趣 vs GPA 权重选", fit: "ok", priority: 30 },
    "E3-3": { line: "经典阅读按你的阅读偏好权重选", fit: "ok", priority: 32 },
    "E3-4": { line: "模块课程是个性化路径最大自由度处", fit: "best", priority: 16 },
    "E4-4": { line: "师范生板块按 4 板块权重决定深度", fit: "ok", priority: 28 },
    "E4-5": { line: "教师教育 21 学分按权重分布到学期", fit: "ok", priority: 30 },
    "A1-10": { line: "退学 7 条触发 = 任何权重组合都不能突破的硬约束", fit: "bad", priority: 78 },
    "A1-12": { line: "保住 '毕业' 档是所有 goal 组合的底线", fit: "ok", priority: 55 },
    "A2-1": { line: "毕业资格审核 = 所有权重组合的最终关卡", fit: "ok", priority: 50 },
    "A3-2": { line: "学位 GPA 2.0 = 所有目标组合都不能突破", fit: "ok", priority: 60 },
    "A3-3": { line: "处分阻断学位 = 硬约束", fit: "bad", priority: 70 },
    "A4-2": { line: "学分认定上限 40%，按你的跨校权重决定使用", fit: "ok", priority: 45 },
    "B3-1": { line: "学业预警 = 所有权重组合的硬约束", fit: "bad", priority: 75 },
    "B3-4": { line: "退学线 = 硬约束底线", fit: "bad", priority: 90 },
    "B4-4": { line: "旷课处分阈值低，按你的出勤权重设上限", fit: "ok", priority: 50 },
    "B5-9": { line: "体测 50 分门槛 = 硬约束底线", fit: "ok", priority: 55 },
    "C1-9": { line: "辅修学位是个性化加分项，按你的兴趣权重决定", fit: "ok", priority: 38 },
    "C2-6": { line: "双学位是个性化路径深度选项", fit: "ok", priority: 40 },
    "C3-3": { line: "强基本研衔接看你权重里保研占比", fit: "ok", priority: 42 },
    "C5-2": { line: "转专业按你的方向权重决定是否触发", fit: "ok", priority: 48 },
    "C6-1": { line: "创新创业学分按你的科研/实习/竞赛权重累积", fit: "best", priority: 22 },
    "C9-1": { line: "推免资格按你权重里保研占比决定是否冲", fit: "ok", priority: 44 },
    "C9-3": { line: "推免综合公式按你保研 vs 实习权重决定投入", fit: "ok", priority: 46 },
    "D3-6": { line: "实习重修阈值 = 实习权重高时的硬约束", fit: "bad", priority: 60 },
    "D4-11": { line: "论文不答 = 所有权重组合的硬约束", fit: "bad", priority: 68 },
    "D4-12": { line: "论文重复率 = 学术诚信硬约束", fit: "bad", priority: 65 },
  },
};

/* ───────────────────────── LINKS：~80 条 req↔req 关系 ───────────────────────── */

const LINKS: LinkRow[] = [
  // ── substitute（替代/冲抵） ──
  { from: "E2-6", to: "C6-1", kind: "substitute", metadata: {"max_credits":2}, note: "劳动2学分可由创新创业学分顶≤2分", sourceRef: "E2-6 cross_ref C6-3" },
  { from: "C6-3", to: "E2-6", kind: "substitute", metadata: {"max_credits":2}, note: "创新创业学分冲抵劳动与创造模块", sourceRef: "C6-3" },
  { from: "D4-16", to: "D4-1", kind: "substitute", note: "创新竞赛获奖可代替毕业论文", sourceRef: "D4-16" },
  { from: "E2-6", to: "C6-3", kind: "substitute", metadata: {"max_credits":2}, note: "劳动学分可由创新创业冲抵≤2", sourceRef: "E2-6" },
  // ── cross_ref（引用/组合） ──
  { from: "E2-8", to: "E2-6", kind: "cross_ref", bidirectional: true, note: "通识必修4学分=劳动2+心理2", sourceRef: "E2-8" },
  { from: "E2-8", to: "E2-7", kind: "cross_ref", bidirectional: true, note: "通识必修4学分=劳动2+心理2", sourceRef: "E2-8" },
  { from: "E3-1", to: "E3-2", kind: "cross_ref", note: "通识8学分含人类思维与学科史论模块", sourceRef: "E3-1" },
  { from: "E3-1", to: "E3-3", kind: "cross_ref", note: "通识8学分含经典阅读模块", sourceRef: "E3-1" },
  { from: "E3-1", to: "E3-4", kind: "cross_ref", note: "通识8学分含模块课程模块", sourceRef: "E3-1" },
  { from: "E2-6", to: "C6-1", kind: "cross_ref", bidirectional: true, note: "劳动教育条款明确引用C6-3创新创业学分", sourceRef: "E2-6" },
  { from: "E4-4", to: "E4-5", kind: "cross_ref", note: "师范生课程结构包含教师教育板块", sourceRef: "E4-4" },
  { from: "C9-3", to: "C9-1", kind: "cross_ref", note: "推免综合公式适用范围由C9-1资格条款决定", sourceRef: "C9-3" },
  { from: "A2-1", to: "A1-12", kind: "cross_ref", bidirectional: true, note: "毕业资格审核三档对应毕业/结业/肄业三档", sourceRef: "A2-1" },
  { from: "A3-3", to: "A3-2", kind: "cross_ref", note: "处分期间不可申请学位引用学位GPA阈值", sourceRef: "A3-3" },
  { from: "C2-6", to: "A3-2", kind: "cross_ref", note: "双学位授予条件引用学位GPA阈值(2.0)", sourceRef: "C2-6" },
  { from: "C1-9", to: "A3-2", kind: "cross_ref", note: "辅修学位授予条件引用学位GPA阈值", sourceRef: "C1-9" },
  { from: "D4-12", to: "D4-11", kind: "cross_ref", note: "论文重复率结果引用不予答辩4触发清单", sourceRef: "D4-12" },
  { from: "B3-1", to: "A3-2", kind: "cross_ref", note: "学业预警判定引用学位GPA阈值", sourceRef: "B3-1" },
  { from: "A1-10", to: "A1-1", kind: "cross_ref", note: "退学含规定学习年限内未毕业结业", sourceRef: "A1-10" },
  { from: "A1-10", to: "A1-5", kind: "cross_ref", note: "退学含超期未注册又未办暂缓", sourceRef: "A1-10" },
  { from: "A2-2", to: "A1-1", kind: "cross_ref", note: "提前毕业以标准学习年限为基准", sourceRef: "A2-2" },
  { from: "B1-4", to: "B6-6", kind: "cross_ref", note: "期中退课缴费引用学分制收费", sourceRef: "B1-4" },
  { from: "B3-6", to: "B3-7", kind: "cross_ref", note: "试读结果引用第十一条三条件", sourceRef: "B3-6" },
  { from: "B6-6", to: "B6-5", kind: "cross_ref", note: "期中退课退费引用第八条单价", sourceRef: "B6-6" },
  { from: "B6-8", to: "B6-5", kind: "cross_ref", note: "毕业超修补缴引用第八条单价", sourceRef: "B6-8" },
  { from: "B6-10", to: "B6-5", kind: "cross_ref", note: "公费师范超年限按第八条缴费", sourceRef: "B6-10" },
  { from: "B6-10", to: "B6-6", kind: "cross_ref", note: "公费师范期中退课按第九条", sourceRef: "B6-10" },
  { from: "C1-8", to: "A1-1", kind: "cross_ref", note: "辅修最长年限锚定主修最长年限", sourceRef: "C1-8" },
  { from: "C5-2", to: "C3-1", kind: "cross_ref", note: "转专业限制群体含强基计划学生", sourceRef: "C5-2" },
  { from: "C5-11", to: "A2-2", kind: "cross_ref", note: "提前完成可申请提前毕业", sourceRef: "C5-11" },
  { from: "C5-11", to: "B6-4", kind: "cross_ref", note: "转专业学费按转入专业、毕业学期结算", sourceRef: "C5-11" },
  { from: "C6-2", to: "C6-5", kind: "cross_ref", note: "训练项目途径对应项目级别认定", sourceRef: "C6-2" },
  { from: "C6-2", to: "C6-6", kind: "cross_ref", note: "竞赛获奖途径对应竞赛分值认定", sourceRef: "C6-2" },
  { from: "C6-2", to: "C6-7", kind: "cross_ref", note: "论文专利著作途径对应分值认定", sourceRef: "C6-2" },
  { from: "C6-2", to: "C6-8", kind: "cross_ref", note: "自主创业途径对应创业分值认定", sourceRef: "C6-2" },
  { from: "C8-3", to: "C3-1", kind: "cross_ref", note: "卓越学院结构含强基计划", sourceRef: "C8-3" },
  { from: "C8-4", to: "C3-2", kind: "cross_ref", note: "强基计划通过高考招生入卓越学院", sourceRef: "C8-4" },
  { from: "C8-5", to: "C4-3", kind: "cross_ref", note: "拔尖个性化选课学分≥24", sourceRef: "C8-5" },
  { from: "C8-5", to: "C3-3", kind: "cross_ref", note: "强基达转段要求可直接转段读研", sourceRef: "C8-5" },
  { from: "C9-3", to: "C9-4", kind: "cross_ref", note: "综合成绩素质加分由7类构成", sourceRef: "C9-3" },
  { from: "C9-7", to: "C2-6", kind: "cross_ref", note: "双学位推免由招生专业院系牵头", sourceRef: "C9-7" },
  { from: "D2-7", to: "A1-9", kind: "cross_ref", note: "创业休学不计最长学习年限", sourceRef: "D2-7" },
  { from: "D4-16", to: "D5-1", kind: "cross_ref", note: "替代具体办法参见D5", sourceRef: "D4-16" },
  { from: "D5-4", to: "D4-1", kind: "cross_ref", note: "抽检即校外专家抽查机制", sourceRef: "D4-1" },
  { from: "D5-2", to: "D4-13", kind: "cross_ref", note: "抽检学术规范维度引学术不端", sourceRef: "D5-2" },
  { from: "D6-7", to: "D6-4", kind: "cross_ref", note: "延期不超执行周期1年须毕业前完成", sourceRef: "D6-7" },
  { from: "E1-3", to: "E2-1", kind: "cross_ref", note: "培养方案4大结构含公共必修块", sourceRef: "E1-3" },
  { from: "E1-3", to: "E3-1", kind: "cross_ref", note: "4大结构含通识教育8学分块", sourceRef: "E1-3" },
  { from: "E1-3", to: "E1-2", kind: "cross_ref", note: "课程结构属培养方案9部分之一", sourceRef: "E1-2" },
  { from: "D2-7", to: "A1-3", kind: "cross_ref", note: "创业休学期不计入最长年限", sourceRef: "process 5-4" },
  { from: "C6-5", to: "D6-6", kind: "cross_ref", note: "创新训练结题后学分计入C6-5", sourceRef: "process 8-3" },
  // ── prerequisite（前置） ──
  { from: "C9-1", to: "C9-3", kind: "prerequisite", note: "达推免资格才适用综合排名公式", sourceRef: "C9-1" },
  { from: "A3-2", to: "A1-12", kind: "prerequisite", note: "学位GPA阈值达成是'毕业+学位'档前置", sourceRef: "A3-2" },
  { from: "E2-1", to: "A2-1", kind: "prerequisite", note: "思政课全部通过是毕业资格审核硬要求", sourceRef: "A2-1" },
  { from: "E2-2", to: "A2-1", kind: "prerequisite", note: "大学英语8学分完成是毕业资格审核硬要求", sourceRef: "A2-1" },
  { from: "E2-4", to: "A2-1", kind: "prerequisite", note: "公共体育4学分完成是毕业资格审核硬要求", sourceRef: "A2-1" },
  { from: "E2-5", to: "A2-1", kind: "prerequisite", note: "国情教育3学分完成是毕业资格审核硬要求", sourceRef: "A2-1" },
  { from: "E2-6", to: "A2-1", kind: "prerequisite", note: "劳动教育2学分完成是毕业资格审核硬要求", sourceRef: "A2-1" },
  { from: "E2-7", to: "A2-1", kind: "prerequisite", note: "心理健康2学分完成是毕业资格审核硬要求", sourceRef: "A2-1" },
  { from: "E3-1", to: "A2-1", kind: "prerequisite", note: "通识8学分完成是毕业资格审核硬要求", sourceRef: "A2-1" },
  { from: "B5-9", to: "A1-12", kind: "prerequisite", note: "体测达50分是'毕业'档前置(<50按结业/肄业)", sourceRef: "B5-9" },
  { from: "E4-4", to: "E4-5", kind: "prerequisite", note: "师范生需完成4板块(含教师教育)才符合培养方案", sourceRef: "E4-4" },
  { from: "C1-9", to: "C2-6", kind: "prerequisite", note: "辅修学位先于双学位审定", sourceRef: "C2-6" },
  { from: "A1-6", to: "A1-5", kind: "prerequisite", note: "未注册不予选课，注册是选课前置", sourceRef: "A1-6" },
  { from: "A3-1", to: "A3-2", kind: "prerequisite", note: "学位申请须满足A3-2的GPA条件之一", sourceRef: "A3-1" },
  { from: "A3-1", to: "A1-12", kind: "prerequisite", note: "学位申请需先通过毕业环节审查", sourceRef: "A3-1" },
  { from: "B3-1", to: "A3-2", kind: "prerequisite", note: "预警线GPA对标学位授予条件", sourceRef: "B3-1" },
  { from: "B6-11", to: "B1-2", kind: "prerequisite", note: "未缴费不予注册阻断选课", sourceRef: "B6-11" },
  { from: "C1-9", to: "A3-2", kind: "prerequisite", note: "获主修学士学位才可授辅修学位", sourceRef: "C1-9" },
  { from: "C6-4", to: "C6-3", kind: "prerequisite", note: "累加学分仅能抵充一次", sourceRef: "C6-4" },
  { from: "C3-3", to: "C3-4", kind: "prerequisite", note: "达转段要求才走推免转段通道", sourceRef: "C3-3" },
  { from: "C9-4", to: "C9-5", kind: "prerequisite", note: "素质加分经专家审核小组鉴定", sourceRef: "C9-5" },
  { from: "D1-2", to: "A1-9", kind: "prerequisite", note: "无课程学期须办休学(注册前置)", sourceRef: "D1-5" },
  { from: "D4-3", to: "D4-1", kind: "prerequisite", note: "开题答辩通过方可进入撰写", sourceRef: "D4-3" },
  { from: "D5-4", to: "D4-12", kind: "prerequisite", note: "抽检对象为通过重复率检测论文", sourceRef: "D5-4" },
  { from: "D6-1", to: "D6-3", kind: "prerequisite", note: "国创/市创/校创从培育项目产生", sourceRef: "D6-1" },
  { from: "D6-8", to: "D6-6", kind: "prerequisite", note: "结题验收前不能申报新项目", sourceRef: "D6-8" },
  { from: "E4-7", to: "E4-5", kind: "prerequisite", note: "须修完教师教育课程才能申请实习", sourceRef: "E4-7" },
  { from: "B1-2", to: "A1-5", kind: "prerequisite", note: "未注册不能选课", sourceRef: "process 2-2" },
  // ── excludes（互斥/免修） ──
  { from: "E4-4", to: "E1-3", kind: "excludes", note: "师范生培养方案与一般本科4大结构互斥", sourceRef: "E4-4" },
  { from: "C3-3", to: "C9-1", kind: "excludes", note: "强基本研衔接转段与普通推免互斥", sourceRef: "C3-3" },
  { from: "A1-12", to: "A1-13", kind: "excludes", note: "取消学籍者不出具肄业/写实证明", sourceRef: "A1-12" },
  { from: "A3-3", to: "A3-1", kind: "excludes", note: "处分期间不可申请学位，解除后再申请", sourceRef: "A3-3" },
  { from: "B3-1", to: "B1-6", kind: "excludes", note: "学业预警学生不可申请免听", sourceRef: "B1-5" },
  { from: "B3-1", to: "B1-7", kind: "excludes", note: "学业预警学生不可申请免修", sourceRef: "B1-5" },
  { from: "B3-4", to: "B1-6", kind: "excludes", note: "试读学生不可申请免听", sourceRef: "B1-5" },
  { from: "B3-4", to: "B1-7", kind: "excludes", note: "试读学生不可申请免修", sourceRef: "B1-5" },
  { from: "C5-10", to: "C2-3", kind: "excludes", note: "双学位退出不归入转专业", sourceRef: "C5-10" },
  { from: "C3-4", to: "C9-1", kind: "excludes", note: "强基转段推免走教育部专项独立通道", sourceRef: "C3-4" },
  { from: "B1-7", to: "E2-2", kind: "excludes", note: "大学英语测评通过方可免修", sourceRef: "process 3-6" },
  { from: "B1-5", to: "E2-1", kind: "excludes", note: "思政课不允许免听免修", sourceRef: "process 3-6" },
  { from: "B1-5", to: "E2-4", kind: "excludes", note: "体育课不允许免听免修", sourceRef: "process 3-6" },
  { from: "C5-9", to: "C5-4", kind: "excludes", note: "参军创业复学转专业不受5%下限", sourceRef: "process 4-7" },
  { from: "C5-7", to: "C5-4", kind: "excludes", note: "卓越学院转专业不受5%下限", sourceRef: "process 4-5" },
  // ── triggers（触发链） ──
  { from: "A1-10", to: "A1-12", kind: "triggers", note: "退学情形触发→学籍结束→肄业档", sourceRef: "A1-10" },
  { from: "A3-3", to: "A3-2", kind: "triggers", note: "处分期间触发→学位申请冻结", sourceRef: "A3-3" },
  { from: "B3-1", to: "B3-4", kind: "triggers", note: "学业预警累计→第一次退学线→试读", sourceRef: "B3-1" },
  { from: "B3-4", to: "A1-10", kind: "triggers", note: "第一次退学线触发→试读(学制内仅限1次)", sourceRef: "B3-4" },
  { from: "B4-4", to: "A3-3", kind: "triggers", note: "旷课纪律处分触发→处分期间学位申请冻结", sourceRef: "B4-4" },
  { from: "B5-9", to: "A1-12", kind: "triggers", note: "体测<50分触发→按结业/肄业档", sourceRef: "B5-9" },
  { from: "D4-12", to: "D4-11", kind: "triggers", note: "论文重复率30%整改/50%直接不予答辩", sourceRef: "D4-12" },
  { from: "D4-11", to: "A2-1", kind: "triggers", note: "论文不予答辩→毕业资格审核失败→延期毕业", sourceRef: "D4-11" },
  { from: "C5-2", to: "A1-12", kind: "triggers", note: "转专业违规处理→可能影响毕业档", sourceRef: "C5-2" },
  { from: "C9-3", to: "C9-1", kind: "triggers", note: "推免综合排名失格→推免资格4条触发取消", sourceRef: "C9-3" },
  { from: "A4-2", to: "A2-1", kind: "triggers", note: "学分认定超过40%上限→毕业资格审核拒绝", sourceRef: "A4-2" },
  { from: "A5-2", to: "A5-4", kind: "triggers", note: "取消考核资格者不予补考", sourceRef: "A5-4" },
  { from: "A5-3", to: "A5-4", kind: "triggers", note: "未办缓考视为缺考，缺考不予补考", sourceRef: "A5-3" },
  { from: "A5-7", to: "A5-4", kind: "triggers", note: "考核违纪不予补考", sourceRef: "A5-4" },
  { from: "A5-7", to: "A3-3", kind: "triggers", note: "考核违纪受处分→阻断学位申请", sourceRef: "A5-7" },
  { from: "B1-6", to: "B4-1", kind: "triggers", note: "免听未批擅自缺课视为旷课", sourceRef: "B1-6" },
  { from: "B1-7", to: "B4-1", kind: "triggers", note: "免修未批擅自缺课视为旷课", sourceRef: "B1-7" },
  { from: "B4-4", to: "A1-10", kind: "triggers", note: "连续两周旷课触发退学", sourceRef: "B4-4" },
  { from: "C6-10", to: "C6-4", kind: "triggers", note: "弄虚作假取消已获学分", sourceRef: "C6-10" },
  { from: "C9-8", to: "C9-1", kind: "triggers", note: "不能毕业或获学位取消推免资格", sourceRef: "C9-8" },
  { from: "D1-6", to: "D1-2", kind: "triggers", note: "逾期未注册→退学/结业/毕业处理", sourceRef: "D1-6" },
  { from: "D2-2", to: "A1-9", kind: "triggers", note: "治疗/请假超1/3学期→应办休学", sourceRef: "D2-2" },
  { from: "D2-6", to: "D2-9", kind: "triggers", note: "逾期未复学→毕业/结业/退学", sourceRef: "D2-9" },
  { from: "D3-5", to: "D3-6", kind: "triggers", note: "分散实习造假→不及格须重修", sourceRef: "D3-5" },
  { from: "D3-6", to: "D3-4", kind: "triggers", note: "实习考核不及格→重修学分", sourceRef: "D3-6" },
  { from: "D4-1", to: "D4-12", kind: "triggers", note: "抄袭检测→重复率超标处理", sourceRef: "D4-1" },
  { from: "D4-12", to: "D4-9", kind: "triggers", note: "复检/整改不合格→不及格+补答辩", sourceRef: "D4-12" },
  { from: "D4-9", to: "D4-7", kind: "triggers", note: "答辩未通过→三月补答辩仅一次", sourceRef: "D4-9" },
  { from: "D4-11", to: "D4-7", kind: "triggers", note: "初评/交叉评阅不合格→不受理答辩", sourceRef: "D4-11" },
  { from: "D4-12", to: "D4-7", kind: "triggers", note: "重度重合→取消该次答辩资格", sourceRef: "D4-12" },
  { from: "D4-13", to: "D4-7", kind: "triggers", note: "学术不端→成绩不及格必须重修", sourceRef: "D4-13" },
  { from: "D4-10", to: "D4-7", kind: "triggers", note: "中途放弃→补考/重修/延期缺考", sourceRef: "D4-10" },
  { from: "D5-5", to: "D4-7", kind: "triggers", note: "第一次抽检不合格→取消答辩延期三月", sourceRef: "D5-5" },
  { from: "D5-5", to: "D4-9", kind: "triggers", note: "复评不合格→视为补答辩不通过须重修", sourceRef: "D5-5" },
  { from: "D5-3", to: "D5-5", kind: "triggers", note: "评议不合格→进入不合格处理", sourceRef: "D5-3" },
  { from: "D5-7", to: "D5-3", kind: "triggers", note: "存在问题论文→提高院系抽检比例", sourceRef: "D5-7" },
  { from: "D5-7", to: "D4-13", kind: "triggers", note: "学术不端查实→已毕业撤销学位", sourceRef: "D5-7" },
  { from: "D6-5", to: "D6-6", kind: "triggers", note: "结项率低→下年度减少/不给名额", sourceRef: "D6-5" },
  { from: "D6-6", to: "D6-7", kind: "triggers", note: "未按时结题→限期整改或延期", sourceRef: "D6-6" },
  { from: "D1-6", to: "A1-10", kind: "triggers", note: "逾期未注册触发自动退学", sourceRef: "process 2-5" },
  { from: "D2-9", to: "A1-10", kind: "triggers", note: "休学逾期未复学触发自动退学", sourceRef: "process 5-7" },
  { from: "B3-6", to: "B3-7", kind: "triggers", note: "试读不通过触发二次退学线", sourceRef: "process 5-11" },
  { from: "A3-7", to: "A1-13", kind: "triggers", note: "学术不端触发撤销学位/学历", sourceRef: "process 7-4" },
];

/* ───────────────────────── 输出 SQL ───────────────────────── */

function sqlEscape(s: string): string {
  return s.replace(/'/g, "''");
}

function buildAdviceSql(): string {
  const header = `-- ─────────────────────────────────────────────────────────────────────
-- 0007_seed_requirement_advice — 280 advice rows (35 reqs × 8 goals)
-- AUTO-GENERATED by scripts/genRequirementAdvice.ts —— DO NOT HAND-EDIT
-- 修文案 → 改 scripts/genRequirementAdvice.ts → 重跑生成器
--
-- 设计原则（2026-05-25 用户拍板）：
--  - 35 reqs = 15 用户可见（E1-3 / E2-1~8 / E3-1~4 / E4-4~5）+ 20 关键规则
--  - 每条 30-60 字中文，区分 8 goal_mode 语气
--  - 同 (goal_mode, requirement_id) ON CONFLICT DO UPDATE（幂等可重跑）
-- ─────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_req_id uuid;
  v_inserted int := 0;
  v_skipped int := 0;
BEGIN
`;

  const rows: string[] = [];
  for (const goal of GOALS) {
    for (const req of REQS) {
      const cell = ADVICE[goal]?.[req.code];
      if (!cell) {
        throw new Error(`Missing advice: ${goal} × ${req.code}`);
      }
      rows.push(`  -- ${goal} × ${req.code} (${req.title})
  SELECT id INTO v_req_id FROM public.track_requirement WHERE code = '${req.code}' LIMIT 1;
  IF v_req_id IS NOT NULL THEN
    INSERT INTO public.requirement_advice (goal_mode, requirement_id, one_liner, goal_fit, priority, source_ref)
    VALUES ('${sqlEscape(goal)}', v_req_id, '${sqlEscape(cell.line)}', '${cell.fit}', ${cell.priority}, '${req.code}')
    ON CONFLICT (goal_mode, requirement_id) DO UPDATE SET
      one_liner = EXCLUDED.one_liner,
      goal_fit = EXCLUDED.goal_fit,
      priority = EXCLUDED.priority,
      source_ref = EXCLUDED.source_ref,
      updated_at = now();
    v_inserted := v_inserted + 1;
  ELSE
    v_skipped := v_skipped + 1;
    RAISE NOTICE 'Skipped (req not found): %', '${req.code}';
  END IF;
`);
    }
  }

  const footer = `  RAISE NOTICE 'requirement_advice seed done: inserted/updated=%, skipped=%', v_inserted, v_skipped;
END $$;
`;

  return header + rows.join("\n") + footer;
}

function buildLinkSql(): string {
  const header = `-- ─────────────────────────────────────────────────────────────────────
-- 0013_seed_requirement_link_full — ${LINKS.length} req↔req 关系（全 198 系统抽取）
-- AUTO-GENERATED by scripts/genRequirementAdvice.ts —— DO NOT HAND-EDIT
--
-- 取代 0008（含其全部关系的超集）；2026-05-31 读 5 份 digest 系统抽取，覆盖 117/198 规则。
-- 连接只存客观事实关系（不带目标字段，目标适配交运行时 AI 层）。
-- 5 档 kind：substitute / prerequisite / excludes / cross_ref / triggers
-- 同 (from, to, kind) ON CONFLICT DO UPDATE（幂等可重跑）
-- ─────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_from_id uuid;
  v_to_id uuid;
  v_inserted int := 0;
  v_skipped int := 0;
BEGIN
`;

  const rows: string[] = [];
  for (const link of LINKS) {
    if (link.from === link.to) {
      // 自环 CHECK 会拒，本工具不输出
      continue;
    }
    const meta = JSON.stringify(link.metadata ?? {}).replace(/'/g, "''");
    const note = sqlEscape(link.note);
    const sref = link.sourceRef ? `'${sqlEscape(link.sourceRef)}'` : "NULL";
    const bi = link.bidirectional ? "true" : "false";
    rows.push(`  -- ${link.from} -[${link.kind}]-> ${link.to}: ${link.note.slice(0, 40)}
  SELECT id INTO v_from_id FROM public.track_requirement WHERE code = '${link.from}' LIMIT 1;
  SELECT id INTO v_to_id   FROM public.track_requirement WHERE code = '${link.to}'   LIMIT 1;
  IF v_from_id IS NOT NULL AND v_to_id IS NOT NULL THEN
    INSERT INTO public.requirement_link (from_req, to_req, kind, bidirectional, metadata, note, source_ref)
    VALUES (v_from_id, v_to_id, '${link.kind}', ${bi}, '${meta}'::jsonb, '${note}', ${sref})
    ON CONFLICT (from_req, to_req, kind) DO UPDATE SET
      bidirectional = EXCLUDED.bidirectional,
      metadata = EXCLUDED.metadata,
      note = EXCLUDED.note,
      source_ref = EXCLUDED.source_ref;
    v_inserted := v_inserted + 1;
  ELSE
    v_skipped := v_skipped + 1;
    RAISE NOTICE 'Skipped (req not found): % or %', '${link.from}', '${link.to}';
  END IF;
`);
  }

  const footer = `  RAISE NOTICE 'requirement_link seed done: inserted/updated=%, skipped=%', v_inserted, v_skipped;
END $$;
`;

  return header + rows.join("\n") + footer;
}

/* ───────────────────────── main ───────────────────────── */

function main() {
  const adviceSql = buildAdviceSql();
  const linkSql = buildLinkSql();

  const adviceOut = resolve(MIGRATIONS_DIR, "0007_seed_requirement_advice.sql");
  const linkOut = resolve(MIGRATIONS_DIR, "0013_seed_requirement_link_full.sql");

  writeFileSync(adviceOut, adviceSql, "utf8");
  writeFileSync(linkOut, linkSql, "utf8");

  const adviceCount = GOALS.length * REQS.length;
  const linkCount = LINKS.filter((l) => l.from !== l.to).length;

  console.log(`✓ 0007 advice seed: ${adviceCount} rows → ${adviceOut}`);
  console.log(`✓ 0013 link   seed: ${linkCount} rows → ${linkOut}`);
}

main();
