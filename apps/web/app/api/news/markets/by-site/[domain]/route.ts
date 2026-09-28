import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/config";

/**
 * Public BFF: proxy GET markets/by-site/:domain so a newsstand host can load
 * its market without a cross-origin call.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ domain: string }> },
) {
  const { domain: raw } = await context.params;
  const domain = decodeURIComponent(raw ?? "").trim().toLowerCase();
  if (!domain || domain.length > 253) {
    return NextResponse.json({ message: "Enter a valid domain." }, { status: 400 });
  }

  const url = `${buildApiUrl(`markets/by-site/${encodeURIComponent(domain)}`)}?includeZipcodes=true`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text) as unknown, { status: res.status });
    } catch {
      return new NextResponse(text, { status: res.status });
    }
  } catch {
    return NextResponse.json({ message: "Failed to reach markets API." }, { status: 502 });
  }
}
