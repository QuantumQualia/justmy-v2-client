/**
 * Daily Drop API types — align with backend contracts.
 * News: on-demand daily cache per market (first user of day triggers fetch).
 * Events: Ticketmaster + Viator; weather badge from WeatherAPI.
 * Deals: Groupon Affiliate API (lat/lng, tsToken); filter 4+ stars.
 */

export interface DailyNewsItem {
  id: string;
  headline: string;
  summary?: string;
  source?: string;
  url?: string;
  publishedAt?: string;
}

export interface DailyNewsResponse {
  marketId: string;
  date: string; // YYYY-MM-DD
  items: DailyNewsItem[];
}

export interface MarketEvent {
  id: string;
  title: string;
  venue: string;
  /** ISO date or "Tonight" / "Today" */
  dateTimeLabel: string;
  /** Full-bleed image URL (Ticketmaster images[0].url or Viator product.images[0].highResUrl) */
  imageUrl: string;
  /** e.g. "☀️ 72° Clear" | "🏟️ Climate Controlled" */
  weatherBadge: string;
  /** ticketmaster | viator */
  source: "ticketmaster" | "viator";
  eventUrl?: string;
}

export interface MarketEventsResponse {
  marketId: string;
  events: MarketEvent[];
  totalCount?: number; // e.g. 142 for "See all 142 events"
}

export interface LocalDeal {
  id: string;
  title: string;
  /** Merchant name */
  merchant?: string;
  /** Category: Things To Do, Food & Drink, Beauty & Spas, etc. */
  category: string;
  /** 1:1 square image (Groupon largeImageUrl) */
  imageUrl: string;
  originalPrice: string;
  discountedPrice: string;
  /** e.g. 40 for "Save 40%" */
  discountPercent?: number;
  /** Affiliate deal URL — open in WebView, not external browser */
  dealUrl: string;
  /** Only show if >= 4.0 */
  rating?: number;
  /** Phase 2: gold border for JustMy Partner */
  isPartnerDeal?: boolean;
}

export interface LocalDealsResponse {
  deals: LocalDeal[];
  totalCount?: number;
}

// ——— Backend API DTOs (match NestJS response DTOs) ———

export interface DailyDropStoryDto {
  headline: string;
  summary: string;
  /** Optional source or read-more hint */
  source?: string;
  /** Link to the full news article (from Perplexity search result). */
  url?: string;
}

export interface DailyDropBriefingResponseDto {
  marketId: number;
  marketName: string;
  date: string;
  stories: DailyDropStoryDto[];
  fetchedAt: string;
  isCritical: boolean;
}

export interface EventCardDto {
  imageUrl: string;
  weatherStamp: string;
  dateTimeLabel: string;
  title: string;
  venue: string;
  source: "ticketmaster" | "viator";
  ticketUrl?: string;
  isIndoor?: boolean;
  startAt: string;
}

export interface MarketEventsResponseDto {
  marketName: string;
  events: EventCardDto[];
  totalCount: number;
}

export interface DealCardDto {
  imageUrl: string;
  title: string;
  merchantName: string;
  originalPrice: string;
  discountPrice: string;
  discountPercent: number;
  category: string;
  rating?: number;
  dealUrl: string;
}

export interface DealsResponseDto {
  deals: DealCardDto[];
  totalCount: number;
  hasMore: boolean;
  cityName?: string;
}
