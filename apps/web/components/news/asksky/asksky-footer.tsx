"use client";

import Image from "next/image";
import Link from "next/link";

import { useIsGuestSession } from "@/hooks/use-is-guest-session";
import type { NewsMarketContext } from "./types";

type FooterLink = {
  label: string;
  href: string;
};

const DEFAULT_LINKS: FooterLink[] = [
  { label: "Try Free", href: "/try-free" },
  { label: "Business", href: "/try-free?for=business" },
  { label: "Government", href: "/try-free?for=nonprofit" },
  { label: "NonProfits", href: "/try-free?for=nonprofit" },
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
  const guest = useIsGuestSession();
  const place =
    [market.city, market.state].filter(Boolean).join(", ") ||
    market.metroLabel ||
    market.marketName;
  const navLinks =
    guest === true ? links : links.filter((link) => !link.href.startsWith("/try-free"));

  return (
    <footer className="border-t border-slate-200/80 bg-[#f7f6fb]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:py-7">
        <Link
          href="/#"
          className="inline-flex shrink-0 items-center gap-2.5 self-start transition hover:opacity-80 lg:self-auto"
        >
          <Image
            src="/images/logo.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-contain shadow-sm shadow-violet-500/25"
          />
          <span className="text-sm font-bold tracking-tight text-slate-900">
            JustMy
          </span>
        </Link>

        <nav
          aria-label="AskSKY footer"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:justify-center"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              scroll
              className="text-[13px] text-slate-500 transition hover:text-slate-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="shrink-0 text-[13px] text-slate-500 lg:text-right">
          © {new Date().getFullYear()} JustMy Communications Corp. {place}.
        </p>
      </div>
    </footer>
  );
}
