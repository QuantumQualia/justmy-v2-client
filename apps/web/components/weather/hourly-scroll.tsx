"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Cloud, CloudRain, CloudSun, Sun } from "lucide-react";
import type { HourlyPoint } from "./types";

interface HourlyScrollProps {
  points: HourlyPoint[];
  className?: string;
}

function HourlyConditionIcon({ condition }: { condition: string }) {
  const normalized = condition.toLowerCase();
  const iconClass = "h-5 w-5 shrink-0 text-current";

  if (normalized.includes("rain") || normalized.includes("shower")) {
    return <CloudRain className={iconClass} />;
  }
  if (normalized.includes("cloud")) {
    return <CloudSun className={iconClass} />;
  }
  if (normalized.includes("sun") || normalized.includes("clear")) {
    return <Sun className={cn(iconClass, "text-amber-200")} />;
  }
  return <Cloud className={iconClass} />;
}

function getRainWallClass(precipChancePercent: number) {
  if (precipChancePercent >= 70) {
    return "bg-sky-600/70 border-sky-300/80 text-sky-50";
  }
  if (precipChancePercent >= 50) {
    return "bg-sky-700/60 border-sky-300/60 text-sky-50";
  }
  return "bg-slate-900/60 border-slate-700/80 text-slate-50";
}

export function HourlyScroll({ points, className }: HourlyScrollProps) {
  return (
    <section
      className={cn(
        "rounded-3xl bg-slate-900/80 border border-slate-800/80 p-4 sm:p-5 shadow-lg",
        className,
      )}
      aria-label="Hourly tactical scroll"
    >
      <header className="flex items-baseline justify-between gap-2 mb-3 sm:mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-50">
            Hourly Tactical Scroll
          </h2>
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.16em] text-slate-400">
            Spot the pivot points in your day
          </p>
        </div>
        <p className="hidden sm:block text-[11px] text-slate-400">
          Blue = Rain Wall, ● Commute = 8 AM / 5 PM
        </p>
      </header>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent" />

        <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth scrollbar-horizontal-dark">
          {points.map((point) => {
            const isRainWall = point.precipChancePercent >= 50;
            const isCommute = point.isCommuteHour;
            const blockClasses = cn(
              "relative min-w-[100px] rounded-2xl border px-2.5 py-2 text-xs sm:text-sm flex flex-col gap-1.5",
              "transition-colors duration-200",
              getRainWallClass(point.precipChancePercent),
            );

            return (
              <div key={point.timeLabel} className="flex flex-col items-stretch gap-1">
                <div className={blockClasses}>
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-medium">{point.timeLabel}</p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px]/none font-medium",
                        isCommute
                          ? "bg-emerald-400 text-slate-900"
                          : isRainWall
                            ? "bg-sky-300 text-slate-900"
                            : "bg-slate-700/80 text-slate-100",
                      )}
                    >
                      {isCommute ? "Commute" : `${point.precipChancePercent}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HourlyConditionIcon condition={point.condition} />
                    <p className="text-[13px] sm:text-sm font-semibold">
                      {Math.round(point.temperatureF)}°
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-100/80 line-clamp-1">
                    {point.condition}
                  </p>
                </div>

                {isCommute && (
                  <p className="text-[10px] text-center text-slate-400">
                    {point.precipChancePercent >= 50
                      ? "Red Commute: pad your schedule."
                      : "Green Commute: smooth in and out."}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

