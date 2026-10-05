"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AdBanner } from "@/components/common/ad-banner";
import type { NewsMarketContext } from "@/components/news/asksky/types";
import { StandStoryCard } from "@/components/news/home/whats-on-the-stand";
import { personalizePitch, useNewsVisitor } from "@/components/news/home/use-news-visitor";
import {
  fetchNewsstandSponsor,
  type NewsstandSponsorSpotlight,
} from "@/lib/news/fetch-newsstand";

type SponsorSpotlightProps = {
  market: NewsMarketContext;
  placement: "newsstand" | "prize";
  eyebrow: string;
  /** Prize closet adds a progress line. The prize cost is not in the data, so the line has no number. */
  showPrizeProgress?: boolean;
};

export function SponsorSpotlight({
  market,
  placement,
  eyebrow,
  showPrizeProgress = false,
}: SponsorSpotlightProps) {
  const { signedIn, firstName } = useNewsVisitor();
  const [sponsor, setSponsor] = useState<NewsstandSponsorSpotlight | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    const marketId = market.marketId;
    if (!marketId) {
      setState("empty");
      return;
    }
    let cancelled = false;
    setState("loading");
    fetchNewsstandSponsor(marketId, placement)
      .then((next) => {
        if (cancelled) return;
        setSponsor(next);
        setState(next ? "ready" : "empty");
      })
      .catch(() => {
        if (cancelled) return;
        setSponsor(null);
        setState("empty");
      });
    return () => {
      cancelled = true;
    };
  }, [market.marketId, placement]);

  if (state === "loading") {
    return (
      <section className="mx-auto w-full max-w-6xl px-3 pb-8 sm:px-6">
        <div className="h-48 animate-pulse justmy-corners-xl bg-muted" />
      </section>
    );
  }
  if (state === "empty" || !sponsor) return null;

  const pitch = sponsor.pitch ? personalizePitch(sponsor.pitch, signedIn ? firstName : null) : "";
  const handle = sponsor.handle.replace(/^@/, "");

  return (
    <section className="mx-auto w-full max-w-6xl px-3 pb-10 sm:px-6 sm:pb-14">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}{" "}
        {sponsor.profileUrl ? (
          <Link href={sponsor.profileUrl} className="text-primary hover:underline">
            {sponsor.name}
          </Link>
        ) : (
          <span className="text-primary">{sponsor.name}</span>
        )}
      </p>

      {sponsor.bannerUrl ? (
        <div className="mt-4">
          <AdBanner
            imageSrc={sponsor.bannerUrl}
            imageAlt={sponsor.name}
            imageElement={
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sponsor.bannerUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            }
            bannerLink={sponsor.externalUrl || undefined}
            profileSlug={handle}
            hotlinks={sponsor.hotlinks.map((link) => ({ label: link.label, href: link.url }))}
            openInNewTab
          />
        </div>
      ) : sponsor.hotlinks.length > 0 ? (
        <p className="mt-4 text-center text-sm">
          {sponsor.hotlinks.map((link, index) => (
            <span key={link.url}>
              {index > 0 ? <span className="mx-2 text-border">|</span> : null}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                {link.label}
              </a>
            </span>
          ))}
        </p>
      ) : null}

      {pitch ? (
        <p className="mx-auto mt-4 max-w-3xl text-center text-sm leading-relaxed text-foreground sm:text-base">
          {pitch}
        </p>
      ) : null}
      {showPrizeProgress && signedIn ? (
        <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-muted-foreground">
          {firstName ? `${firstName}, keep` : "Keep"} earning credits toward this month&apos;s prize.
        </p>
      ) : null}

      {sponsor.articles.length >= 3 ? (
        <div className="mt-8">
          <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
            In the News
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {sponsor.articles.slice(0, 3).map((article) => (
              <StandStoryCard
                key={article.id}
                post={{
                  ...article,
                  channel: sponsor.name,
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
