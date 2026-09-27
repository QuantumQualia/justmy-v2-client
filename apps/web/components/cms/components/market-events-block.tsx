"use client";

import * as React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { MarketEventsStage } from "@/components/daily-drop/market-events-stage";
import type { MarketEvent } from "@/components/daily-drop/types";
import { fetchDailyDropEvents } from "@/lib/api/daily-drop";
import { isAuthenticated } from "@/lib/services/session";
import { PlaceholderPanel } from "@/components/common/placeholder-panel";

interface MarketEventsBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the Daily Drop Market Events stage.
 * Fetches upcoming events for the signed-in user's market; when unavailable, shows a placeholder.
 */
export function MarketEventsBlock({}: MarketEventsBlockProps) {
  const [events, setEvents] = React.useState<MarketEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hadError, setHadError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!(await isAuthenticated())) {
          if (!cancelled) {
            setHadError(true);
          }
          return;
        }

        const res = await fetchDailyDropEvents();
        if (!cancelled) {
          setEvents(res.events || []);
        }
      } catch (err) {
        console.error("Failed to load Daily Drop events:", err);
        if (!cancelled) {
          setHadError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <PlaceholderPanel text="Loading market events…" />;
  }

  if (hadError) {
    return <PlaceholderPanel text="Daily Drop – Market Events Coming Soon" />;
  }

  return <MarketEventsStage title="Events" events={events} />;
}

