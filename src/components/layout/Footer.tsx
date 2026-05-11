import logoWhite from "@/assets/logos/logo白.png";

/**
 * Site footer — two-column layout: brand + tagline + lede on the left,
 * audience on the right. Bottom rail keeps the copyright on its own line.
 *
 * Black backdrop so it visually fuses with the FinalCTA above.
 */
export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 px-6 py-14">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
          {/* LEFT — brand + tagline + lede */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <img
                src={logoWhite}
                alt="Meridian"
                draggable={false}
                className="w-7 h-7 object-contain"
              />
              <span className="text-base font-semibold text-white">
                Meridian
              </span>
            </div>
            <p className="text-base font-medium text-white mb-2">
              See the rules earlier.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              很多规则，只是从来没人把它们连接起来。
            </p>
          </div>

          {/* RIGHT — who it's for */}
          <div className="md:text-right md:pt-12">
            <p className="text-sm text-gray-300">Built for students.</p>
          </div>
        </div>

        {/* Bottom rail */}
        <div className="mt-14 pt-6 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center md:text-left">
            © 2026 Meridian · Academic Decision Engine
          </p>
        </div>
      </div>
    </footer>
  );
}
