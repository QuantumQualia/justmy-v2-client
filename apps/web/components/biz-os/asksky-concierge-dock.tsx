"use client";

import { Sparkles, X } from "lucide-react";
import { AskSkyConcierge } from "@/components/biz-os/asksky-concierge";
import { useAskSkyConciergeStore } from "@/lib/store/asksky-concierge-store";

export function AskSkyConciergeDock() {
  const open = useAskSkyConciergeStore((s) => s.dockOpen);
  const setOpen = useAskSkyConciergeStore((s) => s.setDockOpen);
  const pending = useAskSkyConciergeStore((s) => {
    const d = s.cardDrafts;
    return Boolean(
      d.about ||
        d.tagline ||
        d.website ||
        d.email ||
        d.calendarLink ||
        d.hotlinks?.length ||
        d.phones?.length ||
        d.addresses?.length ||
        d.socials?.length,
    );
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-700"
      >
        <Sparkles className="h-4 w-4" />
        AskSKY!
        {pending ? (
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Draft
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 flex h-[min(70vh,36rem)] w-[min(calc(100vw-2rem),22rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        aria-label="Close AskSKY"
      >
        <X className="h-4 w-4" />
      </button>
      <AskSkyConcierge compact fillViewport />
    </div>
  );
}
