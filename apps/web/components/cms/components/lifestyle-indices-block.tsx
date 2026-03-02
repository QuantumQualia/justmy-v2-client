"use client";

import * as React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { LifestyleIndices } from "@/components/weather/lifestyle-indices";
import type { LifestyleGauge } from "@/components/weather/types";
import { fetchWeatherIndices } from "@/lib/api/weather";

interface LifestyleIndicesBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the Lifestyle Indices panel.
 * Fetches Health / Outdoors / Activity gauges for the signed-in user's profile zip.
 */
export function LifestyleIndicesBlock({}: LifestyleIndicesBlockProps) {
  const [gauges, setGauges] = React.useState<LifestyleGauge[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetchWeatherIndices();
        if (!cancelled) {
          setGauges(res || []);
        }
      } catch (err) {
        console.error("Failed to load lifestyle indices:", err);
        if (!cancelled) {
          setGauges([]);
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
        Loading lifestyle indices…
      </div>
    );
  }

  if (!gauges.length) {
    return null;
  }

  return <LifestyleIndices gauges={gauges} />;
}

