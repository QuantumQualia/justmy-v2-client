"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import { FreeMode, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { flattenContactActions } from "@/components/mycard/flatten-contact-actions";

function contactBarOverflows(swiper: SwiperClass) {
  if (swiper.isLocked) return false;
  // Swiper 12 types omit these instance metrics; they exist at runtime.
  const { virtualSize, size } = swiper as SwiperClass & {
    virtualSize: number;
    size: number;
  };
  // Ignore subpixel / rounding so arrows stay hidden when every icon is on-screen.
  return virtualSize - size > 8;
}

export function MycardLiveContactBar({
  contactActions,
  isLightMycard,
}: {
  contactActions: ReactNode;
  isLightMycard: boolean;
}) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [overflows, setOverflows] = useState(false);

  const syncOverflow = useCallback((swiper: SwiperClass) => {
    const next = contactBarOverflows(swiper);
    setOverflows((prev) => (prev === next ? prev : next));
  }, []);

  const navBtnClass = `absolute top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-200 active:scale-95 ${
    isLightMycard
      ? "border-border bg-[var(--glass-bg)] shadow-[0_2px_10px_oklch(0_0_0/_0.06)] backdrop-blur-[12px] text-foreground/60 hover:text-foreground"
      : "border-slate-700 bg-slate-900/50 text-white/60 hover:text-white"
  }`;

  return (
    <div className="relative">
      <button
        ref={prevRef}
        type="button"
        aria-label="Previous contact"
        aria-hidden={!overflows}
        tabIndex={overflows ? 0 : -1}
        className={`-left-3 ${navBtnClass} ${overflows ? "" : "invisible pointer-events-none"}`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        ref={nextRef}
        type="button"
        aria-label="Next contact"
        aria-hidden={!overflows}
        tabIndex={overflows ? 0 : -1}
        className={`-right-3 ${navBtnClass} ${overflows ? "" : "invisible pointer-events-none"}`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <Swiper
        modules={[FreeMode, Navigation]}
        watchOverflow
        navigation
        freeMode
        slidesPerView="auto"
        spaceBetween={12}
        grabCursor={overflows}
        className={`[&_.swiper-slide:last-child]:!mr-0 ${
          overflows
            ? ""
            : "[&_.swiper-wrapper]:!w-full [&_.swiper-wrapper]:justify-center [&_.swiper-wrapper]:!transform-none"
        }`}
        onBeforeInit={(swiper) => {
          const params = swiper.params.navigation;
          if (params && typeof params !== "boolean") {
            params.prevEl = prevRef.current;
            params.nextEl = nextRef.current;
          }
        }}
        onSwiper={(swiper) => {
          swiper.navigation?.init?.();
          swiper.navigation?.update?.();
          requestAnimationFrame(() => {
            swiper.update();
            syncOverflow(swiper);
          });
        }}
        onResize={syncOverflow}
        onLock={syncOverflow}
        onUnlock={syncOverflow}
        onSlidesUpdated={syncOverflow}
        onAfterInit={syncOverflow}
      >
        {flattenContactActions(contactActions).map((child, index) => (
          <SwiperSlide
            key={index}
            className="!w-auto !h-[45px] !flex items-center justify-center"
          >
            {child}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
