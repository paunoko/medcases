import { useEffect } from 'react';

interface ResizeOptions {
  maxSize?: number;
  minSize?: number;
  step?: number;
}

export const useResizeText = (
  ref: { current: HTMLElement | null },
  dependencies: unknown[],
  options?: ResizeOptions
) => {
  const maxSize = options?.maxSize ?? 36; // 36px default max (generous for lecture halls)
  const minSize = options?.minSize ?? 24; // 24px default floor (never unreadable from back row)
  const step = options?.step ?? 1;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const resize = () => {
      // Start from max size
      let size = maxSize;
      el.style.fontSize = `${size}px`;
      
      // If it overflows vertically, shrink down iteratively, but never below minSize
      while (el.scrollHeight > el.clientHeight && size > minSize) {
        size -= step;
        el.style.fontSize = `${size}px`;
      }
    };
    
    // Resize immediately when dependencies change
    resize();
    
    // Also handle viewport/container resizes
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};
