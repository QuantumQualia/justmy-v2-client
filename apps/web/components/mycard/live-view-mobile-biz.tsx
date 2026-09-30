"use client";

import { AdBanner } from "@/components/common/ad-banner";
import { MycardContentSections } from "@/components/mycard/mycard-content-sections";
import { MycardGoogleRating } from "@/components/mycard/mycard-google-rating";
import { MycardLiveContactBar } from "@/components/mycard/mycard-live-contact-bar";
import { MycardProfileAvatar } from "@/components/mycard/mycard-cover-fallbacks";
import { openShare } from "@/components/common/share/share-store";
import { legacyPlainText } from "@/lib/legacy-html";
import { downloadProfileVCard } from "@/lib/mycard/vcard";
import { publicMycardUrl } from "@/lib/mycard/public-url";
import { useMycardPublicNavStore } from "@/lib/store/mycard-public-nav-store";
import type { MyCardMobileViewProps } from "@/components/mycard/live-view-mobile";

export function MyCardMobileBizView({
  data,
  outerTextClass,
  avatarOuterClass,
  nameTextClass,
  taglineTextClass,
  ctaButtonClassName,
  contactActions,
  isLightMycard,
}: MyCardMobileViewProps) {
  const setSection = useMycardPublicNavStore((state) => state.setSection);
  const agent = data.agents?.find((item) => item.agentToken?.trim());
  const cardUrl = publicMycardUrl(data.slug);
  const showHotlinks = !data.ad?.image;
  const tagline = legacyPlainText(data.tagline);

  return (
    <div className={`${outerTextClass} mx-auto w-full max-w-xl`}>
      <div className="space-y-6 px-4 py-8">
        <div className="flex justify-center">
          <div className={`h-24 w-24 overflow-hidden rounded-full ${avatarOuterClass}`}>
            <MycardProfileAvatar name={data.name} photo={data.photo} />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <h1 className={`text-xl font-bold md:text-2xl ${nameTextClass}`}>{data.name}</h1>
          {tagline ? <p className={`text-sm break-words ${taglineTextClass}`}>{tagline}</p> : null}
          <MycardGoogleRating
            rating={data.googleStarRating}
            count={data.googleRatingCount}
            placeId={data.googlePlaceId}
            reviewLink={data.googleReviewLink}
            variant={isLightMycard ? "light" : "dark"}
          />
        </div>
        <MycardLiveContactBar contactActions={contactActions} isLightMycard={isLightMycard} />
        <div className="flex flex-col gap-2">
          <button type="button" className={ctaButtonClassName} onClick={() => downloadProfileVCard(data)}>
            Save to Contacts
          </button>
          {agent ? (
            <button type="button" className={ctaButtonClassName} onClick={() => setSection("asksky")}>
              AskSKY!
            </button>
          ) : null}
          {showHotlinks
            ? data.hotlinks.map((hotlink) => (
                <a key={hotlink.id} href={hotlink.url} target="_blank" rel="noopener noreferrer" className={ctaButtonClassName}>
                  <span className="min-w-0 truncate">{hotlink.title}</span>
                </a>
              ))
            : null}
          <button
            type="button"
            className={ctaButtonClassName}
            onClick={() =>
              void openShare({
                title: data.name,
                description: tagline || undefined,
                url: cardUrl || `/${data.slug}`,
                entityLabel: "myCARD",
              })
            }
          >
            Send myCARD
          </button>
        </div>

        {data.ad?.image ? (
          <AdBanner
            imageSrc={data.ad.image}
            imageAlt={data.ad.alt || data.name}
            bannerLink={data.ad.href || undefined}
            profileSlug={data.slug}
            hotlinks={data.hotlinks.map((hotlink) => ({ label: hotlink.title, href: hotlink.url }))}
          />
        ) : null}

        <MycardContentSections profileSlug={data.slug} layout="carousel" />
      </div>
    </div>
  );
}
