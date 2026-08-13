"use client";

import { CalendarDays, Newspaper, Tag } from "lucide-react";
import { useEffect } from "react";

import { NewsHomeLink } from "@/components/news/news-home-link";
import { NewsMarketPageClient } from "@/components/news/news-market-page-client";
import { NewsZipForm } from "@/components/news/news-zip-form";
import { useNewsZipStore } from "@/lib/store/news-zip-store";

const HIGHLIGHTS = [
  {
    icon: Newspaper,
    title: "Daily Drop",
    description: "Your local briefing, every morning.",
  },
  {
    icon: CalendarDays,
    title: "Events",
    description: "What's happening around you this week.",
  },
  {
    icon: Tag,
    title: "Deals",
    description: "Offers from businesses nearby.",
  },
];

/**
 * `/news` gate: zip entry when no saved zip, market detail when zip is set.
 */
export function NewsPageClient() {
  const zipcode = useNewsZipStore((s) => s.zipcode);
  const hasHydrated = useNewsZipStore((s) => s.hasHydrated);

  useEffect(() => {
    const markReady = () => {
      useNewsZipStore.getState().setHasHydrated(true);
    };

    if (useNewsZipStore.persist.hasHydrated()) {
      markReady();
      return;
    }

    return useNewsZipStore.persist.onFinishHydration(markReady);
  }, []);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/50">
        Loading…
      </div>
    );
  }

  if (zipcode) {
    return <NewsMarketPageClient zipcode={zipcode} />;
  }

  return <NewsLanding />;
}

function NewsLanding() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black font-sans text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.18),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]"
      />

      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <NewsHomeLink className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white transition hover:opacity-80">
            <span className="inline-block h-2 w-2 rounded-full bg-linear-to-r from-emerald-400 to-cyan-500" />
            JustMy News
          </NewsHomeLink>
          <span className="text-xs text-white/40">Local market routing</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl space-y-12 px-4 py-10 sm:py-16">
        <section className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-md">
            Local news, wherever you are
          </span>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
            Find your{" "}
            <span className="bg-linear-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
              local market
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-base text-white/60">
            Enter your zip code and we&apos;ll take you straight to your local
            Daily Drop.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-6">
            <NewsZipForm />
          </div>
        </section>

        <section className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
            >
              <Icon className="h-5 w-5 text-emerald-400" aria-hidden />
              <h2 className="mt-3 text-sm font-semibold text-white">{title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                {description}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
