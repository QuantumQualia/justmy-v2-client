import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { CITYOS_EVENTS_DEFAULT_LIMIT } from "@/lib/api/cityos-events";
import { buildApiUrl } from "@/lib/config";

const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9.-]{0,253}$/;

/**
 * Public BFF: proxy GET my-api/cityos-events?domain=… for the AskSKY news page.
 */
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")?.trim() ?? "";
  if (!domain || !DOMAIN_RE.test(domain)) {
    return NextResponse.json(
      {
        message:
          "A valid domain query parameter is required (e.g. justmymemphis.com).",
      },
      { status: 400 },
    );
  }

  const rawLimit = request.nextUrl.searchParams.get("eventsLimit");
  const search = new URLSearchParams({ domain });
  if (rawLimit != null && rawLimit !== "") {
    const n = Number.parseInt(rawLimit, 10);
    if (Number.isFinite(n)) {
      search.set("eventsLimit", String(Math.min(100, Math.max(1, n))));
    }
  } else {
    search.set("eventsLimit", String(CITYOS_EVENTS_DEFAULT_LIMIT));
  }

  const backendUrl = buildApiUrl("my-api/cityos-events");

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
      { message: "Unable to load CityOS events for this market." },
      { status: 502 },
    );
  }
}
