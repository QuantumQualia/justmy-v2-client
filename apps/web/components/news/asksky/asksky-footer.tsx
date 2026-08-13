"use client";

import Link from "next/link";

import type { NewsMarketContext } from "./types";

type FooterLink = {
  label: string;
  href: string;
};

const DEFAULT_LINKS: FooterLink[] = [
  { label: "Business", href: "#" },
  { label: "Government", href: "#" },
  { label: "NonProfits", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Privacy", href: "#" },
];

type AskSkyFooterProps = {
  market: NewsMarketContext;
  links?: FooterLink[];
};

/**
 * Light AskSKY footer for the news market page.
 */
export function AskSkyFooter({
  market,
  links = DEFAULT_LINKS,
}: AskSkyFooterProps) {
  const place =
    [market.city, market.state].filter(Boolean).join(", ") ||
    market.metroLabel ||
    market.marketName;

  return (
    <footer className="border-t border-slate-200/80 bg-[#f7f6fb]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:py-7">
        <Link
          href="/#"
          className="inline-flex shrink-0 items-center gap-2.5 self-start transition hover:opacity-80 lg:self-auto"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-violet-500 via-indigo-500 to-sky-400 shadow-[0_0_18px_rgba(139,92,246,0.4)]">
            <svg
              viewBox="0 0 24 24"
              className="relative h-3.5 w-3.5 text-white"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 2l1.2 6.3L19 12l-5.8 3.7L12 22l-1.2-6.3L5 12l5.8-3.7L12 2z" />
            </svg>
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            AskSKY!
          </span>
        </Link>

        <nav
          aria-label="AskSKY footer"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:justify-center"
        >
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[13px] text-slate-500 transition hover:text-slate-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="shrink-0 text-[13px] text-slate-500 lg:text-right">
          © {new Date().getFullYear()} JustMy Civic Systems. {place}.
        </p>
      </div>
    </footer>
  );
}
