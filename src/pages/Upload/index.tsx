import { useState } from "react";
import {
  Cloud,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Link2,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Smartphone,
  Upload as UploadIcon,
  type LucideIcon,
} from "lucide-react";

/* ───────────────────────── Section 2 · File import slots ───────────────────────── */

type ImportSlot = {
  title: string;
  desc: string;
  formats: string;
  icon: LucideIcon;
};

const fileSlots: ImportSlot[] = [
  {
    title: "培养方案 / 学生手册",
    desc: "AI 自动解析章节、学分结构、替代规则",
    formats: "PDF · Word · Markdown",
    icon: FileText,
  },
  {
    title: "成绩单",
    desc: "教务系统导出，或截图 OCR",
    formats: "PDF · Excel · 图片",
    icon: FileSpreadsheet,
  },
  {
    title: "课表 / 截图",
    desc: "本学期课程 + 时间冲突自动检测",
    formats: "图片 · iCal · CSV",
    icon: ImageIcon,
  },
];

/* ───────────────────────── Section 3 · Connectors ───────────────────────── */

const schoolOptions = [
  "请选择学校",
  "清华大学",
  "北京大学",
  "复旦大学",
  "上海交大",
  "浙江大学",
  "其他（手动配置）",
];

/* ───────────────────────── Section 4 · Mini apps & community ───────────────────────── */

type MiniApp = {
  title: string;
  desc: string;
  status: "已连接" | "可连接";
  icon: LucideIcon;
};

const miniApps: MiniApp[] = [
  { title: "超级课程表",  desc: "课表 + 课评数据同步",       status: "可连接", icon: Smartphone },
  { title: "小红书课评",  desc: "聚合学生真实评价",           status: "可连接", icon: Smartphone },
  { title: "学校论坛",    desc: "本校匿名社区抓取（按学校）",  status: "可连接", icon: Database },
  { title: "自定义 RSS",  desc: "教务公告 / 通知订阅",        status: "可连接", icon: Cloud },
];

/* ───────────────────────── Section 6 · Imported data list ───────────────────────── */

type DataRecord = {
  name: string;
  type: string;
  date: string;
  status: "解析完成" | "待解析" | "失败";
};

const dataRecords: DataRecord[] = [
  { name: "培养方案 v2024.pdf",      type: "培养方案", date: "2026-04-22", status: "解析完成" },
  { name: "transcript_2025fall.pdf",  type: "成绩单",   date: "2026-04-29", status: "解析完成" },
  { name: "课表-2026-spring.png",     type: "课表",     date: "2026-04-30", status: "待解析" },
];

const statusCls: Record<DataRecord["status"], string> = {
  解析完成: "bg-emerald-50 text-emerald-700",
  待解析:   "bg-amber-50 text-amber-800",
  失败:     "bg-rose-50 text-rose-700",
};

/* ───────────────────────── Page ───────────────────────── */

export default function UploadPage() {
  const [school, setSchool] = useState(schoolOptions[0]);
  const [grade, setGrade] = useState("2024");
  const [major, setMajor] = useState("计算机科学与技术");
  const [dragHover, setDragHover] = useState<number | null>(null);

  const connected = school !== schoolOptions[0];

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Hero */}
      <header className="animate-fade-in-up-soft">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
          Import Center
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          把所有数据接入 Meridian
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          文件、教务、社区、个人偏好。所有规则的可信度来源都从这里建立。
        </p>
      </header>

      {/* Section 2 · File slots */}
      <div className="mt-10">
        <div className="flex items-center gap-2">
          <UploadIcon className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">文件导入</h2>
          <span className="ml-auto text-xs text-slate-400">PDF · Excel · 图片</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {fileSlots.map((s, i) => {
            const Icon = s.icon;
            const isHover = dragHover === i;
            return (
              <button
                key={s.title}
                type="button"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragHover(i);
                }}
                onDragLeave={() => setDragHover((curr) => (curr === i ? null : curr))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragHover(null);
                }}
                className={`animate-fade-in-up-soft flex flex-col items-start rounded-2xl border-2 border-dashed p-5 text-left transition-colors ${
                  isHover
                    ? "border-slate-950 bg-slate-50"
                    : "border-slate-300 bg-white hover:border-slate-500"
                }`}
                style={{ animationDelay: `${60 + i * 60}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-700" strokeWidth={1.7} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{s.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{s.desc}</p>
                <p className="mt-3 text-[11px] text-slate-400">{s.formats}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                  拖拽文件到此 / 点击上传
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3 · Connectors */}
      <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold tracking-tight">教务系统连接器</h2>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            授权登录后会按周自动同步成绩、课表、培养方案变更。
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                所在学校
              </span>
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors hover:border-slate-400 focus:border-slate-950 focus:outline-none"
              >
                {schoolOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!connected}
              className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors ${
                connected
                  ? "bg-slate-950 text-white hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-200 text-slate-400"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {connected ? "授权登录" : "先选学校"}
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              当前连接状态
            </p>
            <p className="mt-1.5 text-sm text-slate-800">
              {connected ? `${school} · 等待授权` : "尚未连接任何教务系统"}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              所有 OAuth token 加密保存在你本地，不会上传到服务端。
            </p>
          </div>
        </div>

        {/* Personal settings */}
        <aside
          className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-6"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold tracking-tight">个人设置</h2>
          </div>
          <div className="mt-5 space-y-3">
            <Field label="入学年份">
              <input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-400 focus:border-slate-950 focus:outline-none"
              />
            </Field>
            <Field label="专业">
              <input
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-400 focus:border-slate-950 focus:outline-none"
              />
            </Field>
          </div>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950"
          >
            <Download className="h-3.5 w-3.5" />
            导出我的所有数据
          </button>
        </aside>
      </div>

      {/* Section 4 · Mini apps */}
      <div className="mt-12">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">小程序 / 社区接入</h2>
          <span className="ml-auto text-xs text-slate-400">{miniApps.length} 个数据源</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {miniApps.map((m, i) => {
            const Icon = m.icon;
            return (
              <article
                key={m.title}
                className="animate-fade-in-up-soft rounded-2xl border border-slate-200 bg-white p-5"
                style={{ animationDelay: `${60 + i * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <Icon className="h-5 w-5 text-slate-700" strokeWidth={1.7} />
                  </div>
                  <span
                    className={`ml-auto inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold ${
                      m.status === "已连接"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{m.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{m.desc}</p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-700 transition-colors hover:text-slate-950"
                >
                  连接
                  <ExternalLink className="h-3 w-3" />
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* Section 6 · Imported data list */}
      <div className="mt-12">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold tracking-tight">已导入的数据</h2>
          <span className="ml-auto text-xs text-slate-400 tabular-nums">
            {dataRecords.length} 条记录
          </span>
        </div>
        <div
          className="animate-fade-in-up-soft mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          style={{ animationDelay: "60ms" }}
        >
          <div className="grid grid-cols-[1.4fr_120px_140px_120px_120px] gap-4 border-b border-slate-100 bg-slate-50/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 max-md:hidden">
            <span>文件</span>
            <span>类型</span>
            <span>导入日期</span>
            <span>状态</span>
            <span />
          </div>
          {dataRecords.map((r) => (
            <article
              key={r.name}
              className="grid gap-2 border-b border-slate-100 px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50/60 md:grid-cols-[1.4fr_120px_140px_120px_120px] md:items-center md:gap-4"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{r.name}</p>
                <p className="text-[11px] text-slate-400 md:hidden">
                  {r.type} · {r.date}
                </p>
              </div>
              <span className="text-xs text-slate-700 max-md:hidden">{r.type}</span>
              <span className="text-xs tabular-nums text-slate-500 max-md:hidden">{r.date}</span>
              <span
                className={`inline-flex h-5 w-fit items-center rounded-full px-2 text-[11px] font-semibold ${statusCls[r.status]}`}
              >
                {r.status}
              </span>
              <button
                type="button"
                className="inline-flex h-8 w-fit items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950"
              >
                <RefreshCw className="h-3 w-3" />
                重新导入
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
