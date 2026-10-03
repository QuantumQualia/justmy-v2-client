"use client";

import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

import { InsetFrame } from "@/components/news/home/inset-frame";
import { Button } from "@workspace/ui/components/button";
import type { NewsMarketContext } from "./types";

type AskSkyClaimCtaProps = {
  market: NewsMarketContext;
  href?: string;
  onClaim?: () => void;
};

/**
 * Dark “claim your Dot” CTA band for the AskSKY news market page.
 */
export function AskSkyClaimCta({
  market,
  href = "/?claim=1",
  onClaim,
}: AskSkyClaimCtaProps) {
  const city = market.city || market.marketName;

  const label = (
    <>
      <MapPin className="h-4 w-4" aria-hidden />
      Claim Your Free Dot Hub
      <ArrowRight className="h-4 w-4" aria-hidden />
    </>
  );

  return (
    <InsetFrame className="pb-14">
      <div className="bg-foreground px-6 py-12 text-center text-background sm:px-10 sm:py-16">
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
          <span className="inline-flex items-center rounded-full border border-background/20 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-background/85 sm:text-[11px]">
            1,000 Free Biz OS Packages
          </span>

          <h2 className="mt-6 font-serif text-[1.65rem] leading-snug tracking-tight sm:text-[2.15rem] sm:leading-tight">
            If AI doesn&apos;t know you exist, your storefront is completely dark.
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-background/70 sm:text-base">
            Claim your Dot to enter AskSKY!&apos;s local memory — so when {city} asks, your storefront is the answer.
          </p>

          {onClaim ? (
            <Button type="button" onClick={onClaim} className="mt-8 bg-brand-gradient text-primary-foreground">
              {label}
            </Button>
          ) : (
            <Button asChild className="mt-8 bg-brand-gradient text-primary-foreground">
              <Link href={href}>{label}</Link>
            </Button>
          )}
        </div>
      </div>
    </InsetFrame>
  );
}
