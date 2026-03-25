import { NextRequest, NextResponse } from "next/server";
import {
  getUnsplashAccessKey,
  mapUnsplashPhotoToClient,
  unsplashNotConfiguredResponse,
} from "@/lib/unsplash-server";

const UNSPLASH_API = "https://api.unsplash.com";

/**
 * Search photos: GET https://api.unsplash.com/search/photos
 * Legacy used `?client_id=` from jQuery; credentials stay on the server here.
 * @see https://unsplash.com/documentation#search-photos
 */
export async function GET(request: NextRequest) {
  const key = getUnsplashAccessKey();
  if (!key) {
    return unsplashNotConfiguredResponse();
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const page = request.nextUrl.searchParams.get("page") ?? "1";
  const requestedPer = parseInt(
    request.nextUrl.searchParams.get("per_page") ?? "20",
    10,
  );
  const perPage = Number.isFinite(requestedPer)
    ? Math.min(30, Math.max(1, requestedPer))
    : 20;

  if (!q) {
    return NextResponse.json(
      { results: [], total: 0, totalPages: 0, error: "Query required" },
      { status: 400 },
    );
  }

  try {
    const url = new URL(`${UNSPLASH_API}/search/photos`);
    url.searchParams.set("query", q);
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
      console.error("Unsplash search failed:", res.status, text);
      return NextResponse.json(
        { error: "Unsplash search failed", details: text.slice(0, 200) },
        { status: res.status },
      );
    }

    const data = (await res.json()) as {
      results: Array<Parameters<typeof mapUnsplashPhotoToClient>[0]>;
      total: number;
      total_pages: number;
    };

    const results = data.results
      .map((p) => mapUnsplashPhotoToClient(p))
      .filter((x): x is NonNullable<typeof x> => x != null);

    return NextResponse.json({
      results,
      total: data.total,
      totalPages: data.total_pages,
    });
  } catch (e) {
    console.error("Unsplash search error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
