"use client";

import { AdBanner } from "@/components/common/ad-banner";
import { MycardAbout } from "@/components/mycard/mycard-about";
import { MycardContentSections } from "@/components/mycard/mycard-content-sections";
import { MycardRelatedCategories } from "@/components/mycard/mycard-related-categories";
import { MycardGoogleRating } from "@/components/mycard/mycard-google-rating";
import { MycardFallbackBanner, MycardProfileAvatar, hasMycardMedia } from "@/components/mycard/mycard-cover-fallbacks";
import { MycardVideo, profileVideo } from "@/components/mycard/mycard-video";
import { legacyPlainText } from "@/lib/legacy-html";
import type { ProfileData } from "@/lib/store";

const DEFAULT_TAGLINE = "Let's connect.";
const contactRowClass =
  "flex flex-nowrap items-center gap-2 overflow-x-auto py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

interface MyCardDesktopDefaultViewProps {
  data: ProfileData;
  usePublicNavbar: boolean;
  outerTextClass: string;
  avatarOuterClass: string;
  ctaButtonClassName: string;
  registerHref: string;
  contactActions: React.ReactNode;
}

export function MyCardDesktopDefaultView({
  data,
  outerTextClass,
  contactActions,
}: MyCardDesktopDefaultViewProps) {
  const brand = profileVideo(data.videos, "BRAND");
  const tagline = legacyPlainText(data.tagline) || DEFAULT_TAGLINE;

  return (
    <div className={`${outerTextClass} mt-6 w-full`}>
      <div className="mx-auto w-full max-w-[1180px] space-y-8 px-4 pb-10 md:px-6">
        <header className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{data.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
          </div>
          <div className="justmy-corners-xl overflow-hidden bg-muted shadow-card">
            {hasMycardMedia(data.banner) ? (
              <img src={data.banner} alt="" className="aspect-[16/7] w-full object-cover" />
            ) : (
              <MycardFallbackBanner name={data.name} className="aspect-[16/7] w-full" />
            )}
          </div>
          <div className="flex items-center gap-5">
            <div className="size-20 shrink-0 overflow-hidden rounded-full bg-card ring-2 ring-border">
              <MycardProfileAvatar name={data.name} photo={data.photo} fit="contain" />
            </div>
            <div className={`min-w-0 flex-1 ${contactRowClass}`}>{contactActions}</div>
            <MycardGoogleRating
              rating={data.googleStarRating}
              count={data.googleRatingCount}
              placeId={data.googlePlaceId}
              reviewLink={data.googleReviewLink}
              variant="light"
              className="shrink-0 justify-end"
            />
          </div>
        </header>

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
