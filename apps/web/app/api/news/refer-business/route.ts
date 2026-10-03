import type { NextRequest } from "next/server";

import { proxyNewsToBackend } from "@/app/api/news/_lib";

/** Signed-in BFF: deduped Biz OS card plus a claim invite. */
export async function POST(request: NextRequest) {
  return proxyNewsToBackend(request, "newsstand/refer-business", "POST", {
    requireAuth: true,
  });
}
