"use client";

import * as React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { HourlyScroll } from "@/components/weather/hourly-scroll";
import type { HourlyPoint } from "@/components/weather/types";
import { fetchWeatherHourly } from "@/lib/api/weather";

interface HourlyScrollBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the Hourly Tactical Scroll.
 * Fetches the next 12 hours of weather for the signed-in user's profile zip.
 */
export function HourlyScrollBlock({}: HourlyScrollBlockProps) {
  const [points, setPoints] = React.useState<HourlyPoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetchWeatherHourly();
        if (!cancelled) {
          setPoints(res.points || []);
        }
      } catch (err) {
        console.error("Failed to load hourly weather:", err);
        if (!cancelled) {
          setPoints([]);
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
        Loading hourly outlook…
      </div>
    );
  }

  if (!points.length) {
    return null;
  }

  return <HourlyScroll points={points} />;
}

