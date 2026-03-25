/**
 * Single-segment app routes that are not public profile/CMS handles.
 * Keep in sync with `middleware.ts` protectedSingleSegmentRoutes.
 */
export const PROTECTED_SINGLE_SEGMENT_ROUTES = ["/admin", "/dashboard"] as const;

/**
 * True for paths like `/jane` (one segment, not a protected app route). Used for
 * deciding whether we might be on a public myCARD page.
 */
export function isLikelyHandlePath(pathname: string): boolean {
  const normalized = pathname.split("?")[0]?.replace(/\/$/, "") ?? "";
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length !== 1) return false;
  const single = `/${segments[0]}`;
  return !PROTECTED_SINGLE_SEGMENT_ROUTES.includes(
    single as (typeof PROTECTED_SINGLE_SEGMENT_ROUTES)[number]
  );
}

export function firstPathSegment(pathname: string): string | null {
  const normalized = pathname.split("?")[0]?.replace(/\/$/, "") ?? "";
  const segments = normalized.split("/").filter(Boolean);
  return segments.length === 1 ? (segments[0] ?? null) : null;
}
