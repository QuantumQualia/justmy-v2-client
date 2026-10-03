import type { NextRequest } from "next/server";

import { proxyNewsToBackend } from "@/app/api/news/_lib";

/** Public BFF for one page of a NewsSTAND channel's stories. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const marketId = params.get("marketId")?.trim() ?? "";
  const channelId = params.get("channelId")?.trim() ?? "";
  if (!/^\d+$/.test(marketId) || !/^\d+$/.test(channelId)) {
    return Response.json({ message: "marketId and channelId are required." }, { status: 400 });
  }
  const search = new URLSearchParams({ marketId, channelId });
  const offset = params.get("offset")?.trim() ?? "";
  const limit = params.get("limit")?.trim() ?? "";
  if (/^\d+$/.test(offset)) search.set("offset", offset);
  if (/^\d+$/.test(limit)) search.set("limit", limit);
  return proxyNewsToBackend(request, `newsstand/channel-stories?${search.toString()}`, "GET");
}
