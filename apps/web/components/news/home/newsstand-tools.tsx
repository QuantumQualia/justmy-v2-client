"use client";

import { CalendarDays, Heart, PenLine, Store } from "lucide-react";
import Link from "next/link";

import { NEWSSTAND_TOOL_HREFS } from "@/components/news/home/links";
import { useNewsVisitor } from "@/components/news/home/use-news-visitor";

const TILES = [
  {
    href: NEWSSTAND_TOOL_HREFS.publish,
    title: "Publish an Article",
    body: "Got a story? Tell it — Sky helps you write it.",
    icon: PenLine,
  },
  {
    href: NEWSSTAND_TOOL_HREFS.promote,
    title: "Promote Your Business",
    body: "Get found by AskSKY, Google, and your city.",
    icon: Store,
  },
  {
    href: NEWSSTAND_TOOL_HREFS.advertise,
    title: "Advertise an Event",
    body: "Put it in front of the whole city.",
    icon: CalendarDays,
  },
  {
    href: NEWSSTAND_TOOL_HREFS.nonprofits,
    title: "Nonprofit Support",
    body: "Free tools and extra hands for the causes that need them.",
    icon: Heart,
  },
] as const;

export function NewsstandTools() {
  const { signedIn } = useNewsVisitor();

  return (
    <section className="mx-auto w-full max-w-6xl px-3 pb-12 sm:px-6">
      <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
        {signedIn ? "Your NewsSTAND Tools" : "Core Actions"}
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className="justmy-corners-lg border border-border bg-card p-5 shadow-card transition hover:border-primary/30 hover:bg-secondary"
            >
              <span className="flex h-11 w-11 items-center justify-center justmy-corners-sm bg-secondary text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{tile.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tile.body}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
