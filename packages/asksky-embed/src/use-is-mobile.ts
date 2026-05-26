import { useState, useLayoutEffect } from "react";

/** Viewport mobile check aligned to Tailwind `md` (default &lt; 768px). */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const query = `(max-width: ${breakpoint - 1}px)`;
    const mq = window.matchMedia(query);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [breakpoint]);

  return isMobile;
}
