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
const DEFAULT_PRODUCT_HOSTS = ["justmy.com", "www.justmy.com", "founders.justmy.com", "localhost", "127.0.0.1"];

function hostFromUrl(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    return normalizeHostname(new URL(raw).host);
  } catch {
    return normalizeHostname(raw);
  }
}

/** Product app hosts. These never become a city newsstand. */
export function isProductHost(hostHeader: string | null | undefined): boolean {
  if (!hostHeader) return false;
  const hostname = normalizeHostname(hostHeader);
  const extra = [hostFromUrl(process.env.NEXT_PUBLIC_APP_URL), hostFromUrl(process.env.NEXT_PUBLIC_SITE_URL)].filter(
    (host): host is string => Boolean(host),
  );
  return [...DEFAULT_PRODUCT_HOSTS, ...extra].some((entry) => hostname === normalizeHostname(entry));
}

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
