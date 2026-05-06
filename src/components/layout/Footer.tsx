/**
 * Site footer — brand mark + copyright. Kept minimal so any page can drop
 * it in.
 */
export default function Footer() {
  return (
    <footer className="border-t border-gray-100 px-6 py-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">M</span>
          </div>
          <span className="font-medium text-gray-700">Meridian</span>
        </div>
        <p>© 2026 Meridian · Academic Decision Engine</p>
      </div>
    </footer>
  );
}
