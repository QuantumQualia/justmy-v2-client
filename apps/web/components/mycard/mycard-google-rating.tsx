import { Star } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

export function googleWriteReviewUrl(placeId?: string | null): string | null {
  const id = placeId?.trim();
  if (!id) return null;
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(id)}`;
}

export function MycardGoogleRating({
  rating,
  count,
  placeId,
  variant = "dark",
  className,
}: {
  rating?: string | number | null;
  count?: number | null;
  placeId?: string | null;
  variant?: "dark" | "light";
  className?: string;
}) {
  const value = rating == null || rating === "" ? Number.NaN : Number(rating);
  if (!Number.isFinite(value) || value <= 0) return null;
  const filled = Math.round(Math.min(5, Math.max(0, value)));
  const reviews = count && count > 0 ? count : null;
  const href = googleWriteReviewUrl(placeId);
  const isLight = variant === "light";

  return (
    <div
      className={cn("flex flex-wrap items-center justify-center gap-x-2 gap-y-1", className)}
      aria-label={`Google rating ${value.toFixed(1)}${reviews ? ` from ${reviews} reviews` : ""}`}
    >
      <span
        className={cn(
          "text-xs font-semibold",
          isLight ? "text-foreground" : "text-amber-200",
        )}
      >
        {value.toFixed(1)}
      </span>
      <div className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i < filled
                ? "fill-amber-400 text-amber-400"
                : isLight
                  ? "text-border"
                  : "text-slate-600",
            )}
          />
        ))}
      </div>
      {reviews != null ? (
        <span
          className={cn(
            "text-[11px]",
            isLight ? "text-muted-foreground" : "text-slate-400",
          )}
        >
          ({reviews.toLocaleString()})
        </span>
      ) : null}
      {href ? (
        <>
          <span
            className={cn("text-[11px]", isLight ? "text-muted-foreground" : "text-slate-500")}
            aria-hidden
          >
            ·
          </span>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
              isLight
                ? "border border-border bg-[var(--hotlink-bg)] text-foreground hover:border-primary/40"
                : "border border-white/70 bg-white text-slate-900 hover:bg-white/90",
            )}
          >
            Write a review
          </a>
        </>
      ) : null}
    </div>
  );
}
