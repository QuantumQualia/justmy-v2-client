import type { NextRequest } from "next/server";

import { proxyNewsToBackend } from "@/app/api/news/_lib";

export async function GET(request: NextRequest) {
  const marketId = request.nextUrl.searchParams.get("marketId")?.trim() ?? "";
  const qs = marketId && /^\d+$/.test(marketId) ? `?marketId=${marketId}` : "";
  return proxyNewsToBackend(request, `sky/me/conversations${qs}`, "GET", {
    requireAuth: true,
  });
}

export async function POST(request: NextRequest) {
  return proxyNewsToBackend(request, "sky/me/conversations/claim", "POST", {
    requireAuth: true,
  });
}
