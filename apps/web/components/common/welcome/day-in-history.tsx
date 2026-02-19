"use client";

import * as React from "react";
import { aiService } from "@/lib/services/ai";
import type { DayInHistoryResponse } from "@/lib/services/ai";

interface DayInHistoryProps {
  /**
   * When true, only render the content block (no card wrapper).
   * Use inside GreetingCard or other containers. When false, render in its own card for standalone use.
   */
  embedded?: boolean;
}

/**
 * Day in History
 *
 * Minimalist, monochromatic text block for the "Legacy Briefing":
 * headline, history, takeaway, optional read-more link.
 * Fetches from ai/day-in-history (curated for innovation/leadership, not random trivia).
 */
export function DayInHistory({ embedded = false }: DayInHistoryProps) {
  const [data, setData] = React.useState<DayInHistoryResponse | null>(null);

  React.useEffect(() => {
    async function fetchDayInHistory() {
      try {
        const result = await aiService.getDayInHistory();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch day in history:", err);
      }
    }

    fetchDayInHistory();
  }, []);

  if (!data) {
    return null;
  }

  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wider text-white/60 mb-2">
        This Day in History
      </p>
      <p className="text-sm font-semibold text-white mb-1">{data.headline}</p>
      <p className="text-sm text-white/80 mb-2">{data.history}</p>
      <p className="text-sm text-white/90 italic">&ldquo;{data.takeaway}&rdquo;</p>
      {data.readMoreUrl && (
        <a
          href={data.readMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-sm text-white/70 hover:text-white underline underline-offset-2 transition-colors"
        >
          Read more
        </a>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="mt-6 pt-6 border-t border-white/10">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mb-6">
      <div className="rounded-2xl rounded-br-none border border-purple-500/30 bg-black/60 backdrop-blur-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(168,85,247,0.4)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">{content}</div>
      </div>
    </div>
  );
}
