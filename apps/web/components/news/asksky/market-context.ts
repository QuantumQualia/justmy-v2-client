import type { MarketResponseDto } from "@/lib/services/markets";
import type { NewsMarketContext } from "./types";

/** Map a markets API primary result + ZIP into AskSKY nav context. */
export function marketDtoToContext(
  market: MarketResponseDto,
  zipcode?: string,
): NewsMarketContext {
  const fromMarket = market.zipcodes?.[0]?.zipcode?.trim() ?? "";
  const cleanedZip = (zipcode?.trim() || fromMarket).slice(0, 5);
  const city = market.city?.trim() || null;
  const state = market.state?.trim() || null;
  const site = market.site?.trim() || null;
  const cityState = [city, state].filter(Boolean).join(", ");
  return {
    marketId: market.id,
    marketSlug: market.slug,
    marketName: market.name,
    zipcode: cleanedZip,
    city,
    state,
    site,
    cityState: cityState || market.name,
    metroLabel: cleanedZip
      ? `${market.name.toUpperCase()} METRO · ${cleanedZip}`
      : `${market.name.toUpperCase()} METRO`,
    dailyAudioBriefingEnabled: Boolean(market.dailyAudioBriefingEnabled),
  };
}

/** Nav-safe market when zip is known but the markets API has not resolved yet. */
export function fallbackMarketFromZip(zipcode: string): NewsMarketContext {
  const cleaned = zipcode.trim().slice(0, 5);
  return {
    marketSlug: cleaned || "local",
    marketName: cleaned ? `ZIP ${cleaned}` : "Local market",
    zipcode: cleaned,
    city: null,
    state: null,
    site: null,
    cityState: cleaned,
    metroLabel: cleaned ? `LOCAL · ${cleaned}` : "LOCAL",
    dailyAudioBriefingEnabled: false,
  };
}
