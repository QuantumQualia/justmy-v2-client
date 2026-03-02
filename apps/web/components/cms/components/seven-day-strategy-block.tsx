"use client";

import * as React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { SevenDayStrategy } from "@/components/weather/seven-day-strategy";
import type { DayForecast, WeekendLookahead } from "@/components/weather/types";
import { fetchWeatherSevenDay } from "@/lib/api/weather";

interface SevenDayStrategyBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the 7-Day Strategy panel.
 * Fetches work-week vs weekend forecast plus the weekend lookahead summary.
 */
export function SevenDayStrategyBlock({}: SevenDayStrategyBlockProps) {
  const [days, setDays] = React.useState<DayForecast[]>([]);
  const [weekendLookahead, setWeekendLookahead] = React.useState<WeekendLookahead>({
    title: "The Weekend Lookahead",
    summary: "",
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetchWeatherSevenDay();
        if (!cancelled) {
          setDays(res.days || []);
          setWeekendLookahead(res.weekendLookahead || weekendLookahead);
        }
      } catch (err) {
        console.error("Failed to load seven-day weather:", err);
        if (!cancelled) {
          setDays([]);
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
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
        Loading 7-day strategy…
      </div>
    );
  }

  if (!days.length) {
    return null;
  }

  return <SevenDayStrategy days={days} weekendLookahead={weekendLookahead} />;
}

