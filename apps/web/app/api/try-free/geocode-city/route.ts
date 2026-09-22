import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type NominatimHit = {
  display_name?: string;
  class?: string;
  type?: string;
  address?: {
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    county?: string;
    state?: string;
    "ISO3166-2-lvl4"?: string;
  };
};

type GeoHit = {
  zip: string | null;
  city?: string | null;
  state?: string | null;
  displayName?: string;
};

const HEADERS = {
  Accept: "application/json",
  "User-Agent": "JustMy-TryFree/1.0 (city lookup; https://justmy.com)",
} as const;

const HIT_TTL_MS = 24 * 60 * 60 * 1000;
const MEMORY_MAX = 400;

function fetchOpts(): RequestInit {
  return { cache: "no-store", signal: AbortSignal.timeout(6000) };
}

const STATE_BY_NAME: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH",
  "new jersey": "NJ", "new mexico": "NM", "new york": "NY", "north carolina": "NC",
  "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA",
  "rhode island": "RI", "south carolina": "SC", "south dakota": "SD", tennessee: "TN",
  texas: "TX", utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY", "district of columbia": "DC",
};

const geoMemory = new Map<string, { expiresAt: number; value: GeoHit }>();
const geoInflight = new Map<string, Promise<GeoHit>>();

function cacheHeaders(hit: boolean) {
  return {
    "Cache-Control": hit
      ? "public, s-maxage=86400, stale-while-revalidate=604800"
      : "public, s-maxage=60, stale-while-revalidate=60",
  };
}

function cacheKey(q: string) {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

function readMemory(key: string): GeoHit | undefined {
  const row = geoMemory.get(key);
  if (!row) return undefined;
  if (row.expiresAt <= Date.now()) {
    geoMemory.delete(key);
    return undefined;
  }
  return row.value;
}

function writeMemory(key: string, value: GeoHit, ttlMs: number) {
  if (geoMemory.size >= MEMORY_MAX) {
    const first = geoMemory.keys().next().value;
    if (first) geoMemory.delete(first);
  }
  geoMemory.set(key, { expiresAt: Date.now() + ttlMs, value });
}

function json(hit: GeoHit, status = 200) {
  return NextResponse.json(hit, { status, headers: cacheHeaders(Boolean(hit.zip)) });
}

function stateCode(address?: NominatimHit["address"], rawState?: string | null): string | null {
  const iso = address?.["ISO3166-2-lvl4"] || "";
  const isoM = iso.match(/US-([A-Z]{2})/i);
  if (isoM?.[1]) return isoM[1].toUpperCase();
  const state = (rawState || address?.state || "").trim();
  if (/^[A-Za-z]{2}$/.test(state)) return state.toUpperCase();
  return STATE_BY_NAME[state.toLowerCase()] || null;
}

function parseCityState(q: string): { city: string; state: string } | null {
  const m = q
    .trim()
    .match(/^([A-Za-z][A-Za-z'. -]{1,40}?),\s*([A-Za-z]{2}|[A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+)?)$/);
  if (!m?.[1] || !m[2]) return null;
  const state = stateCode(undefined, m[2]);
  const city = m[1].replace(/\s+/g, " ").trim();
  if (!state || city.length < 2) return null;
  return { city, state };
}

async function fromZippopotamZip(zip: string): Promise<GeoHit | null> {
  const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`, {
    headers: HEADERS,
    ...fetchOpts(),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    "place name"?: string;
    places?: Array<{
      "place name"?: string;
      "state abbreviation"?: string;
    }>;
  };
  const place = data.places?.[0];
  if (!place) return null;
  const city = place["place name"] || data["place name"] || null;
  const state = (place["state abbreviation"] || "").toUpperCase() || null;
  return {
    zip,
    city,
    state,
    displayName: [city, state].filter(Boolean).join(", ") || zip,
  };
}

async function fromZippopotamCity(city: string, state: string): Promise<GeoHit | null> {
  const url = `https://api.zippopotam.us/us/${encodeURIComponent(state.toLowerCase())}/${encodeURIComponent(city.toLowerCase())}`;
  const res = await fetch(url, { headers: HEADERS, ...fetchOpts() });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    places?: Array<{
      "place name"?: string;
      "state abbreviation"?: string;
      "post code"?: string;
    }>;
  };
  const place = data.places?.[0];
  const zip = (place?.["post code"] || "").replace(/\D/g, "").slice(0, 5);
  if (zip.length !== 5) return null;
  const name = place?.["place name"] || city;
  const st = (place?.["state abbreviation"] || state).toUpperCase();
  return {
    zip,
    city: name,
    state: st,
    displayName: [name, st].filter(Boolean).join(", "),
  };
}

function cityFromAddress(address?: NominatimHit["address"], q?: string) {
  return (
    address?.city ||
    address?.town ||
    address?.village ||
    address?.hamlet ||
    address?.municipality ||
    q ||
    null
  );
}

async function fromNominatim(q: string): Promise<GeoHit> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("limit", "5");

  const res = await fetch(url.toString(), {
    headers: HEADERS,
    ...fetchOpts(),
  });
  if (!res.ok) return { zip: null };
  const rows = (await res.json()) as NominatimHit[];
  const hit =
    rows.find((row) => row.class === "place" || row.class === "boundary") || rows[0];
  if (!hit) return { zip: null };

  const city = cityFromAddress(hit.address, q);
  const state = stateCode(hit.address);
  let zip = (hit.address?.postcode || "").replace(/\D/g, "").slice(0, 5);
  if (zip.length !== 5) zip = "";

  if ((!zip || zip.length !== 5) && city && state) {
    const filled = await fromZippopotamCity(city, state).catch(() => null);
    if (filled?.zip) return filled;
  }

  return {
    zip: zip.length === 5 ? zip : null,
    city,
    state,
    displayName: [city, state].filter(Boolean).join(", ") || hit.display_name || q,
  };
}

async function lookupCity(q: string): Promise<GeoHit> {
  const zipOnly = q.replace(/\D/g, "").slice(0, 5);
  if (/^\d{5}$/.test(zipOnly) && q.replace(/\D/g, "").length === 5) {
    try {
      const hit = await fromZippopotamZip(zipOnly);
      if (hit) return hit;
    } catch {
      /* fall through */
    }
  }

  const parsed = parseCityState(q);
  if (parsed) {
    try {
      const hit = await fromZippopotamCity(parsed.city, parsed.state);
      if (hit) return hit;
    } catch {
      /* fall through to Nominatim */
    }
  }

  try {
    return await fromNominatim(parsed ? `${parsed.city}, ${parsed.state}` : q);
  } catch {
    return { zip: null };
  }
}

async function cachedLookup(q: string): Promise<GeoHit> {
  const key = cacheKey(q);
  const cached = readMemory(key);
  if (cached?.zip) return cached;

  const pending = geoInflight.get(key);
  if (pending) return pending;

  const run = lookupCity(q)
    .then((value) => {
      if (value.zip) writeMemory(key, value, HIT_TTL_MS);
      return value;
    })
    .finally(() => {
      geoInflight.delete(key);
    });

  geoInflight.set(key, run);
  return run;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ message: "Missing q." }, { status: 400 });
  }
  if (q.length > 120) {
    return NextResponse.json({ message: "Query too long." }, { status: 400 });
  }

  const hit = await cachedLookup(q);
  return json(hit);
}
