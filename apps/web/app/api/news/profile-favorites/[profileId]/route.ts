import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { proxyNewsToBackend } from "@/app/api/news/_lib";

type RouteContext = { params: Promise<{ profileId: string }> };

function parseProfileId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { profileId } = await context.params;
  const id = parseProfileId(profileId);
  if (id == null) {
    return NextResponse.json({ message: "Invalid profile id." }, { status: 400 });
  }
  return proxyNewsToBackend(request, `profile-favorites/${id}`, "GET", {
    requireAuth: true,
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { profileId } = await context.params;
  const id = parseProfileId(profileId);
  if (id == null) {
    return NextResponse.json({ message: "Invalid profile id." }, { status: 400 });
  }
  return proxyNewsToBackend(request, `profile-favorites/${id}`, "PUT", {
    requireAuth: true,
  });
}
