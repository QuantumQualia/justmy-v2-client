"use client";

import { Clock, MapPin, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { FreeMode, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { openShare } from "@/components/common/share/share-store";
import {
  fetchNewsCityOsEvents,
  type CityOsEvent,
} from "@/lib/news/fetch-cityos-events";
import { marketSiteToDomain } from "@/lib/news/fetch-daily-audio-briefing";
import type { NewsMarketContext } from "./types";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";

type AskSkyEventsCarouselProps = {
  market: NewsMarketContext;
};

type LoadState = "loading" | "ready" | "empty" | "error";

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function walkLabel(minutes?: number | null): string | null {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return null;
  const rounded = Math.max(1, Math.round(minutes));
  return `(${rounded}-Min Walk)`;
}

/**
 * CityOS events + optional dining pairings carousel for the AskSKY news page.
 */
export function AskSkyEventsCarousel({ market }: AskSkyEventsCarouselProps) {
  const [state, setState] = useState<LoadState>("loading");
  const [events, setEvents] = useState<CityOsEvent[]>([]);
  const [paginationEl, setPaginationEl] = useState<HTMLElement | null>(null);

  const city = market.city || market.marketName;

  useEffect(() => {
    const domain = marketSiteToDomain(market.site);
    if (!domain) {
      setState("empty");
      setEvents([]);
      return;
    }

    let cancelled = false;
    setState("loading");

    fetchNewsCityOsEvents(domain, 12)
      .then((payload) => {
        if (cancelled) return;
        const next = payload.events.filter((e) => e.imageUrl?.trim());
        setEvents(next);
        setState(next.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        if (cancelled) return;
        setEvents([]);
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [market.site]);

  if (state === "empty" || state === "error") return null;

  return (
    <section className="relative mx-auto w-full max-w-6xl px-3 pb-6 pt-2 sm:px-6 sm:pb-10">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-serif text-[1.55rem] leading-snug tracking-tight text-slate-900 sm:text-[2rem] sm:leading-tight">
          {city} is showing off tonight. Here is where you should be.
        </h2>
        <p className="mt-3 text-sm text-slate-500 sm:text-[15px]">
          AskSKY! paired tonight&apos;s top events with nearby OpenTable
          reservation slots.
        </p>
      </div>

      {state === "loading" ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <EventCardSkeleton />
          <EventCardSkeleton className="hidden sm:block" />
        </div>
      ) : (
        <div className="mt-8 overflow-hidden">
          <Swiper
            key={paginationEl ? "with-pagination" : "init"}
            modules={[FreeMode, Pagination]}
            freeMode
            slidesPerView="auto"
            spaceBetween={18}
            grabCursor
            pagination={
              paginationEl
                ? { el: paginationEl, clickable: true }
                : false
            }
            className="!overflow-visible [&_.swiper-wrapper]:items-stretch"
          >
            {events.map((event, index) => (
              <SwiperSlide
                key={`${event.title}-${event.startAt}-${index}`}
                className="!h-auto !w-[min(100%,22rem)] sm:!w-[24rem]"
              >
                <EventDealCard event={event} />
              </SwiperSlide>
            ))}
          </Swiper>
          <div
            ref={setPaginationEl}
            className="asksky-events-pagination mt-5 flex min-h-6 items-center justify-center gap-1.5 [&>.swiper-pagination-bullet]:h-2 [&>.swiper-pagination-bullet]:w-2 [&>.swiper-pagination-bullet]:rounded-full [&>.swiper-pagination-bullet]:bg-slate-300 [&>.swiper-pagination-bullet]:opacity-100 [&>.swiper-pagination-bullet]:transition-all [&>.swiper-pagination-bullet-active]:scale-125 [&>.swiper-pagination-bullet-active]:bg-violet-500"
            aria-hidden
          />
        </div>
      )}
    </section>
  );
}

function EventDealCard({ event }: { event: CityOsEvent }) {
  const time = formatEventTime(event.startAt);
  const dining = event.dining;
  const distance = walkLabel(dining?.walkMinutes);
  const shareUrl = event.ticketUrl?.trim() || "";

  function handleShare() {
    if (!shareUrl) return;
    void openShare({
      title: event.title,
      description: [event.venue, time].filter(Boolean).join(" · ") || undefined,
      url: shareUrl,
      imageUrl: event.imageUrl,
      entityLabel: event.title,
    });
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)]">
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-4 text-left text-white">
          <h3 className="text-base font-semibold leading-snug drop-shadow-sm sm:text-[17px]">
            {event.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/90 sm:text-[13px]">
            {event.venue ? (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{event.venue}</span>
              </span>
            ) : null}
            {time ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {time}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex items-center gap-2">
          {event.ticketUrl ? (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 flex-1 items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Get Tickets →
            </a>
          ) : (
            <span className="inline-flex min-w-0 flex-1 items-center justify-center rounded-xl bg-violet-600/40 px-4 py-3 text-sm font-semibold text-white/80">
              Get Tickets →
            </span>
          )}
          {shareUrl ? (
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-3 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
              aria-label={`Share ${event.title}`}
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              Share
            </button>
          ) : null}
        </div>

        {dining ? (
          <div className="mt-3.5 border-t border-slate-100 pt-3.5">
            <div className="flex items-start gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                {dining.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dining.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
                    {dining.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {dining.name}
                  {distance ? (
                    <span className="font-normal text-slate-500">
                      {" "}
                      {distance}
                    </span>
                  ) : null}
                </p>
                {dining.reservationLabel ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 sm:text-[13px]">
                    <Clock
                      className="h-3.5 w-3.5 shrink-0 text-cyan-500"
                      aria-hidden
                    />
                    <span className="truncate">{dining.reservationLabel}</span>
                  </p>
                ) : null}
              </div>
            </div>

            {dining.reserveUrl ? (
              <a
                href={dining.reserveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#d9f4f2] px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#c8eeeb]"
              >
                Reserve via OpenTable →
              </a>
            ) : (
              <span className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#d9f4f2]/70 px-4 py-3 text-sm font-semibold text-slate-500">
                Reserve via OpenTable →
              </span>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function EventCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse overflow-hidden rounded-2xl border border-slate-200/90 bg-white ${className}`}
    >
      <div className="aspect-[16/10] bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-11 rounded-xl bg-slate-200" />
        <div className="h-16 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
