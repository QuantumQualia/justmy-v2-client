import type { ReactNode } from "react";
import { cn } from "@workspace/ui/lib/utils";

export function AdminPage({
  title,
  description,
  actions,
  children,
  className,
  width = "7xl",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  width?: "3xl" | "5xl" | "7xl";
}) {
  const widthClass =
    width === "3xl" ? "max-w-3xl" : width === "5xl" ? "max-w-5xl" : "max-w-7xl";

  return (
    <div className={cn("min-h-full bg-background px-6 py-8 text-foreground md:px-10", className)}>
      <div className={cn("mx-auto space-y-6", widthClass)}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-border bg-card p-6 shadow-card md:p-8", className)}>
      {children}
    </div>
  );
}

export function AdminNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {children}
    </div>
  );
}
