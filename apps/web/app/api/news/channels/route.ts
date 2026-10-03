import type { NextRequest } from "next/server";

import { proxyNewsToBackend } from "@/app/api/news/_lib";

/** Public BFF for NewsSTAND channel lookup. */
export async function GET(request: NextRequest) {
  const marketId = request.nextUrl.searchParams.get("marketId")?.trim() ?? "";
  if (!/^\d+$/.test(marketId)) {
    return Response.json({ message: "marketId is required." }, { status: 400 });
  }
  return proxyNewsToBackend(request, `newsstand/channels?marketId=${marketId}`, "GET");
}
