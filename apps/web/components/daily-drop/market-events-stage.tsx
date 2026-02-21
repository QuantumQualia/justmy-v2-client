"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import type { MarketEvent } from "./types";

/** Event card: larger style, one card visible on mobile. */
const EVENT_GLASS =
  "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden";
/** Image uses aspect ratio (16:9) so height scales with card width. */
const EVENT_IMAGE_ASPECT = "aspect-video";

export interface MarketEventsStageProps {
  title?: string;
  events: MarketEvent[];
  /** e.g. 142 for "See all 142 events" */
  totalCount?: number;
  /** Link for View All card */
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function MarketEventsStage({
  title = "Events",
  events,
  totalCount = 0,
  viewAllHref = "/events",
  viewAllLabel,
  className,
}: MarketEventsStageProps) {
  const count = totalCount || events.length;
  const label =
    viewAllLabel ??
    `Your weekend is waiting. See all ${count} events happening in Memphis.`;

  const [paginationEl, setPaginationEl] = useState<HTMLElement | null>(null);
  const hasEvents = events.length > 0;

  const emptyPlaceholder = (
    <div className="rounded-xl border border-dashed border-white/20 bg-white/5 py-8 px-4 text-center text-sm text-white/50">
      No events available for now. Check back later.
    </div>
  );

  return (
    <section className={className}>
      <h2 className="text-lg font-bold text-white mb-3 tracking-tight">
        {title}
      </h2>
      {!hasEvents ? (
        emptyPlaceholder
      ) : (
        <div className="overflow-hidden">
          <Swiper
            key={paginationEl ? "with-pagination" : "init"}
            modules={[FreeMode, Pagination]}
            freeMode
            slidesPerView="auto"
            spaceBetween={16}
            grabCursor
            pagination={
              paginationEl
                ? { el: paginationEl, clickable: true }
                : false
            }
            className="[&_.swiper-wrapper]:items-stretch"
          >
            {events.map((event) => (
              <SwiperSlide
                key={event.id}
                className="!w-full sm:!w-[320px] !h-auto"
              >
                <EventPosterCard event={event} />
              </SwiperSlide>
            ))}
            <SwiperSlide className="!w-full sm:!w-[320px] !h-auto">
              <ViewAllCard href={viewAllHref} label={label} />
            </SwiperSlide>
          </Swiper>
          {/* Dots below the slider – dark mode: white/gray, not blue */}
          <div
            ref={setPaginationEl}
            className="events-pagination mt-3 flex justify-center items-center gap-1.5 min-h-[24px] [&>.swiper-pagination-bullet]:w-2 [&>.swiper-pagination-bullet]:h-2 [&>.swiper-pagination-bullet]:rounded-full [&>.swiper-pagination-bullet]:bg-white/30 [&>.swiper-pagination-bullet]:transition-all [&>.swiper-pagination-bullet-active]:bg-white [&>.swiper-pagination-bullet-active]:scale-125"
            aria-hidden
          />
        </div>
      )}
    </section>
  );
}

/** Event card: larger image + details + Tickets (one per view on mobile). */
function EventPosterCard({ event }: { event: MarketEvent }) {
  return (
    <div className={`${EVENT_GLASS} flex flex-col h-full`}>
      <div
        className={`relative w-full ${EVENT_IMAGE_ASPECT} shrink-0 bg-slate-800 overflow-hidden`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className="rounded-lg bg-black/50 backdrop-blur px-2 py-1 text-[10px] font-medium text-white/95 whitespace-nowrap">
            {event.weatherBadge}
          </span>
        </div>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1 min-h-0">
        <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wide">
          {event.dateTimeLabel}
        </p>
        <h3 className="font-semibold text-white text-sm sm:text-base leading-tight line-clamp-2 mt-1">
          {event.title}
        </h3>
        <p className="text-[10px] sm:text-xs text-white/70 truncate mt-1 mb-3">
          {event.venue}
        </p>
        <div className="flex mt-auto justify-end items-center gap-2">
          {event.eventUrl ? (
            <a
              href={event.eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500/90 hover:bg-emerald-500 text-black text-xs font-semibold py-2 px-4 transition shrink-0"
            >
              Tickets
            </a>
          ) : (
            <span className="inline-flex items-center justify-center rounded-full bg-white/10 text-white/50 text-xs font-medium py-2 px-4 shrink-0">
              Tickets
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** View All card: same height as event cards. */
function ViewAllCard({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`${EVENT_GLASS} flex flex-col h-full hover:bg-white/[0.08] transition`}
    >
      <div
        className={`w-full ${EVENT_IMAGE_ASPECT} shrink-0 bg-slate-800/80 flex items-center justify-center overflow-hidden`}
      >
        <span className="text-4xl sm:text-5xl" aria-hidden>
          📅
        </span>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1 min-h-0 justify-center text-center">
        <span className="text-sm font-medium text-white/90 leading-snug line-clamp-3">
          {label}
        </span>
        <span className="text-xs text-emerald-400 mt-2">View all events →</span>
      </div>
    </Link>
  );
}
