import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/config";
import { EMBED_FORMS_CORS_HEADERS } from "@/lib/embed-forms-cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...EMBED_FORMS_CORS_HEADERS } });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await context.params;
  const clean = slug?.trim() ?? "";
  if (!clean) {
    return NextResponse.json(
      { message: "Form slug is required." },
      { status: 400, headers: { ...EMBED_FORMS_CORS_HEADERS } },
    );
  }

  const backendUrl = buildApiUrl(`forms/${encodeURIComponent(clean)}`);
  const res = await fetch(backendUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text) as unknown;
    return NextResponse.json(json, {
      status: res.status,
      headers: { ...EMBED_FORMS_CORS_HEADERS },
    });
  } catch {
    return new NextResponse(text, {
      status: res.status,
      headers: {
        ...EMBED_FORMS_CORS_HEADERS,
        "Content-Type": res.headers.get("content-type") || "text/plain",
      },
    });
  }
}
