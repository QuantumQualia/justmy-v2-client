"use client";

import * as React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { LocalDealsHook } from "@/components/daily-drop/local-deals-hook";
import type { LocalDeal } from "@/components/daily-drop/types";
import { fetchDailyDropDeals } from "@/lib/api/daily-drop";
import { isAuthenticated } from "@/lib/services/session";
import { PlaceholderPanel } from "@/components/common/placeholder-panel";

interface LocalDealsBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the Daily Drop Local Deals hook.
 * Fetches local deals for the signed-in user; when unavailable, shows a placeholder.
 */
export function LocalDealsBlock({}: LocalDealsBlockProps) {
  const [deals, setDeals] = React.useState<LocalDeal[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [cityName, setCityName] = React.useState<string | undefined>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [hadError, setHadError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!(await isAuthenticated())) {
          if (!cancelled) {
            setHadError(true);
          }
          return;
        }

        const res = await fetchDailyDropDeals();
        if (!cancelled) {
          setDeals(res.deals || []);
          setTotalCount(res.totalCount ?? 0);
          setCityName(res.cityName || undefined);
        }
      } catch (err) {
        console.error("Failed to load Daily Drop deals:", err);
        if (!cancelled) {
          setHadError(true);
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
    return <PlaceholderPanel text="Loading local deals…" />;
  }

  if (hadError) {
    return <PlaceholderPanel text="Daily Drop – Local Deals Coming Soon" />;
  }

  const labelCity = cityName || "your city";
  const browseAllLabel = `Browse All ${totalCount}+ Local Deals in ${labelCity}`;

  // LocalDealsHook already has its own empty state when no deals are available.
  return (
    <LocalDealsHook
      title="Deals"
      deals={deals}
      browseAllHref="/deals"
      browseAllLabel={browseAllLabel}
    />
  );
}

