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
    <section className="px-6 py-24 max-w-6xl mx-auto">
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
            <div
              key={it.title}
              className="flex gap-4 p-5 rounded-xl border border-gray-200 hover:border-black transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold mb-1">{it.title}</h3>
                <p className="text-sm text-gray-600">{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
