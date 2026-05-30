/**
 * 把超大 seed SQL 切成 Supabase SQL Editor 能吞下的小份（排队 13.8-B 辅助）。
 *
 * 起因：0012_seed_handbook_chunks.sql 含 624 行带 1024 维向量的 INSERT ≈ 7MB，
 * 超过 SQL Editor 单查询上限（"Query is too large"）。本脚本按字节预算切成
 * 多个 part 文件，每个是自洽事务（begin;…commit;），用户按序贴入即可。
 *
 * 幂等性：INSERT 都带 ON CONFLICT (source_key, chunk_index) DO UPDATE，
 * 所以切片乱序 / 重跑都安全；不含 delete（避免「重跑某片删全表」的坑）。
 * 要彻底重灌：先手动 `truncate public.rag_chunk;` 再贴各片。
 *
 * 运行：npx tsx scripts/splitSeedSql.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const MIG = resolve(REPO_ROOT, "supabase/migrations");
const SRC = resolve(MIG, "0012_seed_handbook_chunks.sql");

// 每片字节预算，留足余量低于 Editor 上限
const BUDGET = 900_000;

function main() {
  const text = readFileSync(SRC, "utf8");
  const inserts = text
    .split("\n")
    .filter((l) => l.startsWith("insert into public.rag_chunk"));
  if (inserts.length === 0) {
    throw new Error(`${SRC} 里没找到 insert 行，确认文件对不对。`);
  }

  // 按字节预算分组
  const groups: string[][] = [];
  let cur: string[] = [];
  let curBytes = 0;
  for (const line of inserts) {
    const b = Buffer.byteLength(line, "utf8") + 1;
    if (cur.length && curBytes + b > BUDGET) {
      groups.push(cur);
      cur = [];
      curBytes = 0;
    }
    cur.push(line);
    curBytes += b;
  }
  if (cur.length) groups.push(cur);

  const total = groups.length;
  groups.forEach((g, i) => {
    const n = String(i + 1).padStart(2, "0");
    const out = resolve(MIG, `0012_seed_handbook_chunks_part${n}.sql`);
    const body = [
      `-- 0012_seed_handbook_chunks_part${n}.sql — 第 ${i + 1}/${total} 片（由 splitSeedSql.ts 切）`,
      `-- 按序贴进 Supabase SQL Editor 跑；前提 0012_add_handbook_rag.sql 已跑。`,
      `-- 幂等（ON CONFLICT），重跑安全。彻底重灌先 truncate public.rag_chunk;`,
      "begin;",
      ...g,
      "commit;",
      "",
    ].join("\n");
    writeFileSync(out, body, "utf8");
    console.log(
      `  写 part${n}: ${g.length} 行, ${(Buffer.byteLength(body, "utf8") / 1024).toFixed(0)} KB`,
    );
  });

  console.log(
    `\n✅ 切成 ${total} 片（共 ${inserts.length} 行）。按 part01 → part${String(total).padStart(2, "0")} 顺序贴入 SQL Editor。`,
  );
}

main();
