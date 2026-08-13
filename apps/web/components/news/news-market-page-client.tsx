"use client";

import { Instrument_Serif } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AskSkyClaimCta } from "@/components/news/asksky/asksky-claim-cta";
import { AskSkyEventsCarousel } from "@/components/news/asksky/asksky-events-carousel";
import { AskSkyFooter } from "@/components/news/asksky/asksky-footer";
import { mapSkySearchToAnswer } from "@/components/news/asksky/map-sky-search";
import { marketDtoToContext } from "@/components/news/asksky/market-context";
import { NewsMarketNav } from "@/components/news/asksky/news-market-nav";
import { AskSkyWidget } from "@/components/news/asksky/asksky-widget";
import type { AskSkyTurn } from "@/components/news/asksky/types";
import { ApiClientError } from "@/lib/api-client";
import { marketSiteToDomain } from "@/lib/news/fetch-daily-audio-briefing";
import { fetchSkySearch } from "@/lib/news/fetch-sky-search";
import { resolveMarketForZip } from "@/lib/news/resolve-market-zip";
import { useNewsZipStore } from "@/lib/store/news-zip-store";
import { cn } from "@workspace/ui/lib/utils";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-asksky-serif",
  display: "swap",
});

type LoadState = "loading" | "ready" | "error";

type SkyThread = {
  conversationId: number;
  visitorToken: string;
};

/**
 * News market page — uses stored market when available; otherwise resolves by zip once.
 */
export function NewsMarketPageClient({ zipcode }: { zipcode: string }) {
  const market = useNewsZipStore((s) => s.market);
  const setMarket = useNewsZipStore((s) => s.setMarket);
  const clearZipcode = useNewsZipStore((s) => s.clearZipcode);

  const marketMatchesZip =
    market != null &&
    market.zipcode.trim().slice(0, 5) === zipcode.trim().slice(0, 5);

  const [loadState, setLoadState] = useState<LoadState>(() =>
    marketMatchesZip ? "ready" : "loading",
  );
  const [turns, setTurns] = useState<AskSkyTurn[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const threadRef = useRef<SkyThread | null>(null);
  const askInFlightRef = useRef(false);

  // News market UI is light while the app theme defaults to dark — force a light
  // viewport scrollbar so it doesn't clash with the page.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("news-light-html");
    body.classList.add("news-light-body");
    return () => {
      html.classList.remove("news-light-html");
      body.classList.remove("news-light-body");
    };
  }, []);

  useEffect(() => {
    if (marketMatchesZip) {
      setLoadState("ready");
      return;
    }

    let cancelled = false;
    setLoadState("loading");
    setTurns([]);
    threadRef.current = null;

    resolveMarketForZip(zipcode)
      .then((primary) => {
        if (cancelled) return;
        if (!primary) {
          toast.error("No market found");
          clearZipcode();
          return;
        }
        setMarket(marketDtoToContext(primary, zipcode));
        setLoadState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadState("error");
        toast.error(
          err instanceof ApiClientError
            ? err.message
            : "Failed to load market.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [zipcode, marketMatchesZip, setMarket, clearZipcode]);

  async function handleAsk(nextQuery: string) {
    const trimmed = nextQuery.trim();
    if (!trimmed || askInFlightRef.current) return;

    const activeMarket = marketMatchesZip ? market : null;
    if (!activeMarket) return;

    const turnId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    askInFlightRef.current = true;
    setIsSearching(true);
    setTurns((prev) => [
      ...prev,
      { id: turnId, query: trimmed, status: "loading" },
    ]);

    const thread = threadRef.current;

    try {
      const response = await fetchSkySearch({
        query: trimmed,
        zipCode: activeMarket.zipcode,
        domain: marketSiteToDomain(activeMarket.site),
        conversationId: thread?.conversationId,
        visitorToken: thread?.visitorToken,
      });

      if (response.visitorToken?.trim()) {
        threadRef.current = {
          conversationId: response.conversationId,
          visitorToken: response.visitorToken.trim(),
        };
      } else if (threadRef.current) {
        threadRef.current = {
          ...threadRef.current,
          conversationId: response.conversationId,
        };
      }

      const answer = mapSkySearchToAnswer(response);
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === turnId
            ? { ...turn, status: "ready", answer, errorMessage: undefined }
            : turn,
        ),
      );
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "AskSKY search failed. Please try again.";
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === turnId
            ? { ...turn, status: "error", errorMessage: message }
            : turn,
        ),
      );
      toast.error(message);
    } finally {
      askInFlightRef.current = false;
      setIsSearching(false);
    }
  }

  function handleNewChat() {
    setTurns([]);
    threadRef.current = null;
    askInFlightRef.current = false;
    setIsSearching(false);
  }

  const activeMarket = marketMatchesZip ? market : null;

  return (
    <div
      className={cn(
        instrumentSerif.variable,
        "relative min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-[#f7f6fb] text-slate-900",
        "[&_.font-serif]:font-[family-name:var(--font-asksky-serif),ui-serif,Georgia,serif]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-violet-300/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-32 h-96 w-96 rounded-full bg-sky-300/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-200/20 blur-3xl"
      />

      <div className="relative z-10 min-w-0 max-w-full overflow-x-hidden">
        {loadState === "loading" ? (
          <MarketStatusMessage title="Loading market…" />
        ) : loadState === "error" ? (
          <MarketStatusMessage
            title="Couldn't load market"
            detail="Something went wrong loading this market. Please try again."
          />
        ) : activeMarket ? (
          <>
            <NewsMarketNav market={activeMarket} />

            <AskSkyWidget
              market={activeMarket}
              turns={turns}
              onAsk={handleAsk}
              onNewChat={handleNewChat}
              disabled={isSearching}
            />

            <AskSkyEventsCarousel market={activeMarket} />
            <AskSkyClaimCta market={activeMarket} />
            <AskSkyFooter market={activeMarket} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function MarketStatusMessage({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  const clearZipcode = useNewsZipStore((s) => s.clearZipcode);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-lg font-semibold text-slate-800">{title}</p>
      {detail ? (
        <p className="mt-2 text-sm text-slate-500">{detail}</p>
      ) : null}
      <button
        type="button"
        onClick={() => clearZipcode()}
        className="mt-6 text-sm font-medium text-violet-700 transition hover:text-violet-900"
      >
        Back to JustMy News
      </button>
    </div>
  );
}
