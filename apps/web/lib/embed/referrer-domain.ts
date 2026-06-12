/**
 * Hostname for CityOS embed market lookup, parsed from a full page URL
 * (e.g. `document.referrer` or the `Referer` request header when the iframe document loads).
 *
 * Strips a leading `www.` so one snippet works across `www` / bare host variants.
 */
export function hostFromReferrerUrl(referrer: string | null | undefined): string | null {
  if (!referrer?.trim()) return null;
  try {
    const u = new URL(referrer);
    const host = u.hostname.trim().toLowerCase();
    if (!host) return null;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}
