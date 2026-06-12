import * as React from "react";
import { CityOsEventsTagCloud } from "./city-os-events-widget";
import type { CityOsEventsResponseDto } from "./types";

export function CityOsInlineRoot({
  apiOrigin,
  domain,
  eventsLimit,
}: {
  apiOrigin: string;
  domain: string;
  eventsLimit?: number;
}) {
  const [data, setData] = React.useState<CityOsEventsResponseDto | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const qs = new URLSearchParams({ domain: domain.trim() });
    if (eventsLimit != null && Number.isFinite(eventsLimit)) {
      qs.set("eventsLimit", String(Math.min(100, Math.max(1, Math.floor(eventsLimit)))));
    }

    fetch(`${apiOrigin}/api/embed/cityos-events?${qs.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as CityOsEventsResponseDto & { message?: string };
        if (!res.ok) {
          throw new Error(typeof json.message === "string" ? json.message : `CityOS events failed (${res.status})`);
        }
        return json;
      })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiOrigin, domain, eventsLimit]);

  if (error) {
    return <div className="p-4 text-center text-sm text-amber-200/90">{error}</div>;
  }

  if (!data) {
    return (
      <div className="flex min-h-[120px] items-center justify-center bg-[linear-gradient(to_bottom_right,#020618,#0a1628,#0f172b)] p-4 text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <CityOsEventsTagCloud
      marketName={data.marketName}
      marketCity={data.marketCity}
      marketSiteTitle={data.marketSiteTitle}
      events={data.events}
      className="w-full max-w-full"
    />
  );
}
