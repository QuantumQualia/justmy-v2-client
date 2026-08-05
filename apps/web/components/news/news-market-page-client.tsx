"use client";

import { MapPin } from "lucide-react";

import { NewsHomeLink } from "@/components/news/news-home-link";
import { isValidUsZip, marketSlugToTitle } from "@/lib/news/market-routing";

/**
 * Fallback UI for `/news/{marketSlug}` and `/news/{zipcode}`.
 * Both show Coming Soon until public Daily Drop content is available.
 */
export function NewsMarketPageClient({ marketSlug }: { marketSlug: string }) {
  const isZipcode = isValidUsZip(marketSlug);
  const title = isZipcode
    ? `Local news for ${marketSlug}`
    : `${marketSlugToTitle(marketSlug)} Daily Drop`;
  const description = isZipcode
    ? "We don't have a dedicated market for this zip code yet. Check back soon — your local Daily Drop is on the way."
    : `The ${marketSlugToTitle(marketSlug)} market page is not live yet. Check back soon — your local Daily Drop is on the way.`;

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8 text-center sm:py-16">
      <p className="text-xs uppercase tracking-wider text-white/40">
        <NewsHomeLink className="hover:text-white/70">News</NewsHomeLink>
        <span className="mx-2">/</span>
        <span>{marketSlug}</span>
      </p>

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <MapPin className="h-6 w-6 text-emerald-400" aria-hidden />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
          Coming soon
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-white/60">
          {description}
        </p>
      </div>

      <NewsHomeLink className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/10">
        Try another zip code
      </NewsHomeLink>
    </div>
  );
}
