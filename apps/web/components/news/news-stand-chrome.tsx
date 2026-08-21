"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  fallbackMarketFromZip,
  marketDtoToContext,
} from "@/components/news/asksky/market-context";
import { NewsMarketNav } from "@/components/news/asksky/news-market-nav";
import type { NewsMarketContext } from "@/components/news/asksky/types";
import { isLikelyHandlePath } from "@/lib/mycard/handle-route";
import { resolveMarketForZip } from "@/lib/news/resolve-market-zip";
import { useNewsNavPageStore } from "@/lib/store/news-nav-page-store";
import { useNewsZipStore } from "@/lib/store/news-zip-store";
import { useProfileStore } from "@/lib/store/profile-store";

import { cn } from "@workspace/ui/lib/utils";

/**
 * Persistent NewsSTAND header for every page on a news host.
 * Market-page conversation handlers register through `useNewsNavPageStore`.
 */
export function NewsStandChrome() {
  const router = useRouter();
  const pathname = usePathname();
  const hideOnMobile = isLikelyHandlePath(pathname);
  const [market, setMarket] = useState<NewsMarketContext | null>(null);

  const storedMarket = useNewsZipStore((s) => s.market);
  const storedZip = useNewsZipStore((s) => s.zipcode);
  const hasHydrated = useNewsZipStore((s) => s.hasHydrated);
  const persistMarket = useNewsZipStore((s) => s.setMarket);
  const profileId = useProfileStore((s) => s.data.id);
  const profileZip = useProfileStore((s) => s.data.zipCode);

  const onNewChat = useNewsNavPageStore((s) => s.onNewChat);
  const onOpenConversation = useNewsNavPageStore((s) => s.onOpenConversation);
  const onConversationDeleted = useNewsNavPageStore((s) => s.onConversationDeleted);
  const onAuthSuccess = useNewsNavPageStore((s) => s.onAuthSuccess);
  const activeConversationId = useNewsNavPageStore((s) => s.activeConversationId);

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
    const markReady = () => {
      useNewsZipStore.getState().setHasHydrated(true);
    };
    if (useNewsZipStore.persist.hasHydrated()) {
      markReady();
      return;
    }
    return useNewsZipStore.persist.onFinishHydration(markReady);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
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
        const ctx = marketDtoToContext(primary, zip);
        persistMarket(ctx);
        setMarket(ctx);
      })
      .catch(() => {
        /* keep zip fallback */
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, storedMarket, storedZip, profileId, profileZip, persistMarket]);

  if (!market) {
    return (
      <header
        className={cn(
          "sticky top-0 z-40 h-14 border-b border-slate-200/80 bg-[#f3f4f6]/90",
          hideOnMobile && "max-lg:hidden",
        )}
      />
    );
  }

  return (
    <div className={cn("sticky top-0 z-40", hideOnMobile && "max-lg:hidden")}>
      <NewsMarketNav
        market={market}
        sticky={false}
        onNewChat={() => {
          if (onNewChat) onNewChat();
          else router.push("/news");
        }}
        onOpenConversation={onOpenConversation}
        onConversationDeleted={onConversationDeleted}
        onAuthSuccess={onAuthSuccess}
        activeConversationId={activeConversationId ?? null}
      />
    </div>
  );
}
