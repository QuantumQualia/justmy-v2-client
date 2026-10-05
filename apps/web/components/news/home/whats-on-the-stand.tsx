"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { NewsMarketContext } from "@/components/news/asksky/types";
import { BROWSE_CHANNELS_HREF } from "@/components/news/home/links";
import { formatRelativeTime } from "@/components/news/home/use-news-visitor";
import { fetchNewsstandStand, type NewsstandStandPost } from "@/lib/news/fetch-newsstand";

export function WhatsOnTheStand({ market }: { market: NewsMarketContext }) {
  const [posts, setPosts] = useState<NewsstandStandPost[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    const marketId = market.marketId;
    if (!marketId) {
      setState("empty");
      return;
    }
    let cancelled = false;
    setState("loading");
    fetchNewsstandStand(marketId)
      .then((next) => {
        if (cancelled) return;
        setPosts(next.slice(0, 3));
        setState(next.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        if (cancelled) return;
        setPosts([]);
        setState("empty");
      });
    return () => {
      cancelled = true;
    };
  }, [market.marketId]);

  if (state === "loading") {
    return (
      <section className="mx-auto w-full max-w-6xl px-3 pb-10 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-64 animate-pulse justmy-corners-lg bg-muted" />
          <div className="hidden h-64 animate-pulse justmy-corners-lg bg-muted md:block" />
          <div className="hidden h-64 animate-pulse justmy-corners-lg bg-muted md:block" />
        </div>
      </section>
    );
  }
  if (state === "empty") return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-3 pb-12 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
          What&apos;s on the NewsSTAND!
        </h2>
        <Link
          href={BROWSE_CHANNELS_HREF}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Browse All Channels
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <StandStoryCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

export function StandStoryCard({
  post,
  showChannel = true,
}: {
  post: NewsstandStandPost;
  showChannel?: boolean;
}) {
  const card = (
    <article className="relative flex h-72 flex-col justify-end overflow-hidden justmy-corners-lg bg-muted shadow-card">
      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-foreground/55" />
      <div className="relative p-5 text-background">
        {showChannel ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-background/80">
            {post.channel}
          </p>
        ) : null}
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug">{post.title}</h3>
        {post.excerpt ? (
          <p className="mt-1 line-clamp-1 text-sm text-background/80">{post.excerpt}</p>
        ) : null}
        <p className="mt-3 text-xs text-background/70">{formatRelativeTime(post.publishedAt)}</p>
      </div>
    </article>
  );
  return post.url ? (
    <Link href={post.url} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
