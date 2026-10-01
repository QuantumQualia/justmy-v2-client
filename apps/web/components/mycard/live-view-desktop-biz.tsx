"use client";

import { useState } from "react";
import { AdBanner } from "@/components/common/ad-banner";
import { AskSkyWidget } from "@/components/asksky/asksky-widget";
import { MycardAbout } from "@/components/mycard/mycard-about";
import { MycardContentSections } from "@/components/mycard/mycard-content-sections";
import { MycardRelatedCategories } from "@/components/mycard/mycard-related-categories";
import { MycardGoogleRating } from "@/components/mycard/mycard-google-rating";
import { MycardProfileAvatar } from "@/components/mycard/mycard-cover-fallbacks";
import { MycardLiveContactBar } from "@/components/mycard/mycard-live-contact-bar";
import { MycardVideo, profileVideo } from "@/components/mycard/mycard-video";
import { openShare } from "@/components/common/share/share-store";
import { legacyPlainText } from "@/lib/legacy-html";
import { publicMycardUrl } from "@/lib/mycard/public-url";
import type { ProfileData } from "@/lib/store";

const DEFAULT_TAGLINE = "Let's connect.";

interface MyCardDesktopBizViewProps {
  data: ProfileData;
  usePublicNavbar: boolean;
  outerTextClass: string;
  avatarOuterClass: string;
  ctaButtonClassName: string;
  registerHref: string;
  contactActions: React.ReactNode;
}

export function MyCardDesktopBizView({
  data,
  usePublicNavbar,
  outerTextClass,
  avatarOuterClass,
  ctaButtonClassName,
  registerHref,
  contactActions,
}: MyCardDesktopBizViewProps) {
  const [askOpen, setAskOpen] = useState(false);
  const agent = data.agents?.find((item) => item.agentToken?.trim());
  const pitch = profileVideo(data.videos, "PITCH");
  const brand = profileVideo(data.videos, "BRAND");
  const cardUrl = publicMycardUrl(data.slug);
  const tagline = legacyPlainText(data.tagline) || DEFAULT_TAGLINE;

  function shareCard() {
    void openShare({
      title: data.name,
      description: tagline,
      url: cardUrl || `/${data.slug}`,
      entityLabel: "myCARD",
    });
  }

  const actions = (
    <div className="flex flex-col gap-2">
      {data.hotlinks.map((hotlink) => (
        <a
          key={hotlink.id}
          href={hotlink.url}
          target="_blank"
          rel="noopener noreferrer"
          className={ctaButtonClassName}
        >
          <span className="min-w-0 truncate">{hotlink.title}</span>
        </a>
      ))}
      {agent ? (
        <button type="button" className={ctaButtonClassName} aria-expanded={askOpen} onClick={() => setAskOpen((open) => !open)}>
          AskSKY!
        </button>
      ) : null}
      <button type="button" className={ctaButtonClassName} onClick={shareCard}>
        Send myCARD
      </button>
      <a href={registerHref} className={ctaButtonClassName}>
        Get myCARD Free
      </a>
    </div>
  );

  return (
    <div className={`${outerTextClass} mt-6 w-full`}>
      <div className="mx-auto w-full max-w-[1180px] space-y-8 px-4 pb-10 md:px-6">
        {pitch?.videoUrl ? (
          <div className="grid grid-cols-3 items-stretch overflow-hidden justmy-corners-xl bg-card shadow-card">
            <aside className="flex min-w-0 flex-col gap-4 border-r border-border bg-card p-5">
              <div className="flex justify-center">
                <div className={`h-24 w-24 overflow-hidden rounded-full ${avatarOuterClass}`}>
                  <MycardProfileAvatar name={data.name} photo={data.photo} />
                </div>
              </div>
              <h1 className="text-center text-2xl font-bold text-foreground">{data.name}</h1>
              <div className="min-w-0">
                <MycardLiveContactBar contactActions={contactActions} isLightMycard={usePublicNavbar} />
              </div>
              <MycardGoogleRating
                rating={data.googleStarRating}
                count={data.googleRatingCount}
                placeId={data.googlePlaceId}
                reviewLink={data.googleReviewLink}
                variant="light"
              />
              {actions}
            </aside>
            <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-border bg-black">
              {askOpen && agent ? (
                <div className="mycard-header-asksky flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
                  <AskSkyWidget
                    profileSlug={data.slug}
                    agentToken={agent.agentToken}
                    variant="inline"
                    embedFill
                    embedKey={`mycard-${data.slug}-${agent.id}`}
                  />
                </div>
              ) : (
                <div className="min-h-0 flex-1">
                  <MycardVideo url={pitch.videoUrl} title={pitch.title || "Pitch"} fill dark bare />
                </div>
              )}
            </section>
            <aside className="flex min-w-0 items-center bg-muted p-8">
              <p className="text-2xl font-semibold leading-snug text-foreground">“{tagline}”</p>
            </aside>
          </div>
        ) : null}

        <MycardContentSections profileSlug={data.slug} layout="grid" collapsible />

        <MycardRelatedCategories categories={data.relatedCategories} />

        {data.ad?.image ? (
          <AdBanner
            imageSrc={data.ad.image}
            imageAlt={data.ad.alt || data.name}
            bannerLink={data.ad.href || undefined}
            profileSlug={data.slug}
            hotlinks={data.hotlinks.map((hotlink) => ({ label: hotlink.title, href: hotlink.url }))}
          />
        ) : null}

        <MycardAbout about={data.about} />

        {brand?.videoUrl ? (
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">{data.name} Video Spotlight</h2>
            <MycardVideo url={brand.videoUrl} title={brand.title || `${data.name} Video Spotlight`} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
