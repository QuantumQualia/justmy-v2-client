"use client";

import * as React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { CityOsEventsTagCloud } from "@/components/city-os/city-os-events-tag-cloud";
import { fetchCityOsEventsEmbed, type CityOsEventsResponseDto } from "@/lib/api/cityos-events";
import { PlaceholderPanel } from "@/components/common/placeholder-panel";

function parseLimit(raw: unknown): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(100, Math.max(1, Math.floor(n)));
}

export function CityOsEventsBlock({ block }: { block: PageBlock }) {
  const domain = String(block.cityOsEventsDomain ?? block.domain ?? "").trim();
  const eventsLimit = parseLimit(block.cityOsEventsLimit ?? block.eventsLimit);

  const [data, setData] = React.useState<CityOsEventsResponseDto | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!domain) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCityOsEventsEmbed(domain, eventsLimit)
      .then((res) => {
        if (!cancelled) {
          setData(res);
        }
      })
      .catch((err: unknown) => {
        console.error("CityOS events load failed:", err);
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Could not load events.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [domain, eventsLimit]);

  if (!domain) {
    return (
      <PlaceholderPanel text="CityOS Events — set the market site domain in the block settings (e.g. justmymemphis.com)." />
    );
  }

  if (loading && !data) {
    return <PlaceholderPanel text="Loading CityOS events…" />;
  }

  if (error) {
    return <PlaceholderPanel text={`CityOS events — ${error}`} />;
  }

  if (!data) {
    return <PlaceholderPanel text="CityOS events — no data." />;
  }

  return (
    <CityOsEventsTagCloud
      marketName={data.marketName}
      marketCity={data.marketCity}
      marketSiteTitle={data.marketSiteTitle}
      events={data.events}
    />
  );
}
