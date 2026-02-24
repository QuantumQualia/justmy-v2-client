"use client";

import dynamic from "next/dynamic";
import { cn } from "@workspace/ui/lib/utils";
import type { RadarMapProps } from "./radar-map";

const RadarMap = dynamic<RadarMapProps>(
  () => import("./radar-map").then((m) => ({ default: m.RadarMap })),
  { ssr: false },
);

export interface RadarPanelData {
  precipTileUrlTemplate: string;
  lat: number;
  lon: number;
  locationName: string;
}

interface RadarPanelProps {
  /** When provided, shows live precipitation map. When null, shows placeholder. */
  data?: RadarPanelData | null;
  className?: string;
}

export function RadarPanel({ data, className }: RadarPanelProps) {
  return (
    <section
      className={cn(
        "rounded-3xl bg-slate-950 border border-slate-900 p-4 sm:p-5 shadow-xl",
        className,
      )}
      aria-label="Radar"
    >
      <header className="mb-3 sm:mb-4 flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-50">
            Radar – Visual Truth
          </h2>
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.16em] text-slate-400">
            Defaulted to precipitation so you can see where the rain is
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px]/none text-slate-300">
          Precipitation layer
        </span>
      </header>

      {data ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 h-56 sm:h-64">
          <RadarMap
            lat={data.lat}
            lon={data.lon}
            precipTileUrlTemplate={data.precipTileUrlTemplate}
            locationName={data.locationName}
            className="rounded-2xl"
          />
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-sky-900/60 to-slate-950 h-56 sm:h-64 flex items-center justify-center">
          <p className="text-sm text-slate-400">
            Sign in and set your profile zip to see live radar.
          </p>
        </div>
      )}
    </section>
  );
}
