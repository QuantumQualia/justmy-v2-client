import type { Metadata } from "next";
import { CalendarDays, Newspaper, Tag } from "lucide-react";

import { NewsZipForm } from "@/components/news/news-zip-form";

export const metadata: Metadata = {
  title: "Find Your Local Market",
  description:
    "Enter your zip code to visit your JustMy market site or local Daily Drop.",
};

const HIGHLIGHTS = [
  {
    icon: Newspaper,
    title: "Daily Drop",
    description: "Your local briefing, every morning.",
  },
  {
    icon: CalendarDays,
    title: "Events",
    description: "What's happening around you this week.",
  },
  {
    icon: Tag,
    title: "Deals",
    description: "Offers from businesses nearby.",
  },
];

export default function NewsLandingPage() {
  return (
    <div className="space-y-12">
      <section className="mx-auto max-w-xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-md">
          Local news, wherever you are
        </span>

        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
          Find your{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            local market
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-md text-base text-white/60">
          Enter your zip code and we&apos;ll take you straight to your market
          site or to your local Daily Drop.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-6">
          <NewsZipForm />
        </div>
      </section>

      <section className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
          >
            <Icon className="h-5 w-5 text-emerald-400" aria-hidden />
            <h2 className="mt-3 text-sm font-semibold text-white">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              {description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
