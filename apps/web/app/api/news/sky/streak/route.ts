import type { NextRequest } from "next/server";

import { proxyNewsToBackend } from "@/app/api/news/_lib";

export async function GET(request: NextRequest) {
  return proxyNewsToBackend(request, "sky/me/streak", "GET", { requireAuth: true });
}
