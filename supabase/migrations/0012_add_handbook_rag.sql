-- ─────────────────────────────────────────────────────────────────────
-- 0012_add_handbook_rag — pgvector + rag_chunk + match RPC（排队 13.8-B）
--
-- 手册 RAG：两本校级共享手册 PDF（public/docs/ecnu-2025-{guide,handbook}.pdf）
-- 向量化后入 rag_chunk，advisor 运行时按用户问题做余弦最近邻检索，引用相关章节。
--
-- 与个人文档（A）的区别：
--   rag_source.parsed_text   个人文档（成绩单 / 培养方案），owner-only，直塞 prompt（A）
--   rag_chunk                公共手册分块向量，**全员共享、非 user-owned**，运行时检索（B）
--
-- 向量化方案：智谱 embedding-3，dimensions=1024（与 GLM-5.1 同一个 ZHIPU_API_KEY）。
-- 数据量级：两本手册几百 chunk → 不建 ANN 索引，精确顺序扫描足够快且更准；
--           未来手册暴涨再加 ivfflat / hnsw。
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================
-- UP — apply this migration
-- ============================================================

-- § 0  pgvector 扩展（Supabase 自带，未启用则启用）
CREATE EXTENSION IF NOT EXISTS vector;

-- § 1  rag_chunk — 手册分块 + 向量。source_key 区分来源手册，(source_key, chunk_index) 唯一
CREATE TABLE IF NOT EXISTS public.rag_chunk (
    id           uuid primary key default gen_random_uuid(),
    -- 来源手册标识：'ecnu-2025-guide' / 'ecnu-2025-handbook'
    source_key   text not null,
    -- 章节 / 标题（检索回引时给用户看「出处」，可空）
    heading      text,
    -- 该手册内的块序号，幂等 upsert 用
    chunk_index  int not null,
    content      text not null,
    -- embedding-3 dimensions=1024
    embedding    vector(1024) not null,
    created_at   timestamptz not null default now(),
    unique (source_key, chunk_index)
);

-- § 2  索引：按来源手册过滤（轻量 btree；向量列不建 ANN，数据量小走精确扫描）
CREATE INDEX IF NOT EXISTS idx_rag_chunk_source ON public.rag_chunk(source_key);

-- § 3  RLS：手册是公共参考资料 → 任何登录用户可读；
--      写入只走离线脚本生成的 SQL（Dashboard / service 跑，绕 RLS），无前端写入面
ALTER TABLE public.rag_chunk ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rag_chunk_read_authed ON public.rag_chunk;
CREATE POLICY rag_chunk_read_authed ON public.rag_chunk
    FOR SELECT USING (auth.role() = 'authenticated');

-- § 4  match RPC — 余弦最近邻 top-K。
--      SECURITY DEFINER：Worker 用 anon / authed 客户端都能查，不依赖调用方 RLS 上下文
--      （只读公共手册，安全）。match_count 夹在 [1,20] 防滥用。
CREATE OR REPLACE FUNCTION public.match_handbook_chunks(
    query_embedding vector(1024),
    match_count int default 5
)
RETURNS TABLE (
    id uuid,
    source_key text,
    heading text,
    content text,
    similarity float
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT
        c.id, c.source_key, c.heading, c.content,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM public.rag_chunk c
    ORDER BY c.embedding <=> query_embedding
    LIMIT greatest(1, least(match_count, 20))
$$;

GRANT EXECUTE ON FUNCTION public.match_handbook_chunks(vector, int) TO anon, authenticated;

-- ============================================================
-- DOWN  (manual, DO NOT EXEC)
-- ============================================================
--
-- DROP FUNCTION IF EXISTS public.match_handbook_chunks(vector, int);
-- DROP POLICY   IF EXISTS rag_chunk_read_authed ON public.rag_chunk;
-- DROP INDEX    IF EXISTS public.idx_rag_chunk_source;
-- DROP TABLE    IF EXISTS public.rag_chunk;
-- -- vector 扩展保留（其它表可能用），如确定不用：DROP EXTENSION IF EXISTS vector;
