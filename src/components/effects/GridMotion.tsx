import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './GridMotion.css';

interface GridMotionProps {
  items?: (string | React.ReactNode)[];
  gradientColor?: string;
}

const GridMotion = ({ items = [], gradientColor = 'black' }: GridMotionProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const itemsPerRow = 7;
  const totalItems = itemsPerRow * 4;
  const defaultItems = Array.from({ length: totalItems }, (_, index) => `Item ${index + 1}`);
  const combinedItems = items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  useEffect(() => {
    gsap.ticker.lagSmoothing(0);

    // Each row is rendered with its 7 items duplicated (14 total) and given
    // width: 200%. Animating xPercent across the full 50% range traverses one
    // copy of the duplicated content, so when GSAP repeats from the start the
    // visible items are identical — seamless infinite scroll.
    const durations = [38, 46, 42, 50];
    const tweens: gsap.core.Tween[] = [];

    rowRefs.current.forEach((row, index) => {
      if (!row) return;
      const movesLeft = index % 2 === 0;
      const tween = gsap.fromTo(
        row,
        { xPercent: movesLeft ? 0 : -50 },
        {
          xPercent: movesLeft ? -50 : 0,
          duration: durations[index] ?? 40,
          ease: 'none',
          repeat: -1,
        },
      );
      tweens.push(tween);
    });

    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="noscroll loading" ref={gridRef}>
      <section
        className="intro"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        }}
      >
        <div className="gridMotion-container">
          {[...Array(4)].map((_, rowIndex) => {
            const rowItems = Array.from({ length: itemsPerRow }, (_, i) =>
              combinedItems[rowIndex * itemsPerRow + i],
            );
            // Duplicate items for the seamless infinite-scroll trick.
            const duplicated = [...rowItems, ...rowItems];

            return (
              <div
                key={rowIndex}
                className="row"
                ref={(el) => {
                  rowRefs.current[rowIndex] = el;
                }}
              >
                {duplicated.map((content, itemIndex) => (
                  <div key={itemIndex} className="row__item">
                    <div className="row__item-inner" style={{ backgroundColor: '#111' }}>
                      {typeof content === 'string' &&
                      (content.startsWith('http') || content.startsWith('/')) ? (
                        <div
                          className="row__item-img"
                          style={{ backgroundImage: `url("${encodeURI(content)}")` }}
                        />
                      ) : (
                        <div className="row__item-content">{content}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="fullview" />
      </section>
    </div>
  );
};

export default GridMotion;
