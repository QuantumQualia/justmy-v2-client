"use client";

import { useLayoutEffect, type ReactNode } from "react";

const HTML_CLASS = "news-light-html";
const BODY_CLASS = "news-light-body";

/**
 * NewsSTAND / Biz OS / verify-email are light product surfaces.
 * Apply light classes for the lifetime of this tree without calling
 * setTheme (that can loop if the theme setter identity changes).
 */
export function ForceLightMode({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const hadDark = html.classList.contains("dark");
    html.classList.remove("dark");
    html.classList.add(HTML_CLASS);
    body.classList.add(BODY_CLASS);

    return () => {
      html.classList.remove(HTML_CLASS);
      body.classList.remove(BODY_CLASS);
      if (hadDark) html.classList.add("dark");
    };
  }, []);

  return (
    <div className="light min-h-screen bg-[#f7f6fb] text-slate-900" data-theme="light">
      {children}
    </div>
  );
}
