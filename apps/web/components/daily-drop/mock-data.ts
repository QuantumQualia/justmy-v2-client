/**
 * Mock data for Daily Drop UI. Replace with API when ready.
 */
import type { DailyNewsItem, MarketEvent, LocalDeal } from "./types";

export const MOCK_NEWS: DailyNewsItem[] = [
  {
    id: "n1",
    headline: "Memphis City Council Approves New Downtown Development Plan",
    summary:
      "The plan includes green spaces and mixed-use zoning to boost local business.",
  },
  {
    id: "n2",
    headline: "Local Schools Partner with JustMy for Student ID Digital Wallet",
    summary: "Pilot program will roll out in five Shelby County schools this fall.",
  },
  {
    id: "n3",
    headline: "Beale Street Music Fest Announces 2026 Lineup",
    summary: "Three-day festival returns with headliners and local acts.",
  },
];

export const MOCK_EVENTS: MarketEvent[] = [
  {
    id: "e1",
    title: "The Lumineers - Live in Concert",
    venue: "Radians Amphitheater at Memphis Botanic Garden",
    dateTimeLabel: "Saturday, 7:30 PM",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    weatherBadge: "☀️ 72° – Perfect Skies for Kickoff",
    source: "ticketmaster",
    eventUrl: "#",
  },
  {
    id: "e2",
    title: "The Memphis Mojo Musical Bus Tour",
    venue: "Departs from Beale Street",
    dateTimeLabel: "Friday, 1:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    weatherBadge: "⛅ 68° – Great walking weather",
    source: "viator",
    eventUrl: "#",
  },
  {
    id: "e3",
    title: "Memphis Grizzlies vs. L.A. Lakers",
    venue: "FedExForum",
    dateTimeLabel: "Tonight, 7:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
    weatherBadge: "🏟️ Climate Controlled",
    source: "ticketmaster",
    eventUrl: "#",
  },
];

export const MOCK_EVENTS_TOTAL = 142;

export const MOCK_DEALS: LocalDeal[] = [
  {
    id: "d1",
    title: "60-Minute Escape Room for Four",
    merchant: "Memphis Escape Rooms",
    category: "Things To Do",
    imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&q=80",
    originalPrice: "$100",
    discountedPrice: "$60",
    discountPercent: 40,
    dealUrl: "https://www.groupon.com/",
    rating: 4.5,
  },
  {
    id: "d2",
    title: "$50 Voucher for Two",
    merchant: "Flight Restaurant and Wine Bar",
    category: "Food & Drink",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
    originalPrice: "$50",
    discountedPrice: "$35",
    discountPercent: 30,
    dealUrl: "https://www.groupon.com/",
    rating: 4.2,
  },
  {
    id: "d3",
    title: "Spa Day for Two",
    merchant: "Bliss Day Spa",
    category: "Beauty & Spas",
    imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6f6dd39ad?w=400&q=80",
    originalPrice: "$120",
    discountedPrice: "$69",
    discountPercent: 42,
    dealUrl: "https://www.groupon.com/",
    rating: 4.8,
  },
  {
    id: "d4",
    title: "Car Wash & Detail Package",
    merchant: "QuickShine Auto",
    category: "Automotive",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    originalPrice: "$75",
    discountedPrice: "$45",
    discountPercent: 40,
    dealUrl: "https://www.groupon.com/",
    rating: 4.0,
  },
];
