import type { ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

/** Page-gutter frame shared by the community reel and the Dot Hub CTA. */
export function InsetFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-3 pb-8 sm:px-6 sm:pb-12", className)}>
      <div className="overflow-hidden justmy-corners-xl shadow-card">{children}</div>
    </div>
  );
}
