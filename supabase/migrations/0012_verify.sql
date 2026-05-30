-- 0012_verify — 跑完 0012_add_handbook_rag.sql 后逐段验证（Supabase Dashboard SQL）
-- 每段单独跑，对照「期望」。

-- § 1  vector 扩展已启用 → 期望 1 行
select extname from pg_extension where extname = 'vector';

-- § 2  rag_chunk 表 + 列存在 → 期望含 embedding(USER-DEFINED/vector)
select column_name, data_type, udt_name
from information_schema.columns
where table_schema = 'public' and table_name = 'rag_chunk'
order by ordinal_position;

-- § 3  RLS 开启 + 读策略存在 → relrowsecurity = t；rag_chunk_read_authed 一行
select relrowsecurity from pg_class where relname = 'rag_chunk';
select policyname from pg_policies where tablename = 'rag_chunk';

-- § 4  match RPC 存在且 SECURITY DEFINER → prosecdef = t
select proname, prosecdef
from pg_proc where proname = 'match_handbook_chunks';

-- § 5  灌库后（跑完 0012_seed_handbook_chunks.sql）统计 → 期望每本手册若干 chunk
select source_key, count(*) as chunks, min(chunk_index), max(chunk_index)
from public.rag_chunk
group by source_key
order by source_key;

-- § 6  端到端 smoke：随便拿一行的 embedding 当 query，应能召回它自己 similarity≈1
--      （灌库后再跑；空表会返 0 行）
select source_key, heading, round(similarity::numeric, 4) as sim
from public.match_handbook_chunks(
    (select embedding from public.rag_chunk limit 1),
    5
);
