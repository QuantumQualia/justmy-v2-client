import { NextRequest, NextResponse } from "next/server";
import {
  getUnsplashAccessKey,
  mapUnsplashPhotoToClient,
  unsplashNotConfiguredResponse,
  type UnsplashPhotoForClient,
} from "@/lib/unsplash-server";

const UNSPLASH_API = "https://api.unsplash.com";

/**
 * Editorial feed: GET https://api.unsplash.com/photos
 * Legacy used `?client_id=` in the browser; we use Authorization: Client-ID server-side only.
 * @see https://unsplash.com/documentation#list-photos
 */
export async function GET(request: NextRequest) {
  const key = getUnsplashAccessKey();
  if (!key) {
    return unsplashNotConfiguredResponse();
  }

  const page = request.nextUrl.searchParams.get("page") ?? "1";
  const requestedPer = parseInt(
    request.nextUrl.searchParams.get("per_page") ?? "20",
    10,
  );
  const perPage = Number.isFinite(requestedPer)
    ? Math.min(30, Math.max(1, requestedPer))
    : 20;

  try {
    const url = new URL(`${UNSPLASH_API}/photos`);
    url.searchParams.set("page", page);
    url.searchParams.set("per_page", String(perPage));

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${key}`,
        "Accept-Version": "v1",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Unsplash list photos failed:", res.status, text);
      return NextResponse.json(
        { error: "Unsplash photos request failed", details: text.slice(0, 200) },
        { status: res.status },
      );
    }

    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw)) {
      return NextResponse.json(
        { error: "Unexpected response from Unsplash" },
        { status: 502 },
      );
    }

    const xTotal = parseInt(res.headers.get("X-Total") ?? "0", 10);
    const xPerPage = parseInt(
      res.headers.get("X-Per-Page") ?? String(perPage),
      10,
    );
    const totalPages =
      xTotal > 0 && xPerPage > 0 ? Math.ceil(xTotal / xPerPage) : 1;

    const results: UnsplashPhotoForClient[] = [];
    for (const item of raw) {
      const mapped = mapUnsplashPhotoToClient(
        item as Parameters<typeof mapUnsplashPhotoToClient>[0],
      );
      if (mapped) results.push(mapped);
    }

    return NextResponse.json({
      results,
      total: xTotal,
      totalPages,
    });
  } catch (e) {
    console.error("Unsplash photos error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
