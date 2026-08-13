"use client";

import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

import type { NewsMarketContext } from "./types";

type AskSkyClaimCtaProps = {
  market: NewsMarketContext;
  href?: string;
};

/**
 * Dark “claim your Dot” CTA band for the AskSKY news market page.
 */
export function AskSkyClaimCta({
  market,
  href = "/#",
}: AskSkyClaimCtaProps) {
  const city = market.city || market.marketName;

  return (
    <section className="mx-auto w-full max-w-5xl px-3 pb-10 sm:px-6 sm:pb-14 lg:max-w-6xl">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#0c0c10] px-6 py-12 text-center shadow-[0_28px_60px_-28px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:px-10 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-teal-500/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 top-0 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_40%,transparent_40%,rgba(0,0,0,0.35)_100%)]"
        />

        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85 sm:text-[11px]">
            1,000 Free Biz OS Packages
          </span>

          <h2 className="mt-6 font-serif text-[1.65rem] leading-snug tracking-tight text-white sm:text-[2.15rem] sm:leading-tight">
            If AI doesn&apos;t know you exist, your storefront is completely
            dark.
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
            Claim your Dot to enter AskSKY!&apos;s local memory — so when{" "}
            {city} asks, your storefront is the answer.
          </p>

          <Link
            href={href}
            className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-linear-to-r from-violet-600 to-cyan-400 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:brightness-110 sm:px-7 sm:text-base"
          >
            <span className="relative inline-flex h-5 w-5 items-center justify-center">
              <MapPin className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              <span
                aria-hidden
                className="absolute bottom-[3px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white"
              />
            </span>
            Claim Your Free Dot Hub
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
