"use client";

import { create } from "zustand";

import type { SkyStreak } from "@/lib/news/fetch-sky-search";

type SkyStreakState = {
  /** `null` for guests or before the first load. */
  status: SkyStreak | null;
  loaded: boolean;
  set: (status: SkyStreak | null) => void;
  hydrate: (opts?: { force?: boolean }) => Promise<void>;
};

export const useSkyStreakStore = create<SkyStreakState>((set, get) => ({
  status: null,
  loaded: false,
  set: (status) => set({ status, loaded: true }),
  hydrate: async (opts) => {
    if (get().loaded && !opts?.force) return;
    try {
      const res = await fetch("/api/news/sky/streak", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        set({ status: null, loaded: true });
        return;
      }
      const data = (await res.json()) as SkyStreak;
      set({ status: typeof data?.streak === "number" ? data : null, loaded: true });
    } catch {
      set({ status: null, loaded: true });
    }
  },
}));
