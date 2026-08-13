import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/config";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

/**
 * Public BFF: proxy GET markets/slug/:slug (with zipcodes) for the news market page.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug: raw } = await context.params;
  const slug = decodeURIComponent(raw ?? "").trim();

  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json(
      { message: "Enter a valid market slug." },
      { status: 400 },
    );
  }

  const backendUrl = buildApiUrl(
    `markets/slug/${encodeURIComponent(slug.toLowerCase())}`,
  );
  const url = `${backendUrl}?includeZipcodes=true`;

  try {
    const res = await fetch(url, {
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
      { message: "Unable to look up market for this slug." },
      { status: 502 },
    );
  }
}
