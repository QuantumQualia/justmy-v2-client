import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/config";
import { isValidUsZip } from "@/lib/news/market-routing";

/**
 * Public BFF: proxy GET markets/zipcode/:zipcode so the news landing
 * can look up markets without requiring a JWT.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ zipcode: string }> },
) {
  const { zipcode: raw } = await context.params;
  const zipcode = decodeURIComponent(raw ?? "").trim();

  if (!isValidUsZip(zipcode)) {
    return NextResponse.json(
      { message: "Enter a valid US ZIP code (e.g. 38103)." },
      { status: 400 },
    );
  }

  // Use 5-digit ZIP for lookup when ZIP+4 is provided
  const lookupZip = zipcode.slice(0, 5);
  const backendUrl = buildApiUrl(
    `markets/zipcode/${encodeURIComponent(lookupZip)}`,
  );

  try {
    const res = await fetch(backendUrl, {
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
      { message: "Unable to look up market for this zipcode." },
      { status: 502 },
    );
  }
}
