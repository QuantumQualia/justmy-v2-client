/**
 * Human-readable text from Nest / AskSKY JSON error bodies (handles `message` as string or array).
 */
export function formatSkyApiErrorPayload(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }
  const o = data as Record<string, unknown>;
  const msg = o.message;
  if (typeof msg === "string" && msg.trim()) {
    return msg.trim();
  }
  if (Array.isArray(msg)) {
    const parts = msg.map((x) => (typeof x === "string" ? x : String(x))).filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" ");
    }
  }
  const err = o.error;
  if (typeof err === "string" && err.trim()) {
    return err.trim();
  }
  return fallback;
}
