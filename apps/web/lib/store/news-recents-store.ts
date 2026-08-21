"use client";

import { create } from "zustand";

import {
  fetchSkyConversations,
  type SkyMeConversationListItem,
} from "@/lib/news/fetch-sky-conversations";

type HydrateOptions = { force?: boolean };

type NewsRecentsState = {
  marketId: number | null;
  items: SkyMeConversationListItem[];
  status: "idle" | "loading" | "ready";
  hydrate: (marketId?: number, opts?: HydrateOptions) => Promise<void>;
  upsert: (item: Pick<SkyMeConversationListItem, "id"> & Partial<SkyMeConversationListItem>) => void;
  patch: (id: number, patch: Partial<SkyMeConversationListItem>) => void;
  remove: (id: number) => void;
  reset: () => void;
};

function marketKey(marketId?: number): number {
  return typeof marketId === "number" && marketId > 0 ? marketId : 0;
}

let hydrateInFlight: Promise<void> | null = null;
let hydrateInFlightKey: number | null = null;

export const useNewsRecentsStore = create<NewsRecentsState>((set, get) => ({
  marketId: null,
  items: [],
  status: "idle",
  reset: () => {
    hydrateInFlight = null;
    hydrateInFlightKey = null;
    set({ marketId: null, items: [], status: "idle" });
  },

  hydrate: async (marketId, opts) => {
    const key = marketKey(marketId);
    const force = opts?.force === true;
    if (!force && get().status === "ready" && get().marketId === key) return;
    if (hydrateInFlight && hydrateInFlightKey === key && !force) {
      await hydrateInFlight;
      return;
    }

    const run = (async () => {
      set({ status: "loading", marketId: key });
      try {
        const items = await fetchSkyConversations(key || undefined);
        set({ items, marketId: key, status: "ready" });
      } catch {
        if (get().marketId === key && get().status !== "ready") {
          set({ items: [], status: "idle" });
        }
      }
    })();

    hydrateInFlight = run;
    hydrateInFlightKey = key;
    try {
      await run;
    } finally {
      if (hydrateInFlight === run) {
        hydrateInFlight = null;
        hydrateInFlightKey = null;
      }
    }
  },

  upsert: (item) => {
    set((state) => {
      const existing = state.items.find((row) => row.id === item.id);
      const now = new Date().toISOString();
      const next: SkyMeConversationListItem = {
        id: item.id,
        title: existing?.title?.trim() ? existing.title : (item.title ?? existing?.title ?? null),
        updatedAt: item.updatedAt || now,
        createdAt: existing?.createdAt || item.createdAt || now,
      };
      return {
        items: [next, ...state.items.filter((row) => row.id !== item.id)],
        status: "ready",
      };
    });
  },

  patch: (id, patch) => {
    set((state) => ({
      items: state.items.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  },

  remove: (id) => {
    set((state) => ({
      items: state.items.filter((row) => row.id !== id),
    }));
  },
}));
