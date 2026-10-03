"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { SEE_ALL_EVENTS_HREF } from "@/components/news/home/links";
import {
  fetchNewsCityOsEvents,
  type CityOsEvent,
} from "@/lib/news/fetch-cityos-events";
import { marketSiteToDomain } from "@/lib/news/fetch-daily-audio-briefing";
import { Button } from "@workspace/ui/components/button";
import type { NewsMarketContext } from "./types";

type AskSkyEventsCarouselProps = {
  market: NewsMarketContext;
};

type LoadState = "loading" | "ready" | "empty";

export function formatEventWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours === 0 && minutes === 0) return "All Day";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * Horizontal scroll-snap row of market events. No carousel controls.
 */
export function AskSkyEventsCarousel({ market }: AskSkyEventsCarouselProps) {
  const [state, setState] = useState<LoadState>("loading");
  const [events, setEvents] = useState<CityOsEvent[]>([]);
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
        const next = payload.events
          .filter((event) => event.imageUrl?.trim())
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        setEvents(next);
        setState(next.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        if (cancelled) return;
        setEvents([]);
        setState("empty");
      });

    return () => {
      cancelled = true;
    };
  }, [market.site]);

  if (state === "empty") return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-3 pb-12 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
          {city} is showing off tonight.
        </h2>
        <Link
          href={SEE_ALL_EVENTS_HREF}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          See All Events
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {state === "loading" ? (
        <div className="mt-6 flex gap-4">
          <div className="h-80 w-64 shrink-0 animate-pulse justmy-corners-lg bg-muted" />
          <div className="hidden h-80 w-64 shrink-0 animate-pulse justmy-corners-lg bg-muted sm:block" />
        </div>
      ) : (
        <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {events.map((event, index) => (
            <EventCard key={`${event.title}-${event.startAt}-${index}`} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}

export function EventCard({
  event,
  className = "h-80 w-64 shrink-0 snap-start",
}: {
  event: CityOsEvent;
  className?: string;
}) {
  const when = formatEventWhen(event.startAt);
  const ticketUrl = event.ticketUrl?.trim() || "";
  const detail = [event.venue, when].filter(Boolean).join(" · ");

  return (
    <article className={`relative overflow-hidden justmy-corners-lg bg-muted shadow-card ${className}`}>
      {event.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-foreground/50" />
      <div className="relative flex h-full flex-col justify-end p-4 text-background">
        <h3 className="text-lg font-semibold leading-snug">{event.title}</h3>
        {detail ? <p className="mt-1 text-sm text-background/80">{detail}</p> : null}
        {ticketUrl ? (
          <Button asChild variant="secondary" className="mt-4 w-fit">
            <a href={ticketUrl} target="_blank" rel="noopener noreferrer">
              Buy Tickets
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
