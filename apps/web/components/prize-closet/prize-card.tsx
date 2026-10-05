import type { ReactNode } from "react";
import { Package } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";

import { ImagePlaceholder } from "@/components/marketing/marketing-ui";

export interface PrizeCardProps {
  business: string;
  title: string;
  blurb: string;
  imageUrl?: string | null;
  imageLabel?: string;
  period: string;
  value: string;
  market: string;
  winners: number;
  redeemNote?: string | null;
  action?: ReactNode;
  stacked?: boolean;
  className?: string;
}

export function PrizeCard({
  business,
  title,
  blurb,
  imageUrl,
  imageLabel,
  period,
  value,
  market,
  winners,
  redeemNote,
  action,
  stacked = false,
  className,
}: PrizeCardProps) {
  return (
    <div
      className={cn(
        "grid items-center gap-8 overflow-hidden justmy-corners-xl border border-border bg-card shadow-card",
        !stacked && "md:grid-cols-2",
        className
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={`Prize from ${business}`} className="aspect-[4/3] h-full w-full object-cover" />
      ) : (
        <ImagePlaceholder
          label="PRIZE PHOTO"
          spec={imageLabel ?? `Uploaded by ${business} · 4:3`}
          className="aspect-[4/3] rounded-none border-0"
        />
      )}
      <div className={cn("px-6 pb-8", !stacked && "md:py-8 md:pl-0 md:pr-10")}>
        <span className="mb-4 inline-block rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold tracking-wide text-primary-foreground">
          Brought to you by {business}
        </span>
        <h3 className="mb-3 font-serif text-2xl font-bold text-foreground md:text-[1.65rem]">{title}</h3>
        <p className="mb-5 text-[0.95rem] leading-relaxed text-muted-foreground">{blurb}</p>
        <div className="mb-5 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
          <PrizeMeta value={period} label="Entry period" />
          <PrizeMeta value={value} label="Approximate value" />
          <PrizeMeta value={market} label="Market" />
          <PrizeMeta value={String(winners)} label={winners === 1 ? "Winner drawn" : "Winners drawn"} />
        </div>
        {redeemNote ? (
          <div className="mb-5 flex gap-2.5 justmy-corners bg-secondary px-4 py-3 text-xs leading-relaxed text-secondary-foreground">
            <Package className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              <b>How you&apos;ll get it:</b> {redeemNote}
            </span>
          </div>
        ) : null}
        {action}
      </div>
    </div>
  );
}

function PrizeMeta({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <b className="block text-[0.95rem] text-foreground">{value}</b>
      {label}
    </div>
  );
}
