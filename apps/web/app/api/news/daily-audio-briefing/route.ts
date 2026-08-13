import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/config";
import { isValidUsZip } from "@/lib/news/market-routing";

/**
 * Public BFF: proxy GET sky/daily-audio-briefing?zipCode=&domain=
 * for the Sky FM 60-second daily briefing.
 */
export async function GET(request: NextRequest) {
  const zipCode = request.nextUrl.searchParams.get("zipCode")?.trim() ?? "";
  const domain = request.nextUrl.searchParams.get("domain")?.trim() ?? "";

  if (zipCode && !isValidUsZip(zipCode)) {
    return NextResponse.json(
      { message: "Enter a valid US ZIP code (e.g. 38103)." },
      { status: 400 },
    );
  }

  if (!zipCode && !domain) {
    return NextResponse.json(
      { message: "Provide a zipCode and/or domain." },
      { status: 400 },
    );
  }

  const search = new URLSearchParams();
  if (zipCode) search.set("zipCode", zipCode.slice(0, 5));
  if (domain) search.set("domain", domain);

  const backendUrl = buildApiUrl("sky/daily-audio-briefing");

  try {
    const res = await fetch(`${backendUrl}?${search.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const text = await res.text();
    try {
      const json = JSON.parse(text) as unknown;
      return NextResponse.json(json, { status: res.status });
    } catch {
      return new NextResponse(text, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("content-type") || "text/plain",
        },
      });
    }
  } catch {
    return NextResponse.json(
      { message: "Unable to load today's Sky audio briefing." },
      { status: 502 },
    );
  }
}
