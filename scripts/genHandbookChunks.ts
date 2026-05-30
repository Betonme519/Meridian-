/**
 * 排队 13.8-B 手册向量化生成器 —— 一次性把两本公共手册 PDF 切块 + embedding
 * → 产 supabase/migrations/0012_seed_handbook_chunks.sql。
 *
 * 与 genRequirementAdvice.ts 同思路：脚本产幂等 SQL，用户在 Supabase Dashboard 跑。
 * 区别是这份会**真调智谱 embedding-3 API**（花钱，按 token 计；两本手册一次几块钱级）。
 *
 * 运行：
 *   1) 先装好依赖（pdfjs-dist 已随 13.8-A 装）
 *   2) 干跑预览 chunk 数（不花钱、不调 API、不写 SQL）：
 *        npx tsx scripts/genHandbookChunks.ts --dry
 *   3) 真跑（需 ZHIPU_API_KEY 环境变量）：
 *        ZHIPU_API_KEY=xxx npx tsx scripts/genHandbookChunks.ts
 *      Windows PowerShell：
 *        $env:ZHIPU_API_KEY="xxx"; npx tsx scripts/genHandbookChunks.ts
 *   4) 把生成的 0012_seed_handbook_chunks.sql 贴进 Supabase Dashboard 跑
 *      （前提：0012_add_handbook_rag.sql 已先跑，建好 rag_chunk + pgvector）
 *
 * 设计：
 *  - PDF 抽文字走 pdfjs-dist legacy build（node 端），逐页 getTextContent
 *  - chunk = 段落感知的 ~700 字窗口 + 120 字重叠，尽量不切断句
 *  - heading 启发式跟踪最近章节标题，作检索结果「出处」
 *  - embedding-3 dimensions=1024，批量 10 条/请求，失败重试 3 次
 *  - SQL 每行 INSERT ... ON CONFLICT (source_key, chunk_index) DO UPDATE（幂等）
 */

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const DOCS_DIR = resolve(REPO_ROOT, "public/docs");
const OUT_SQL = resolve(
  REPO_ROOT,
  "supabase/migrations/0012_seed_handbook_chunks.sql",
);

/* ───────────────────────── 配置 ───────────────────────── */

const DRY = process.argv.includes("--dry");

interface SourceDef {
  /** rag_chunk.source_key */
  key: string;
  /** public/docs 下的文件名 */
  file: string;
}

const SOURCES: SourceDef[] = [
  { key: "ecnu-2025-guide", file: "ecnu-2025-guide.pdf" },
  { key: "ecnu-2025-handbook", file: "ecnu-2025-handbook.pdf" },
];

const CHUNK_TARGET = 700; // 目标块长（字符）
const CHUNK_MAX = 1000; // 硬上限
const CHUNK_OVERLAP = 120; // 相邻块重叠，保上下文不断

const EMBED_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/embeddings";
const EMBED_MODEL = process.env.EMBEDDING_MODEL || "embedding-3";
const EMBED_DIMS = 1024;
const EMBED_BATCH = 10; // 每请求块数
const EMBED_RETRY = 3;

/* ───────────────────────── PDF 抽文字 ───────────────────────── */

async function extractPdfText(absPath: string): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // node 端 worker：必须是 file:// URL（Windows 裸路径 'E:\...' 的 ESM loader 会拒）
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
    require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"),
  ).href;

  const data = new Uint8Array(readFileSync(absPath));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ")
      .replace(/[ \t]+/g, " ")
      .trim();
    if (text) pages.push(text);
  }
  await doc.destroy();
  return pages.join("\n\n");
}

/* ───────────────────────── 分块 ───────────────────────── */

interface Chunk {
  heading: string | null;
  content: string;
}

/** 启发式判断一行是否像章节标题 */
function looksLikeHeading(line: string): boolean {
  const s = line.trim();
  if (!s || s.length > 40) return false;
  if (/^第[一二三四五六七八九十百零〇\d]+[章节条编部篇]/.test(s)) return true;
  if (/^[\d]+([.、][\d]+){0,3}[\s、.]/.test(s)) return true;
  // 短行且无句末标点，多半是小标题
  if (s.length <= 24 && !/[。；，,.;:：]$/.test(s)) return true;
  return false;
}

/**
 * 段落感知切块：先按空行 / 句末切成段，再贪心拼到 ~CHUNK_TARGET，
 * 超 CHUNK_MAX 强切；相邻块带 CHUNK_OVERLAP 字符重叠。
 */
function chunkText(full: string): Chunk[] {
  // 归一换行，按段落/句子粗分
  const units = full
    .replace(/\r/g, "")
    .split(/\n+|(?<=[。！？!?])\s+/)
    .map((u) => u.trim())
    .filter(Boolean);

  const chunks: Chunk[] = [];
  let currentHeading: string | null = null;
  let buf = "";

  const flush = () => {
    const content = buf.trim();
    if (content.length >= 40) chunks.push({ heading: currentHeading, content });
    buf = "";
  };

  for (const u of units) {
    if (looksLikeHeading(u)) {
      // 标题前先收掉已积累内容，再把标题作为新块的引子
      flush();
      currentHeading = u.slice(0, 40);
    }
    if (!buf) {
      buf = u;
    } else if (buf.length + 1 + u.length <= CHUNK_TARGET) {
      buf += " " + u;
    } else {
      // 收一块，下一块用尾部 overlap 续上
      const tail = buf.slice(Math.max(0, buf.length - CHUNK_OVERLAP));
      flush();
      buf = tail + " " + u;
    }
    // 单段超长硬切
    while (buf.length > CHUNK_MAX) {
      const head = buf.slice(0, CHUNK_MAX);
      chunks.push({ heading: currentHeading, content: head.trim() });
      buf = buf.slice(CHUNK_MAX - CHUNK_OVERLAP);
    }
  }
  flush();
  return chunks;
}

/* ───────────────────────── Embedding ───────────────────────── */

async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error(
      "缺少 ZHIPU_API_KEY 环境变量。干跑预览用 --dry；真跑前先设好 key。",
    );
  }
  let lastErr: unknown;
  for (let attempt = 1; attempt <= EMBED_RETRY; attempt++) {
    try {
      const res = await fetch(EMBED_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: EMBED_MODEL,
          input: texts,
          dimensions: EMBED_DIMS,
        }),
      });
      if (!res.ok) {
        throw new Error(`embeddings ${res.status}: ${await res.text()}`);
      }
      const json = (await res.json()) as {
        data?: { index: number; embedding: number[] }[];
      };
      const data = json.data ?? [];
      if (data.length !== texts.length) {
        throw new Error(
          `embeddings 返回数量不符：要 ${texts.length} 得 ${data.length}`,
        );
      }
      // 按 index 复位
      const out: number[][] = new Array(texts.length);
      for (const d of data) out[d.index] = d.embedding;
      return out;
    } catch (e) {
      lastErr = e;
      const wait = attempt * 1500;
      console.warn(`  embed 批次失败（第 ${attempt} 次），${wait}ms 后重试：`, e);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/* ───────────────────────── SQL 生成 ───────────────────────── */

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function vecLiteral(v: number[]): string {
  // 6 位小数足够，缩小文件
  return `'[${v.map((x) => x.toFixed(6)).join(",")}]'::vector`;
}

/* ───────────────────────── 主流程 ───────────────────────── */

async function main() {
  const sqlParts: string[] = [];
  sqlParts.push(
    "-- 0012_seed_handbook_chunks.sql —— 由 scripts/genHandbookChunks.ts 生成，勿手改",
    "-- 前提：0012_add_handbook_rag.sql 已跑（rag_chunk + pgvector + match RPC 就绪）",
    "-- 幂等：ON CONFLICT (source_key, chunk_index) DO UPDATE",
    "begin;",
    "",
  );

  let grandTotal = 0;

  for (const src of SOURCES) {
    const abs = resolve(DOCS_DIR, src.file);
    if (!existsSync(abs)) {
      console.error(`✗ 找不到 ${abs}，跳过 ${src.key}`);
      continue;
    }
    console.log(`\n[${src.key}] 抽取 ${src.file} …`);
    const text = await extractPdfText(abs);
    const chunks = chunkText(text);
    console.log(
      `  抽到 ${text.length} 字符 → ${chunks.length} 块（目标 ${CHUNK_TARGET} / 上限 ${CHUNK_MAX} / 重叠 ${CHUNK_OVERLAP}）`,
    );
    grandTotal += chunks.length;

    if (DRY) continue; // 干跑只数块，不调 API 不写 SQL

    // 批量 embedding
    const embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      console.log(
        `  embedding ${i + 1}-${i + batch.length} / ${chunks.length} …`,
      );
      const vecs = await embedBatch(batch.map((c) => c.content));
      embeddings.push(...vecs);
    }

    // 该 source 先清旧块（手册重灌时避免残留旧 index 的孤儿）
    sqlParts.push(
      `-- ${src.key}: ${chunks.length} chunks`,
      `delete from public.rag_chunk where source_key = '${esc(src.key)}';`,
    );
    chunks.forEach((c, idx) => {
      const headingSql = c.heading ? `'${esc(c.heading)}'` : "null";
      sqlParts.push(
        `insert into public.rag_chunk (source_key, heading, chunk_index, content, embedding) values ` +
          `('${esc(src.key)}', ${headingSql}, ${idx}, '${esc(c.content)}', ${vecLiteral(embeddings[idx])}) ` +
          `on conflict (source_key, chunk_index) do update set heading = excluded.heading, content = excluded.content, embedding = excluded.embedding;`,
      );
    });
    sqlParts.push("");
  }

  if (DRY) {
    console.log(
      `\n✅ 干跑完成：共 ${grandTotal} 块。真跑（花钱）去掉 --dry 并设 ZHIPU_API_KEY。`,
    );
    return;
  }

  sqlParts.push("commit;", "");
  writeFileSync(OUT_SQL, sqlParts.join("\n"), "utf8");
  console.log(
    `\n✅ 写出 ${OUT_SQL}\n   共 ${grandTotal} 块。下一步：Supabase Dashboard 跑该 SQL，再跑 0012_verify.sql § 5/§ 6。`,
  );
}

main().catch((e) => {
  console.error("✗ 生成失败：", e);
  process.exit(1);
});
