"use client";

import { MyCardContentLiteView } from "@/components/mycard/mycard-content-lite-view";
import { MycardLiveContactBar } from "@/components/mycard/mycard-live-contact-bar";
import { MycardFallbackBanner, MycardProfileAvatar, hasMycardMedia } from "@/components/mycard/mycard-cover-fallbacks";
import { PROFILE_KIND } from "@/lib/os-types";
import type { MyCardMobileViewProps } from "@/components/mycard/live-view-mobile";

export function MyCardMobileCommandView({
  data,
  usePublicNavbar,
  outerTextClass,
  screenBgClass,
  avatarOuterClass,
  nameTextClass,
  taglineTextClass,
  aboutTitleTextClass,
  aboutCardClass,
  aboutBodyTextClass,
  ctaButtonClassName,
  registerHref,
  footerAdUrl,
  contactActions,
  isLightMycard,
}: MyCardMobileViewProps) {
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
            <p className={`text-sm ${taglineTextClass} break-words`}>{data.tagline}</p>
          </div>

          <div className="flex flex-col gap-2">
            {data.hotlinks.map((hotlink) => (
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
            ))}
            <button type="button" className={ctaButtonClassName}>
              Save to Contacts
            </button>
            <button type="button" className={ctaButtonClassName}>
              Send myCARD
            </button>
          </div>

          <MyCardContentLiteView
            profileType={data.type}
            profileSlug={data.slug}
            variant={usePublicNavbar ? "light" : "dark"}
          />

          {data.about && (
            <div className="space-y-2">
              <h2 className={`text-xl font-bold ${aboutTitleTextClass} font-serif`}>About</h2>

              {isLightMycard ? (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {data.about}
                </p>
              ) : (
                <div className={aboutCardClass}>
                  <p className={`text-sm ${aboutBodyTextClass} leading-relaxed whitespace-pre-wrap`}>
                    {data.about}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {footerAdUrl ? (
              <a href={registerHref} aria-label="Claim your free myCARD">
                <img
                  src={footerAdUrl}
                  alt="Get Amplified Now - Claim Your Free myCARD"
                  className="w-full rounded-md rounded-br-none object-cover"
                  loading="lazy"
                />
              </a>
            ) : null}

            <a
              href={registerHref}
              className="block text-center text-sm underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Click to create your free account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
