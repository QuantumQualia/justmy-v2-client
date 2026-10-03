"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { LookupShell } from "@/components/news/home/lookup-shell";
import { Pagination } from "@/components/news/home/pagination";
import { formatRelativeTime } from "@/components/news/home/use-news-visitor";
import { StandStoryCard } from "@/components/news/home/whats-on-the-stand";
import {
  fetchNewsstandChannelStories,
  fetchNewsstandChannels,
  type NewsstandChannel,
  type NewsstandStandPost,
} from "@/lib/news/fetch-newsstand";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";

/** Page one carries the lead story plus a 3x3 grid; later pages are a 3x3 grid. */
const FIRST_PAGE_SIZE = 10;
const PAGE_SIZE = 9;

function pageWindow(page: number) {
  if (page <= 1) return { offset: 0, limit: FIRST_PAGE_SIZE };
  return { offset: FIRST_PAGE_SIZE + (page - 2) * PAGE_SIZE, limit: PAGE_SIZE };
}

function pageCount(total: number) {
  if (total <= FIRST_PAGE_SIZE) return 1;
  return 1 + Math.ceil((total - FIRST_PAGE_SIZE) / PAGE_SIZE);
}

export function ChannelsLookup() {
  return (
    <LookupShell
      title="Channels"
      lede="Every desk on the stand. Choose one, then read what was just filed."
    >
      {(market) => <ChannelDirectory marketId={market.marketId!} city={market.city || market.marketName} />}
    </LookupShell>
  );
}

function ChannelDirectory({ marketId, city }: { marketId: number; city: string }) {
  const [channels, setChannels] = useState<NewsstandChannel[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<NewsstandStandPost[]>([]);
  const [total, setTotal] = useState(0);
  const [postsFor, setPostsFor] = useState<string | null>(null);
  const [postsState, setPostsState] = useState<"idle" | "loading" | "ready" | "empty">("idle");
  const storiesRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    fetchNewsstandChannels(marketId)
      .then((next) => {
        if (cancelled) return;
        setChannels(next);
        setSelectedId((current) => current ?? next[0]?.id ?? null);
        setState(next.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        if (cancelled) return;
        setChannels([]);
        setState("empty");
      });
    return () => {
      cancelled = true;
    };
  }, [marketId]);

  const requestKey = selectedId ? `${selectedId}:${page}` : null;

  useEffect(() => {
    if (!selectedId || !requestKey) {
      setPosts([]);
      setPostsFor(null);
      setPostsState("idle");
      return;
    }
    let cancelled = false;
    setPostsState("loading");
    const { offset, limit } = pageWindow(page);
    fetchNewsstandChannelStories(marketId, selectedId, offset, limit)
      .then((next) => {
        if (cancelled) return;
        setPosts(next.items);
        setTotal(next.total);
        setPostsFor(requestKey);
        setPostsState(next.items.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        if (cancelled) return;
        setPosts([]);
        setPostsFor(requestKey);
        setPostsState("empty");
      });
    return () => {
      cancelled = true;
    };
  }, [marketId, selectedId, page, requestKey]);

  function selectChannel(id: number) {
    setSelectedId(id);
    setPage(1);
  }

  function goToPage(next: number) {
    setPage(next);
    storiesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return channels;
    return channels.filter((channel) =>
      `${channel.name} ${channel.description}`.toLowerCase().includes(needle),
    );
  }, [channels, query]);

  const selected = channels.find((channel) => channel.id === selectedId) ?? null;

  useEffect(() => {
    const first = visible[0];
    if (!first) return;
    if (!visible.some((channel) => channel.id === selectedId)) {
      setSelectedId(first.id);
      setPage(1);
    }
  }, [visible, selectedId]);

  const storiesMatch = postsFor === requestKey;
  const lead = storiesMatch && page === 1 ? posts[0] ?? null : null;
  const grid = storiesMatch ? (page === 1 ? posts.slice(1) : posts) : [];
  const storyState = !selectedId ? "idle" : storiesMatch ? postsState : "loading";
  const pages = pageCount(total || selected?.postCount || 0);

  return (
    <div>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search ${city} channels`}
        aria-label="Search channels"
        className="h-11 max-w-sm"
      />

      {state === "loading" ? (
        <div className="mt-5 flex gap-2 overflow-hidden">
          <div className="h-10 w-40 animate-pulse rounded-full bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded-full bg-muted" />
          <div className="h-10 w-36 animate-pulse rounded-full bg-muted" />
        </div>
      ) : state === "empty" ? (
        <p className="mt-6 text-sm text-muted-foreground">No channels are on the stand yet.</p>
      ) : visible.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No channels match that search.</p>
      ) : (
        <ChannelRail channels={visible} selectedId={selectedId} onSelect={selectChannel} />
      )}

      {selected ? (
        <section ref={storiesRef} className="mt-8 scroll-mt-24">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">{selected.name}</h2>
                <p className="text-sm font-medium text-primary">
                  {selected.postCount} {selected.postCount === 1 ? "story" : "stories"}
                </p>
              </div>
              {selected.description ? (
                <p className="mt-2 max-w-2xl line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {selected.description}
                </p>
              ) : null}
            </div>
          </div>

          {storyState === "loading" ? (
            <div className="mt-6 space-y-4">
              <div className="h-72 animate-pulse justmy-corners-xl bg-muted" />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="h-64 animate-pulse justmy-corners-lg bg-muted" />
                <div className="hidden h-64 animate-pulse justmy-corners-lg bg-muted md:block" />
                <div className="hidden h-64 animate-pulse justmy-corners-lg bg-muted md:block" />
              </div>
            </div>
          ) : storyState === "empty" ? (
            <p className="mt-6 text-sm text-muted-foreground">Nothing published in this channel yet.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {lead ? <LeadStory post={lead} /> : null}
              {grid.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {grid.map((post) => (
                    <StandStoryCard key={post.id} post={post} showChannel={false} />
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {pages > 1 ? (
            <Pagination
              page={page}
              pages={pages}
              disabled={storyState === "loading"}
              onPage={goToPage}
              label="Story pages"
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ChannelRail({
  channels,
  selectedId,
  onSelect,
}: {
  channels: NewsstandChannel[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setEdges({
      start: rail.scrollLeft > 4,
      end: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    measure();
    const rail = railRef.current;
    if (!rail) return;
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [measure, channels]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (rail.scrollWidth <= rail.clientWidth) return;
      event.preventDefault();
      rail.scrollBy({ left: event.deltaY });
    };
    rail.addEventListener("wheel", onWheel, { passive: false });
    return () => rail.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    const active = rail?.querySelector<HTMLElement>(`[data-channel-id="${selectedId}"]`);
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [selectedId]);

  function nudge(direction: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.7, behavior: "smooth" });
  }

  return (
    <div className="relative mt-5 flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => nudge(-1)}
        disabled={!edges.start}
        aria-label="Scroll channels left"
        className="hidden shrink-0 sm:inline-flex"
      >
        <ChevronLeft aria-hidden />
      </Button>
      <div
        ref={railRef}
        onScroll={measure}
        className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto scroll-smooth py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Channels"
      >
        {channels.map((channel) => {
          const active = channel.id === selectedId;
          return (
            <button
              key={channel.id}
              type="button"
              role="tab"
              data-channel-id={channel.id}
              aria-selected={active}
              onClick={() => onSelect(channel.id)}
              className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-secondary"
              }`}
            >
              <span className="max-w-[14rem] truncate">{channel.name}</span>
              <span className={active ? "text-background/70" : "text-muted-foreground"}>{channel.postCount}</span>
            </button>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => nudge(1)}
        disabled={!edges.end}
        aria-label="Scroll channels right"
        className="hidden shrink-0 sm:inline-flex"
      >
        <ChevronRight aria-hidden />
      </Button>
    </div>
  );
}

function LeadStory({ post }: { post: NewsstandStandPost }) {
  const body = (
    <article className="grid overflow-hidden justmy-corners-xl bg-card shadow-card md:grid-cols-2">
      <div className="relative min-h-56 bg-muted md:min-h-80">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-col justify-end p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {formatRelativeTime(post.publishedAt)}
        </p>
        <h3 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground">{post.title}</h3>
        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        ) : null}
      </div>
    </article>
  );

  return post.url ? (
    <Link href={post.url} className="block transition hover:opacity-95">
      {body}
    </Link>
  ) : (
    body
  );
}
