import type { NextRequest } from "next/server";

import { proxyNewsToBackend } from "@/app/api/news/_lib";

/** Public BFF for the three newest NewsSTAND posts in a market. */
export async function GET(request: NextRequest) {
  const marketId = request.nextUrl.searchParams.get("marketId")?.trim() ?? "";
  if (!/^\d+$/.test(marketId)) {
    return Response.json({ message: "marketId is required." }, { status: 400 });
  }
  const search = new URLSearchParams({ marketId });
  const channelId = request.nextUrl.searchParams.get("channelId")?.trim() ?? "";
  const limit = request.nextUrl.searchParams.get("limit")?.trim() ?? "";
  if (/^\d+$/.test(channelId)) search.set("channelId", channelId);
  if (/^\d+$/.test(limit)) search.set("limit", limit);
  return proxyNewsToBackend(request, `newsstand/stand?${search.toString()}`, "GET");
}
