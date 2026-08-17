"use client";

import { create } from "zustand";

import {
  fetchProfileFavorites,
  isFavoriteItem,
  upsertProfileFavorite,
  type ProfileFavoriteItem,
  type ProfileFavoriteState,
} from "@/lib/news/fetch-profile-favorites";
import { tokenStorage } from "@/lib/storage/token-storage";

type FavoriteFlags = { liked: boolean; bookmarked: boolean };

type FavoritePreview = {
  name: string;
  slug?: string;
  photo?: string | null;
};

type NewsFavoritesState = {
  items: ProfileFavoriteItem[];
  byId: Record<number, FavoriteFlags>;
  hydrate: () => Promise<void>;
  toggle: (
    profileId: number,
    field: "liked" | "bookmarked",
    preview?: FavoritePreview,
  ) => Promise<void>;
  reset: () => void;
};

function toMap(items: ProfileFavoriteItem[]): Record<number, FavoriteFlags> {
  const next: Record<number, FavoriteFlags> = {};
  for (const item of items) {
    next[item.profileId] = {
      liked: item.liked,
      bookmarked: item.bookmarked,
    };
  }
  return next;
}

function applyResult(
  items: ProfileFavoriteItem[],
  result: ProfileFavoriteItem | ProfileFavoriteState,
  preview?: FavoritePreview,
): ProfileFavoriteItem[] {
  const liked = result.liked;
  const bookmarked = result.bookmarked;
  if (!liked && !bookmarked) {
    return items.filter((item) => item.profileId !== result.profileId);
  }
  if (isFavoriteItem(result)) {
    const without = items.filter((item) => item.profileId !== result.profileId);
    return [result, ...without];
  }
  const existing = items.find((item) => item.profileId === result.profileId);
  const nextItem: ProfileFavoriteItem = {
    profileId: result.profileId,
    name: existing?.name || preview?.name || "Saved business",
    slug: existing?.slug || preview?.slug || "",
    photo: existing?.photo ?? preview?.photo ?? null,
    liked,
    bookmarked,
    updatedAt: new Date().toISOString(),
  };
  const without = items.filter((item) => item.profileId !== result.profileId);
  return [nextItem, ...without];
}

let writeChain: Promise<void> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export const useNewsFavoritesStore = create<NewsFavoritesState>((set, get) => ({
  items: [],
  byId: {},
  reset: () => set({ items: [], byId: {} }),

  hydrate: async () => {
    await enqueue(async () => {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ items: [], byId: {} });
        return;
      }
      try {
        const items = await fetchProfileFavorites();
        set({ items, byId: toMap(items) });
      } catch {
        /* keep current list */
      }
    });
  },

  toggle: async (profileId, field, preview) => {
    await enqueue(async () => {
      const current = get().byId[profileId] ?? {
        liked: false,
        bookmarked: false,
      };
      const next = { ...current, [field]: !current[field] };
      set((state) => ({
        byId: { ...state.byId, [profileId]: next },
      }));
      try {
        const result = await upsertProfileFavorite(profileId, {
          [field]: next[field],
        });
        const optimistic = applyResult(get().items, result, preview);
        set({
          items: optimistic,
          byId: {
            ...toMap(optimistic),
            [profileId]: {
              liked: result.liked,
              bookmarked: result.bookmarked,
            },
          },
        });
        const items = await fetchProfileFavorites();
        set({ items, byId: toMap(items) });
      } catch {
        set((state) => ({
          byId: { ...state.byId, [profileId]: current },
        }));
        throw new Error("Unable to update saved business.");
      }
    });
  },
}));
