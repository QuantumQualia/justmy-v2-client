import type { MarketResponseDto } from "@/lib/services/markets";

/** US ZIP or ZIP+4. */
export function isValidUsZip(zipcode: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zipcode.trim());
}

/**
 * Resolve a zip match to its primary market.
 * Child markets that matched the zip are represented by their `parent`.
 */
function resolveToPrimary(market: MarketResponseDto): MarketResponseDto | null {
  const isChild =
    (market.parentId !== undefined && market.parentId !== null) ||
    market.parent != null;

  if (!isChild) return market;
  return market.parent ?? null;
}

/**
 * Pick exactly one primary market (not a child).
 * Zip matches may be child markets — use nested `parent` when present.
 * Prefer ACTIVE; then first remaining primary.
 */
export function pickPrimaryMarket(
  markets: MarketResponseDto[],
): MarketResponseDto | null {
  const byId = new Map<number, MarketResponseDto>();

  for (const market of markets) {
    const primary = resolveToPrimary(market);
    if (primary) byId.set(primary.id, primary);
  }

  const primaries = Array.from(byId.values());
  if (primaries.length === 0) return null;

  const active = primaries.filter((m) => m.status === "ACTIVE");
  const pool = active.length > 0 ? active : primaries;
  return pool[0] ?? null;
}

export function hasMarketSite(site?: string | null): boolean {
  return Boolean(site?.trim());
}

/** Normalize hostname or URL to an absolute https URL. */
export function normalizeMarketSiteUrl(site: string): string {
  const trimmed = site.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Display label from market slug (e.g. memphis → Memphis). */
export function marketSlugToTitle(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
