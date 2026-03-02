"use client";

import * as React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { WeatherHero } from "@/components/weather/weather-hero";
import type { WeatherHeroData } from "@/components/weather/types";
import { fetchWeatherHero } from "@/lib/api/weather";

interface WeatherHeroBlockProps {
  block: PageBlock;
}

const EMPTY_HERO: WeatherHeroData = {
  location: "",
  temperatureF: 0,
  condition: "",
  feelsLikeF: 0,
  highF: 0,
  lowF: 0,
  windMph: 0,
  windDirection: "SW",
  aiStrategyLine: "",
};

/**
 * CMS block that renders the Strategic Weather hero.
 * Fetches live hero data for the signed-in user's profile zip.
 */
export function WeatherHeroBlock({}: WeatherHeroBlockProps) {
  const [data, setData] = React.useState<WeatherHeroData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const hero = await fetchWeatherHero();
        if (!cancelled) {
          setData(hero);
        }
      } catch (err) {
        console.error("Failed to load weather hero:", err);
        if (!cancelled) {
          setData(null);
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
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
        Loading current weather…
      </div>
    );
  }

  if (!data) {
    // Silently fail when weather isn't available (e.g. unauthenticated).
    return null;
  }

  return <WeatherHero data={data ?? EMPTY_HERO} />;
}

