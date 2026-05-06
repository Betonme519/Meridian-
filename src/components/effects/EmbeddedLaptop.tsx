import type { ReactNode } from "react";
import "./EmbeddedLaptop.css";

interface EmbeddedLaptopProps {
  children?: ReactNode;
}

/**
 * 3D-ish laptop frame:
 *  - lid-back / lid edges / lid front: build the lid as a box with thickness
 *  - bezel + screen: the visible front of the lid
 *  - base + keyboard + trackpad: a horizontal panel rotated to lie flat,
 *    revealing the keyboard from above-front angles
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
        <div className="embedded-laptop-keyboard" />
        <div className="embedded-laptop-trackpad" />
      </div>
    </div>
  );
}
