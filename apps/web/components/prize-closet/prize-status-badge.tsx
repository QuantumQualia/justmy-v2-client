import { cn } from "@workspace/ui/lib/utils";

import type { PrizeStatus } from "@/lib/services/prize-closet";

const STATUS: Record<PrizeStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending Review", className: "bg-accent text-accent-foreground" },
  CHANGES: { label: "Needs Changes", className: "bg-destructive/10 text-destructive" },
  APPROVED: { label: "Approved · Upcoming", className: "bg-secondary text-secondary-foreground" },
  LIVE: { label: "Live Now", className: "bg-success/15 text-success" },
  COMPLETED: { label: "Completed", className: "bg-muted text-muted-foreground" },
  DECLINED: { label: "Declined", className: "bg-destructive/10 text-destructive" },
};

export function PrizeStatusBadge({ status }: { status: PrizeStatus }) {
  const { label, className } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}
