"use client";

import { AdBanner } from "@/components/common/ad-banner";
import { MycardContentSections } from "@/components/mycard/mycard-content-sections";
import { MycardLiveContactBar } from "@/components/mycard/mycard-live-contact-bar";
import { MycardFallbackBanner, MycardProfileAvatar, hasMycardMedia } from "@/components/mycard/mycard-cover-fallbacks";
import type { MyCardMobileViewProps } from "@/components/mycard/live-view-mobile";
import { openShare } from "@/components/common/share/share-store";
import { legacyPlainText } from "@/lib/legacy-html";
import { downloadProfileVCard } from "@/lib/mycard/vcard";
import { publicMycardUrl } from "@/lib/mycard/public-url";
import { useMycardPublicNavStore } from "@/lib/store/mycard-public-nav-store";

export function MyCardMobileDefaultView({
  data,
  outerTextClass,
  screenBgClass,
  avatarOuterClass,
  nameTextClass,
  taglineTextClass,
  ctaButtonClassName,
  contactActions,
  isLightMycard,
}: MyCardMobileViewProps) {
  const setSection = useMycardPublicNavStore((state) => state.setSection);
  const agent = data.agents?.find((item) => item.agentToken?.trim());
  const showHotlinks = !data.ad?.image;
  return (
    <div className={`${outerTextClass} w-full max-w-xl mx-auto`}>
      <div className={`w-full mx-auto ${screenBgClass} relative overflow-hidden`}>
        <div className="relative">
          <div className="relative h-48 overflow-hidden rounded-b-3xl">
            {hasMycardMedia(data.banner) ? (
              <>
                <div className="absolute inset-0 bg-black/10" />
                <img
                  src={data.banner}
                  alt=""
                  className="w-full h-full object-cover object-center"
                />
              </>
            ) : (
              <MycardFallbackBanner name={data.name} />
            )}
          </div>

          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="relative">
              <div className={`h-24 w-24 rounded-full ${avatarOuterClass} overflow-hidden`}>
                <MycardProfileAvatar name={data.name} photo={data.photo} />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-16 pb-8 space-y-6">
          <MycardLiveContactBar
            contactActions={contactActions}
            isLightMycard={isLightMycard}
          />

          <div className="text-center space-y-2">
            <h1 className={`text-xl md:text-2xl font-bold ${nameTextClass} font-serif`}>
              {data.name}
            </h1>
            <p className={`text-sm ${taglineTextClass} break-words`}>{legacyPlainText(data.tagline)}</p>
          </div>

          <div className="flex flex-col gap-2">
            {showHotlinks
              ? data.hotlinks.map((hotlink) => (
                  <a
                    key={hotlink.id}
                    href={hotlink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={hotlink.url ? `${hotlink.title} — ${hotlink.url}` : hotlink.title}
                    className={ctaButtonClassName}
                  >
                    <span className="min-w-0 truncate">{hotlink.title}</span>
                  </a>
                ))
              : null}
            <button type="button" className={ctaButtonClassName} onClick={() => downloadProfileVCard(data)}>
              Save to Contacts
            </button>
            {agent ? (
              <button type="button" className={ctaButtonClassName} onClick={() => setSection("asksky")}>
                AskSKY!
              </button>
            ) : null}
            <button
              type="button"
              className={ctaButtonClassName}
              onClick={() =>
                void openShare({
                  title: data.name,
                  description: legacyPlainText(data.tagline) || undefined,
                  url: publicMycardUrl(data.slug) || `/${data.slug}`,
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
    </div>
  );
}
