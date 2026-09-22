import { ApiClientError } from "@/lib/api-client";
import { isValidUsZip } from "@/lib/news/market-routing";
import { resolveMarketForZip } from "@/lib/news/resolve-market-zip";
import type { TryFreeLocation, TryFreeTier } from "@/lib/try-free/types";

const QUESTIONISH =
  /\b(what|whats|what's|where|when|why|how|who|which|any|best|open|deal|deals|happening|tonight|weekend|recommend|tell|help|can you|could you|i need|i want|looking for|pick|plan|remind)\b/i;

const FALSE_IN =
  /^(the|a|an|my|me|here|there|us|this|that|our|your|love|need|fact|case|order|front|back|touch|charge|trouble|time|mind|town|city|yes|yeah|yep|ok|okay)$/i;

const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
  "VA", "WA", "WV", "WI", "WY", "DC",
]);

function stripPlacePunctuation(raw: string) {
  return raw.trim().replace(/[.,!?;:]+$/g, "").trim();
}

function cityTokenOk(city: string) {
  const words = city.split(/\s+/).filter(Boolean);
  if (city.replace(/[\s'-]/g, "").length < 3) return false;
  return words.every((w) => !FALSE_IN.test(w));
}

const CITY_CHUNK = "([A-Za-z][A-Za-z'-]*(?:\\s+[A-Za-z][A-Za-z'-]*){0,2})";

/** True when the whole message is a city/ZIP, not a question. */
export function looksLikePlaceQuery(raw: string): boolean {
  const q = stripPlacePunctuation(raw);
  if (!q) return false;
  if (isValidUsZip(q)) return true;
  if (q.length > 48 || /[?]/.test(q) || QUESTIONISH.test(q)) return false;
  return /^[a-zA-Z][a-zA-Z\s.'-]{1,40}(,\s*[A-Za-z]{2})?$/.test(q);
}

function extractCityState(raw: string): string | null {
  const re = new RegExp(`\\b${CITY_CHUNK},\\s*([A-Za-z]{2})\\b`, "g");
  let hit: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const city = m[1].replace(/\s+/g, " ").trim();
    const st = m[2].toUpperCase();
    if (!US_STATES.has(st) || !cityTokenOk(city)) continue;
    if (city[0] !== city[0].toUpperCase() && city.length < 5) continue;
    hit = `${city}, ${st}`;
  }
  return hit;
}

/** ZIP or “in Memphis” / “I’m in Austin, TX” / “Memphis, TN” buried in a longer message. */
export function extractPlaceHint(raw: string): string | null {
  const q = stripPlacePunctuation(raw);
  if (!q) return null;
  const zip = q.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zip?.[1]) return zip[1];
  if (looksLikePlaceQuery(q)) return q;
  const citySt = extractCityState(q);
  if (citySt) return citySt;
  const inPlace = q.match(
    new RegExp(
      `\\b(?:i(?:['’]m| am)?\\s+(?:located\\s+in|from|near|in)|located\\s+in|live\\s+in|in|near|around)\\s+${CITY_CHUNK}(?:,\\s*([A-Za-z]{2}))?\\b`,
      "i",
    ),
  );
  const city = inPlace?.[1]?.replace(/[.,]+$/g, "").trim();
  if (city && cityTokenOk(city)) {
    const st = inPlace?.[2]?.toUpperCase();
    return [city.replace(/\s+/g, " "), st && US_STATES.has(st) ? st : null]
      .filter(Boolean)
      .join(", ");
  }
  return null;
}

export async function tryResolveTryFreePlace(raw: string): Promise<ResolvedTryFreePlace | null> {
  try {
    return await resolveTryFreePlace(raw);
  } catch {
    return null;
  }
}

export type ResolvedTryFreePlace = TryFreeLocation & { tier: TryFreeTier };

function fiveDigitZip(value: string): string {
  return value.replace(/\D/g, "").slice(0, 5);
}

async function nominatimCity(query: string): Promise<{
  zip: string;
  city: string | null;
  state: string | null;
  displayName: string;
} | null> {
  const url = `/api/try-free/geocode-city?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    zip?: string | null;
    city?: string | null;
    state?: string | null;
    displayName?: string | null;
  };
  const zip = fiveDigitZip(data.zip || "");
  if (zip.length !== 5) return null;
  return {
    zip,
    city: data.city?.trim() || null,
    state: data.state?.trim() || null,
    displayName: data.displayName?.trim() || query,
  };
}

export async function resolveTryFreePlace(raw: string): Promise<ResolvedTryFreePlace> {
  const query = stripPlacePunctuation(raw);
  if (!query) {
    throw new ApiClientError("Tell Sky a city or ZIP so she can look around.");
  }

  let zip = "";
  let city: string | null = null;
  let state: string | null = null;
  let displayName = query;

  if (isValidUsZip(query)) {
    zip = fiveDigitZip(query);
    const geo = await nominatimCity(zip);
    if (geo) {
      city = geo.city;
      state = geo.state;
      displayName = geo.displayName;
    }
  } else {
    const geo = await nominatimCity(query);
    if (!geo) {
      throw new ApiClientError("Couldn't place that city. Try a ZIP like 38103.");
    }
    zip = geo.zip;
    city = geo.city;
    state = geo.state;
    displayName = geo.displayName;
  }

  let tier: TryFreeTier = "unseeded";
  try {
    const market = await resolveMarketForZip(zip);
    if (market) {
      tier = "seeded";
      city = city || market.city?.trim() || null;
      state = state || market.state?.trim() || null;
      displayName = [city || market.name, state].filter(Boolean).join(", ") || displayName;
    }
  } catch {
    tier = "unseeded";
  }

  return {
    query,
    zip,
    city,
    state,
    displayName,
    tier,
  };
}
