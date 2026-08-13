import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/config";
import { isValidUsZip } from "@/lib/news/market-routing";

/**
 * Public BFF: proxy GET my-api/today-weather?zipCode=… for the news market nav.
 */
export async function GET(request: NextRequest) {
  const zipCode = request.nextUrl.searchParams.get("zipCode")?.trim() ?? "";

  if (!isValidUsZip(zipCode)) {
    return NextResponse.json(
      { message: "Enter a valid US ZIP code (e.g. 38103)." },
      { status: 400 },
    );
  }

  const lookupZip = zipCode.slice(0, 5);
  const backendUrl = buildApiUrl("my-api/today-weather");
  const search = new URLSearchParams({ zipCode: lookupZip });

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
      { message: "Unable to load today's weather for this zipcode." },
      { status: 502 },
    );
  }
}
