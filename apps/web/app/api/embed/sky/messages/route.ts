import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/config";
import { EMBED_SKY_CORS_HEADERS } from "@/lib/embed-sky-cors";

export const runtime = "nodejs";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...EMBED_SKY_CORS_HEADERS } });
}

export async function POST(request: NextRequest) {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json(
      { message: "Invalid body" },
      { status: 400, headers: { ...EMBED_SKY_CORS_HEADERS } },
    );
  }

  const backendUrl = buildApiUrl("sky/messages");
  const res = await fetch(backendUrl, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const json = JSON.parse(text) as unknown;
      return NextResponse.json(json, {
        status: res.status,
        headers: { ...EMBED_SKY_CORS_HEADERS },
      });
    } catch {
      return new NextResponse(text || res.statusText, {
        status: res.status,
        headers: {
          ...EMBED_SKY_CORS_HEADERS,
          "Content-Type": res.headers.get("content-type") || "text/plain",
        },
      });
    }
  }

  const headers = new Headers({
    ...EMBED_SKY_CORS_HEADERS,
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  if (!res.body) {
    return NextResponse.json(
      { message: "No response body from AskSKY! backend." },
      { status: 502, headers: { ...EMBED_SKY_CORS_HEADERS } },
    );
  }

  return new NextResponse(res.body, {
    status: res.status,
    headers,
  });
}
