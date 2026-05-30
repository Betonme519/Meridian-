/**
 * 浏览器端文档抽取 —— 排队 13.8-A。
 *
 * 把用户上传的个人文档（培养方案 / 成绩单）抽成纯文本，喂给 AI 顾问。
 * **全部在浏览器跑**：PDF 用 pdfjs-dist（同 Schedule 页 PDF 预览同源能力），
 * 文本类直接 File.text()。抽取免费、零服务器、零 token —— 只有后续把文本
 * 塞进对话调 GLM-5.1 才花钱。
 *
 * 范围（用户 2026-05-30 拍板「只做文字版」）：
 *  - ✅ PDF（文字版）/ 纯文本 / CSV / Markdown
 *  - ❌ 图片（课表截图）→ 抛 UnsupportedDocError，UI 显「图片暂不支持」灰态，
 *       等以后接视觉档（GLM-4V 系）再做
 *  - ❌ Word（.doc/.docx）→ 抛 UnsupportedDocError，提示导出 PDF
 *
 * SSR 安全：pdfjs 只在 extractText 内部动态 import，模块加载期不碰浏览器 API。
 */

/** 抽取上限：单文档截到 ~200k 字符，避免极端大 PDF 把内存 / token 撑爆。
 *  真正喂 AI 时还会在 personalDocContext 里二次按预算截断。 */
const MAX_EXTRACT_CHARS = 200_000;

/**
 * 文档类型不支持（图片 / Word 等）。UI 据此显灰态而非报错红字。
 */
export class UnsupportedDocError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedDocError";
  }
}

function getExtLower(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx < 0 ? "" : name.slice(idx + 1).toLowerCase();
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || getExtLower(file.name) === "pdf";
}

function isPlainText(file: File): boolean {
  if (file.type.startsWith("text/")) return true;
  return ["txt", "csv", "md", "markdown", "tsv", "json"].includes(
    getExtLower(file.name),
  );
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * 抽 PDF 全文。逐页 getTextContent，页内 item 以空格拼、页间以空行分隔。
 * worker 用 Vite `?url` 拿到打包后地址（构建期处理，dev / prod 两端一致）。
 */
async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Vite `?url`：返回 worker 文件的最终 URL 字符串（vite/client 类型已声明）
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
    .default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  try {
    const pages: string[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const pageText = content.items
        // TextItem 有 str；TextMarkedContent 没有 —— 过滤掉
        .map((it) => ("str" in it ? it.str : ""))
        .join(" ")
        .replace(/[ \t]+/g, " ")
        .trim();
      if (pageText) pages.push(pageText);
      if (pages.join("\n\n").length > MAX_EXTRACT_CHARS) break;
    }
    return pages.join("\n\n").slice(0, MAX_EXTRACT_CHARS).trim();
  } finally {
    // 释放 worker / 内存
    void doc.destroy();
  }
}

/**
 * 主入口：按文件类型分流抽取纯文本。
 *
 * @throws UnsupportedDocError  图片 / Word 等暂不支持的类型
 * @throws Error               PDF 解析失败等（调用方落 parse_error）
 */
export async function extractText(file: File): Promise<string> {
  if (isImage(file)) {
    throw new UnsupportedDocError(
      "图片暂不支持解析（等接入视觉模型后再做）。课表请导出文字版 PDF / CSV。",
    );
  }
  if (isPdf(file)) {
    const text = await extractPdf(file);
    if (!text) {
      throw new Error(
        "这份 PDF 没抽到文字（可能是扫描件 / 图片型 PDF）。请上传文字版，或等接入 OCR。",
      );
    }
    return text;
  }
  if (isPlainText(file)) {
    const text = (await file.text()).slice(0, MAX_EXTRACT_CHARS).trim();
    if (!text) throw new Error("文件内容为空。");
    return text;
  }
  throw new UnsupportedDocError(
    "暂只支持文字版 PDF 和文本文件（TXT / CSV / Markdown）。Word 请先导出 PDF。",
  );
}
