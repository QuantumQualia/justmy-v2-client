"use client";

import { CalendarDays, Clock, MapPin, Search, Ticket } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { formatEventWhen } from "@/components/news/asksky/asksky-events-carousel";
import { LookupShell } from "@/components/news/home/lookup-shell";
import { Pagination } from "@/components/news/home/pagination";
import { fetchNewsCityOsEventsPage, type CityOsEvent } from "@/lib/news/fetch-cityos-events";
import { marketSiteToDomain } from "@/lib/news/fetch-daily-audio-briefing";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";

const PAGE_SIZE = 12;

type When = "all" | "today" | "weekend" | "week";

const WHEN_OPTIONS: { id: When; label: string }[] = [
  { id: "all", label: "All upcoming" },
  { id: "today", label: "Today" },
  { id: "weekend", label: "This weekend" },
  { id: "week", label: "Next 7 days" },
];

export function EventsLookup() {
  return (
    <LookupShell
      title="Events"
      lede="Concerts, games, shows, and nights out — soonest first. Filter by day or search by name and venue."
    >
      {(market) => <EventDirectory site={market.site} city={market.city || market.marketName} />}
    </LookupShell>
  );
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Browser-local window for a filter; the weekend runs Friday through Sunday. */
function whenRange(when: When): { from?: string; to?: string } {
  if (when === "all") return {};
  const today = startOfDay(new Date());
  if (when === "today") return { from: today.toISOString(), to: addDays(today, 1).toISOString() };
  if (when === "week") return { from: today.toISOString(), to: addDays(today, 7).toISOString() };
  const day = today.getDay();
  const friday = day === 0 ? addDays(today, -2) : day === 6 ? addDays(today, -1) : addDays(today, 5 - day);
  const from = friday < today ? today : friday;
  return { from: from.toISOString(), to: addDays(friday, 3).toISOString() };
}

function dayKey(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "upcoming" : startOfDay(date).toISOString();
}

function dayHeading(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Upcoming";
  const today = startOfDay(new Date());
  const gap = Math.round((startOfDay(date).getTime() - today.getTime()) / 86_400_000);
  if (gap === 0) return "Today";
  if (gap === 1) return "Tomorrow";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" as const } : {}),
  });
}

function DateTile({ iso, size = "md" }: { iso: string; size?: "md" | "lg" }) {
  const date = new Date(iso);
  const valid = !Number.isNaN(date.getTime());
  const big = size === "lg";
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center justmy-corners border border-border bg-card text-foreground ${
        big ? "h-20 w-20" : "h-14 w-14"
      }`}
      aria-hidden
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
        {valid ? date.toLocaleDateString(undefined, { month: "short" }) : "TBA"}
      </span>
      <span className={`font-serif leading-none ${big ? "text-4xl" : "text-2xl"}`}>
        {valid ? date.getDate() : "–"}
      </span>
      {big && valid ? (
        <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {date.toLocaleDateString(undefined, { weekday: "short" })}
        </span>
      ) : null}
    </div>
  );
}

function EventImage({ event, className }: { event: CityOsEvent; className: string }) {
  return event.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={event.imageUrl} alt="" loading="lazy" className={`object-cover ${className}`} />
  ) : (
    <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}>
      <CalendarDays className="h-6 w-6" aria-hidden />
    </div>
  );
}

function TicketButton({ event, size }: { event: CityOsEvent; size?: "sm" | "default" }) {
  const href = event.ticketUrl?.trim();
  if (!href) return null;
  return (
    <Button asChild size={size} className="rounded-full">
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Ticket aria-hidden />
        Tickets
      </a>
    </Button>
  );
}

function FeaturedEvent({ event }: { event: CityOsEvent }) {
  const when = formatEventWhen(event.startAt);
  return (
    <article className="grid overflow-hidden justmy-corners-xl border border-border bg-card shadow-card md:grid-cols-[1.15fr_1fr]">
      <EventImage event={event} className="aspect-[16/9] h-full w-full md:aspect-auto md:min-h-80" />
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <DateTile iso={event.startAt} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Up next</p>
            <p className="mt-1 text-sm text-muted-foreground">{dayHeading(event.startAt)}</p>
          </div>
        </div>
        <h2 className="font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
          {event.title}
        </h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          {event.venue ? (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {event.venue}
            </p>
          ) : null}
          {when ? (
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              {when}
            </p>
          ) : null}
        </div>
        <div className="mt-auto">
          <TicketButton event={event} />
        </div>
      </div>
    </article>
  );
}

function EventRow({ event }: { event: CityOsEvent }) {
  const when = formatEventWhen(event.startAt);
  return (
    <article className="flex gap-4 justmy-corners-lg border border-border bg-card p-3 shadow-card transition hover:border-primary/30">
      <EventImage event={event} className="h-24 w-24 shrink-0 justmy-corners sm:h-28 sm:w-28" />
      <div className="flex min-w-0 flex-1 flex-col py-1">
        {when ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{when}</p>
        ) : null}
        <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-foreground">{event.title}</h3>
        {event.venue ? (
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{event.venue}</span>
          </p>
        ) : null}
        <div className="mt-auto flex justify-end pt-2">
          <TicketButton event={event} size="sm" />
        </div>
      </div>
    </article>
  );
}

function EventDirectory({ site, city }: { site: string | null; city: string }) {
  const domain = marketSiteToDomain(site);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [when, setWhen] = useState<When>("all");
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<CityOsEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [loaded, setLoaded] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(draft.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    if (!domain) {
      setEvents([]);
      setTotal(0);
      setState("ready");
      setLoaded(true);
      return;
    }
    const controller = new AbortController();
    setState("loading");
    fetchNewsCityOsEventsPage(domain, { page, pageSize: PAGE_SIZE, q: query, ...whenRange(when) }, controller.signal)
      .then((result) => {
        setEvents(result.events);
        setTotal(result.totalCount);
        setPages(result.totalPages);
        setState("ready");
        setLoaded(true);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setEvents([]);
        setTotal(0);
        setPages(1);
        setState("error");
        setLoaded(true);
      });
    return () => controller.abort();
  }, [domain, page, query, when]);

  const showFeatured = page === 1 && when === "all" && !query && events.length > 1;
  const featured = showFeatured ? events[0] : null;
  const listed = showFeatured ? events.slice(1) : events;

  const groups = useMemo(() => {
    const buckets = new Map<string, CityOsEvent[]>();
    for (const event of listed) {
      const key = dayKey(event.startAt);
      buckets.set(key, [...(buckets.get(key) ?? []), event]);
    }
    return [...buckets.values()];
  }, [listed]);

  function chooseWhen(next: When) {
    setWhen(next);
    setPage(1);
  }

  function goToPage(next: number) {
    setPage(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const filtered = Boolean(query) || when !== "all";

  return (
    <div ref={topRef} className="scroll-mt-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Search ${city} events or venues`}
            aria-label="Search events"
            className="h-11 rounded-full pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="When">
          {WHEN_OPTIONS.map((option) => {
            const active = option.id === when;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => chooseWhen(option.id)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-secondary"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {loaded ? (
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          {total === 1 ? "1 event" : `${total} events`}
          {pages > 1 ? ` · Page ${page} of ${pages}` : ""}
        </p>
      ) : null}

      {!loaded ? (
        <div className="mt-6 space-y-4">
          <div className="h-80 animate-pulse justmy-corners-xl bg-muted" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-32 animate-pulse justmy-corners-lg bg-muted" />
            ))}
          </div>
        </div>
      ) : state === "error" ? (
        <EmptyState title="Events couldn't load" body="Something went wrong reaching the events feed. Try again in a moment." />
      ) : events.length === 0 ? (
        filtered ? (
          <EmptyState
            title="Nothing matches yet"
            body="Try a different search or widen the date range."
            action={
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setDraft("");
                  chooseWhen("all");
                }}
              >
                Show all upcoming
              </Button>
            }
          />
        ) : (
          <EmptyState title="No events listed yet" body={`We don't have upcoming events for ${city} right now. Check back soon.`} />
        )
      ) : (
        <div className={`mt-6 space-y-10 transition-opacity ${state === "loading" ? "opacity-60" : ""}`}>
          {featured ? <FeaturedEvent event={featured} /> : null}
          {groups.map((dayEvents) => {
            const first = dayEvents[0]!;
            return (
              <section key={dayKey(first.startAt)}>
                <div className="flex items-center gap-4">
                  <DateTile iso={first.startAt} />
                  <div>
                    <h2 className="font-serif text-2xl tracking-tight text-foreground">{dayHeading(first.startAt)}</h2>
                    <p className="text-sm text-muted-foreground">
                      {dayEvents.length === 1 ? "1 event" : `${dayEvents.length} events`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {dayEvents.map((event, index) => (
                    <EventRow key={`${event.title}-${event.startAt}-${index}`} event={event} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} disabled={state === "loading"} onPage={goToPage} label="Event pages" />
    </div>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col items-center justmy-corners-xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <CalendarDays className="h-8 w-8 text-muted-foreground" aria-hidden />
      <h2 className="mt-4 font-serif text-2xl text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
