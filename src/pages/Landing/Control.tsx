import { useState } from "react";

/** "风险与控制权" — split layout, headline left + 3 numbered cards right. */
export default function Control() {
  const items = [
    {
      title: "可以质疑任何推荐",
      desc: "每条推理都附带原始规则与数据，你可以反驳。",
    },
    {
      title: "数据由用户控制",
      desc: "上传内容仅在本地解析，可一键导出或删除。",
    },
    {
      title: "最终决策由用户决定",
      desc: "系统不替你选课，只让你看清取舍。",
    },
  ];
  return (
    <section className="px-6 pt-12 pb-48 max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mb-4">
            风险与控制权
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            如果系统错了，
            <br />
            你仍然掌控一切
          </h2>
        </div>
        <div className="space-y-4">
          {items.map((it, i) => (
            <ControlCard key={it.title} idx={i} title={it.title} desc={it.desc} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Module-level component — defined OUTSIDE Control so its function reference
 * is stable across re-renders. Otherwise React would tear it down on every
 * hover and the CSS transitions wouldn't have a "from" state to interpolate.
 *
 * Hover uses layered inline transitions (transform / border / shadow with
 * stagger delays) for a slow "lighting up" feel — same recipe as the
 * Transparency pillars.
 */
function ControlCard({
  idx,
  title,
  desc,
}: {
  idx: number;
  title: string;
  desc: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex gap-4 p-5 rounded-2xl border bg-white cursor-default"
      style={{
        borderColor: hovered ? "#111827" : "#e5e7eb",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 22px 50px rgba(15,23,42,0.10)"
          : "0 1px 2px rgba(15,23,42,0.03)",
        transition: [
          "transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)",
          "border-color 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.06s",
          "box-shadow 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
        ].join(", "),
      }}
    >
      <div
        className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold flex-shrink-0"
        style={{
          transform: hovered ? "scale(1.08)" : "scale(1)",
          transition: "transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
        }}
      >
        {idx + 1}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
