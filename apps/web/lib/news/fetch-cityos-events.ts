import { ApiClientError } from "@/lib/api-client";
import { CITYOS_EVENTS_DEFAULT_LIMIT } from "@/lib/api/cityos-events";

/** Optional OpenTable-style dining pairing when the API provides one. */
export type CityOsEventDining = {
  name: string;
  imageUrl?: string | null;
  walkMinutes?: number | null;
  reservationLabel?: string | null;
  reserveUrl?: string | null;
};

export type CityOsEvent = {
  title: string;
  venue: string;
  imageUrl: string;
  ticketUrl?: string | null;
  startAt: string;
  venuePostalCode?: string | null;
  dining?: CityOsEventDining | null;
};

export type CityOsEventsPayload = {
  marketName: string;
  marketCity?: string | null;
  marketSiteTitle?: string | null;
  events: CityOsEvent[];
  totalCount: number;
};

function asDining(value: unknown): CityOsEventDining | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const name =
    (typeof raw.name === "string" && raw.name.trim()) ||
    (typeof raw.restaurantName === "string" && raw.restaurantName.trim()) ||
    null;
  if (!name) return null;

  const walkRaw = raw.walkMinutes ?? raw.walkingDistanceMinutes;
  const walkMinutes =
    typeof walkRaw === "number" && Number.isFinite(walkRaw)
      ? walkRaw
      : null;

  return {
    name,
    imageUrl:
      (typeof raw.imageUrl === "string" && raw.imageUrl) ||
      (typeof raw.restaurantImageUrl === "string" && raw.restaurantImageUrl) ||
      null,
    walkMinutes,
    reservationLabel:
      (typeof raw.reservationLabel === "string" && raw.reservationLabel) ||
      (typeof raw.reservationTime === "string" && raw.reservationTime) ||
      null,
    reserveUrl:
      (typeof raw.reserveUrl === "string" && raw.reserveUrl) ||
      (typeof raw.reservationBookingUrl === "string" &&
        raw.reservationBookingUrl) ||
      null,
  };
}

function asEvent(value: unknown): CityOsEvent | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.title !== "string" || !raw.title.trim()) return null;
  if (typeof raw.venue !== "string") return null;
  if (typeof raw.imageUrl !== "string") return null;
  if (typeof raw.startAt !== "string") return null;

  const dining =
    asDining(raw.dining) ??
    asDining(raw.restaurant) ??
    asDining(raw.pairing) ??
    null;

  return {
    title: raw.title.trim(),
    venue: raw.venue,
    imageUrl: raw.imageUrl,
    ticketUrl: typeof raw.ticketUrl === "string" ? raw.ticketUrl : null,
    startAt: raw.startAt,
    venuePostalCode:
      typeof raw.venuePostalCode === "string" ? raw.venuePostalCode : null,
    dining,
  };
}

/** In-flight + session cache so remounts (e.g. Strict Mode) share one request. */
const inFlight = new Map<string, Promise<CityOsEventsPayload>>();
const cache = new Map<string, CityOsEventsPayload>();

function requestKey(domain: string, eventsLimit: number): string {
  return `${domain.toLowerCase()}|${eventsLimit}`;
}

/**
 * Client-side CityOS events via Next news BFF (no JWT required).
 */
export async function fetchNewsCityOsEvents(
  domain: string,
  eventsLimit: number = 12,
): Promise<CityOsEventsPayload> {
  const cleaned = domain.trim();
  if (!cleaned) {
    throw new ApiClientError("A market domain is required.");
  }

  const lim = Number.isFinite(eventsLimit)
    ? Math.min(100, Math.max(1, Math.floor(eventsLimit)))
    : CITYOS_EVENTS_DEFAULT_LIMIT;

  const key = requestKey(cleaned, lim);
  const cached = cache.get(key);
  if (cached) return cached;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const request = (async () => {
    const search = new URLSearchParams({
      domain: cleaned,
      eventsLimit: String(lim),
    });
    const res = await fetch(`/api/news/cityos-events?${search.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    > & { message?: string };

    if (!res.ok) {
      throw new ApiClientError(
        typeof data.message === "string"
          ? data.message
          : `CityOS events failed (${res.status})`,
        res.status,
      );
    }

    const eventsRaw = Array.isArray(data.events) ? data.events : [];
    const events = eventsRaw
      .map(asEvent)
      .filter((e): e is CityOsEvent => e != null);

    const payload: CityOsEventsPayload = {
      marketName:
        typeof data.marketName === "string" ? data.marketName : cleaned,
      marketCity:
        typeof data.marketCity === "string" ? data.marketCity : null,
      marketSiteTitle:
        typeof data.marketSiteTitle === "string" ? data.marketSiteTitle : null,
      events,
      totalCount:
        typeof data.totalCount === "number" ? data.totalCount : events.length,
    };
    cache.set(key, payload);
    return payload;
  })().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, request);
  return request;
}
