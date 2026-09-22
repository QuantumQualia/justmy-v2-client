"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Radio } from "lucide-react";
import { useProfileStore } from "@/lib/store/profile-store";

export function DailyDropReadyBanner({ featured = false }: { featured?: boolean }) {
  const zip = useProfileStore((s) => s.data.zipCode);
  const startsOn = useProfileStore((s) => s.data.dailyDropStartsOn) || null;

  const ready = useMemo(() => {
    if (!startsOn) return false;
    return new Date(startsOn).getTime() <= Date.now();
  }, [startsOn]);

  const when = startsOn
    ? new Date(startsOn).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  if (!ready && !startsOn) return null;

  if (!featured) {
    if (!ready) {
      return (
        <p className="mx-auto mb-4 max-w-3xl text-sm text-muted-foreground">
          SkyFM Daily Drop starts {when} — the first Monday after you joined.
        </p>
      );
    }
    return (
      <Link
        href="/personal-os/daily-drop"
        className="mx-auto mb-6 flex max-w-3xl items-center justify-between rounded-2xl border border-[#e6e4f0] bg-white px-4 py-3 text-sm font-semibold hover:border-[#b9aef7]"
      >
        <span>Your SkyFM Daily Drop is ready{zip ? ` for ${zip}` : ""}.</span>
        <span className="text-violet-600">Open it →</span>
      </Link>
    );
  }

  return (
    <Link
      href="/personal-os/daily-drop"
      className="flex items-center justify-between gap-4 overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-500 px-5 py-4 text-white shadow-[0_18px_40px_-24px_rgba(76,29,149,0.7)] transition hover:brightness-[1.03]"
    >
      <div className="min-w-0">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-100">
          <Radio className="h-3.5 w-3.5" />
          SkyFM Daily Drop
        </p>
        <p className="mt-1 text-lg font-semibold tracking-tight">
          {ready
            ? `Today’s briefing is ready${zip ? ` for ${zip}` : ""}.`
            : `First Drop ${when} — the Monday after you joined.`}
        </p>
        <p className="mt-0.5 text-sm text-violet-100">
          {ready ? "Open it, then tell Sky what to plan from it." : "Sky will brief your city once a week."}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold backdrop-blur-sm">
        {ready ? "Open →" : "Preview"}
      </span>
    </Link>
  );
}
