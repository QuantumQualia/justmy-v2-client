"use client";

import { cn } from "@workspace/ui/lib/utils";
import { CloudRain, Cloud, CloudSun, Sun } from "lucide-react";
import type { WeatherHeroData } from "./types";

interface WeatherHeroProps {
  data: WeatherHeroData;
  className?: string;
}

function ConditionIcon({ condition }: { condition: string }) {
  const normalized = condition.toLowerCase();
  const iconClass = "h-7 w-7 sm:h-8 sm:w-8 text-sky-100";

  if (normalized.includes("rain") || normalized.includes("shower")) {
    return <CloudRain className={iconClass} />;
  }
  if (normalized.includes("cloud")) {
    return <CloudSun className={iconClass} />;
  }
  if (normalized.includes("sun") || normalized.includes("clear")) {
    return <Sun className="h-7 w-7 sm:h-8 sm:w-8 text-amber-200" />;
  }
  return <Cloud className={iconClass} />;
}

export function WeatherHero({ data, className }: WeatherHeroProps) {
  const {
    location,
    temperatureF,
    condition,
    feelsLikeF,
    highF,
    lowF,
    windDirection,
    windMph,
    aiStrategyLine,
  } = data;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-indigo-700 to-slate-900 px-4 py-3 sm:px-5 sm:py-4 shadow-xl text-white",
        "border border-white/10 backdrop-blur-xl",
        className,
      )}
      aria-label="Current weather"
    >
      <div className="flex flex-col gap-3 sm:gap-3 md:flex-row md:items-center md:gap-6 justify-between">
        {/* Left: header + icon + temp + condition */}
        <div className="flex flex-col gap-2 min-w-0">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/70">
              Strategic Weather Dashboard
            </p>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-0.5">
              {location}
            </h2>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-sky-500 to-indigo-600 shadow-lg">
              <ConditionIcon condition={condition} />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-semibold leading-none">
                  {Math.round(temperatureF)}
                </span>
                <span className="text-2xl sm:text-3xl align-top">°</span>
              </div>
              <p className="text-sm font-medium mt-0.5">{condition}</p>
              <p className="text-[11px] sm:text-xs text-sky-100/80">
                Feels like {Math.round(feelsLikeF)}°
              </p>
            </div>
          </div>
        </div>

        {/* Right: Vibe Check + Today/Wind */}
        <div className="flex flex-col gap-2 md:w-80 md:flex-none">
          <div className="rounded-xl bg-black/10 px-3 py-2 sm:px-3.5 sm:py-2.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-sky-100/70">
              Vibe Check
            </p>
            <p className="text-xs sm:text-sm leading-snug text-sky-50 mt-1">
              {aiStrategyLine}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-2 rounded-xl bg-black/10 px-3 py-2 sm:px-3.5 sm:py-2.5">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-sky-100/60">
                Today
              </dt>
              <dd className="text-sm font-medium mt-0.5">
                {Math.round(highF)}° / {Math.round(lowF)}°
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-sky-100/60">
                Wind
              </dt>
              <dd className="text-sm font-medium mt-0.5">
                {Math.round(windMph)} mph {windDirection}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

