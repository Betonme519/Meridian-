/**
 * RAG Source API — Supabase 实现（Storage + rag_source 表）。
 *
 * 数据模型见 docs/DATA_MODEL.md § 3.3。表 + Storage bucket 都由用户 RLS
 * 把守：表用 user_id = auth.uid()，Storage 用路径首段 = auth.uid()。
 *
 * 文件路径约定：`<auth_uid>/<rag_source_id>.<ext>`
 *  - 首段是 uid → Storage RLS 用 (storage.foldername(name))[1] 取出来比对
 *  - 二段是 rag_source 行 id → 行删了也能从 path 反查出来
 *
 * 公共 API：
 *   - listRagSources(userId)           SELECT 该用户所有 source，按 created_at desc
 *   - uploadRagSource({...})           pre-gen id → 传 Storage → 写表；失败兜底清理
 *   - deleteRagSource(source)          先删 Storage 对象 → 再删表行
 *
 * 切后端只动本文件。
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type RagSourceKind =
  | "培养方案"
  | "成绩单"
  | "课表"
  | "手册"
  | "其它";

export const RAG_SOURCE_KINDS: RagSourceKind[] = [
  "培养方案",
  "成绩单",
  "课表",
  "手册",
  "其它",
];

export type ParsedStatus = "pending" | "parsing" | "parsed" | "failed";

/**
 * RagSource shape —— 与 docs/DATA_MODEL.md § 3.3 字段表 1:1 对齐。
 * Postgres NULL → TS null。
 */
export interface RagSource {
  id: string;
  user_id: string;
  name: string;
  kind: RagSourceKind;
  mime: string | null;
  size_bytes: number | null;
  storage_path: string;
  parsed_status: ParsedStatus;
  parsed_text: string | null;
  parse_error: string | null;
  parsed_at: string | null;
  created_at: string;
  updated_at: string;
}

const BUCKET = "rag_sources";

const NOT_CONFIGURED_MSG =
  "Supabase 未配置：请在 .env.local 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重启 dev server。";

/**
 * 从文件名提取扩展名（小写、无点），缺失时返回 "bin"。
 * 不依赖 mime（mime 可能拿不到，如本地拖拽 .ical）。
 */
function getExt(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx < 0 || idx === filename.length - 1) return "bin";
  return filename.slice(idx + 1).toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
}

/**
 * 列出某用户的所有 rag_source。返回按导入时间倒序。
 * RLS 已限制 user_id = auth.uid()，但 .eq("user_id", userId) 显式写出更清楚。
 */
export async function listRagSources(userId: string): Promise<RagSource[]> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("rag_source")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RagSource[];
}

export interface UploadRagSourceInput {
  userId: string;
  file: File;
  kind: RagSourceKind;
  /** 显式覆盖入库的展示名，缺省用 file.name */
  displayName?: string;
}

/**
 * 上传一个文件：
 *   1) 客户端先 gen id（crypto.randomUUID）
 *   2) 传 Storage 到 `<userId>/<id>.<ext>`
 *   3) 写 rag_source 行（parsed_status='pending'，等后续 AI 解析）
 *   4) 任一步失败：已传 Storage 的对象兜底清理（best-effort）
 *
 * 关键约束：路径首段必须是 userId，否则 Storage RLS 会拒。
 */
export async function uploadRagSource(
  input: UploadRagSourceInput,
): Promise<RagSource> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);
  const { userId, file, kind, displayName } = input;

  // 1) 预生成行 id（用 crypto.randomUUID；浏览器全平台支持）
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : // 兜底：极旧浏览器/SSR 拿不到 crypto.randomUUID 时，退化到 36 进制随机
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  const ext = getExt(file.name);
  const storagePath = `${userId}/${id}.${ext}`;

  // 2) 传 Storage
  const upload = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (upload.error) {
    throw new Error(`上传文件失败：${upload.error.message}`);
  }

  // 3) 写 rag_source 行
  const row = {
    id,
    user_id: userId,
    name: displayName?.trim() || file.name,
    kind,
    mime: file.type || null,
    size_bytes: Number.isFinite(file.size) ? file.size : null,
    storage_path: storagePath,
    parsed_status: "pending" as ParsedStatus,
  };

  const { data, error } = await supabase
    .from("rag_source")
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    // 4) 兜底：行写失败 → 清理已传 Storage 对象，避免孤儿文件
    void supabase.storage
      .from(BUCKET)
      .remove([storagePath])
      .catch(() => {
        /* 兜底清理失败就吞掉；不要遮盖原始错误 */
      });
    throw new Error(`保存导入记录失败：${error?.message ?? "未知错误"}`);
  }

  return data as RagSource;
}

/**
 * 删除：先删 Storage 对象，再删表行。
 *  - Storage 删失败仍继续删表（让用户看不见孤儿；下次清理脚本兜）
 *  - 表删失败直接抛错（调用方决定是否 revert UI）
 */
export async function deleteRagSource(source: RagSource): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MSG);

  const storageRes = await supabase.storage
    .from(BUCKET)
    .remove([source.storage_path]);
  if (storageRes.error && typeof console !== "undefined") {
    console.warn(
      `[ragSourceApi] 删除 Storage 对象失败（继续删表）：${storageRes.error.message}`,
    );
  }

  const { error } = await supabase
    .from("rag_source")
    .delete()
    .eq("id", source.id);
  if (error) throw new Error(`删除导入记录失败：${error.message}`);
}
