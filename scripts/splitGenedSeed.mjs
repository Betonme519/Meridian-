// 一次性切分器：把 0013_seed_gened_courses.sql（11MB）切成可粘进 Supabase 网页
// SQL Editor 的小份（每份 ~150 条 insert）。每份独立 begin;…commit;、幂等；
// 第一份带上那条 delete（只清 ecnu-gened-courses 自己的旧块）。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "supabase/migrations/0013_seed_gened_courses.sql");
const OUT_DIR = resolve(ROOT, "docs/20260610华师大通识课文档/seed_parts");
const PER = 50;

const lines = readFileSync(SRC, "utf8").split("\n");
const deleteLine = lines.find((l) => l.startsWith("delete from"));
const inserts = lines.filter((l) => l.startsWith("insert into"));

mkdirSync(OUT_DIR, { recursive: true });

const total = Math.ceil(inserts.length / PER);
for (let i = 0; i < total; i++) {
  const part = i + 1;
  const slice = inserts.slice(i * PER, (i + 1) * PER);
  const body = [
    `-- 通识课程手册 灌库 第 ${part}/${total} 份（粘进 Supabase SQL Editor 运行）`,
    "begin;",
    ...(i === 0 ? [deleteLine] : []),
    ...slice,
    "commit;",
    "",
  ].join("\n");
  const name = `gened_part${String(part).padStart(2, "0")}.sql`;
  writeFileSync(resolve(OUT_DIR, name), body, "utf8");
}
console.log(`✅ 切了 ${total} 份 → ${OUT_DIR}`);
