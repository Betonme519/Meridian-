import type { ReactNode } from "react";
import "./EmbeddedLaptop.css";

interface EmbeddedLaptopProps {
  children?: ReactNode;
}

const KEY_ROWS = 5;
const KEYS_PER_ROW = 14;

/**
 * 3D-ish laptop frame:
 *  - lid-back / lid edges / lid front: build the lid as a box with thickness
 *  - bezel + screen: the visible front of the lid
 *  - base + keyboard (real per-key divs) + trackpad
 */
export default function EmbeddedLaptop({ children }: EmbeddedLaptopProps) {
  return (
    <div className="embedded-laptop">
      <div className="embedded-laptop-lid-back" />
      <div className="embedded-laptop-edge embedded-laptop-edge-top" />
      <div className="embedded-laptop-edge embedded-laptop-edge-right" />
      <div className="embedded-laptop-edge embedded-laptop-edge-bottom" />
      <div className="embedded-laptop-edge embedded-laptop-edge-left" />
      <div className="embedded-laptop-bezel">
        <div className="embedded-laptop-screen">{children}</div>
      </div>
      <div className="embedded-laptop-base-3d">
        <div className="embedded-laptop-base-bottom" />
        <div className="embedded-laptop-base-front" />
        <div className="embedded-laptop-keyboard">
          {Array.from({ length: KEY_ROWS }).map((_, row) => (
            <div key={row} className="embedded-laptop-keyboard-row">
              {Array.from({ length: KEYS_PER_ROW }).map((_, col) => (
                <div key={col} className="embedded-laptop-key" />
              ))}
            </div>
          ))}
        </div>
        <div className="embedded-laptop-trackpad" />
      </div>
    </div>
  );
}
