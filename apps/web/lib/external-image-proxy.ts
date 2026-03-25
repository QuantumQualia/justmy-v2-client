/**
 * Same-origin image URL for cropping canvas (avoids CORS taint on external URLs).
 * Requires the target host to be allowlisted in `/api/images/proxy`.
 */
export function proxiedImageUrl(originalUrl: string): string {
  return `/api/images/proxy?url=${encodeURIComponent(originalUrl)}`;
}
