"use client";

import { getVideoEmbedUrl } from "@/lib/utils/video";

export function MycardVideo({
  url,
  title,
  fill = false,
  natural = false,
  dark = false,
  bare = false,
}: {
  url: string;
  title?: string;
  /** Stretch to the parent height. Used when the desktop pitch column matches the side cards. */
  fill?: boolean;
  /** Keep the file's own aspect. Vertical pitch videos stay tall. */
  natural?: boolean;
  /** Letterbox on black. Pitch videos use this. */
  dark?: boolean;
  /** No own radius. The desktop header clips the shared corner. */
  bare?: boolean;
}) {
  const embed = getVideoEmbedUrl(url);
  const mediaClass = fill ? "h-full w-full object-contain" : natural ? "block h-auto w-full" : "aspect-video w-full";
  const frameClass = [
    "overflow-hidden",
    dark ? "bg-black" : "bg-card",
    bare ? "" : "justmy-corners-xl shadow-card",
    fill ? "flex h-full min-h-0" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={frameClass}>
      {embed ? (
        <iframe
          src={embed}
          title={title || "Video"}
          className={fill ? "h-full w-full border-0" : natural ? "aspect-[9/16] w-full border-0" : "aspect-video w-full border-0"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video src={url} controls playsInline className={mediaClass} title={title || "Video"} />
      )}
    </div>
  );
}

export function profileVideo(videos: { type?: string; videoUrl?: string; title?: string }[] | undefined, type: "PITCH" | "BRAND") {
  return (videos ?? []).find((video) => String(video.type || "").toUpperCase() === type && video.videoUrl?.trim()) ?? null;
}
