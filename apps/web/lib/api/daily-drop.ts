/**
 * Daily Drop API client.
 * Uses JWT auth via apiRequest. Endpoints: ai/daily-drop/briefing, ai/daily-drop/events, ai/daily-drop/deals.
 */

import { apiRequest } from "@/lib/api-client";
import type {
  DailyNewsItem,
  MarketEvent,
  LocalDeal,
  DailyDropBriefingResponseDto,
  MarketEventsResponseDto,
  DealsResponseDto,
} from "@/components/daily-drop/types";

/** Map backend briefing to UI news items (with generated id). */
function mapBriefingToNewsItems(dto: DailyDropBriefingResponseDto): DailyNewsItem[] {
  return (dto.stories ?? []).map((story, i) => ({
    id: `briefing-${dto.date}-${i}`,
    headline: story.headline,
    summary: story.summary,
    source: story.source,
    url: story.url,
  }));
}

/** Map backend event cards to UI market events (with generated id). */
function mapEventsToMarketEvents(dto: MarketEventsResponseDto): MarketEvent[] {
  return (dto.events ?? []).map((e, i) => ({
    id: `event-${e.startAt}-${i}`,
    title: e.title,
    venue: e.venue,
    dateTimeLabel: e.dateTimeLabel,
    imageUrl: e.imageUrl,
    weatherBadge: e.weatherStamp,
    source: e.source,
    eventUrl: e.ticketUrl,
  }));
}

/** Map backend deal cards to UI local deals (with generated id). */
function mapDealsToLocalDeals(dto: DealsResponseDto): LocalDeal[] {
  return (dto.deals ?? []).map((d, i) => ({
    id: `deal-${i}-${d.dealUrl}`.slice(0, 50),
    title: d.title,
    merchant: d.merchantName,
    category: d.category,
    imageUrl: d.imageUrl,
    originalPrice: d.originalPrice,
    discountedPrice: d.discountPrice,
    discountPercent: d.discountPercent,
    dealUrl: d.dealUrl,
    rating: d.rating,
  }));
}

/**
 * Get daily local news briefing for the current user's market.
 * Requires JWT. First user in market/day triggers fetch; others get cache.
 */
export async function fetchDailyDropBriefing(): Promise<{
  items: DailyNewsItem[];
  marketName: string;
  date: string;
}> {
  const dto = await apiRequest<DailyDropBriefingResponseDto>("ai/daily-drop/briefing");
  return {
    items: mapBriefingToNewsItems(dto),
    marketName: dto.marketName ?? "",
    date: dto.date ?? "",
  };
}

/**
 * Get upcoming market events (The Stage) for the current user's market.
 * Requires JWT.
 */
export async function fetchDailyDropEvents(): Promise<{
  events: MarketEvent[];
  totalCount: number;
  marketName: string;
}> {
  const dto = await apiRequest<MarketEventsResponseDto>("ai/daily-drop/events");
  return {
    events: mapEventsToMarketEvents(dto),
    totalCount: dto.totalCount ?? 0,
    marketName: dto.marketName ?? "",
  };
}

/**
 * Get local deals (The Hook) for the current user. Top 8, 4+ stars.
 * Requires JWT.
 */
export async function fetchDailyDropDeals(): Promise<{
  deals: LocalDeal[];
  totalCount: number;
  cityName?: string;
}> {
  const dto = await apiRequest<DealsResponseDto>("ai/daily-drop/deals");
  return {
    deals: mapDealsToLocalDeals(dto),
    totalCount: dto.totalCount ?? 0,
    cityName: dto.cityName,
  };
}
