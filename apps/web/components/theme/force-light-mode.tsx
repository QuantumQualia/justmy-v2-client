"use client";

import type { ReactNode } from "react";

/**
 * Layout shell for product routes. Color comes from the shared tokens so
 * light and dark both apply. The name is kept so existing layouts stay stable.
 */
export function ForceLightMode({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      {children}
    </div>
  );
}
