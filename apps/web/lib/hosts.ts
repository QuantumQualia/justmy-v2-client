/**
 * Host detection for multi-domain surfaces on the same Next.js deploy.
 *
 * Main product: founders.justmy.com / justmy.com (unchanged routing).
 * News router: news.justmy.com — `/` and `/news` serve the dual-mode
 * zip entry / market page (zip preference in storage, not the URL).
 *
 * Env (comma-separated hostnames, no protocol):
 *   NEXT_PUBLIC_NEWS_HOSTS=news.justmy.com
 *
 * Deploy: add news.justmy.com as a domain on the same Vercel project as the main site.
 */

const DEFAULT_NEWS_HOSTS = ["news.justmy.com"];

function parseHostList(raw: string | undefined): string[] {
  if (!raw?.trim()) return DEFAULT_NEWS_HOSTS;
  return raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/** Hostnames that serve the news zip-routing surface. */
export function getNewsHosts(): string[] {
  return parseHostList(process.env.NEXT_PUBLIC_NEWS_HOSTS);
}

/** Strip port for comparison (e.g. localhost:3000 → localhost when listed without port). */
export function normalizeHostname(host: string): string {
  return host.trim().toLowerCase().split(":")[0] ?? "";
}

/**
 * True when the request Host is a configured news host.
 * Matches full host (with port) or hostname-only against the allowlist.
 */
export function isNewsHost(hostHeader: string | null | undefined): boolean {
  if (!hostHeader) return false;
  const host = hostHeader.trim().toLowerCase();
  const hostname = normalizeHostname(host);
  const allow = getNewsHosts();
  return allow.some((entry) => {
    const entryLower = entry.toLowerCase();
    return host === entryLower || hostname === normalizeHostname(entryLower);
  });
}
