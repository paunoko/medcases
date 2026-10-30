import React, { useRef, useState, useEffect } from 'react';

export const CANONICAL_WIDTH = 1920;
export const CANONICAL_HEIGHT = 1080;

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const SlideContainer: React.FC<Props> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleState, setScaleState] = useState<{ scale: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;

    const updateScale = () => {
      const pWidth = el.clientWidth;
      const pHeight = el.clientHeight;
      if (pWidth <= 0 || pHeight <= 0) return;

      const scale = Math.min(pWidth / CANONICAL_WIDTH, pHeight / CANONICAL_HEIGHT);
      const width = Math.floor(CANONICAL_WIDTH * scale);
      const height = Math.floor(CANONICAL_HEIGHT * scale);

      setScaleState({ scale, width, height });
    };

    updateScale();

    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center min-h-0 min-w-0 overflow-hidden"
    >
      {scaleState ? (
        <div
          style={{
            width: `${scaleState.width}px`,
            height: `${scaleState.height}px`,
          }}
          className="relative shrink-0 overflow-hidden rounded-2xl shadow-2xl border border-gray-200/90"
        >
          <div
            style={{
              width: `${CANONICAL_WIDTH}px`,
              height: `${CANONICAL_HEIGHT}px`,
              transform: `scale(${scaleState.scale})`,
              transformOrigin: 'top left',
            }}
            className={`flex flex-col bg-white text-left text-gray-900 p-12 gap-8 shrink-0 ${className}`}
          >
            {children}
          </div>
        </div>
      ) : (
        <div className="w-full h-full aspect-[16/9] opacity-0" />
      )}
    </div>
  );
};
