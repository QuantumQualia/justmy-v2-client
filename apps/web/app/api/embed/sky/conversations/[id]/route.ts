import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/config";
import { EMBED_SKY_CORS_HEADERS } from "@/lib/embed-sky-cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...EMBED_SKY_CORS_HEADERS } });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const conversationId = String(id ?? "").trim();
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!conversationId || !token) {
    return NextResponse.json(
      { message: "conversation id and token query param are required." },
      { status: 400, headers: { ...EMBED_SKY_CORS_HEADERS } },
    );
  }

  const backendUrl = buildApiUrl(`sky/conversations/${encodeURIComponent(conversationId)}`);
  const search = new URLSearchParams({ token });
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
