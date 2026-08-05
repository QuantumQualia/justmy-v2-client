import type { Metadata } from "next";

import { NewsHomeLink } from "@/components/news/news-home-link";

export const metadata: Metadata = {
  title: {
    default: "Find Your Local Market",
    template: "%s | JustMy News",
  },
  description:
    "Enter your zip code to go to your local JustMy market site or Daily Drop.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black font-sans text-white">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.18),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]"
      />

      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <NewsHomeLink className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white transition hover:opacity-80">
            <span className="inline-block h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500" />
            JustMy News
          </NewsHomeLink>
          <span className="text-xs text-white/40">Local market routing</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:py-16">
        {children}
      </main>
    </div>
  );
}
