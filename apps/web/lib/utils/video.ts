/**
 * Video embed URL utilities
 *
 * Shared helpers for parsing YouTube, Vimeo, and other video platform URLs
 * into embeddable iframe sources.
 */

function youtubeVideoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const youtube =
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com" ||
    host === "youtu.be";
  if (!youtube) return null;

  if (host === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] || null;
  }

  const queryId = url.searchParams.get("v");
  if (queryId) return queryId;

  const parts = url.pathname.split("/").filter(Boolean);
  const marker = parts.findIndex((part) =>
    part === "embed" || part === "shorts" || part === "live" || part === "v" || part === "e",
  );
  if (marker >= 0) return parts[marker + 1] || null;
  return null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const id = youtubeVideoId(new URL(url));
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
  } catch {
    return null;
  }
}

export function getVimeoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
    const id = parsed.pathname
      .split("/")
      .filter(Boolean)
      .reverse()
      .find((part) => /^\d+$/.test(part));
    return id ? `https://player.vimeo.com/video/${id}` : null;
  } catch {
    return null;
  }
}

/**
 * Returns the embed URL for a given video URL, or null if the URL
 * is not a recognized embed-able platform (YouTube, Vimeo).
 * For unrecognized URLs the caller should fall back to a <video> tag.
 */
export function getVideoEmbedUrl(url: string): string | null {
  return getYouTubeEmbedUrl(url) || getVimeoEmbedUrl(url);
}
