import { useEffect } from 'react';

export const useResizeText = (ref: { current: HTMLElement | null }, dependencies: any[]) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const resize = () => {
      // Allow it to grow back to max size to recalculate
      let size = 30; // text-3xl roughly
      el.style.fontSize = `${size}px`;
      
      // If it overflows vertically, shrink it down iteratively
      while (el.scrollHeight > el.clientHeight && size > 14) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };
    
    // Resize immediately when dependencies change
    resize();
    
    // Also handle viewport/container resizes
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, dependencies);
};
