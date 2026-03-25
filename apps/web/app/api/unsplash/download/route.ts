import { NextRequest, NextResponse } from "next/server";
import { getUnsplashAccessKey } from "@/lib/unsplash-server";

/**
 * Trigger download per Unsplash API when a user uses a photo.
 * GET /photos/:id/download
 * @see https://unsplash.com/documentation#track-a-photo-download
 * @see https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines
 */
export async function POST(request: NextRequest) {
  const key = getUnsplashAccessKey();
  if (!key) {
    return NextResponse.json({ error: "Unsplash is not configured." }, { status: 503 });
  }

  let photoId: string;
  try {
    const body = (await request.json()) as { photoId?: string };
    photoId = body.photoId?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!photoId) {
    return NextResponse.json({ error: "photoId required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/${encodeURIComponent(photoId)}/download`,
      {
        headers: {
          Authorization: `Client-ID ${key}`,
          "Accept-Version": "v1",
        },
      },
    );

    if (!res.ok) {
      console.warn("Unsplash download trigger failed:", res.status);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Unsplash download error:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
