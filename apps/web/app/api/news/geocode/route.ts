import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type GeocodeResult = { lat: number; lng: number };

/** Process-local cache so repeated AskSKY map pins don't re-hit Nominatim. */
const cache = new Map<string, GeocodeResult | null>();

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "JustMy-NewsSTAND/1.0 (AskSKY map pins)",
} as const;

/**
 * Suite / unit segments like ", 600," or "Ste 200" break Nominatim free-text search.
 * Build fallback query strings that strip those.
 */
function addressVariants(raw: string): string[] {
  const base = raw.replace(/\s+/g, " ").trim();
  if (!base) return [];

  const variants: string[] = [base];

  // "5350 Poplar Ave, 600, Memphis, TN, 38119, US" → drop bare numeric suite token
  const noBareSuite = base
    .replace(/,\s*\d{1,6}\s*,/g, ", ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/\s+/g, " ")
    .trim();
  if (noBareSuite && noBareSuite !== base) variants.push(noBareSuite);

  // Drop suite/unit/apt/# labels
  const noUnitLabel = base
    .replace(
      /,?\s*(?:suite|ste|unit|apt|apartment|#)\s*[\w-]+/gi,
      "",
    )
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/\s+/g, " ")
    .trim();
  if (noUnitLabel && !variants.includes(noUnitLabel)) variants.push(noUnitLabel);

  // Drop trailing country
  for (const v of [...variants]) {
    const noCountry = v.replace(/,\s*(US|USA|United States)\s*$/i, "").trim();
    if (noCountry && !variants.includes(noCountry)) variants.push(noCountry);
  }

  return variants;
}

type StructuredParts = {
  street?: string;
  city?: string;
  state?: string;
  postalcode?: string;
  country?: string;
};

/** Best-effort US-style parse: street, city, ST, zip. */
function parseUsAddress(address: string): StructuredParts | null {
  const cleaned = address
    .replace(/,\s*\d{1,6}\s*,/g, ", ")
    .replace(
      /,?\s*(?:suite|ste|unit|apt|apartment|#)\s*[\w-]+/gi,
      "",
    )
    .replace(/,\s*,/g, ",")
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 3) return null;

  let country: string | undefined;
  const last = parts[parts.length - 1]?.toLowerCase() ?? "";
  if (last === "us" || last === "usa" || last === "united states") {
    country = "US";
    parts.pop();
  }

  if (parts.length < 3) return null;

  const stateZip = parts[parts.length - 1] ?? "";
  const city = parts[parts.length - 2];
  const street = parts.slice(0, -2).join(", ");
  const m = stateZip.match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (!street || !city || !m) return null;

  return {
    street,
    city,
    state: m[1]?.toUpperCase(),
    postalcode: m[2],
    country: country ?? "US",
  };
}

async function nominatimSearch(
  params: Record<string, string>,
): Promise<GeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: NOMINATIM_HEADERS,
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  const row = data?.[0];
  const lat = row?.lat != null ? Number(row.lat) : NaN;
  const lng = row?.lon != null ? Number(row.lon) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) return null;
  return { lat, lng };
}

/**
 * Public BFF: geocode a free-text address for AskSKY map pins.
 * Server-side Nominatim (browser CORS blocks the public endpoint).
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ message: "Missing q." }, { status: 400 });
  }
  if (q.length > 300) {
    return NextResponse.json({ message: "Address too long." }, { status: 400 });
  }

  const key = q.toLowerCase();
  const cached = cache.get(key);
  // Only reuse successful hits — never sticky-cache misses (suite variants / timeouts).
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // 1) Structured US query (most reliable for "street, suite, city, ST zip")
    const structured = parseUsAddress(q);
    if (structured?.street && structured.city && structured.state) {
      const hit = await nominatimSearch({
        street: structured.street,
        city: structured.city,
        state: structured.state,
        ...(structured.postalcode
          ? { postalcode: structured.postalcode }
          : {}),
        country: structured.country ?? "US",
      });
      if (hit) {
        cache.set(key, hit);
        return NextResponse.json(hit);
      }
    }

    // 2) Free-text variants (strip suite tokens that make Nominatim return [])
    for (const variant of addressVariants(q)) {
      const hit = await nominatimSearch({ q: variant });
      if (hit) {
        cache.set(key, hit);
        return NextResponse.json(hit);
      }
    }

    return NextResponse.json({ lat: null, lng: null }, { status: 200 });
  } catch {
    return NextResponse.json({ lat: null, lng: null }, { status: 200 });
  }
}
