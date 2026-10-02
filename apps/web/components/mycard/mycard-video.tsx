"use client";

import { getVideoEmbedUrl } from "@/lib/utils/video";

export function MycardVideo({
  url,
  title,
  fill = false,
  natural = false,
  contain = false,
  dark = false,
  bare = false,
}: {
  url: string;
  title?: string;
  /** Stretch to the parent height. Used when the desktop pitch column matches the side cards. */
  fill?: boolean;
  /** Keep the file's own aspect. Vertical pitch videos stay tall. */
  natural?: boolean;
  /** Fit inside the parent. Mobile pitch uses this so a vertical video stays on screen. */
  contain?: boolean;
  /** Letterbox on black. Pitch videos use this. */
  dark?: boolean;
  /** No own radius. The desktop header clips the shared corner. */
  bare?: boolean;
}) {
  const embed = getVideoEmbedUrl(url);
  const mediaClass = fill || contain
    ? "max-h-full w-full object-contain"
    : natural
      ? "block h-auto w-full"
      : "aspect-video w-full";
  const frameClass = [
    "overflow-hidden",
    embed || dark ? "bg-black" : "bg-card",
    bare ? "" : "justmy-corners-xl shadow-card",
    fill || contain ? "flex h-full min-h-0 w-full items-center justify-center" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={frameClass}>
      {embed ? (
        <iframe
          src={embed}
          title={title || "Video"}
          className={
            fill
              ? "h-full w-full border-0 bg-black"
              : contain
                ? "aspect-[9/16] h-full max-h-full w-auto max-w-full border-0 bg-black"
                : natural
                  ? "aspect-[9/16] w-full border-0 bg-black"
                  : "aspect-video w-full border-0 bg-black"
          }
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
