import { ApiClientError } from "@/lib/api-client";
import type { MarketResponseDto } from "@/lib/services/markets";

/**
 * Client-side market-by-slug lookup via Next BFF (no JWT required).
 */
export async function fetchMarketBySlug(
  slug: string,
): Promise<MarketResponseDto> {
  const cleaned = slug.trim().toLowerCase();
  const res = await fetch(
    `/api/news/markets/by-slug/${encodeURIComponent(cleaned)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  const data = (await res.json().catch(() => ({}))) as
    | MarketResponseDto
    | { message?: string };

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data && data.message
        ? String(data.message)
        : "Failed to look up market.";
    throw new ApiClientError(message, res.status);
  }

  if (!data || typeof data !== "object" || !("slug" in data) || !("name" in data)) {
    throw new ApiClientError("Unexpected market response.");
  }

  return data as MarketResponseDto;
}
