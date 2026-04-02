"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MyCardContentLiteView } from "@/components/mycard/mycard-content-lite-view";
import { PROFILE_KIND } from "@/lib/os-types";
import type { MyCardMobileViewProps } from "@/components/mycard/live-view-mobile";

export function MyCardMobileCommandView({
  data,
  usePublicNavbar,
  outerTextClass,
  screenBgClass,
  avatarOuterClass,
  avatarPlaceholderBgClass,
  avatarPlaceholderTextClass,
  nameTextClass,
  taglineTextClass,
  aboutTitleTextClass,
  aboutCardClass,
  aboutBodyTextClass,
  ctaButtonClassName,
  registerHref,
  footerAdUrl,
  shouldCenterItems,
  swiperRef,
  contactPrevBtnRef,
  contactNextBtnRef,
  contactActions,
  isLightMycard,
}: MyCardMobileViewProps) {
  return (
    <div className={`${outerTextClass} w-full max-w-xl mx-auto`}>
      <div className={`w-full mx-auto ${screenBgClass} relative overflow-hidden`}>
        <div className="relative">
          <div className="relative h-48 overflow-hidden rounded-b-3xl">
            <div className="absolute inset-0 bg-black/10" />
            <img
              src={data.banner || "/images/banner.jpg"}
              alt="Banner"
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="relative">
              <div className={`h-24 w-24 rounded-full ${avatarOuterClass} overflow-hidden`}>
                {data.photo ? (
                  <img
                    src={data.photo}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`h-full w-full flex items-center justify-center ${avatarPlaceholderBgClass}`}>
                    <span className={`text-2xl font-bold ${avatarPlaceholderTextClass}`}>
                      {data.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-16 pb-8 space-y-6">
          <div className="relative" ref={swiperRef}>
            {!shouldCenterItems && (
              <>
                <button
                  ref={contactPrevBtnRef}
                  type="button"
                  aria-label="Previous contact"
                  className={`absolute -left-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-200 ${isLightMycard
                    ? "border-border bg-[var(--glass-bg)] shadow-[0_2px_10px_oklch(0_0_0/_0.06)] backdrop-blur-[12px] text-foreground/60 hover:text-foreground"
                    : "border-slate-700 bg-slate-900/50 text-white/60 hover:text-white"
                    } active:scale-95`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  ref={contactNextBtnRef}
                  type="button"
                  aria-label="Next contact"
                  className={`absolute -right-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-200 ${isLightMycard
                    ? "border-border bg-[var(--glass-bg)] shadow-[0_2px_10px_oklch(0_0_0/_0.06)] backdrop-blur-[12px] text-foreground/60 hover:text-foreground"
                    : "border-slate-700 bg-slate-900/50 text-white/60 hover:text-white"
                    } active:scale-95`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            <Swiper
              modules={[FreeMode, Navigation]}
              navigation={true}
              freeMode={true}
              slidesPerView="auto"
              spaceBetween={12}
              mousewheel={true}
              grabCursor={true}
              className={`!px-4 ${shouldCenterItems ? "[&_.swiper-wrapper]:justify-center" : "[&_.swiper-wrapper]:justify-start"}`}
              onBeforeInit={(swiper) => {
                const params = swiper.params as any;
                params.navigation = params.navigation === true ? {} : params.navigation ?? {};
                params.navigation.prevEl = contactPrevBtnRef.current;
                params.navigation.nextEl = contactNextBtnRef.current;
              }}
              onSwiper={(swiper) => {
                if (swiper.navigation && typeof swiper.navigation.update === "function") {
                  swiper.navigation.update();
                }
              }}
            >
              {React.Children.map(contactActions, (child, index) => (
                <SwiperSlide key={index} className="!w-auto !h-[45px] !flex items-center justify-center">
                  {child}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

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

          {data.type === PROFILE_KIND.COMMAND ? (
            <MyCardContentLiteView
              profileType={data.type}
              profileSlug={data.slug}
              variant={usePublicNavbar ? "light" : "dark"}
            />
          ) : null}

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
