"use client";

import * as React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { RadarPanel, type RadarPanelData } from "@/components/weather/radar-panel";
import { fetchWeatherRadar, type WeatherRadarResponseDto } from "@/lib/api/weather";

interface RadarPanelBlockProps {
  block: PageBlock;
}

function mapDtoToRadarData(dto: WeatherRadarResponseDto): RadarPanelData {
  return {
    precipTileUrlTemplate: dto.precipTileUrlTemplate,
    lat: dto.lat,
    lon: dto.lon,
    locationName: dto.locationName,
  };
}

/**
 * CMS block that renders the Radar – Visual Truth panel.
 * Fetches precipitation tiles centered on the signed-in user's profile zip.
 */
export function RadarPanelBlock({}: RadarPanelBlockProps) {
  const [data, setData] = React.useState<RadarPanelData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const dto = await fetchWeatherRadar();
        if (!cancelled) {
          setData(mapDtoToRadarData(dto));
        }
      } catch (err) {
        console.error("Failed to load weather radar:", err);
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
      <div className="rounded-3xl border border-slate-900 bg-slate-950/70 px-4 py-3 text-sm text-slate-400">
        Loading radar…
      </div>
    );
  }

  // When no radar data, fall back to the built-in placeholder in RadarPanel by passing null.
  if (!data) {
    return <RadarPanel data={null} />;
  }

  return <RadarPanel data={data} />;
}

