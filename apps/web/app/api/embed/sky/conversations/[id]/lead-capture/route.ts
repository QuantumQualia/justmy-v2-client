import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/config";
import { EMBED_SKY_CORS_HEADERS } from "@/lib/embed-sky-cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...EMBED_SKY_CORS_HEADERS } });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  const conversationId = String(id ?? "").trim();
  if (!conversationId) {
    return NextResponse.json(
      { message: "conversation id is required." },
      { status: 400, headers: { ...EMBED_SKY_CORS_HEADERS } },
    );
  }

  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    bodyText = "";
  }

  const backendUrl = buildApiUrl(`sky/conversations/${encodeURIComponent(conversationId)}/lead-capture`);
  const res = await fetch(backendUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: bodyText || "{}",
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
