"use client";

import { useEffect, useState } from "react";
import { AdBanner } from "@/components/common/ad-banner";
import { WeatherHero } from "@/components/weather/weather-hero";
import { HourlyScroll } from "@/components/weather/hourly-scroll";
import { LifestyleIndices } from "@/components/weather/lifestyle-indices";
import { SevenDayStrategy } from "@/components/weather/seven-day-strategy";
import { RadarPanel } from "@/components/weather/radar-panel";
import type { WeatherHeroData } from "@/components/weather/types";
import type { HourlyPoint } from "@/components/weather/types";
import type { LifestyleGauge } from "@/components/weather/types";
import type { DayForecast, WeekendLookahead } from "@/components/weather/types";

const DEFAULT_HERO: WeatherHeroData = {
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

const DEFAULT_LOOKAHEAD: WeekendLookahead = {
  title: "The Weekend Lookahead",
  summary: "",
};
import {
  fetchWeatherHero,
  fetchWeatherHourly,
  fetchWeatherIndices,
  fetchWeatherSevenDay,
  fetchWeatherRadar,
  type WeatherRadarResponseDto,
} from "@/lib/api/weather";
import { isAuthenticated } from "@/lib/services/session";
import { useProfileStore } from "@/lib/store";

const SPONSOR_BANNERS = [
  {
    imageSrc: "/images/placeholders/banner_placement.jpg",
    imageAlt: "Weather Partner – Patio Lunch",
    profileSlug: "justmymemphis",
  },
  {
    imageSrc: "/images/placeholders/banner_placement.jpg",
    imageAlt: "Weather Partner – Commute Ready",
    profileSlug: "justmymemphis",
  },
  {
    imageSrc: "/images/placeholders/banner_placement.jpg",
    imageAlt: "Weather Partner – Weekend Ready",
    profileSlug: "justmymemphis",
  },
];

const SPONSOR_HOTLINKS: [ { label: string; href: string }, { label: string; href: string }, { label: string; href: string } ] = [
  { label: "Today's Offer", href: "/sponsors" },
  { label: "Meet the Market", href: "/lab/app-hub" },
  { label: "Become a Sponsor", href: "/contact" },
];

export default function WeatherLabPage() {
  const [heroData, setHeroData] = useState<WeatherHeroData>(DEFAULT_HERO);
  const [hourlyPoints, setHourlyPoints] = useState<HourlyPoint[]>([]);
  const [gauges, setGauges] = useState<LifestyleGauge[]>([]);
  const [sevenDayDays, setSevenDayDays] = useState<DayForecast[]>([]);
  const [weekendLookahead, setWeekendLookahead] = useState<WeekendLookahead>(DEFAULT_LOOKAHEAD);
  const [radarData, setRadarData] = useState<WeatherRadarResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  const topBanner = SPONSOR_BANNERS[0]!;
  const middleBanner = SPONSOR_BANNERS[1]!;
  const bottomBanner = SPONSOR_BANNERS[2]!;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!(await isAuthenticated())) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        await useProfileStore.getState().fetchProfileData("me");
        if (cancelled) return;

        const [heroRes, hourlyRes, indicesRes, sevenDayRes, radarRes] =
          await Promise.allSettled([
            fetchWeatherHero(),
            fetchWeatherHourly(),
            fetchWeatherIndices(),
            fetchWeatherSevenDay(),
            fetchWeatherRadar(),
          ]);

        if (cancelled) return;

        if (heroRes.status === "fulfilled") {
          const marketName = useProfileStore.getState().data.markets[0]?.name;
          setHeroData({
            ...heroRes.value,
            location: marketName || heroRes.value.location,
          });
        } else {
          setUsedFallback(true);
        }
        if (hourlyRes.status === "fulfilled") {
          setHourlyPoints(hourlyRes.value.points);
        } else {
          setUsedFallback(true);
        }
        if (indicesRes.status === "fulfilled") {
          setGauges(indicesRes.value);
        } else {
          setUsedFallback(true);
        }
        if (sevenDayRes.status === "fulfilled") {
          setSevenDayDays(sevenDayRes.value.days);
          setWeekendLookahead(sevenDayRes.value.weekendLookahead);
        } else {
          setUsedFallback(true);
        }
        if (radarRes.status === "fulfilled") {
          setRadarData(radarRes.value);
        } else {
          setUsedFallback(true);
        }
      } catch {
        if (!cancelled) {
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
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-950 text-slate-50 flex items-center justify-center p-6">
        <p className="text-white/70">Loading your Strategic Weather…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950 text-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8 sm:space-y-10">
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Strategic Weather Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Not a forecast app. A lifestyle planning OS that tells you what to
            do with the forecast.
            {usedFallback && (
              <span className="block mt-1 text-slate-500">
                Showing sample data. Sign in and set your profile zip for live weather.
              </span>
            )}
          </p>
        </header>

        <AdBanner
          imageSrc={topBanner.imageSrc}
          imageAlt={topBanner.imageAlt}
          profileSlug={topBanner.profileSlug}
          hotlinks={SPONSOR_HOTLINKS}
        />

        <WeatherHero data={heroData} />

        <HourlyScroll points={hourlyPoints} />

        <LifestyleIndices gauges={gauges} />

        <AdBanner
          imageSrc={middleBanner.imageSrc}
          imageAlt={middleBanner.imageAlt}
          profileSlug={middleBanner.profileSlug}
          hotlinks={SPONSOR_HOTLINKS}
        />

        <SevenDayStrategy
          days={sevenDayDays}
          weekendLookahead={weekendLookahead}
        />

        <RadarPanel
          data={
            radarData
              ? {
                  precipTileUrlTemplate: radarData.precipTileUrlTemplate,
                  lat: radarData.lat,
                  lon: radarData.lon,
                  locationName: radarData.locationName,
                }
              : null
          }
        />

        <AdBanner
          imageSrc={bottomBanner.imageSrc}
          imageAlt={bottomBanner.imageAlt}
          profileSlug={bottomBanner.profileSlug}
          hotlinks={SPONSOR_HOTLINKS}
        />
      </div>
    </div>
  );
}

