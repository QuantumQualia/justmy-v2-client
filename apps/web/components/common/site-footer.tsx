"use client";

import { useEffect, useState } from "react";

import { AskSkyFooter } from "@/components/news/asksky/asksky-footer";
import {
  fallbackMarketFromZip,
  marketDtoToContext,
} from "@/components/news/asksky/market-context";
import type { NewsMarketContext } from "@/components/news/asksky/types";
import { resolveMarketForZip } from "@/lib/news/resolve-market-zip";
import { useNewsZipStore } from "@/lib/store/news-zip-store";
import { useProfileStore } from "@/lib/store/profile-store";

/**
 * Public-page footer. News hosts use the visitor's market; other pages use the same links.
 */
export function SiteFooter({ newsHost }: { newsHost: boolean }) {
  const [market, setMarket] = useState<NewsMarketContext | null>(null);
  const storedMarket = useNewsZipStore((s) => s.market);
  const storedZip = useNewsZipStore((s) => s.zipcode);
  const hasHydrated = useNewsZipStore((s) => s.hasHydrated);
  const persistMarket = useNewsZipStore((s) => s.setMarket);
  const profileId = useProfileStore((s) => s.data.id);
  const profileZip = useProfileStore((s) => s.data.zipCode);

  useEffect(() => {
    if (!newsHost) return;
    const markReady = () => {
      useNewsZipStore.getState().setHasHydrated(true);
    };
    if (useNewsZipStore.persist.hasHydrated()) {
      markReady();
      return;
    }
    return useNewsZipStore.persist.onFinishHydration(markReady);
  }, [newsHost]);

  useEffect(() => {
    if (!newsHost || !hasHydrated) return;
    if (storedMarket) {
      setMarket(storedMarket);
      return;
    }
    const zip = (storedZip || (profileId ? profileZip : "") || "").trim().slice(0, 5);
    setMarket(fallbackMarketFromZip(zip));
    if (!zip) return;

    let cancelled = false;
    void resolveMarketForZip(zip)
      .then((primary) => {
        if (cancelled || !primary) return;
        const next = marketDtoToContext(primary, zip);
        persistMarket(next);
        setMarket(next);
      })
      .catch(() => {
        /* keep the zip fallback */
      });

    return () => {
      cancelled = true;
    };
  }, [newsHost, hasHydrated, storedMarket, storedZip, profileId, profileZip, persistMarket]);

  return (
    <div className="mt-auto">
      <AskSkyFooter market={newsHost ? market : null} />
    </div>
  );
}
