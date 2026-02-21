"use client";

import React, { useEffect, useState } from "react";
import {
  fetchDailyDropBriefing,
  fetchDailyDropEvents,
  fetchDailyDropDeals,
} from "@/lib/api/daily-drop";
import type { DailyNewsItem, MarketEvent, LocalDeal } from "@/components/daily-drop/types";
import { TopNewsBriefing } from "@/components/daily-drop/top-news-briefing";
import { MarketEventsStage } from "@/components/daily-drop/market-events-stage";
import { LocalDealsHook } from "@/components/daily-drop/local-deals-hook";
import {
  MOCK_NEWS,
  MOCK_EVENTS,
  MOCK_EVENTS_TOTAL,
  MOCK_DEALS,
} from "@/components/daily-drop/mock-data";
import { AdBanner } from "@/components/common/ad-banner";
import { isAuthenticated } from "@/lib/services/session";

const DEFAULT_MARKET_NAME = "Memphis";

export default function DailyDropPage() {
  const [news, setNews] = useState<DailyNewsItem[]>([]);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [marketName, setMarketName] = useState(DEFAULT_MARKET_NAME);
  const [deals, setDeals] = useState<LocalDeal[]>([]);
  const [dealsTotal, setDealsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isAuthenticated()) {
        if (!cancelled) {
          setNews(MOCK_NEWS);
          setEvents(MOCK_EVENTS);
          setEventsTotal(MOCK_EVENTS_TOTAL);
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
          if (briefingRes.value.marketName) setMarketName(briefingRes.value.marketName);
        } else {
          setNews(MOCK_NEWS);
          setUsedFallback(true);
        }

        if (eventsRes.status === "fulfilled") {
          setEvents(eventsRes.value.events);
          setEventsTotal(eventsRes.value.totalCount);
          if (eventsRes.value.marketName) setMarketName(eventsRes.value.marketName);
        } else {
          setEvents(MOCK_EVENTS);
          setEventsTotal(MOCK_EVENTS_TOTAL);
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
          setEventsTotal(MOCK_EVENTS_TOTAL);
          setDeals(MOCK_DEALS);
          setDealsTotal(150);
          setUsedFallback(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <p className="text-white/70">Loading your Daily Drop…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-10">
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Daily Drop
          </h1>
          <p className="text-sm text-white/60">
            Your local briefing, events, and deals.
            {usedFallback && (
              <span className="block mt-1 text-white/50">
                Showing sample data. Sign in for your market.
              </span>
            )}
          </p>
        </header>

        <TopNewsBriefing
          title="Top News"
          items={news}
          myCityAppUrl="/lab/app-hub"
        />

        <MarketEventsStage
          title="Events"
          events={events}
          totalCount={eventsTotal}
          viewAllHref="/events"
          viewAllLabel={`Your weekend is waiting. See all ${eventsTotal} events happening in ${marketName}.`}
        />

        <LocalDealsHook
          title="Deals"
          deals={deals}
          browseAllHref="/deals"
          browseAllLabel={`Browse All ${dealsTotal}+ Local Deals`}
        />

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
      </div>
    </div>
  );
}
