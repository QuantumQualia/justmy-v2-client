"use client";

import * as React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { TopNewsBriefing } from "@/components/daily-drop/top-news-briefing";
import type { DailyNewsItem } from "@/components/daily-drop/types";
import { fetchDailyDropBriefing } from "@/lib/api/daily-drop";
import { isAuthenticated } from "@/lib/services/session";
import { PlaceholderPanel } from "@/components/common/placeholder-panel";

interface TopNewsBriefingBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the Daily Drop Top News briefing.
 * Fetches news for the signed-in user's market; when unavailable, shows a placeholder.
 */
export function TopNewsBriefingBlock({}: TopNewsBriefingBlockProps) {
  const [items, setItems] = React.useState<DailyNewsItem[]>([]);
  const [marketName, setMarketName] = React.useState<string | undefined>();
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

        const res = await fetchDailyDropBriefing();
        if (!cancelled) {
          setItems(res.items || []);
          setMarketName(res.marketName || undefined);
        }
      } catch (err) {
        console.error("Failed to load Daily Drop briefing:", err);
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
    return <PlaceholderPanel text="Loading Daily Drop briefing…" />;
  }

  if (hadError) {
    return <PlaceholderPanel text="Daily Drop – Top News Coming Soon" />;
  }

  // TopNewsBriefing already includes its own "no news available" placeholder when items are empty.
  const title = marketName ? `Top News in ${marketName}` : "Top News";

  return <TopNewsBriefing title={title} items={items} myCityAppUrl="/lab/app-hub" />;
}

