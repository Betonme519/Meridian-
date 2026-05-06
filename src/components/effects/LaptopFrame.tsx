import type { ReactNode } from "react";
import "./LaptopFrame.css";

interface LaptopFrameProps {
  children?: ReactNode;
}

export default function LaptopFrame({ children }: LaptopFrameProps) {
  return (
    <div className="laptop-mockup">
      <div className="laptop-lid">
        <div className="laptop-camera" />
        <div className="laptop-screen">{children}</div>
      </div>
      <div className="laptop-hinge" />
      <div className="laptop-base">
        <div className="laptop-base-notch" />
      </div>
    </div>
  );
}
