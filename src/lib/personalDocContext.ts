/**
 * 个人文档 → AI 上下文 —— 排队 13.8-A。
 *
 * 把已解析的 rag_source（成绩单 / 培养方案文本）拼成一段紧凑上下文，
 * 在调 GLM-5.1 前作为 system 消息 prepend 进对话，让 AI 能引用学生的
 * 真实已修课程 / 成绩 / 培养方案要求。
 *
 * **预算截断**：个人文档可能很长（培养方案几十页），全塞会撑爆 token 也烧钱。
 * 单文档截到 PER_DOC，总量截到 TOTAL，超出标「已截断」。13.8-B 接 RAG 后
 * 大文档改走向量检索，这里只兜个人短文档。
 */

import type { RagSource } from "@/api/ragSourceApi";

/** 单文档字符上限 */
const PER_DOC_CHAR_BUDGET = 4_000;
/** 所有文档合计字符上限 */
const TOTAL_CHAR_BUDGET = 12_000;

function clip(text: string, budget: number): string {
  const t = text.trim();
  return t.length > budget ? `${t.slice(0, budget)}…（已截断）` : t;
}

/**
 * 拼成单条 system 上下文字符串。无可用文档时返回 null（调用方据此决定是否 prepend）。
 */
export function buildPersonalDocBlock(docs: RagSource[]): string | null {
  if (!docs?.length) return null;

  const parts: string[] = [];
  let total = 0;
  for (const d of docs) {
    const text = d.parsed_text?.trim();
    if (!text) continue;
    if (total >= TOTAL_CHAR_BUDGET) break;
    const budget = Math.min(PER_DOC_CHAR_BUDGET, TOTAL_CHAR_BUDGET - total);
    const clipped = clip(text, budget);
    parts.push(`【${d.kind}｜${d.name}】\n${clipped}`);
    total += clipped.length;
  }
  if (!parts.length) return null;

  return (
    "以下是该学生上传并解析出的个人文档文本（如成绩单 / 培养方案）。" +
    "回答时可据此引用其真实已修课程、成绩、培养方案要求。" +
    "文本可能含 OCR / 排版噪声，按常识理解，不要照抄乱码，也不要编造文本里没有的内容。\n\n" +
    parts.join("\n\n")
  );
}

/**
 * 转成 advisor 结构化入参（GradPathAdvisorInput.personalDocs）。同预算截断。
 * 空时返回 undefined，便于直接展开进 input 对象。
 */
export function personalDocsForAdvisor(
  docs: RagSource[],
): { kind: string; name: string; text: string }[] | undefined {
  if (!docs?.length) return undefined;
  const out: { kind: string; name: string; text: string }[] = [];
  let total = 0;
  for (const d of docs) {
    const text = d.parsed_text?.trim();
    if (!text) continue;
    if (total >= TOTAL_CHAR_BUDGET) break;
    const budget = Math.min(PER_DOC_CHAR_BUDGET, TOTAL_CHAR_BUDGET - total);
    const clipped = clip(text, budget);
    out.push({ kind: d.kind, name: d.name, text: clipped });
    total += clipped.length;
  }
  return out.length ? out : undefined;
}
