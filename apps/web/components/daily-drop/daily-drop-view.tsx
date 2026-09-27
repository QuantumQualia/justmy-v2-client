"use client";

import { useEffect, useState } from "react";
import {
  fetchDailyDropBriefing,
  fetchDailyDropEvents,
  fetchDailyDropDeals,
} from "@/lib/api/daily-drop";
import type { DailyNewsItem, MarketEvent, LocalDeal } from "@/components/daily-drop/types";
import { TopNewsBriefing } from "@/components/daily-drop/top-news-briefing";
import { MarketEventsStage } from "@/components/daily-drop/market-events-stage";
import { LocalDealsHook } from "@/components/daily-drop/local-deals-hook";
import { SkyFmDropPlayer } from "@/components/try-free/skyfm-drop-player";
import {
  MOCK_NEWS,
  MOCK_EVENTS,
  MOCK_DEALS,
} from "@/components/daily-drop/mock-data";
import { AdBanner } from "@/components/common/ad-banner";
import { isAuthenticated } from "@/lib/services/session";
import { cn } from "@workspace/ui/lib/utils";

function Pulse({ className }: { className: string }) {
  return <div className={cn("animate-pulse rounded bg-slate-200/70", className)} />;
}

function DailyDropSkeleton({ compact }: { compact: boolean }) {
  return (
    <div
      className={cn(
        "text-foreground font-sans",
        compact ? "bg-transparent" : "min-h-[calc(100vh-4.1rem)] bg-background",
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <div className={cn("mx-auto space-y-10", compact ? "max-w-3xl" : "max-w-3xl px-4 py-6 sm:py-8")}>
        <header className="space-y-2">
          <Pulse className="h-8 w-40 rounded-lg bg-slate-200/80" />
          <Pulse className="h-4 w-64 max-w-full bg-slate-200/60" />
        </header>

        <section className="space-y-3">
          <Pulse className="h-5 w-24 bg-slate-200/80" />
          <div className="space-y-3 rounded-xl rounded-br-none border border-slate-200/80 bg-white p-4 shadow-sm">
            <Pulse className="h-4 w-3/4" />
            <Pulse className="h-3 w-full bg-slate-100" />
            <Pulse className="h-3 w-5/6 bg-slate-100" />
          </div>
          <div className="space-y-3 rounded-xl rounded-br-none border border-slate-200/80 bg-white p-4 shadow-sm">
            <Pulse className="h-4 w-2/3" />
            <Pulse className="h-3 w-full bg-slate-100" />
          </div>
        </section>

        <section className="space-y-3">
          <Pulse className="h-5 w-20 bg-slate-200/80" />
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-[min(100%,280px)] shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm"
              >
                <div className="aspect-video animate-pulse bg-slate-200/80" />
                <div className="space-y-2 p-4">
                  <Pulse className="h-3 w-24" />
                  <Pulse className="h-4 w-full" />
                  <Pulse className="h-4 w-4/5 bg-slate-100" />
                  <Pulse className="mt-2 h-8 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <Pulse className="h-5 w-16 bg-slate-200/80" />
          <div className="h-16 animate-pulse rounded-xl border border-slate-200/80 bg-white" />
        </section>
      </div>
    </div>
  );
}

export function DailyDropView({
  showSkyFm = true,
  showMyCityBanner = true,
  showAdBanner = true,
  compact = false,
}: {
  showSkyFm?: boolean;
  showMyCityBanner?: boolean;
  showAdBanner?: boolean;
  compact?: boolean;
}) {
  const [news, setNews] = useState<DailyNewsItem[]>([]);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [deals, setDeals] = useState<LocalDeal[]>([]);
  const [dealsTotal, setDealsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!(await isAuthenticated())) {
        if (!cancelled) {
          setNews(MOCK_NEWS);
          setEvents(MOCK_EVENTS);
          setDeals(MOCK_DEALS);
          setDealsTotal(150);
          setUsedFallback(true);
          setLoading(false);
        }
        return;
      }

      try {
        const [briefingRes, eventsRes, dealsRes] = await Promise.allSettled([
          fetchDailyDropBriefing(),
          fetchDailyDropEvents(),
          fetchDailyDropDeals(),
        ]);

        if (cancelled) return;

        if (briefingRes.status === "fulfilled") {
          setNews(briefingRes.value.items);
        } else {
          setNews(MOCK_NEWS);
          setUsedFallback(true);
        }

        if (eventsRes.status === "fulfilled") {
          setEvents(eventsRes.value.events);
        } else {
          setEvents(MOCK_EVENTS);
          setUsedFallback(true);
        }

        if (dealsRes.status === "fulfilled") {
          setDeals(dealsRes.value.deals);
          setDealsTotal(dealsRes.value.totalCount);
        } else {
          setDeals(MOCK_DEALS);
          setDealsTotal(150);
          setUsedFallback(true);
        }
      } catch {
        if (!cancelled) {
          setNews(MOCK_NEWS);
          setEvents(MOCK_EVENTS);
          setDeals(MOCK_DEALS);
          setDealsTotal(150);
          setUsedFallback(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <DailyDropSkeleton compact={compact} />;
  }

  return (
    <div
      className={cn(
        "text-foreground font-sans",
        compact ? "bg-transparent" : "min-h-[calc(100vh-4.1rem)] bg-background",
      )}
    >
      <div className={cn("mx-auto space-y-10", compact ? "max-w-3xl" : "max-w-3xl px-4 py-6 sm:py-8")}>
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Daily Drop</h1>
          <p className="text-sm text-muted-foreground">
            Your local briefing, events, and deals.
            {usedFallback ? (
              <span className="mt-1 block text-muted-foreground">
                Showing sample data. Sign in for your market.
              </span>
            ) : null}
          </p>
        </header>

        {showSkyFm ? <SkyFmDropPlayer /> : null}

        <TopNewsBriefing
          title="Top News"
          items={news}
          myCityAppUrl="/lab/app-hub"
          showMyCityBanner={showMyCityBanner}
        />

        <MarketEventsStage title="Events" events={events} />

        <LocalDealsHook
          title="Deals"
          deals={deals}
          browseAllHref="/deals"
          browseAllLabel={`Browse All ${dealsTotal}+ Local Deals`}
        />

        {showAdBanner ? (
          <AdBanner
            imageSrc="/images/placeholders/banner_placement.jpg"
            imageAlt="Ad Banner"
            profileSlug="justmymemphis"
            hotlinks={[
              { label: "Learn More", href: "/learn-more" },
              { label: "Contact Us", href: "/contact-us" },
              { label: "Follow Us", href: "/follow-us" },
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}
