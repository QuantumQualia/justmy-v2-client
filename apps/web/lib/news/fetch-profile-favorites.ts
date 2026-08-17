import { ApiClientError } from "@/lib/api-client";

export type ProfileFavoriteItem = {
  profileId: number;
  name: string;
  slug: string;
  photo: string | null;
  liked: boolean;
  bookmarked: boolean;
  updatedAt?: string;
};

export type ProfileFavoriteState = {
  profileId: number;
  liked: boolean;
  bookmarked: boolean;
};

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T | { message?: string };
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data && data.message
        ? String(data.message)
        : fallback;
    throw new ApiClientError(message, res.status);
  }
  return data as T;
}

export async function fetchProfileFavorites(): Promise<ProfileFavoriteItem[]> {
  const res = await fetch("/api/news/profile-favorites", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const data = await readJson<{ items?: ProfileFavoriteItem[] }>(
    res,
    "Unable to load saved businesses.",
  );
  return Array.isArray(data.items) ? data.items : [];
}

export async function upsertProfileFavorite(
  profileId: number,
  patch: { liked?: boolean; bookmarked?: boolean },
): Promise<ProfileFavoriteItem | ProfileFavoriteState> {
  const res = await fetch(`/api/news/profile-favorites/${profileId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
    cache: "no-store",
  });
  return readJson<ProfileFavoriteItem | ProfileFavoriteState>(
    res,
    "Unable to update saved business.",
  );
}

export function isFavoriteItem(
  value: ProfileFavoriteItem | ProfileFavoriteState,
): value is ProfileFavoriteItem {
  return "slug" in value && typeof value.slug === "string";
}
