import { Star } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

function placeIdFromLink(reviewLink?: string | null): string | null {
  const link = reviewLink?.trim();
  if (!link) return null;
  try {
    const id = new URL(link).searchParams.get("placeid") || new URL(link).searchParams.get("placeId");
    return id?.trim() || null;
  } catch {
    return null;
  }
}

function resolvedPlaceId(placeId?: string | null, reviewLink?: string | null): string | null {
  return placeId?.trim() || placeIdFromLink(reviewLink);
}

export function googleWriteReviewUrl(placeId?: string | null, reviewLink?: string | null): string | null {
  const id = resolvedPlaceId(placeId, reviewLink);
  if (id) return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(id)}`;
  return reviewLink?.trim() || null;
}

export function googleReviewsPageUrl(placeId?: string | null, reviewLink?: string | null): string | null {
  const id = resolvedPlaceId(placeId, reviewLink);
  if (id) return `https://search.google.com/local/reviews?placeid=${encodeURIComponent(id)}`;
  return reviewLink?.trim() || null;
}

export function MycardGoogleRating({
  rating,
  count,
  placeId,
  reviewLink,
  variant = "dark",
  className,
}: {
  rating?: string | number | null;
  count?: number | null;
  placeId?: string | null;
  reviewLink?: string | null;
  variant?: "dark" | "light";
  className?: string;
}) {
  const value = rating == null || rating === "" ? Number.NaN : Number(rating);
  if (!Number.isFinite(value) || value <= 0) return null;
  const filled = Math.round(Math.min(5, Math.max(0, value)));
  const reviews = count && count > 0 ? count : null;
  const reviewsHref = googleReviewsPageUrl(placeId, reviewLink);
  const writeHref = googleWriteReviewUrl(placeId, reviewLink);
  const isLight = variant === "light";
  const label = `Google rating ${value.toFixed(1)}${reviews ? ` from ${reviews} reviews` : ""}`;

  const score = (
    <>
      <span
        className={cn(
          "text-xs font-semibold",
          isLight ? "text-primary" : "text-amber-200",
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
                  : "text-muted-foreground",
            )}
          />
        ))}
      </div>
      {reviews != null ? (
        <span className="text-[11px] text-muted-foreground">({reviews.toLocaleString()})</span>
      ) : null}
    </>
  );

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-2 gap-y-1", className)}>
      {reviewsHref ? (
        <a
          href={reviewsHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="inline-flex items-center gap-x-2"
        >
          {score}
        </a>
      ) : (
        <div className="inline-flex items-center gap-x-2" aria-label={label}>
          {score}
        </div>
      )}
      {writeHref ? (
        <a
          href={writeHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "text-sm font-medium underline-offset-4 hover:underline",
            isLight ? "text-primary" : "text-primary-foreground",
          )}
        >
          Write a review
        </a>
      ) : null}
    </div>
  );
}
