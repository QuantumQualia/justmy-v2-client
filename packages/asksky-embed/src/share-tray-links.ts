import type { SkyShareTrayChannel, SkyShareTrayConfig } from "./sky-types";

const ALL_CHANNELS: SkyShareTrayChannel[] = ["sms", "whatsapp", "facebook", "x"];

export const ASK_SKY_DEFAULT_CLOSING_MESSAGE =
  "Awesome! Knowledge is power—now let's use it to move Shelby County forward. Don't go to the polls alone; pass the light forward!";

/** True when resolve.shareTray should drive the Ready CTA + tray UI. */
export function isShareTrayActive(
  config: SkyShareTrayConfig | null | undefined,
): config is SkyShareTrayConfig {
  if (!config || config.enabled !== true) {
    return false;
  }
  const readyLabel = typeof config.readyLabel === "string" ? config.readyLabel.trim() : "";
  const url = typeof config.shareUrl === "string" ? config.shareUrl.trim() : "";
  const text = typeof config.shareText === "string" ? config.shareText.trim() : "";
  return readyLabel.length > 0 && url.length > 0 && text.length > 0;
}

export function buildShareBody(shareText: string, shareUrl: string): string {
  const text = shareText.trim();
  const url = shareUrl.trim();
  if (!url) {
    return text;
  }
  if (!text) {
    return url;
  }
  if (text.includes(url)) {
    return text;
  }
  return `${text} ${url}`;
}

export type AskSkyShareLink = {
  channel: SkyShareTrayChannel;
  label: string;
  href: string;
  /** False for OS handlers like `sms:` where `target=_blank` often does nothing. */
  openInNewTab: boolean;
};

export function buildShareTrayLinks(config: SkyShareTrayConfig): AskSkyShareLink[] {
  const url = config.shareUrl.trim();
  const body = buildShareBody(config.shareText, url);
  const encodedBody = encodeURIComponent(body);
  const encodedUrl = encodeURIComponent(url);
  const channels =
    Array.isArray(config.channels) && config.channels.length > 0
      ? ALL_CHANNELS.filter((c) => config.channels!.includes(c))
      : ALL_CHANNELS;

  const links: AskSkyShareLink[] = [];
  for (const channel of channels) {
    if (channel === "sms") {
      // `sms:?body=` works more reliably across iOS/Android than `sms:?&body=`.
      links.push({
        channel,
        label: "SMS",
        href: `sms:?body=${encodedBody}`,
        openInNewTab: false,
      });
    } else if (channel === "whatsapp") {
      links.push({
        channel,
        label: "WhatsApp",
        href: `https://wa.me/?text=${encodedBody}`,
        openInNewTab: true,
      });
    } else if (channel === "facebook") {
      links.push({
        channel,
        label: "Facebook",
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        openInNewTab: true,
      });
    } else if (channel === "x") {
      links.push({
        channel,
        label: "X",
        href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(
          config.shareText.trim() || body,
        )}`,
        openInNewTab: true,
      });
    }
  }
  return links;
}

/** Open a share link; returns false if the browser blocked navigation. */
export function openShareTrayLink(link: AskSkyShareLink): boolean {
  try {
    if (link.openInNewTab) {
      const win = window.open(link.href, "_blank", "noopener,noreferrer");
      return win != null;
    }
    window.location.href = link.href;
    return true;
  } catch {
    return false;
  }
}
