import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { proxyNewsToBackend } from "@/app/api/news/_lib";
import { isValidUsZip } from "@/lib/news/market-routing";

type SkySearchBody = {
  query?: unknown;
  domain?: unknown;
  zipCode?: unknown;
  conversationId?: unknown;
  visitorToken?: unknown;
};

/**
 * Public BFF: proxy POST sky/search for NewsSTAND AskSKY conversations.
 * Continuity: omit conversationId + visitorToken to start; send both to continue.
 */
export async function POST(request: NextRequest) {
  let body: SkySearchBody;
  try {
    body = (await request.json()) as SkySearchBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ message: "Enter a search query." }, { status: 400 });
  }
  if (query.length > 2000) {
    return NextResponse.json(
      { message: "Query must be 2000 characters or fewer." },
      { status: 400 },
    );
  }

  const zipRaw =
    typeof body.zipCode === "string" ? body.zipCode.trim() : "";
  if (zipRaw && !isValidUsZip(zipRaw)) {
    return NextResponse.json(
      { message: "Enter a valid US ZIP code (e.g. 38103)." },
      { status: 400 },
    );
  }

  const domain =
    typeof body.domain === "string" ? body.domain.trim().slice(0, 255) : "";
  const visitorToken =
    typeof body.visitorToken === "string"
      ? body.visitorToken.trim().slice(0, 128)
      : "";

  let conversationId: number | undefined;
  if (
    typeof body.conversationId === "number" &&
    Number.isInteger(body.conversationId) &&
    body.conversationId > 0
  ) {
    conversationId = body.conversationId;
  } else if (
    typeof body.conversationId === "string" &&
    /^\d+$/.test(body.conversationId.trim())
  ) {
    const n = Number(body.conversationId.trim());
    if (n > 0) conversationId = n;
  }

  const payload: Record<string, unknown> = { query };
  if (zipRaw) payload.zipCode = zipRaw.slice(0, 10);
  if (domain) payload.domain = domain;
  if (conversationId != null) {
    payload.conversationId = conversationId;
    if (visitorToken) payload.visitorToken = visitorToken;
  }

  return proxyNewsToBackend(request, "sky/search", "POST", { body: payload });
}
