"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import {
  AdBanner,
  type AdBannerHotlink,
} from "@/components/common/ad-banner";

type BannerType = "custom" | "market-sponsor" | "profile";

interface AdBannerBlockProps {
  block: PageBlock;
}

const defaultHotlinks: AdBannerHotlink[] = [
  { label: "Learn More", href: "#" },
  { label: "Contact Us", href: "#" },
  { label: "Follow Us", href: "#" },
];

/** Placeholder until backend provides market sponsor banner data */
function MarketSponsorPlaceholder() {
  return (
    <section className="relative w-full overflow-hidden rounded-lg rounded-br-none border border-dashed border-slate-600 bg-slate-800/30 py-8 text-center">
      <p className="text-sm text-slate-500">Market sponsor banner</p>
    </section>
  );
}

/** Placeholder until backend provides profile ad banner by profileId */
function ProfileBannerPlaceholder({ profileId }: { profileId?: string }) {
  return (
    <section className="relative w-full overflow-hidden rounded-lg rounded-br-none border border-dashed border-slate-600 bg-slate-800/30 py-8 text-center">
      <p className="text-sm text-slate-500">
        Profile banner
        {profileId ? ` (profile: ${profileId})` : ""}
      </p>
    </section>
  );
}

export function AdBannerBlock({ block }: AdBannerBlockProps) {
  const bannerType = (block.bannerType as BannerType) || "custom";

  if (bannerType === "market-sponsor") {
    return <MarketSponsorPlaceholder />;
  }

  if (bannerType === "profile") {
    const profileId = (block.profileId as string) || "";
    return <ProfileBannerPlaceholder profileId={profileId || undefined} />;
  }

  // Custom: use CMS image, slug, hotlinks, and optional banner link
  const imageSrc =
    (block.imageSrc as string) || "/images/placeholders/banner_placement.jpg";
  const imageAlt = (block.imageAlt as string) || "Ad Banner";
  const bannerLink = (block.bannerLink as string) || undefined;
  const profileSlug = (block.profileSlug as string) || "sponsor";

  const rawHotlinks = (block.hotlinks as AdBannerHotlink[] | undefined) || [];
  const hotlinks = [
    rawHotlinks[0] ?? defaultHotlinks[0],
    rawHotlinks[1] ?? defaultHotlinks[1],
    rawHotlinks[2] ?? defaultHotlinks[2],
  ] as [AdBannerHotlink, AdBannerHotlink, AdBannerHotlink];

  return (
    <AdBanner
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      bannerLink={bannerLink}
      profileSlug={profileSlug}
      hotlinks={hotlinks}
    />
  );
}

