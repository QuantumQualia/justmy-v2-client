"use client";

import { useEffect, useState } from "react";
import { FaLinkedin } from "react-icons/fa6";
import {
  SiFacebook,
  SiInstagram,
  SiSnapchat,
  SiTiktok,
  SiX,
  SiYoutube,
} from "react-icons/si";

import type { NewsMarketContext } from "@/components/news/asksky/types";
import { InsetFrame } from "@/components/news/home/inset-frame";
import { COMMUNITY_POSTER_SRC, COMMUNITY_VIDEO_SRC, FALLBACK_SOCIAL } from "@/components/news/home/links";
import { fetchMarketBySlug } from "@/lib/news/fetch-market-by-slug";
import type { MarketSocialResponseDto } from "@/lib/services/markets";

type SocialAccount = {
  platform: string;
  handle: string;
  url: string;
};

const PLATFORM_ORDER = [
  "facebook",
  "instagram",
  "twitter",
  "youtube",
  "snapchat",
  "linkedin",
  "tiktok",
] as const;

function handleFromUrl(url: string, platform: string): string {
  try {
    const path = new URL(url).pathname.split("/").filter(Boolean);
    const last = path[path.length - 1];
    if (last) return last.replace(/^@/, "");
  } catch {
    /* keep platform name */
  }
  return platform;
}

const DEFAULT_VIMEO_ID = "1133304253";

function communityVideo(src: string): { kind: "file"; src: string } | { kind: "vimeo"; id: string } {
  const trimmed = src.trim();
  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo?.[1]) return { kind: "vimeo", id: vimeo[1] };
  if (trimmed) return { kind: "file", src: trimmed };
  return { kind: "vimeo", id: DEFAULT_VIMEO_ID };
}

function listSocials(socials: MarketSocialResponseDto | null | undefined): SocialAccount[] {
  if (!socials) return [];
  const accounts: SocialAccount[] = [];
  for (const platform of PLATFORM_ORDER) {
    const url = socials[platform as keyof MarketSocialResponseDto];
    if (typeof url !== "string" || !url.trim()) continue;
    accounts.push({ platform, handle: handleFromUrl(url, platform), url: url.trim() });
  }
  return accounts;
}

export function CommunityReel({ market }: { market: NewsMarketContext }) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const slug = market.marketSlug?.trim();
    if (!slug) {
      setAccounts([]);
      return;
    }
    let cancelled = false;
    fetchMarketBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setAccounts(listSocials(data.socials));
      })
      .catch(() => {
        if (!cancelled) setAccounts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [market.marketSlug]);

  const socials =
    accounts.length > 0
      ? accounts
      : [
          {
            platform: FALLBACK_SOCIAL.platform,
            handle: FALLBACK_SOCIAL.handle,
            url: FALLBACK_SOCIAL.url,
          },
        ];
  const video = communityVideo(COMMUNITY_VIDEO_SRC);
  const showVideo = !reduceMotion;

  return (
    <InsetFrame>
      <div className="relative min-h-[28rem] overflow-hidden bg-foreground">
        {showVideo && video.kind === "file" ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={video.src}
            poster={COMMUNITY_POSTER_SRC || undefined}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : showVideo && video.kind === "vimeo" ? (
          <iframe
            title=""
            src={`https://player.vimeo.com/video/${video.id}?background=1&autoplay=1&loop=1&muted=1&autopause=0`}
            className="pointer-events-none absolute left-1/2 top-1/2 aspect-video min-h-full w-[177.78%] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
            allow="autoplay; fullscreen"
          />
        ) : COMMUNITY_POSTER_SRC ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={COMMUNITY_POSTER_SRC} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-foreground/45" />
        <div className="relative flex min-h-[28rem] items-center p-4 sm:p-10">
          <div className="max-w-md justmy-corners-lg bg-foreground/75 p-6 text-background shadow-card backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-background/70">
              #TheSundayPaper
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight">
              Real faces. Real neighbors. Your local journalists.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-background/80">
              Every story on the stand is written by someone who actually lives here — #FunCrew members covering their own city, and neighbors like you telling the stories only you&apos;d know to tell.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {socials.map((social) => (
                <a
                  key={`${social.platform}-${social.url}`}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-background/30 bg-background/10 px-3.5 py-2 text-sm font-medium text-background hover:bg-background/20"
                >
                  <PlatformMark platform={social.platform} />
                  @{social.handle}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </InsetFrame>
  );
}

function PlatformMark({ platform }: { platform: string }) {
  const className = "h-3.5 w-3.5";
  const key = platform.trim().toLowerCase();
  const icon =
    key === "facebook" ? (
      <SiFacebook className={className} aria-hidden />
    ) : key === "instagram" ? (
      <SiInstagram className={className} aria-hidden />
    ) : key === "twitter" || key === "x" ? (
      <SiX className={className} aria-hidden />
    ) : key === "youtube" ? (
      <SiYoutube className={className} aria-hidden />
    ) : key === "snapchat" ? (
      <SiSnapchat className={className} aria-hidden />
    ) : key === "linkedin" ? (
      <FaLinkedin className={className} aria-hidden />
    ) : key === "tiktok" ? (
      <SiTiktok className={className} aria-hidden />
    ) : (
      <span className="text-[11px] font-semibold">{platform.slice(0, 1).toUpperCase()}</span>
    );
  return (
    <span
      aria-hidden
      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-background/40"
    >
      {icon}
    </span>
  );
}
