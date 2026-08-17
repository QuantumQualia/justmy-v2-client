"use client";

import { MessageCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { AskSkyConversation } from "@/components/news/asksky/asksky-results";
import type { AskSkyTurn, NewsMarketContext } from "@/components/news/asksky/types";
import { useNewsZipStore } from "@/lib/store/news-zip-store";

type AskSkyWidgetProps = {
  market: NewsMarketContext;
  turns: AskSkyTurn[];
  onAsk: (query: string) => void;
  onNewChat: () => void;
  disabled?: boolean;
};

type PromptChip = {
  id: string;
  label: string;
  query: string;
};

function chipsFromSuggestedQuestions(questions: string[]): PromptChip[] {
  return questions.map((question, index) => ({
    id: `suggested-${index}`,
    label: question,
    query: question,
  }));
}

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

/**
 * AskSKY conversational widget — intro chrome stays visible;
 * results scroll inside the card, not the page.
 */
export function AskSkyWidget({
  market,
  turns,
  onAsk,
  onNewChat,
  disabled = false,
}: AskSkyWidgetProps) {
  const suggestedQuestions = useNewsZipStore((s) => s.suggestedQuestions);
  const briefingSponsor = useNewsZipStore((s) => s.briefingSponsor);
  const [query, setQuery] = useState("");
  const [typedLength, setTypedLength] = useState(0);
  const hasConversation = turns.length > 0;

  const city = market.city || market.marketName;
  const greetingLead = `Hey ${city}, stop Googling. Start living. `;
  const greetingBrand = "AskSKY!";
  const fullGreeting = greetingLead + greetingBrand;

  const sponsorName = firstNonEmpty(
    briefingSponsor?.companyName,
    briefingSponsor?.name,
  );
  const sponsorCta =
    firstNonEmpty(briefingSponsor?.cta) ?? "Presented by";
  const sponsorLink = firstNonEmpty(
    briefingSponsor?.targetUrl,
    briefingSponsor?.targetLink,
  );

  useEffect(() => {
    if (hasConversation) {
      setTypedLength(fullGreeting.length);
      return;
    }
    setTypedLength(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTypedLength(i);
      if (i >= fullGreeting.length) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [fullGreeting, hasConversation]);

  const chips = chipsFromSuggestedQuestions(suggestedQuestions);

  function submit(value: string) {
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuery("");
    onAsk(trimmed);
  }

  const leadVisible = greetingLead.slice(0, typedLength);
  const brandVisible =
    typedLength > greetingLead.length
      ? greetingBrand.slice(0, typedLength - greetingLead.length)
      : "";
  const showCursor = !hasConversation && typedLength < fullGreeting.length;

  return (
    <section
      className={`relative mx-auto flex w-full min-w-0 flex-col items-center px-3 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16 max-w-6xl`}
    >
      <div className="relative z-10 -mb-8 flex h-16 w-16 items-center justify-center sm:-mb-10 sm:h-20 sm:w-20">
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-violet-400/25 blur-xl"
        />
        <Image
          src="/images/logo.png"
          alt="AskSKY!"
          width={64}
          height={64}
          className="relative h-14 w-14 rounded-2xl object-contain shadow-[0_0_36px_rgba(139,92,246,0.45)] sm:h-16 sm:w-16"
          priority
        />
      </div>

      <div
        className={`flex w-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/90 bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.18)] sm:rounded-[2rem] ${
          hasConversation
            ? "h-auto max-h-[min(68svh,34rem)] sm:h-[min(72vh,44rem)] sm:max-h-none lg:h-[min(75vh,48rem)]"
            : ""
        }`}
      >
        <div
          className={`min-w-0 shrink-0 px-4 pt-11 sm:px-8 sm:pt-14 ${
            hasConversation ? "pb-3" : "pb-5 sm:pb-8"
          }`}
        >
          <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
            <h1
              className={`min-w-0 flex-1 break-words font-serif leading-snug tracking-tight text-slate-900 ${
                hasConversation
                  ? "text-left text-lg sm:text-2xl"
                  : "text-center text-[1.45rem] sm:text-[2.15rem] sm:leading-tight"
              }`}
            >
              <span>{leadVisible}</span>
              <span className="font-sans font-bold text-violet-600">
                {brandVisible}
              </span>
              {showCursor ? (
                <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-violet-600 align-[-0.1em]" />
              ) : null}
            </h1>
            {hasConversation ? (
              <button
                type="button"
                onClick={onNewChat}
                className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-100 sm:px-3 sm:text-xs"
              >
                New chat
              </button>
            ) : null}
          </div>

          {!hasConversation ? (
            <form
              className="mt-6 sm:mt-7"
              onSubmit={(e) => {
                e.preventDefault();
                submit(query);
              }}
            >
              <label htmlFor="asksky-query" className="sr-only">
                Ask SKY
              </label>
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-200/60 sm:flex-row sm:items-center sm:rounded-full sm:py-1.5 sm:pl-4 sm:pr-1.5">
                <input
                  id="asksky-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Ask anything about ${market.zipcode}…`}
                  disabled={disabled}
                  className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 sm:px-0 sm:py-2 sm:text-base"
                />
                <button
                  type="submit"
                  disabled={disabled}
                  className="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-linear-to-r from-violet-600 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5"
                >
                  Ask SKY →
                </button>
              </div>
            </form>
          ) : null}

          {!hasConversation && sponsorName ? (
            <p className="mt-3 text-center text-xs text-slate-500 sm:text-[13px]">
              {sponsorCta}:{" "}
              {sponsorLink ? (
                <a
                  href={sponsorLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-violet-600 transition hover:text-violet-500 hover:underline"
                >
                  {sponsorName}
                </a>
              ) : (
                <span className="font-semibold text-violet-600">
                  {sponsorName}
                </span>
              )}
            </p>
          ) : null}
        </div>

        {hasConversation ? (
          <AskSkyConversation
            market={market}
            turns={turns}
            onAsk={onAsk}
            disabled={disabled}
          />
        ) : null}
      </div>

      {!hasConversation && chips.length > 0 ? (
        <div className="mt-4 flex w-full max-w-5xl flex-wrap items-center justify-center gap-2 sm:mt-5 sm:gap-2.5">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              disabled={disabled}
              onClick={() => submit(chip.query)}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-violet-600 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:px-3.5 sm:text-sm"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="min-w-0">{chip.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
