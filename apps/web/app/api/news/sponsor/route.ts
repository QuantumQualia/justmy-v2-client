import type { NextRequest } from "next/server";

import { proxyNewsToBackend } from "@/app/api/news/_lib";

const PLACEMENTS = new Set(["newsstand", "prize"]);

export const dynamic = "force-dynamic";

/** Public BFF for the NewsSTAND or prize-closet sponsor. Rotates on each request. */
export async function GET(request: NextRequest) {
  const marketId = request.nextUrl.searchParams.get("marketId")?.trim() ?? "";
  const placement = request.nextUrl.searchParams.get("placement")?.trim() ?? "";
  if (!/^\d+$/.test(marketId) || !PLACEMENTS.has(placement)) {
    return Response.json({ message: "marketId and placement are required." }, { status: 400 });
  }
  const search = new URLSearchParams({ marketId, placement });
  return proxyNewsToBackend(request, `newsstand/sponsor?${search.toString()}`, "GET");
}
