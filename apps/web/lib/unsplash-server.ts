/**
 * Server-only Unsplash Source API helpers (Photo API v1).
 * @see https://unsplash.com/documentation
 */

import { NextResponse } from "next/server";

/** Unsplash dashboard "Access Key" is sent as Authorization: Client-ID … */
export function getUnsplashAccessKey(): string | null {
  const key =
    process.env.UNSPLASH_ACCESS_KEY?.trim() ||
    process.env.UNSPLASH_CLIENT_ID?.trim();
  return key || null;
}

export function unsplashNotConfiguredResponse() {
  return NextResponse.json(
    {
      error:
        "Unsplash is not configured. Set UNSPLASH_ACCESS_KEY (or UNSPLASH_CLIENT_ID) in the server environment.",
    },
    { status: 503 },
  );
}

/** Normalized shape for the image insert dialog + crop flow */
export type UnsplashPhotoForClient = {
  id: string;
  urls: { thumb: string; small: string; regular: string; full: string };
  userName: string;
  userHtml: string;
  photoHtml: string;
};

export function mapUnsplashPhotoToClient(p: {
  id: string;
  urls?: { thumb: string; small: string; regular: string; full: string };
  user?: { name?: string; links?: { html?: string } };
  links?: { html?: string };
}): UnsplashPhotoForClient | null {
  const urls = p.urls;
  if (
    !urls?.thumb ||
    !urls?.small ||
    !urls?.regular ||
    !urls?.full
  ) {
    return null;
  }
  return {
    id: p.id,
    urls,
    userName: p.user?.name ?? "Unknown",
    userHtml: p.user?.links?.html ?? "",
    photoHtml: p.links?.html ?? "",
  };
}
