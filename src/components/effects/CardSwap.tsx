import {
  Children,
  cloneElement,
  createRef,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type {
  CSSProperties,
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";
import gsap from "gsap";
import "./CardSwap.css";

/**
 * CardSwap — vertical-skew stack of cards that swap with a GSAP timeline.
 *
 * Behavior:
 *  - Auto-loops on a fixed `delay` interval (front card drops out, others
 *    promote, dropped card returns to back).
 *  - Clicking any card brings it to the front via a short reorder
 *    animation; the auto-loop interval restarts after the click animation
 *    completes (no double-trigger, no stuck timelines).
 *  - `pauseOnHover` is supported but defaults to false so the loop runs
 *    continuously without the laggy "click-tries-to-fight-pause" feel.
 */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ customClass, className, ...rest }, ref) => (
    <div
      ref={ref}
      {...rest}
      className={`card ${customClass ?? ""} ${className ?? ""}`.trim()}
    />
  ),
);
Card.displayName = "Card";

interface Slot {
  x: number;
  y: number;
  z: number;
  zIndex: number;
}

const makeSlot = (
  i: number,
  distX: number,
  distY: number,
  total: number,
): Slot => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const placeNow = (el: HTMLDivElement | null, slot: Slot, skew: number) => {
  if (!el) return;
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    force3D: true,
  });
};

interface SwapConfig {
  ease: string;
  durDrop: number;
  durMove: number;
  durReturn: number;
  promoteOverlap: number;
  returnDelay: number;
}

export interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (idx: number) => void;
  skewAmount?: number;
  easing?: "linear" | "elastic";
  children: ReactNode;
}

const CardSwap = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = "elastic",
  children,
}: CardSwapProps) => {
  const config: SwapConfig =
    easing === "elastic"
      ? {
          ease: "elastic.out(0.6,0.9)",
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05,
        }
      : {
          ease: "power1.inOut",
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2,
        };

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo<RefObject<HTMLDivElement | null>[]>(
    () => childArr.map(() => createRef<HTMLDivElement>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length],
  );

  const order = useRef<number[]>(
    Array.from({ length: childArr.length }, (_, i) => i),
  );

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );
  const container = useRef<HTMLDivElement>(null);

  // Latest swap-to-front handler; the click closure reads via this ref so
  // we don't have to re-bind on every child render.
  const goToFrontRef = useRef<((targetIdx: number) => void) | null>(null);

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) =>
      placeNow(
        r.current,
        makeSlot(i, cardDistance, verticalDistance, total),
        skewAmount,
      ),
    );

    const swap = () => {
      if (order.current.length < 2) return;

      const [front, ...rest] = order.current;
      const elFront = refs[front].current;
      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.to(elFront, {
        y: "+=500",
        duration: config.durDrop,
        ease: config.ease,
      });

      tl.addLabel("promote", `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el = refs[idx].current;
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, "promote");
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease,
          },
          `promote+=${i * 0.15}`,
        );
      });

      const backSlot = makeSlot(
        refs.length - 1,
        cardDistance,
        verticalDistance,
        refs.length,
      );
      tl.addLabel(
        "return",
        `promote+=${config.durMove * config.returnDelay}`,
      );
      tl.call(
        () => {
          if (elFront) gsap.set(elFront, { zIndex: backSlot.zIndex });
        },
        undefined,
        "return",
      );
      tl.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease,
        },
        "return",
      );

      tl.call(() => {
        order.current = [...rest, front];
      });
    };

    const startInterval = () => {
      if (intervalRef.current !== undefined) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(swap, delay);
    };

    const stopInterval = () => {
      tlRef.current?.pause();
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };

    // Bring an arbitrary card to front via a single short tween for every
    // card, snapping the order array. Kills any in-flight swap to avoid
    // collisions with the auto-loop.
    goToFrontRef.current = (targetIdx: number) => {
      const pos = order.current.indexOf(targetIdx);
      if (pos <= 0) return; // already front (or not found)

      // Rotate so the clicked card is first.
      const newOrder = [
        ...order.current.slice(pos),
        ...order.current.slice(0, pos),
      ];

      tlRef.current?.kill();
      if (intervalRef.current !== undefined) clearInterval(intervalRef.current);

      const tl = gsap.timeline({
        onComplete: () => {
          // Resume the auto-loop only after the click animation settles.
          startInterval();
        },
      });
      tlRef.current = tl;

      newOrder.forEach((idx, i) => {
        const el = refs[idx].current;
        if (!el) return;
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, 0);
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: 0.55,
            ease: "power2.out",
          },
          0,
        );
      });

      order.current = newOrder;
    };

    swap();
    startInterval();

    const cleanups: Array<() => void> = [];
    const node = container.current;

    // Pause the loop when the stack scrolls out of view; resume when it
    // comes back. Without this the GSAP timeline keeps ticking and the
    // dropped card slides into the next section as the user scrolls past.
    if (node && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          if (entry.isIntersecting) {
            tlRef.current?.play();
            startInterval();
          } else {
            stopInterval();
          }
        },
        { threshold: 0 },
      );
      io.observe(node);
      cleanups.push(() => io.disconnect());
    }

    if (pauseOnHover && node) {
      const pause = () => stopInterval();
      const resume = () => {
        tlRef.current?.play();
        startInterval();
      };
      node.addEventListener("mouseenter", pause);
      node.addEventListener("mouseleave", resume);
      cleanups.push(() => {
        node.removeEventListener("mouseenter", pause);
        node.removeEventListener("mouseleave", resume);
      });
    }

    return () => {
      cleanups.forEach((fn) => fn());
      if (intervalRef.current !== undefined) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing]);

  const rendered = childArr.map((child, i) => {
    if (!isValidElement(child)) return child;
    const childEl = child as ReactElement<{
      style?: CSSProperties;
      onClick?: (e: MouseEvent) => void;
    }>;
    return cloneElement(childEl, {
      key: i,
      ref: refs[i],
      style: { width, height, ...(childEl.props.style ?? {}) },
      onClick: (e: MouseEvent) => {
        childEl.props.onClick?.(e);
        onCardClick?.(i);
        // Bring the clicked card to the front.
        goToFrontRef.current?.(i);
      },
    } as Partial<HTMLAttributes<HTMLDivElement>> & { ref: RefObject<HTMLDivElement | null> });
  });

  return (
    <div
      ref={container}
      className="card-swap-container"
      style={{ width, height }}
    >
      {rendered}
    </div>
  );
};

export default CardSwap;
