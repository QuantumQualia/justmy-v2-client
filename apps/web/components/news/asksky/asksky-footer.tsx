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
  market?: NewsMarketContext | null;
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
  const place = market
    ? [market.city, market.state].filter(Boolean).join(", ") ||
      market.metroLabel ||
      market.marketName
    : "";
  const navLinks =
    guest === true ? links : links.filter((link) => !link.href.startsWith("/try-free"));

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1 px-4 py-2.5 text-center sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:py-2.5 lg:text-left">
        <Link
          href="/#"
          className="inline-flex shrink-0 items-center gap-1.5 transition hover:opacity-80"
        >
          <Image
            src="/images/logo.png"
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 rounded-md object-contain"
          />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            JustMy
          </span>
        </Link>

        <nav
          aria-label="AskSKY footer"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 lg:justify-center"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              scroll
              className="text-xs text-muted-foreground transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs leading-tight text-muted-foreground lg:shrink-0 lg:text-right">
          © {new Date().getFullYear()} JustMy Communications Corp.{place ? ` ${place}.` : ""}
        </p>
      </div>
    </footer>
  );
}
