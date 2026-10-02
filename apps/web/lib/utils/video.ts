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
    return id ? `https://player.vimeo.com/video/${id}?transparent=0` : null;
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

const EXTRA_VIDEO_EMBEDS: Array<{ host: string; path: RegExp }> = [
  { host: "dailymotion.com", path: /^\/embed\/video\/[a-z0-9]+/i },
  { host: "geo.dailymotion.com", path: /^\/player(?:\/|$)/i },
  { host: "player.wistia.com", path: /^\/embed\/[a-z0-9]+/i },
  { host: "fast.wistia.net", path: /^\/embed\/iframe\/[a-z0-9]+/i },
  { host: "loom.com", path: /^\/embed\/[a-z0-9-]+/i },
  { host: "facebook.com", path: /^\/plugins\/video\.php$/i },
  { host: "tiktok.com", path: /^\/embed\/v\d+/i },
  { host: "streamable.com", path: /^\/[eo]\/[a-z0-9]+/i },
  { host: "player.twitch.tv", path: /^\/?$/ },
];

function httpsVideoUrl(src: string): URL | null {
  try {
    const url = new URL(src.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function bareHost(url: URL) {
  return url.hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
}

/** https embed URL safe to place in a raw HTML iframe. Page links are rewritten to the embed form. */
export function safeVideoEmbedSrc(src: string): string | null {
  const url = httpsVideoUrl(src);
  if (!url) return null;
  const host = bareHost(url);
  const youtube = host === "youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be";
  const vimeo = host === "vimeo.com" || host === "player.vimeo.com";
  if (host === "facebook.com" && (url.pathname === "/watch" || url.pathname.startsWith("/watch/"))) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.toString())}&show_text=false`;
  }
  if (youtube || vimeo) {
    const already =
      (youtube && url.pathname.startsWith("/embed/")) ||
      (host === "player.vimeo.com" && url.pathname.startsWith("/video/"));
    if (already && host === "player.vimeo.com") {
      url.searchParams.set("transparent", "0");
      return url.toString();
    }
    if (already) return `${url.origin}${url.pathname}${url.search}`;
    return getVideoEmbedUrl(url.toString());
  }
  const extra = EXTRA_VIDEO_EMBEDS.find((item) => item.host === host && item.path.test(url.pathname));
  if (!extra) return null;
  return `${url.origin}${url.pathname}${url.search}`;
}
