/** Absolute myCARD URL. Prefer APP_URL so newsstand hosts still open the live card. */
export function publicMycardUrl(slug?: string | null): string | null {
  const handle = slug?.trim();
  if (!handle) return null;
  const path = `/${encodeURIComponent(handle)}`;
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}
