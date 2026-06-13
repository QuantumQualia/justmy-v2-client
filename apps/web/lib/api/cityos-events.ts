/**
 * CityOS events (Ticketmaster on-sale) — types and fetch via Next embed proxy.
 */

export interface CityOsEventDto {
  title: string;
  venue: string;
  imageUrl: string;
  ticketUrl?: string | null;
  startAt: string;
  venuePostalCode?: string | null;
}

export interface CityOsEventsResponseDto {
  marketName: string;
  /** City label for UI (e.g. “Memphis”) — preferred for “THIS WEEK IN …” title. */
  marketCity?: string | null;
  marketSiteTitle?: string | null;
  events: CityOsEventDto[];
  totalCount: number;
}

/** Default when callers omit `eventsLimit` (word cloud target density). */
export const CITYOS_EVENTS_DEFAULT_LIMIT = 30;

function buildEmbedQuery(domain: string, eventsLimit?: number): string {
  const q = new URLSearchParams();
  q.set("domain", domain.trim());
  const lim =
    eventsLimit != null && Number.isFinite(eventsLimit)
      ? Math.floor(eventsLimit)
      : CITYOS_EVENTS_DEFAULT_LIMIT;
  q.set("eventsLimit", String(Math.min(100, Math.max(1, lim))));
  return q.toString();
}

/**
 * Loads CityOS events through `/api/embed/cityos-events` (CORS + no JWT; safe for embeds and CMS).
 */
export async function fetchCityOsEventsEmbed(
  domain: string,
  eventsLimit?: number,
): Promise<CityOsEventsResponseDto> {
  const qs = buildEmbedQuery(domain, eventsLimit);
  const res = await fetch(`/api/embed/cityos-events?${qs}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as CityOsEventsResponseDto & { message?: string };
  if (!res.ok) {
    throw new Error(typeof data.message === "string" ? data.message : `CityOS events failed (${res.status})`);
  }
  return data;
}
