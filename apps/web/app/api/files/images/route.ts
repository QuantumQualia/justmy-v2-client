import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/lib/config";

/**
 * Same-origin BFF for image uploads. The browser POSTs here; we forward to the real API
 * with the user's JWT so the request is server→API (no browser CORS on the backend).
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.trim()) {
    return NextResponse.json({ message: "Authorization required" }, { status: 401 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const backendUrl = buildApiUrl("files/images");

  const res = await fetch(backendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body,
    cache: "no-store",
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text) as unknown;
    return NextResponse.json(json, { status: res.status });
  } catch {
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "text/plain",
      },
    });
  }
}
