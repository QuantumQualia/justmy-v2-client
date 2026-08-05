import type { MarketResponseDto } from "@/lib/services/markets";
import { ApiClientError } from "@/lib/api-client";

/**
 * Client-side zip → markets lookup via Next BFF (no JWT required).
 */
export async function fetchMarketsByZip(
  zipcode: string,
): Promise<MarketResponseDto[]> {
  const cleaned = zipcode.trim();
  const res = await fetch(
    `/api/news/markets/by-zip/${encodeURIComponent(cleaned)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  const data = (await res.json().catch(() => ({}))) as
    | MarketResponseDto[]
    | { message?: string };

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data && data.message
        ? String(data.message)
        : "Failed to look up market for zipcode.";
    throw new ApiClientError(message, res.status);
  }

  if (!Array.isArray(data)) {
    throw new ApiClientError("Unexpected market lookup response.");
  }

  return data;
}
