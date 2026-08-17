import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { proxyNewsToBackend } from "@/app/api/news/_lib";

type RouteContext = { params: Promise<{ id: string }> };

function conversationId(id: string): number | null {
  if (!/^\d+$/.test(id)) return null;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const cid = conversationId(id);
  if (cid == null) {
    return NextResponse.json({ message: "Invalid conversation id." }, { status: 400 });
  }
  return proxyNewsToBackend(request, `sky/me/conversations/${cid}`, "GET", {
    requireAuth: true,
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const cid = conversationId(id);
  if (cid == null) {
    return NextResponse.json({ message: "Invalid conversation id." }, { status: 400 });
  }
  return proxyNewsToBackend(request, `sky/me/conversations/${cid}`, "PATCH", {
    requireAuth: true,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const cid = conversationId(id);
  if (cid == null) {
    return NextResponse.json({ message: "Invalid conversation id." }, { status: 400 });
  }
  return proxyNewsToBackend(request, `sky/me/conversations/${cid}`, "DELETE", {
    requireAuth: true,
  });
}
