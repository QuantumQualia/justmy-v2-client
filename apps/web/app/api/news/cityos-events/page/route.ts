import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/config";

const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9.-]{0,253}$/;

/** Public BFF: one page of a market's CityOS events for the NewsSTAND events page. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const domain = params.get("domain")?.trim() ?? "";
  if (!domain || !DOMAIN_RE.test(domain)) {
    return NextResponse.json({ message: "A valid domain query parameter is required." }, { status: 400 });
  }

  const search = new URLSearchParams({ domain });
  const page = params.get("page")?.trim() ?? "";
  const pageSize = params.get("pageSize")?.trim() ?? "";
  if (/^\d+$/.test(page)) search.set("page", page);
  if (/^\d+$/.test(pageSize)) search.set("pageSize", String(Math.min(48, Math.max(1, Number(pageSize)))));
  const q = params.get("q")?.trim().slice(0, 120) ?? "";
  if (q) search.set("q", q);
  for (const key of ["from", "to"] as const) {
    const value = params.get(key)?.trim() ?? "";
    if (value && !Number.isNaN(Date.parse(value))) search.set(key, value);
  }

  try {
    const res = await fetch(`${buildApiUrl("my-api/cityos-events/page")}?${search.toString()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as unknown;
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Unable to load events for this market." }, { status: 502 });
  }
}
