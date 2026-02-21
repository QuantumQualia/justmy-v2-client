"use client";

import React from "react";
import Link from "next/link";
import type { LocalDeal } from "./types";

const GLASS_CARD =
  "rounded-xl rounded-br-none border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden";

/** Fixed image height: mobile-friendly base, taller on desktop so all cards match */
const DEAL_IMAGE_H = "h-[140px] md:h-[200px]";
const DEAL_BUTTON_H = "h-9";

export interface LocalDealsHookProps {
  title?: string;
  deals: LocalDeal[];
  /** Full-width CTA below grid */
  browseAllHref?: string;
  browseAllLabel?: string;
  /** Open deal in WebView (in-app browser) when true. For web, we use target="_blank"; native can override. */
  openDealInWebView?: boolean;
  className?: string;
}

const EMPTY_PLACEHOLDER =
  "rounded-xl border border-dashed border-white/20 bg-white/5 py-8 px-4 text-center text-sm text-white/50";

export function LocalDealsHook({
  title = "Deals",
  deals,
  browseAllHref = "/deals",
  browseAllLabel = "Browse All Local Deals",
  openDealInWebView = false,
  className,
}: LocalDealsHookProps) {
  const hasDeals = deals.length > 0;

  return (
    <section className={className}>
      <h2 className="text-lg font-bold text-white mb-3 tracking-tight">
        {title}
      </h2>
      {!hasDeals ? (
        <div className={EMPTY_PLACEHOLDER}>
          No deals available for now. Check back later.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 items-stretch">
          {deals.map((deal) => (
            <FlashDealCard
              key={deal.id}
              deal={deal}
              openInWebView={openDealInWebView}
            />
          ))}
        </div>
      )}
      {hasDeals && (
        <Link
          href={browseAllHref}
          className={`${GLASS_CARD} mt-4 flex items-center justify-center py-4 px-4 text-center font-medium text-white/95 hover:bg-white/[0.08] transition block`}
        >
          {browseAllLabel}
        </Link>
      )}
    </section>
  );
}

function FlashDealCard({
  deal,
  openInWebView,
}: {
  deal: LocalDeal;
  openInWebView: boolean;
}) {
  const discountText =
    deal.discountPercent != null ? `Save ${deal.discountPercent}%` : null;

  return (
    <div
      className={`${GLASS_CARD} flex flex-col h-full ${deal.isPartnerDeal ? "ring-2 ring-amber-400/60" : ""}`}
    >
      {/* Fixed-height image: same size on every card */}
      <div
        className={`relative w-full ${DEAL_IMAGE_H} shrink-0 bg-slate-800`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deal.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 left-2">
          <span className="rounded-full bg-black/50 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-white/95 uppercase tracking-wide">
            {deal.category}
          </span>
        </div>
      </div>
      {/* Content: flex-1 so View Deal stays at bottom */}
      <div className="p-3 flex flex-col flex-1 min-h-0">
        {deal.merchant && (
          <p className="text-[10px] text-white/60 uppercase tracking-wide truncate">
            {deal.merchant}
          </p>
        )}
        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 mt-0.5">
          {deal.title}
        </h3>
        <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
          <span className="font-bold text-emerald-400">
            {deal.discountedPrice}
          </span>
          <span className="text-xs text-white/50 line-through">
            {deal.originalPrice}
          </span>
          {discountText && (
            <span className="text-xs font-medium text-emerald-400/90">
              {discountText}
            </span>
          )}
        </div>
        <a
          href={deal.dealUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-auto ${DEAL_BUTTON_H} flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold px-4 transition shrink-0`}
        >
          View Deal
        </a>
      </div>
    </div>
  );
}
