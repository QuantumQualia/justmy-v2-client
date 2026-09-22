"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SkyAvatar } from "@workspace/ui/components/sky-avatar";
import { useIsGuestSession } from "@/hooks/use-is-guest-session";

export function AskSkyTryFreeCta() {
  const guest = useIsGuestSession();
  if (guest !== true) return null;

  return (
    <section className="mx-auto w-full max-w-5xl px-3 pb-8 sm:px-6 lg:max-w-6xl">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-violet-200/80 bg-linear-to-br from-violet-50 via-white to-cyan-50 px-5 py-6 shadow-[0_18px_44px_-22px_rgba(76,29,149,0.38)] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-7 sm:py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 top-0 h-32 w-32 rounded-full bg-violet-400/20 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 bottom-0 h-28 w-28 rounded-full bg-cyan-400/20 blur-2xl"
        />
        <div className="relative z-10 flex min-w-0 items-start gap-3.5">
          <SkyAvatar size={44} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight text-slate-900">Try AskSKY! Free</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Plan a week, a trip, or your card — then start Personal OS or Biz OS.
            </p>
          </div>
        </div>
        <Link
          href="/try-free"
          scroll
          className="relative z-10 mt-4 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-linear-to-r from-violet-600 via-fuchsia-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/30 transition hover:brightness-110 sm:mt-0"
        >
          Try Free
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
