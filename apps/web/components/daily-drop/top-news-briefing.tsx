"use client";

import React from "react";
import Link from "next/link";
import type { DailyNewsItem } from "./types";

const GLASS_CARD =
  "rounded-xl rounded-br-none border border-border bg-card shadow-lg";

export interface TopNewsBriefingProps {
  /** Section title (e.g. "The Briefing") */
  title?: string;
  items: DailyNewsItem[];
  /** Link for myCITY banner CTA */
  myCityAppUrl?: string;
  className?: string;
}

const EMPTY_PLACEHOLDER =
  "rounded-xl border border-dashed border-border bg-muted py-8 px-4 text-center text-sm text-muted-foreground";

export function TopNewsBriefing({
  title = "Top News",
  items,
  myCityAppUrl = "/lab/app-hub",
  className,
}: TopNewsBriefingProps) {
  const hasItems = items.length > 0;

  return (
    <section className={className}>
      <h2 className="text-lg font-bold text-foreground mb-3 tracking-tight">
        {title}
      </h2>
      {!hasItems ? (
        <div className={EMPTY_PLACEHOLDER}>
          No news available for now. Check back later.
        </div>
      ) : (
      <div className="space-y-3">
        {items.slice(0, 3).map((item) => {
          const Wrapper = item.url ? "a" : "article";
          const wrapperProps = item.url
            ? {
                href: item.url,
                target: "_blank",
                rel: "noopener noreferrer",
                className: `${GLASS_CARD} p-4 transition hover:bg-accent block`,
              }
            : {
                className: `${GLASS_CARD} p-4 transition hover:bg-accent`,
              };
          return (
            <Wrapper key={item.id} {...wrapperProps}>
              <h3 className="font-semibold text-foreground text-base leading-snug">
                {item.headline}
              </h3>
              {item.summary && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {item.summary}
                </p>
              )}
            </Wrapper>
          );
        })}
      </div>
      )}
      <div
        className={`${GLASS_CARD} mt-4 p-4 flex items-center justify-between gap-2`}
        role="banner"
      >
        <span className="text-sm text-foreground">
          Dive Deeper into Local. Get the myCITY App
        </span>
        <Link
          href={myCityAppUrl}
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2 shrink-0"
        >
          Get myCITY →
        </Link>
      </div>
    </section>
  );
}
