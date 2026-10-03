import { ApiClientError } from "@/lib/api-client";
import type { MarketResponseDto } from "@/lib/services/markets";

const inFlight = new Map<string, Promise<MarketResponseDto>>();

/**
 * Client-side market-by-slug lookup via Next BFF (no JWT required).
 * Concurrent calls for the same slug share one request.
 */
export function fetchMarketBySlug(slug: string): Promise<MarketResponseDto> {
  const cleaned = slug.trim().toLowerCase();
  const existing = inFlight.get(cleaned);
  if (existing) return existing;
  const request = loadMarketBySlug(cleaned).finally(() => {
    inFlight.delete(cleaned);
  });
  inFlight.set(cleaned, request);
  return request;
}

async function loadMarketBySlug(cleaned: string): Promise<MarketResponseDto> {
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
