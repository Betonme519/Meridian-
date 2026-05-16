# AI Project Rules

Before starting any task:

1. Read:
- docs/PROJECT_OVERVIEW.md
- docs/DESIGN_SYSTEM.md
- docs/CURRENT_TASK.md

2. Follow architecture rules in:
- docs/ARCHITECTURE.md

3. Use existing components whenever possible.

4. Do not refactor unrelated files.

5. Maintain:
- low saturation
- Apple-like UI
- clean academic aesthetic

6. Mobile responsive required.

7. Avoid modifying:
- auth
- backend
- routing
unless explicitly requested.

8. 数据源文件分流（按需读取，不要主动 Grep / 扫描）：
- `docs/华师大公示文件/*` — ECNU 教务规则源文件（PDF / md，34+ 份），AI 读取的源头
- `docs/ecnu-digests/ecnu_rules_digest_{A,B,C,D}.md` — AI 总结后的 4 份 digest（99 条 track_requirement 候选 + 过程类规则）
- `docs/track_kind_taxonomy.md` — D-track-8 归并方案（98 → 8 canonical kind）
- `docs/ecnu_process_rules.md` — 过程类规则精炼版（将来由阶段 4 生成）
- 这些文件**只在「排队 10 / 排队 13」任务**（毕业路径 seed SQL、AI prompt 落地）时读
- 其他任务（UI / Schedule 修复 / TD 处理 / 后端接通）**不要 Grep 或 Read 这些目录**，避免浪费 context
