import React, { useRef, useState, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const SlideContainer: React.FC<Props> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;

    const updateDimensions = () => {
      const pWidth = el.clientWidth;
      const pHeight = el.clientHeight;
      if (pWidth <= 0 || pHeight <= 0) return;

      const targetRatio = 16 / 9;
      let w = pWidth;
      let h = w / targetRatio;

      if (h > pHeight) {
        h = pHeight;
        w = h * targetRatio;
      }

      setDimensions({ width: Math.floor(w), height: Math.floor(h) });
    };

    updateDimensions();

    const ro = new ResizeObserver(updateDimensions);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center min-h-0 min-w-0 overflow-hidden">
      <div
        style={dimensions ? { width: `${dimensions.width}px`, height: `${dimensions.height}px` } : { width: '100%', height: '100%', aspectRatio: '16/9' }}
        className={`flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200/90 text-left text-gray-900 p-8 gap-6 shrink-0 transition-all ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
