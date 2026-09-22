"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { AskSkyConcierge } from "@/components/biz-os/asksky-concierge";
import { useAskSkyConciergeStore } from "@/lib/store/asksky-concierge-store";
import { isPersonalOsPath } from "@/lib/personal-os/landing";
import { SkyAvatar } from "@workspace/ui/components/sky-avatar";

export function AskSkyConciergeDock() {
  const pathname = usePathname();
  const personal = isPersonalOsPath(pathname || "");
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

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3">
      {open ? (
        <div
          className="asksky-sky-panel pointer-events-auto flex h-[min(70vh,36rem)] w-[min(calc(100vw-2rem),22rem)] flex-col overflow-hidden"
          data-asksky-theme="light"
        >
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
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="asksky-sky-launcher pointer-events-auto"
          data-asksky-theme="light"
        >
          <SkyAvatar size={28} />
          AskSKY!
          {pending ? (
            <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
              Draft
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
}
