"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { useNewsZipStore } from "@/lib/store/news-zip-store";
import type { NewsMarketContext } from "./types";

type AskSkyIntroProps = {
  market: NewsMarketContext;
  onAsk: (query: string) => void;
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

export function AskSkyIntro({ market, onAsk }: AskSkyIntroProps) {
  const suggestedQuestions = useNewsZipStore((s) => s.suggestedQuestions);
  const briefingSponsor = useNewsZipStore((s) => s.briefingSponsor);
  const [query, setQuery] = useState("");
  const [typedLength, setTypedLength] = useState(0);

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
    setTypedLength(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTypedLength(i);
      if (i >= fullGreeting.length) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [fullGreeting]);

  const chips = chipsFromSuggestedQuestions(suggestedQuestions);

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAsk(trimmed);
  }

  const leadVisible = greetingLead.slice(0, typedLength);
  const brandVisible =
    typedLength > greetingLead.length
      ? greetingBrand.slice(0, typedLength - greetingLead.length)
      : "";
  const showCursor = typedLength < fullGreeting.length;

  return (
    <section className="relative mx-auto flex max-w-3xl flex-col items-center px-4 pb-16 pt-14 sm:pt-16">
      <div className="relative z-10 -mb-8 flex h-16 w-16 items-center justify-center sm:-mb-10 sm:h-20 sm:w-20">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-violet-400/30 blur-xl"
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-violet-500 via-indigo-500 to-sky-400 shadow-[0_0_36px_rgba(139,92,246,0.55)] sm:h-16 sm:w-16">
          <span
            aria-hidden
            className="absolute inset-0 animate-pulse rounded-full bg-white/15"
          />
          <svg
            viewBox="0 0 24 24"
            className="relative h-6 w-6 text-white drop-shadow-md sm:h-7 sm:w-7"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 2l1.2 6.3L19 12l-5.8 3.7L12 22l-1.2-6.3L5 12l5.8-3.7L12 2z" />
          </svg>
        </div>
      </div>

      <div className="w-full rounded-[1.75rem] border border-slate-200/90 bg-white px-5 pb-6 pt-12 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.18)] sm:rounded-[2rem] sm:px-8 sm:pb-8 sm:pt-14">
        <h1 className="text-center font-serif text-[1.65rem] leading-snug tracking-tight text-slate-900 sm:text-[2.15rem] sm:leading-tight">
          <span>{leadVisible}</span>
          <span className="font-sans font-bold text-violet-600">
            {brandVisible}
          </span>
          {showCursor ? (
            <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-violet-600 align-[-0.1em]" />
          ) : null}
        </h1>

        <form
          className="mt-7"
          onSubmit={(e) => {
            e.preventDefault();
            submit(query);
          }}
        >
          <label htmlFor="asksky-query" className="sr-only">
            Ask SKY
          </label>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-4 pr-1.5 shadow-sm transition focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-200/60">
            <input
              id="asksky-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Tap to ask anything about ${market.zipcode}...`}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:text-base"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-r from-violet-600 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:brightness-110 sm:px-5"
            >
              Ask SKY →
            </button>
          </div>
        </form>

        {sponsorName ? (
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
              <span className="font-semibold text-violet-600">{sponsorName}</span>
            )}
          </p>
        ) : null}
      </div>

      {chips.length > 0 ? (
        <div className="mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2.5">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setQuery(chip.query);
                submit(chip.query);
              }}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-left text-xs font-medium text-violet-600 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 sm:text-sm"
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
