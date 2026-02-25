"use client";

import { cn } from "@workspace/ui/lib/utils";
import type { DayForecast, WeekendLookahead } from "./types";

interface SevenDayStrategyProps {
  days: DayForecast[];
  weekendLookahead: WeekendLookahead;
  className?: string;
}

export function SevenDayStrategy({
  days,
  weekendLookahead,
  className,
}: SevenDayStrategyProps) {
  const workWeek = days.filter((day) => !day.isWeekend);
  const weekend = days.filter((day) => day.isWeekend);

  return (
    <section
      className={cn(
        "rounded-3xl bg-slate-950/80 border border-slate-900 p-4 sm:p-5 shadow-xl",
        className,
      )}
      aria-label="7-day strategy"
    >
      <header className="mb-3 sm:mb-4 space-y-1">
        <h2 className="text-sm sm:text-base font-semibold text-slate-50">
          7-Day Strategy
        </h2>
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.16em] text-slate-400">
          Work Week vs. Weekend at a glance
        </p>
      </header>

      <div className="space-y-4 sm:space-y-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Work Week
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {workWeek.map((day) => (
              <DayCard key={day.id} day={day} />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300">
            The Weekend
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
            {weekend.map((day) => (
              <DayCard key={day.id} day={day} highlightWeekend />
            ))}
          </div>
        </div>

        <footer className="mt-1 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 px-3.5 py-3 sm:px-4 sm:py-3.5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300 mb-1.5">
            {weekendLookahead.title}
          </p>
          <p className="text-xs sm:text-[13px] leading-snug text-amber-50">
            {weekendLookahead.summary}
          </p>
        </footer>
      </div>
    </section>
  );
}

interface DayCardProps {
  day: DayForecast;
  highlightWeekend?: boolean;
}

function DayCard({ day, highlightWeekend }: DayCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border px-3 py-2.5 sm:px-3.5 sm:py-3 flex flex-col gap-1.5",
        highlightWeekend
          ? "border-amber-400/70 bg-gradient-to-b from-amber-500/10 via-slate-950/90 to-slate-950/90"
          : "border-slate-800 bg-slate-950/80",
      )}
    >
      <header className="flex items-baseline justify-between gap-1">
        <p
          className={cn(
            "text-xs font-semibold",
            highlightWeekend ? "text-amber-200" : "text-slate-100",
          )}
        >
          {day.weekdayLabel}
        </p>
        <p className="text-[11px] text-slate-400">{day.dateLabel}</p>
      </header>
      <p className="text-[11px] text-slate-300 line-clamp-1">{day.condition}</p>
      <p
        className={cn(
          "text-sm font-medium",
          highlightWeekend ? "text-amber-100" : "text-slate-100",
        )}
      >
        {Math.round(day.highF)}° /{" "}
        <span className="text-slate-400">{Math.round(day.lowF)}°</span>
      </p>
    </article>
  );
}

