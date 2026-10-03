"use client";

import { Instrument_Serif } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AskSkyClaimCta } from "@/components/news/asksky/asksky-claim-cta";
import { DotClaimModal } from "@/components/news/asksky/dot-claim-modal";
import { AskSkyEventsCarousel } from "@/components/news/asksky/asksky-events-carousel";
import { CommunityReel } from "@/components/news/home/community-reel";
import { NewsstandTools } from "@/components/news/home/newsstand-tools";
import { SponsorSpotlight } from "@/components/news/home/sponsor-spotlight";
import { WhatsOnTheStand } from "@/components/news/home/whats-on-the-stand";
import { WinWithSky } from "@/components/news/home/win-with-sky";
import { mapSkySearchToAnswer, turnsFromSkyMessages } from "@/components/news/asksky/map-sky-search";
import { marketDtoToContext } from "@/components/news/asksky/market-context";
import { NewsMarketNav } from "@/components/news/asksky/news-market-nav";
import { AskSkyWidget } from "@/components/news/asksky/asksky-widget";
import type { AskSkyTurn } from "@/components/news/asksky/types";
import { ApiClientError } from "@/lib/api-client";
import { useNewsHost } from "@/lib/news/news-host-context";
import { useNewsNavPageStore } from "@/lib/store/news-nav-page-store";
import { marketSiteToDomain } from "@/lib/news/fetch-daily-audio-briefing";
import {
  claimSkyConversation,
  type SkyMeConversationDetail,
} from "@/lib/news/fetch-sky-conversations";
import { fetchSkySearch } from "@/lib/news/fetch-sky-search";
import { resolveMarketForZip } from "@/lib/news/resolve-market-zip";
import type { AuthResponse } from "@/lib/services/auth";
import { useNewsFavoritesStore } from "@/lib/store/news-favorites-store";
import { useNewsRecentsStore } from "@/lib/store/news-recents-store";
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
export function NewsMarketPageClient({
  zipcode,
  domain,
}: {
  zipcode: string;
  domain?: string | null;
}) {
  const newsHost = useNewsHost();
  const market = useNewsZipStore((s) => s.market);
  const setMarket = useNewsZipStore((s) => s.setMarket);
  const clearZipcode = useNewsZipStore((s) => s.clearZipcode);

  const domainKey = domain ? marketSiteToDomain(domain) ?? "" : "";
  const marketMatchesDomain =
    Boolean(domainKey) &&
    market != null &&
    marketSiteToDomain(market.site) === domainKey;
  const marketMatchesZip =
    market != null &&
    market.zipcode.trim().slice(0, 5) === zipcode.trim().slice(0, 5);
  const marketReady = domain ? marketMatchesDomain : marketMatchesZip;

  const [loadState, setLoadState] = useState<LoadState>(() =>
    marketReady ? "ready" : "loading",
  );
  const [turns, setTurns] = useState<AskSkyTurn[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(
    null,
  );
  const [claimOpen, setClaimOpen] = useState(false);
  const threadRef = useRef<SkyThread | null>(null);
  const askInFlightRef = useRef(false);
  const loadedDomainRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("claim") === "1") {
      setClaimOpen(true);
    }
  }, []);

  useEffect(() => {
    // Sponsor/stand only fire when marketId is set. Never skip resolve if it's missing
    // (e.g. an older localStorage market shape), or those sections never call the API.
    const hasMarketId = typeof market?.marketId === "number" && market.marketId > 0;
    if (domainKey && loadedDomainRef.current === domainKey && marketMatchesDomain && hasMarketId) {
      setLoadState("ready");
      return;
    }
    if (!domain && marketMatchesZip && hasMarketId) {
      setLoadState("ready");
      return;
    }

    let cancelled = false;
    setLoadState("loading");
    setTurns([]);
    threadRef.current = null;
    setActiveConversationId(null);

    const loadMarket = domain
      ? fetch(`/api/news/markets/by-site/${encodeURIComponent(domain)}`).then(async (res) => {
          if (!res.ok) return null;
          return res.json();
        })
      : resolveMarketForZip(zipcode);

    Promise.resolve(loadMarket)
      .then((primary) => {
        if (cancelled) return;
        if (!primary) {
          toast.error("No market found");
          clearZipcode();
          setLoadState("error");
          return;
        }
        setMarket(
          marketDtoToContext(
            primary,
            domain ? primary.zipcodes?.[0]?.zipcode : zipcode || primary.zipcodes?.[0]?.zipcode,
          ),
        );
        if (domainKey) loadedDomainRef.current = domainKey;
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
  }, [
    zipcode,
    domain,
    domainKey,
    marketMatchesDomain,
    marketMatchesZip,
    market?.marketId,
    setMarket,
    clearZipcode,
  ]);

  async function handleAsk(nextQuery: string) {
    const trimmed = nextQuery.trim();
    if (!trimmed || askInFlightRef.current) return;

    const activeMarket = marketReady ? market : null;
    if (!activeMarket?.marketId) return;

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
      setActiveConversationId(response.conversationId);
      useNewsRecentsStore.getState().upsert({
        id: response.conversationId,
        title: trimmed,
      });

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
    setActiveConversationId(null);
    askInFlightRef.current = false;
    setIsSearching(false);
  }

  function handleOpenConversation(detail: SkyMeConversationDetail) {
    threadRef.current = {
      conversationId: detail.conversationId,
      visitorToken: detail.visitorToken?.trim() || "",
    };
    setActiveConversationId(detail.conversationId);
    setTurns(turnsFromSkyMessages(detail.messages));
    askInFlightRef.current = false;
    setIsSearching(false);
  }

  function handleConversationDeleted(id: number) {
    if (activeConversationId === id) {
      handleNewChat();
    }
  }

  async function handleAuthSuccess(_response: AuthResponse) {
    void useNewsFavoritesStore.getState().hydrate({ force: true });
    const thread = threadRef.current;
    if (thread?.conversationId && thread.visitorToken) {
      try {
        await claimSkyConversation({
          conversationId: thread.conversationId,
          visitorToken: thread.visitorToken,
        });
      } catch {
        /* visitor thread stays local until the next authenticated search */
      }
    }
    void useNewsRecentsStore.getState().hydrate(market?.marketId, { force: true });
  }

  useEffect(() => {
    if (!newsHost) return;
    useNewsNavPageStore.getState().setBindings({
      onNewChat: handleNewChat,
      onOpenConversation: handleOpenConversation,
      onConversationDeleted: handleConversationDeleted,
      onAuthSuccess: handleAuthSuccess,
      activeConversationId,
    });
    return () => {
      useNewsNavPageStore.getState().clearBindings();
    };
  }, [newsHost, activeConversationId]);

  const activeMarket = marketReady ? market : null;

  return (
    <div
      className={cn(
        instrumentSerif.variable,
        "relative min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-background text-foreground",
        "[&_.font-serif]:font-[family-name:var(--font-asksky-serif),ui-serif,Georgia,serif]",
      )}
    >
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
            {newsHost ? null : (
              <NewsMarketNav
                market={activeMarket}
                onNewChat={handleNewChat}
                onOpenConversation={handleOpenConversation}
                activeConversationId={activeConversationId}
                onConversationDeleted={handleConversationDeleted}
                onAuthSuccess={handleAuthSuccess}
              />
            )}

            <AskSkyWidget
              market={activeMarket}
              turns={turns}
              onAsk={handleAsk}
              onNewChat={handleNewChat}
              disabled={isSearching}
            />
            <SponsorSpotlight
              market={activeMarket}
              placement="newsstand"
              eyebrow="Your NewsSTAND is brought to you by"
            />
            <WhatsOnTheStand market={activeMarket} />
            <AskSkyEventsCarousel market={activeMarket} />
            <WinWithSky market={activeMarket} />
            <SponsorSpotlight
              market={activeMarket}
              placement="prize"
              eyebrow="Win with Sky! is brought to you by"
              showPrizeProgress
            />
            <NewsstandTools />
            <CommunityReel market={activeMarket} />
            <AskSkyClaimCta market={activeMarket} onClaim={() => setClaimOpen(true)} />
            <DotClaimModal
              open={claimOpen}
              onOpenChange={setClaimOpen}
              defaultZip={activeMarket.zipcode || zipcode}
            />
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
      <p className="text-lg font-semibold text-foreground">{title}</p>
      {detail ? (
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      ) : null}
      <button
        type="button"
        onClick={() => clearZipcode()}
        className="mt-6 text-sm font-medium text-primary transition hover:text-primary"
      >
        Back to JustMy News
      </button>
    </div>
  );
}
