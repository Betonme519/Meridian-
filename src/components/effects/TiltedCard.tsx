import { useRef, type CSSProperties, type ReactNode, type MouseEvent } from "react";
import "./TiltedCard.css";

/**
 * 3D tilt-on-hover wrapper, ported from React Bits to plain React + CSS
 * (no `motion` dependency — uses CSS transitions for the rest-state spring,
 * and direct transform writes during mouse tracking for zero-lag follow).
 *
 * Wraps arbitrary children — unlike the original which is image-only,
 * this version is content-agnostic so we can tilt any composed card.
 */
type Props = {
  children: ReactNode;
  /** Max degrees of tilt at the corners. Lower = subtler. */
  rotateAmplitude?: number;
  /** CSS scale applied while hovering. */
  scaleOnHover?: number;
  /** CSS perspective on the figure (lower = more dramatic). */
  perspective?: number;
  className?: string;
  style?: CSSProperties;
};

export default function TiltedCard({
  children,
  rotateAmplitude = 8,
  scaleOnHover = 1.02,
  perspective = 1000,
  className = "",
  style,
}: Props) {
  const figRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const fig = figRef.current;
    const inner = innerRef.current;
    if (!fig || !inner) return;
    const rect = fig.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    const rotX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotY = (offsetX / (rect.width / 2)) * rotateAmplitude;
    inner.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scaleOnHover})`;
    inner.style.setProperty("--shine-x", `${e.clientX - rect.left}px`);
    inner.style.setProperty("--shine-y", `${e.clientY - rect.top}px`);
  };

  const handleEnter = () => {
    const inner = innerRef.current;
    if (!inner) return;
    // tight transition during tracking — keeps small jitters silky without lag
    inner.style.transition = "transform 90ms ease-out";
  };

  const handleLeave = () => {
    const inner = innerRef.current;
    if (!inner) return;
    // long settle on exit — mimics motion spring without the dep
    inner.style.transition =
      "transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1)";
    inner.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return (
    <div
      ref={figRef}
      className={`tilted-card-figure ${className}`}
      style={{ perspective: `${perspective}px`, ...style }}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div ref={innerRef} className="tilted-card-inner">
        {children}
      </div>
    </div>
  );
}
