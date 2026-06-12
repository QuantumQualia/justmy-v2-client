/**
 * Hostname for CityOS market lookup from any full page URL
 * (e.g. `window.location.href`, `document.referrer`). Strips a leading `www.`.
 */
export function hostFromReferrerUrl(pageUrl: string | null | undefined): string | null {
  if (!pageUrl?.trim()) return null;
  try {
    const u = new URL(pageUrl);
    const host = u.hostname.trim().toLowerCase();
    if (!host) return null;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}
