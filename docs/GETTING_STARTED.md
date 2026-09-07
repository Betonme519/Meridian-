# 快速开始

## 1. 安装与界面预览

使用 Node.js 20.19+ 或 22.12+，在仓库根目录运行：

```bash
npm ci
npm run dev
```

打开终端报告的本地地址。项目也包含 Bun 锁文件，可使用 `bun install` 与 `bun dev`；团队协作时请保持锁文件和包管理器选择一致。

未配置 Supabase 时，程序采用容错初始化；可以查看界面，但数据操作不会因此获得可用后端。默认 `VITE_AI_PROVIDER=mock` 提供模拟流式内容，不能用来验证真实回答质量。

## 2. 连接自己的 Supabase

复制 `.env.example` 为 `.env.local`，使用自己的项目值：

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
VITE_AI_PROVIDER=mock
```

`VITE_*` 会进入客户端构建，只能放公开配置。不要填写 service-role、模型密钥或数据库密码。可选的 `VITE_SUPABASE_RAG_BUCKET` 用于指定文件存储 bucket，默认名称为 `rag_sources`。

在自己的 Supabase 实例中，根据 `supabase/migrations/` 的编号与依赖顺序初始化结构及需要的种子数据。同编号的建表文件应先于对应 seed 执行；`*_verify.sql` 是校验文件，`_template.sql` 不是需要执行的业务迁移。运行前检查每份 SQL 的说明，勿将整目录无差别执行到已有生产数据库。

数据库还需具备对应 RLS 和 Storage 权限。仅填写 URL 与公开 key 不等于已完成初始化；缺少学校数据时，路径视图可能为空。

## 3. 启用真实 AI

在 `.env.local` 中将 `VITE_AI_PROVIDER` 设为 `remote`。本地服务端配置写入被 Git 忽略的 `.dev.vars`：

```dotenv
ZHIPU_API_KEY=your-server-only-key
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-publishable-or-anon-key
GLM_MODEL=your-enabled-model-id
```

选择自己的上游账号实际可用的模型。代码当前默认模型为 `glm-5.1`；这不意味着所有账号均可调用。修改配置后重启开发进程。真实 AI 路由要求有效 Supabase 会话，访客模式不会绕过服务端鉴权。

生产密钥通过部署平台的服务端 secret 配置管理，不提交 `.dev.vars`，也不把密钥写进 `wrangler.jsonc` 的公开变量或任何 `VITE_*` 字段。

## 4. 手册检索

RAG 需要 `0012_add_handbook_rag.sql` 定义的表、向量扩展和 RPC，以及部署者有权使用的语料与向量数据。向量 seed 不随 Git 仓库完整分发。

`scripts/genHandbookChunks.ts` 提供语料切分与向量生成入口。执行前阅读脚本要求，核对资料版本、使用权限、模型维度和上游费用。当前服务端使用 1024 维向量；已有库与检索模型必须保持匹配。检索未配置或失败时，AI 对话可能继续，但不会获得相应手册上下文。

## 5. 构建与部署

```bash
npm run build
npm run lint
npm run preview
```

这些是仓库已定义的命令，不代表本次文档更新重新验证了所有构建和运行场景。`npm run format` 会重写文件，贡献前请避免产生无关格式改动。

部署目标为 Cloudflare Workers。自行部署前，检查 `wrangler.jsonc` 中的 Worker 名称与域名绑定，将其调整为自己的资源；现有域名属于项目部署配置，不适用于其他账号直接复用。前端配置应在构建时准备，模型等私密配置由服务端运行环境提供。

## 常见情况

| 现象 | 首先检查 |
| --- | --- |
| 对话始终是模拟回答 | `VITE_AI_PROVIDER` 是否为 `remote`，是否重启或重新构建 |
| AI 返回 401 / 403 | 是否登录、会话是否有效、服务端 Supabase 配置是否一致 |
| AI 返回 429 | 请求频率限制；等待后重试 |
| 上传或个人数据保存失败 | Supabase 配置、表结构、Storage bucket 与 RLS |
| 路径为空 | 培养方案与相关 seed 是否存在，资料选择是否匹配 |
| PDF 无可读文本 | 是否为扫描件；当前不提供 OCR，Word 文档应先转文字 PDF |
| 回答缺少手册依据 | 向量库、检索 RPC、模型维度与语料是否可用 |
