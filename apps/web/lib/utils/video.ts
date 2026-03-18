/**
 * Video embed URL utilities
 *
 * Shared helpers for parsing YouTube, Vimeo, and other video platform URLs
 * into embeddable iframe sources.
 */

export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

export function getVimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

/**
 * Returns the embed URL for a given video URL, or null if the URL
 * is not a recognized embed-able platform (YouTube, Vimeo).
 * For unrecognized URLs the caller should fall back to a <video> tag.
 */
export function getVideoEmbedUrl(url: string): string | null {
  return getYouTubeEmbedUrl(url) || getVimeoEmbedUrl(url);
}
