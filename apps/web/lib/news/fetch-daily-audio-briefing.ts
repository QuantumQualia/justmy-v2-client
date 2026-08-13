import { ApiClientError } from "@/lib/api-client";

export type SkyAudioSponsor = {
  /** Display name for the sponsor (current API). */
  companyName?: string | null;
  /** @deprecated Prefer `companyName`. */
  name?: string | null;
  /** Prefixed phrase before the sponsor name, e.g. "Brought to you by". */
  cta?: string | null;
  /** Optional spoken tagline from the briefing audio. */
  audioTagline?: string | null;
  /** Sponsor click-through URL (current API). */
  targetUrl?: string | null;
  /** @deprecated Prefer `targetUrl`. */
  targetLink?: string | null;
  slug?: string | null;
  photo?: string | null;
  profileUrl?: string | null;
  id?: number | null;
  profileId?: number | null;
  tier?: string | null;
};

export type SkyDailyAudioBriefing = {
  audioUrl: string;
  sponsor: SkyAudioSponsor | null;
  marketName: string;
  slot: "am" | "pm";
  localDate: string;
  /** AskSKY chip questions grounded in this slot's briefing / digest. */
  suggestedQuestions?: string[];
};

type FetchOpts = {
  zipCode?: string | null;
  domain?: string | null;
};

/** In-flight + session cache keyed by zip|domain|localDate|slot once known. */
const inFlight = new Map<string, Promise<SkyDailyAudioBriefing>>();
const cache = new Map<string, SkyDailyAudioBriefing>();

function requestKey(opts: FetchOpts): string {
  const zip = opts.zipCode?.trim().slice(0, 5) ?? "";
  const domain = opts.domain?.trim().toLowerCase() ?? "";
  return `${zip}|${domain}`;
}

/**
 * Client-side Sky daily audio briefing via Next BFF (no JWT required).
 * May take longer on first request while the MP3 is lazily generated.
 */
export async function fetchDailyAudioBriefing(
  opts: FetchOpts,
): Promise<SkyDailyAudioBriefing> {
  const zip = opts.zipCode?.trim().slice(0, 5) ?? "";
  const domain = opts.domain?.trim() ?? "";
  if (!zip && !domain) {
    throw new ApiClientError("Provide a zip code or domain.");
  }

  const key = requestKey({ zipCode: zip, domain });
  const cached = cache.get(key);
  if (cached) return cached;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const request = (async () => {
    const search = new URLSearchParams();
    if (zip) search.set("zipCode", zip);
    if (domain) search.set("domain", domain);

    const res = await fetch(
      `/api/news/daily-audio-briefing?${search.toString()}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );

    const data = (await res.json().catch(() => ({}))) as
      | SkyDailyAudioBriefing
      | { message?: string };

    if (!res.ok) {
      const message =
        data && typeof data === "object" && "message" in data && data.message
          ? String(data.message)
          : "Failed to load Sky audio briefing.";
      throw new ApiClientError(message, res.status);
    }

    if (
      !data ||
      typeof data !== "object" ||
      !("audioUrl" in data) ||
      typeof data.audioUrl !== "string" ||
      !data.audioUrl.trim()
    ) {
      throw new ApiClientError("Unexpected audio briefing response.");
    }

    const briefing = data as SkyDailyAudioBriefing;
    cache.set(key, briefing);
    // Also cache under resolved localDate|slot so remounts reuse after first fetch
    if (briefing.localDate && briefing.slot) {
      cache.set(`${key}|${briefing.localDate}|${briefing.slot}`, briefing);
    }
    return briefing;
  })().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, request);
  return request;
}

/** Normalize market.site / hostname for the briefing `domain` query. */
export function marketSiteToDomain(site?: string | null): string | null {
  if (!site?.trim()) return null;
  const trimmed = site.trim();
  try {
    const url = /^https?:\/\//i.test(trimmed)
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    return url.hostname || null;
  } catch {
    return trimmed.replace(/^https?:\/\//i, "").split("/")[0] || null;
  }
}
