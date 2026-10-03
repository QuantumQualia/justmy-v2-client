/** Swap these when the real destinations land. */
export const BROWSE_CHANNELS_HREF = "/news/channels";
export const SEE_ALL_EVENTS_HREF = "/news/events";
export const REFER_FRIEND_HREF = "/lab/refer";

export const NEWSSTAND_TOOL_HREFS = {
  publish: "#publish",
  promote: "#promote",
  advertise: "#advertise",
  nonprofits: "#nonprofits",
} as const;

/** Sunday Paper background. A Vimeo page URL is embedded; a file URL plays as video. */
export const COMMUNITY_VIDEO_SRC =
  process.env.NEXT_PUBLIC_NEWSSTAND_COMMUNITY_VIDEO_URL ??
  "https://vimeo.com/1133304253";
export const COMMUNITY_POSTER_SRC =
  process.env.NEXT_PUBLIC_NEWSSTAND_COMMUNITY_POSTER_URL ?? "";

export const FALLBACK_SOCIAL = {
  platform: process.env.NEXT_PUBLIC_NEWSSTAND_FALLBACK_SOCIAL_PLATFORM ?? "instagram",
  handle: process.env.NEXT_PUBLIC_NEWSSTAND_FALLBACK_SOCIAL_HANDLE ?? "justmy",
  url: process.env.NEXT_PUBLIC_NEWSSTAND_FALLBACK_SOCIAL_URL ?? "https://www.instagram.com/justmy",
};
