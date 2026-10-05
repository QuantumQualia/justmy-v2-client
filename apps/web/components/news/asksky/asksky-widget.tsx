"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { AskSkyGrowTextarea } from "@/components/asksky/asksky-grow-textarea";
import { AskSkyConversation } from "@/components/news/asksky/asksky-results";
import { AskSkyStreakLine } from "@/components/news/asksky/asksky-streak";
import type { AskSkyTurn, NewsMarketContext } from "@/components/news/asksky/types";
import {
  useNewsVisitor,
  useTimeOfDayGreeting,
} from "@/components/news/home/use-news-visitor";
import { useNewsZipStore } from "@/lib/store/news-zip-store";
import { Button } from "@workspace/ui/components/button";

type AskSkyWidgetProps = {
  market: NewsMarketContext;
  turns: AskSkyTurn[];
  onAsk: (query: string) => void;
  onNewChat: () => void;
  disabled?: boolean;
};

const BRIEFING_FALLBACK =
  "Ask Sky anything about what's open, what happened, and what's coming up around you.";

function heroHeadline(firstName: string | null, marketName: string | null) {
  const market = marketName?.trim() || "";
  if (firstName && market) {
    return { lead: `Hey ${firstName}, `, emphasis: `here's ${market} right now.` };
  }
  if (market) {
    return { lead: "Here's ", emphasis: `${market} right now.` };
  }
  return { lead: "Here's what's happening right now.", emphasis: "" };
}

/**
 * AskSKY hero — one layout for signed-in and signed-out visitors.
 * The composer and conversation path are unchanged.
 */
export function AskSkyWidget({
  market,
  turns,
  onAsk,
  onNewChat,
  disabled = false,
}: AskSkyWidgetProps) {
  const suggestedQuestions = useNewsZipStore((s) => s.suggestedQuestions);
  const briefingParagraph = useNewsZipStore((s) => s.briefingParagraph);
  const { firstName } = useNewsVisitor();
  const greeting = useTimeOfDayGreeting();
  const [query, setQuery] = useState("");
  const hasConversation = turns.length > 0;

  const marketName = market.marketName?.trim() || market.city?.trim() || "";
  const headline = heroHeadline(firstName, marketName || null);
  const paragraph = briefingParagraph?.trim() || BRIEFING_FALLBACK;
  const chips = suggestedQuestions.slice(0, 3);

  function submit(value: string) {
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuery("");
    onAsk(trimmed);
  }

  return (
    <section
      className="relative mx-auto flex w-full min-w-0 max-w-6xl flex-col items-center px-3 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16"
      data-asksky-theme="light"
    >
      {greeting ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {greeting}
        </p>
      ) : (
        <p className="h-4" aria-hidden />
      )}

      <h1 className="mt-4 max-w-3xl text-center font-serif text-[1.85rem] leading-tight tracking-tight text-foreground sm:text-5xl">
        {headline.lead}
        {headline.emphasis ? <span className="text-primary">{headline.emphasis}</span> : null}
      </h1>

      {!hasConversation ? (
        <p className="mt-5 max-w-2xl text-center text-sm italic leading-relaxed text-muted-foreground sm:text-base">
          {paragraph}
        </p>
      ) : null}

      <div className={`mt-8 flex w-full min-h-0 min-w-0 flex-col ${hasConversation ? "" : "max-w-3xl"}`}>
        {hasConversation ? (
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="asksky-sky-brand text-lg">AskSKY!</p>
              <AskSkyStreakLine className="mt-0.5" />
            </div>
            <Button type="button" variant="outline" className="shrink-0 rounded-full" onClick={onNewChat}>
              New chat
            </Button>
          </div>
        ) : null}

        {!hasConversation ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(query);
            }}
          >
            <label htmlFor="asksky-query" className="sr-only">
              AskSKY!
            </label>
            <div className="flex flex-col gap-2 justmy-corners-lg border border-border bg-card p-1.5 pl-4 shadow-card transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/60 sm:flex-row sm:items-end">
              <AskSkyGrowTextarea
                chrome={false}
                id="asksky-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Ask anything about ${market.zipcode}…`}
                disabled={disabled}
                className="min-h-10 bg-transparent px-2 py-2.5 text-base text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:px-0 sm:py-2 md:text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit(query);
                  }
                }}
              />
              <button
                type="submit"
                disabled={disabled}
                className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand-gradient px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
              >
                AskSKY!
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </form>
        ) : (
          <div className="flex h-auto max-h-[min(72vh,48rem)] min-h-0 w-full flex-col overflow-hidden justmy-corners-xl border border-border bg-card shadow-card">
            <AskSkyConversation
              market={market}
              turns={turns}
              onAsk={onAsk}
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {!hasConversation && chips.length > 0 ? (
        <div className="mt-4 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 sm:mt-5 sm:gap-2.5">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={disabled}
              onClick={() => submit(chip)}
              className="inline-flex max-w-full items-center rounded-full border border-border bg-card px-3.5 py-2 text-sm text-foreground transition hover:border-primary/30 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="min-w-0 truncate">{chip}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
