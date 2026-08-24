"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProfileStore } from "@/lib/store";
import { useBizOsProfile } from "@/components/biz-os/use-biz-os-profile";
import { useNewsZipStore } from "@/lib/store/news-zip-store";
import { resolveMarketForZip } from "@/lib/news/resolve-market-zip";
import {
  fallbackMarketFromZip,
  marketDtoToContext,
} from "@/components/news/asksky/market-context";
import { NewsMarketNav } from "@/components/news/asksky/news-market-nav";
import { BizOsSubnav } from "@/components/biz-os/biz-os-ui";
import { useNewsHost } from "@/lib/news/news-host-context";
import type { NewsMarketContext } from "@/components/news/asksky/types";
import { cn } from "@workspace/ui/lib/utils";

export function BizOsShell({ children }: { children: React.ReactNode }) {
  const newsHost = useNewsHost();
  const router = useRouter();
  const pathname = usePathname();
  const lockViewport = pathname === "/biz-os/onboard";
  const { isError } = useBizOsProfile();
  const [market, setMarket] = useState<NewsMarketContext | null>(null);

  const storedMarket = useNewsZipStore((s) => s.market);
  const storedZip = useNewsZipStore((s) => s.zipcode);
  const hasHydrated = useNewsZipStore((s) => s.hasHydrated);
  const persistMarket = useNewsZipStore((s) => s.setMarket);
  const profileZip = useProfileStore((s) => s.data.zipCode);

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
    if (isError) router.push("/login?redirect=/biz-os");
  }, [isError, router]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (storedMarket) {
      setMarket(storedMarket);
      return;
    }

    const zip = (storedZip || profileZip || "").trim().slice(0, 5);
    if (!zip) {
      setMarket(fallbackMarketFromZip(""));
      return;
    }

    let cancelled = false;
    setMarket(fallbackMarketFromZip(zip));
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
  }, [hasHydrated, storedMarket, storedZip, profileZip, persistMarket]);

  const chromeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chromeRef.current;
    if (!el) return;
    const apply = () => {
      document.documentElement.style.setProperty(
        "--biz-os-sticky-top",
        `${Math.round(el.getBoundingClientRect().bottom)}px`,
      );
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      document.documentElement.style.removeProperty("--biz-os-sticky-top");
    };
  }, [newsHost, market]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f3f0f8] text-slate-900">
      {newsHost ? (
        <div
          ref={chromeRef}
          className="sticky top-[var(--news-header-h,3.5rem)] z-30 shrink-0"
        >
          <BizOsSubnav />
        </div>
      ) : (
        <div ref={chromeRef} className="sticky top-0 z-40 shrink-0">
          {market ? (
            <NewsMarketNav
              market={market}
              sticky={false}
              onNewChat={() => router.push("/news")}
            />
          ) : (
            <header className="h-14 border-b border-slate-200/80 bg-white/90" />
          )}
          <BizOsSubnav />
        </div>
      )}

      <div
        className={cn(
          "mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-4 py-8",
          lockViewport && "overflow-hidden",
        )}
      >
        {children}
      </div>
    </div>
  );
}
