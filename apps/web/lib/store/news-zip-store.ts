/**
 * News market preference — drives `/news` entry vs market detail.
 * Persists zip + market context to localStorage; mirrors zip to a cookie.
 * Session-only: Sky briefing sponsor + suggested AskSKY questions.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { NewsMarketContext } from "@/components/news/asksky/types";
import type { SkyAudioSponsor } from "@/lib/news/fetch-daily-audio-briefing";

export const NEWS_ZIP_COOKIE = "justmy_news_zip";
export const NEWS_ZIP_STORAGE_KEY = "justmy-news-zip";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

const EMPTY_BRIEFING = {
  briefingSponsor: null as SkyAudioSponsor | null,
  suggestedQuestions: [] as string[],
};

function writeZipCookie(zipcode: string | null) {
  if (typeof document === "undefined") return;

  if (!zipcode) {
    document.cookie = `${NEWS_ZIP_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }

  document.cookie = `${NEWS_ZIP_COOKIE}=${encodeURIComponent(zipcode)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

/** Fill newer fields for markets persisted before newer context fields existed. */
function normalizeMarket(market: NewsMarketContext): NewsMarketContext {
  const cleaned = market.zipcode.trim().slice(0, 5);
  const city = market.city?.trim() || null;
  const state = market.state?.trim() || null;
  const site = market.site?.trim() || null;
  const cityState =
    market.cityState?.trim() ||
    [city, state].filter(Boolean).join(", ") ||
    market.marketName;
  return {
    ...market,
    zipcode: cleaned,
    city,
    state,
    site,
    cityState,
    dailyAudioBriefingEnabled: Boolean(market.dailyAudioBriefingEnabled),
  };
}

function normalizeSuggestedQuestions(questions?: string[] | null): string[] {
  if (!Array.isArray(questions)) return [];
  return questions
    .map((q) => (typeof q === "string" ? q.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);
}

interface NewsZipStore {
  zipcode: string | null;
  market: NewsMarketContext | null;
  /** True after persist rehydration finishes (client only). */
  hasHydrated: boolean;
  /** Sky daily briefing sponsor for the active market (session only). */
  briefingSponsor: SkyAudioSponsor | null;
  /** AskSKY intro chips from the active slot's briefing (session only). */
  suggestedQuestions: string[];
  /** Save zip + resolved market together (preferred entry point). */
  setMarket: (market: NewsMarketContext) => void;
  /** Zip-only update — clears market so callers re-resolve if needed. */
  setZipcode: (zipcode: string) => void;
  clearZipcode: () => void;
  setHasHydrated: (value: boolean) => void;
  /** Write briefing extras from GET sky/daily-audio-briefing. */
  setBriefingExtras: (extras: {
    sponsor?: SkyAudioSponsor | null;
    suggestedQuestions?: string[] | null;
  }) => void;
  clearBriefingExtras: () => void;
}

export const useNewsZipStore = create<NewsZipStore>()(
  persist(
    (set) => ({
      zipcode: null,
      market: null,
      hasHydrated: false,
      ...EMPTY_BRIEFING,

      setMarket: (market) => {
        const next = normalizeMarket(market);
        writeZipCookie(next.zipcode);
        set({ zipcode: next.zipcode, market: next, ...EMPTY_BRIEFING });
      },

      setZipcode: (zipcode) => {
        const cleaned = zipcode.trim().slice(0, 5);
        writeZipCookie(cleaned);
        set({ zipcode: cleaned, market: null, ...EMPTY_BRIEFING });
      },

      clearZipcode: () => {
        writeZipCookie(null);
        set({ zipcode: null, market: null, ...EMPTY_BRIEFING });
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),

      setBriefingExtras: ({ sponsor, suggestedQuestions }) =>
        set({
          briefingSponsor: sponsor ?? null,
          suggestedQuestions: normalizeSuggestedQuestions(suggestedQuestions),
        }),

      clearBriefingExtras: () => set(EMPTY_BRIEFING),
    }),
    {
      name: NEWS_ZIP_STORAGE_KEY,
      partialize: (state) => ({
        zipcode: state.zipcode,
        market: state.market,
      }),
      merge: (persisted, current) => {
        const raw = (persisted ?? {}) as Partial<NewsZipStore>;
        return {
          ...current,
          ...raw,
          market: raw.market ? normalizeMarket(raw.market) : null,
          // Never hydrate briefing extras from localStorage
          ...EMPTY_BRIEFING,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state?.zipcode) {
          writeZipCookie(state.zipcode);
        }
      },
    },
  ),
);
