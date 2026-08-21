"use client";

import { useNewsFavoritesStore } from "@/lib/store/news-favorites-store";
import { useNewsRecentsStore } from "@/lib/store/news-recents-store";
import { useNewsZipStore } from "@/lib/store/news-zip-store";

let afterAuthHydrate: Promise<void> | null = null;

/** Refetch signed-in news lists after `auth/me` has finished. */
export function hydrateNewsStoresAfterAuth() {
  if (afterAuthHydrate) return afterAuthHydrate;
  afterAuthHydrate = (async () => {
    const marketId = useNewsZipStore.getState().market?.marketId;
    await Promise.all([
      useNewsFavoritesStore.getState().hydrate({ force: true }),
      useNewsRecentsStore.getState().hydrate(marketId, { force: true }),
    ]);
  })();
  return afterAuthHydrate;
}
