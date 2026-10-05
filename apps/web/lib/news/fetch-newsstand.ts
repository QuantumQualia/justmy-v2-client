import { ApiClientError } from "@/lib/api-client";

export type NewsstandHotlink = { label: string; url: string };

export type NewsstandArticle = {
  id: number;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  url: string;
  publishedAt: string | null;
};

export type NewsstandSponsorSpotlight = {
  id: number;
  name: string;
  handle: string;
  profileUrl: string;
  externalUrl: string;
  bannerUrl: string | null;
  photoUrl: string | null;
  pitch: string | null;
  hotlinks: NewsstandHotlink[];
  articles: NewsstandArticle[];
};

export type NewsstandStandPost = NewsstandArticle & { channel: string };

export type NewsstandChannel = {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  postCount: number;
};

export type ReferBusinessResult = {
  status: "exists" | "created";
  /** live = already claimed; boost = unclaimed, you joined its referrers; created = new Dot. */
  outcome: "live" | "boost" | "already" | "created";
  name: string;
  profileUrl: string;
  claimUrl: string | null;
  invited: boolean;
  creditsAwarded: number;
  creditsPending: number;
};

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) {
    throw new ApiClientError(
      data && typeof data === "object" && "message" in data && data.message
        ? String(data.message)
        : fallback,
      res.status,
    );
  }
  return data;
}

/** Shared while in flight so a remount (Strict Mode) reuses the request; each page load still rotates. */
const sponsorInFlight = new Map<string, Promise<NewsstandSponsorSpotlight | null>>();

export function fetchNewsstandSponsor(
  marketId: number,
  placement: "newsstand" | "prize",
): Promise<NewsstandSponsorSpotlight | null> {
  const key = `${marketId}:${placement}`;
  const existing = sponsorInFlight.get(key);
  if (existing) return existing;

  const request = (async () => {
    const search = new URLSearchParams({
      marketId: String(marketId),
      placement,
    });
    const res = await fetch(`/api/news/sponsor?${search.toString()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 204) return null;
    const data = await readJson<NewsstandSponsorSpotlight | null>(res, "Failed to load sponsor.");
    if (!data || typeof data !== "object" || !("id" in data)) return null;
    return data;
  })().finally(() => {
    sponsorInFlight.delete(key);
  });

  sponsorInFlight.set(key, request);
  return request;
}

const standInFlight = new Map<string, Promise<NewsstandStandPost[]>>();

export function fetchNewsstandStand(
  marketId: number,
  options?: { channelId?: number; limit?: number },
): Promise<NewsstandStandPost[]> {
  const search = new URLSearchParams({ marketId: String(marketId) });
  if (options?.channelId) search.set("channelId", String(options.channelId));
  if (options?.limit) search.set("limit", String(options.limit));
  const key = search.toString();
  const existing = standInFlight.get(key);
  if (existing) return existing;

  const request = (async () => {
    const res = await fetch(`/api/news/stand?${key}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await readJson<NewsstandStandPost[]>(res, "Failed to load the stand.");
    return Array.isArray(data) ? data : [];
  })().finally(() => {
    standInFlight.delete(key);
  });

  standInFlight.set(key, request);
  return request;
}

export async function fetchNewsstandChannelStories(
  marketId: number,
  channelId: number,
  offset: number,
  limit: number,
): Promise<{ items: NewsstandStandPost[]; total: number }> {
  const search = new URLSearchParams({
    marketId: String(marketId),
    channelId: String(channelId),
    offset: String(offset),
    limit: String(limit),
  });
  const res = await fetch(`/api/news/channel-stories?${search.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const data = await readJson<{ items?: NewsstandStandPost[]; total?: number }>(
    res,
    "Failed to load stories.",
  );
  const items = Array.isArray(data?.items) ? data.items : [];
  return { items, total: typeof data?.total === "number" ? data.total : items.length };
}

export async function fetchNewsstandChannels(marketId: number): Promise<NewsstandChannel[]> {
  const res = await fetch(`/api/news/channels?marketId=${marketId}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const data = await readJson<NewsstandChannel[]>(res, "Failed to load channels.");
  return Array.isArray(data) ? data : [];
}

export async function referNewsstandBusiness(body: {
  name: string;
  phone?: string;
  zipCode?: string;
  city?: string;
  email?: string;
  marketId?: number;
}): Promise<ReferBusinessResult> {
  const res = await fetch("/api/news/refer-business", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readJson<ReferBusinessResult>(res, "Could not refer that business.");
}
