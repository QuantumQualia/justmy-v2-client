"use client";

import { AlertCircle, ArrowRight, Loader2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiClientError } from "@/lib/api-client";
import { isNewsHost } from "@/lib/hosts";
import { fetchMarketsByZip } from "@/lib/news/fetch-markets-by-zip";
import {
  hasMarketSite,
  isValidUsZip,
  normalizeMarketSiteUrl,
  pickPrimaryMarket,
} from "@/lib/news/market-routing";

export function NewsZipForm() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleaned = zip.trim();
    if (!isValidUsZip(cleaned)) {
      setError("Enter a valid US ZIP code (e.g. 38103).");
      return;
    }

    setLoading(true);
    try {
      const markets = await fetchMarketsByZip(cleaned);
      const primary = pickPrimaryMarket(markets);

      if (!primary) {
        const onNewsHost =
          typeof window !== "undefined" && isNewsHost(window.location.host);
        const path = onNewsHost ? `/${cleaned}` : `/news/${cleaned}`;
        router.push(path);
        return;
      }

      if (hasMarketSite(primary.site)) {
        const url = normalizeMarketSiteUrl(primary.site!);
        window.location.assign(url);
        return;
      }

      const onNewsHost =
        typeof window !== "undefined" && isNewsHost(window.location.host);
      const path = onNewsHost
        ? `/${primary.slug}`
        : `/news/${primary.slug}`;
      router.push(path);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Something went wrong looking up your market.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-left">
      <label htmlFor="zipcode" className="sr-only">
        Zip code
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MapPin
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30"
            aria-hidden
          />
          <input
            id="zipcode"
            name="zipcode"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="Enter your zip code"
            value={zip}
            onChange={(e) => {
              setZip(e.target.value.replace(/[^\d-]/g, ""));
              if (error) setError(null);
            }}
            maxLength={10}
            className="h-14 w-full rounded-xl border border-white/15 bg-black/40 pl-12 pr-4 text-lg tracking-wide text-white outline-none transition placeholder:text-base placeholder:tracking-normal placeholder:text-white/30 hover:border-white/25 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-60"
            disabled={loading}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "zip-error" : undefined}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-400 to-cyan-500 px-6 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Finding…
            </>
          ) : (
            <>
              Go
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </div>

      {error ? (
        <p
          id="zip-error"
          role="alert"
          className="flex items-start gap-2 text-sm text-red-400"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        <p className="text-xs text-white/40">
          We use your zip code only to find your local market.
        </p>
      )}
    </form>
  );
}
