import { ApiClientError } from "@/lib/api-client";
import { fetchMarketsByZip } from "@/lib/news/fetch-markets-by-zip";
import { isValidUsZip, pickPrimaryMarket } from "@/lib/news/market-routing";
import type { MarketResponseDto } from "@/lib/services/markets";

/**
 * Resolve a US ZIP to its primary market, or null if none covers the zip.
 */
export async function resolveMarketForZip(
  zip: string,
): Promise<MarketResponseDto | null> {
  const cleaned = zip.trim();
  if (!isValidUsZip(cleaned)) {
    throw new ApiClientError("Enter a valid US ZIP code (e.g. 38103).");
  }

  const markets = await fetchMarketsByZip(cleaned);
  return pickPrimaryMarket(markets);
}
