"use client";

import { cn } from "@workspace/ui/lib/utils";
import type { LifestyleGauge } from "./types";

interface LifestyleIndicesProps {
  gauges: LifestyleGauge[];
  className?: string;
}

function badgeClasses(status: LifestyleGauge["status"]) {
  if (status === "go") {
    return "bg-emerald-400/90 text-slate-900";
  }
  if (status === "caution") {
    return "bg-amber-300 text-slate-900";
  }
  return "bg-rose-400 text-slate-900";
}

function statusLabel(status: LifestyleGauge["status"]) {
  if (status === "go") return "Go";
  if (status === "caution") return "Adjust";
  return "No-Go";
}

export function LifestyleIndices({ gauges, className }: LifestyleIndicesProps) {
  return (
    <section
      className={cn(
        "rounded-3xl bg-slate-950/80 border border-slate-800 p-4 sm:p-5 shadow-lg",
        className,
      )}
      aria-label="Lifestyle indices"
    >
      <header className="mb-3 sm:mb-4 space-y-1">
        <h2 className="text-sm sm:text-base font-semibold text-slate-50">
          Lifestyle Indices
        </h2>
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.16em] text-slate-400">
          Winner&apos;s Metrics – Go / No-Go gauges
        </p>
      </header>

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        {gauges.map((gauge) => (
          <article
            key={gauge.id}
            className="group rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-slate-950/90 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3"
          >
            <header className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-100">{gauge.label}</p>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px]/none font-semibold uppercase tracking-[0.14em]",
                  badgeClasses(gauge.status),
                )}
              >
                {statusLabel(gauge.status)}
              </span>
            </header>
            <p className="text-xs sm:text-[13px] text-slate-50">
              {gauge.valueLabel}
            </p>
            <p className="text-[11px] text-slate-400 leading-snug">
              {gauge.summary}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

