"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to detect if the current viewport is mobile
 * @param breakpoint - The breakpoint in pixels to consider as mobile (default: 768px for md breakpoint)
 * @returns boolean - true if viewport width is less than breakpoint
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Check on mount
    checkMobile();

    // Listen for resize events
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);

  return isMobile;
}
