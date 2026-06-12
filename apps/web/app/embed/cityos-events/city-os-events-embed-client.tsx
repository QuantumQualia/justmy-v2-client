"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CityOsEventsTagCloud } from "@/components/city-os/city-os-events-tag-cloud";
import { fetchCityOsEventsEmbed, type CityOsEventsResponseDto } from "@/lib/api/cityos-events";
import { hostFromReferrerUrl } from "@/lib/embed/referrer-domain";

function parseLimit(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(100, Math.max(1, n));
}

export function CityOsEventsEmbedClient({
  referrerHintDomain,
}: {
  /** Host parsed from the `Referer` header on the iframe document request (when present). */
  referrerHintDomain: string | null;
}) {
  const searchParams = useSearchParams();
  const domainFromQuery = searchParams.get("domain")?.trim() ?? "";
  const eventsLimit = parseLimit(searchParams.get("eventsLimit"));

  const needsDocumentReferrer = !domainFromQuery && !referrerHintDomain;
  const [fromClientReferrer, setFromClientReferrer] = React.useState<string | null>(null);
  const [documentReferrerProbeDone, setDocumentReferrerProbeDone] = React.useState(!needsDocumentReferrer);

  React.useEffect(() => {
    if (!needsDocumentReferrer) return;
    const h = hostFromReferrerUrl(typeof document !== "undefined" ? document.referrer : "");
    if (h) setFromClientReferrer(h);
    setDocumentReferrerProbeDone(true);
  }, [needsDocumentReferrer]);

  const effectiveDomain = (domainFromQuery || referrerHintDomain || fromClientReferrer || "").trim();

  const [data, setData] = React.useState<CityOsEventsResponseDto | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!effectiveDomain) {
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setData(null);
    setError(null);

    fetchCityOsEventsEmbed(effectiveDomain, eventsLimit)
      .then((res) => {
        if (!cancelled) setData(res);
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
  }, [effectiveDomain, eventsLimit]);

  if (!documentReferrerProbeDone) {
    return (
      <div className="flex min-h-[120px] items-center justify-center p-4 text-sm text-slate-400">Loading…</div>
    );
  }

  if (!effectiveDomain) {
    return (
      <div className="space-y-2 p-4 text-center text-sm text-slate-400">
        <p>
          Could not resolve a market domain. Use the same iframe on a newsstand page so the parent URL
          is sent as referrer, or add{" "}
          <code className="rounded bg-slate-800 px-1 text-slate-200">?domain=justmymemphis.com</code> for a fixed
          market.
        </p>
        <p className="text-xs text-slate-500">
          If the parent site strips referrers (strict Referrer-Policy), you must pass{" "}
          <code className="rounded bg-slate-800 px-1 text-slate-300">domain</code> in the iframe{" "}
          <code className="rounded bg-slate-800 px-1 text-slate-300">src</code>.
        </p>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-sm text-amber-200/90">{error}</div>;
  }

  if (effectiveDomain && data === null) {
    return (
      <div className="flex min-h-[120px] items-center justify-center p-4 text-sm text-slate-400">Loading…</div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <CityOsEventsTagCloud
      marketName={data.marketName}
      marketCity={data.marketCity}
      marketSiteTitle={data.marketSiteTitle}
      events={data.events}
      className="min-h-0 rounded-none"
    />
  );
}
