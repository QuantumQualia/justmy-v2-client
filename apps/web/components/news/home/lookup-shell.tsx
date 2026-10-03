"use client";

import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { NewsMarketNav } from "@/components/news/asksky/news-market-nav";
import { useNewsHost } from "@/lib/news/news-host-context";
import { useNewsZipStore } from "@/lib/store/news-zip-store";
import { cn } from "@workspace/ui/lib/utils";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-asksky-serif",
  display: "swap",
});

export function LookupShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: (market: NonNullable<ReturnType<typeof useNewsZipStore.getState>["market"]>) => ReactNode;
}) {
  const router = useRouter();
  const newsHost = useNewsHost();
  const market = useNewsZipStore((s) => s.market);
  const hydrated = useNewsZipStore((s) => s.hasHydrated);

  return (
    <div
      className={cn(
        instrumentSerif.variable,
        "min-h-screen w-full bg-background text-foreground",
        "[&_.font-serif]:font-[family-name:var(--font-asksky-serif),ui-serif,Georgia,serif]",
      )}
    >
      {market && !newsHost ? (
        <NewsMarketNav market={market} onNewChat={() => router.push("/news")} />
      ) : null}
      <main className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-6 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">NewsSTAND</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-foreground sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{lede}</p>
        {!hydrated ? (
          <div className="mt-8 h-40 animate-pulse justmy-corners-lg bg-muted" />
        ) : market?.marketId ? (
          <div className="mt-8">{children(market)}</div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            Pick a market on the{" "}
            <Link href="/news" className="font-medium text-primary hover:underline">
              NewsSTAND
            </Link>{" "}
            to look through this list.
          </p>
        )}
      </main>
    </div>
  );
}
