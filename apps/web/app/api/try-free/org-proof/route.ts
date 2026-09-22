import type { NextRequest } from "next/server";

import { proxyNewsToBackend } from "@/app/api/news/_lib";

export async function POST(request: NextRequest) {
  return proxyNewsToBackend(request, "try-free/org-proof", "POST");
}
