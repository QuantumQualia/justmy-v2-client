import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/config";
import { EMBED_SKY_CORS_HEADERS } from "@/lib/embed-sky-cors";

const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9.-]{0,253}$/;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...EMBED_SKY_CORS_HEADERS } });
}

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")?.trim() ?? "";
  if (!domain || !DOMAIN_RE.test(domain)) {
    return NextResponse.json(
      { message: "A valid domain query parameter is required (e.g. justmymemphis.com)." },
      { status: 400, headers: { ...EMBED_SKY_CORS_HEADERS } },
    );
  }

  const rawLimit = request.nextUrl.searchParams.get("eventsLimit");
  const search = new URLSearchParams({ domain });
  if (rawLimit != null && rawLimit !== "") {
    const n = Number.parseInt(rawLimit, 10);
    if (Number.isFinite(n)) {
      search.set("eventsLimit", String(Math.min(100, Math.max(1, n))));
    }
  }

  const backendUrl = buildApiUrl("my-api/cityos-events");
  const res = await fetch(`${backendUrl}?${search.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text) as unknown;
    return NextResponse.json(json, {
      status: res.status,
      headers: { ...EMBED_SKY_CORS_HEADERS },
    });
  } catch {
    return new NextResponse(text, {
      status: res.status,
      headers: {
        ...EMBED_SKY_CORS_HEADERS,
        "Content-Type": res.headers.get("content-type") || "text/plain",
      },
    });
  }
}
