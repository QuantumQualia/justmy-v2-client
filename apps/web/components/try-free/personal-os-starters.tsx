"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, CalendarDays, PartyPopper, Plane, Utensils } from "lucide-react";
import { toast } from "sonner";
import { useChatbotStore } from "@/lib/store/chatbot-store";
import { bizOsService } from "@/lib/services/biz-os";
import { useBizOsProfile } from "@/components/biz-os/use-biz-os-profile";
import { useProfileStore } from "@/lib/store/profile-store";
import { fetchLocalProof } from "@/lib/try-free/api";
import { resolveMarketForZip } from "@/lib/news/resolve-market-zip";

const STARTERS = [
  {
    id: "week",
    label: "Plan my week",
    hint: "Sky drafts the days",
    trigger: "week",
    icon: CalendarDays,
  },
  {
    id: "trip",
    label: "Plan a trip",
    hint: "Dates, home base, itinerary",
    trigger: "trip",
    icon: Plane,
  },
  {
    id: "dinner",
    label: "Pick dinner tonight",
    hint: "A local pick, not a list",
    action: "dinner",
    icon: Utensils,
  },
  {
    id: "remind",
    label: "Remind me",
    hint: "So it doesn’t slip",
    trigger: "reminder",
    icon: Bell,
  },
  {
    id: "event",
    label: "Plan an event",
    hint: "Guest list, timing, share",
    trigger: "event",
    icon: PartyPopper,
  },
] as const;

export function PersonalOsStarters({ layout = "pills" }: { layout?: "pills" | "tiles" }) {
  const router = useRouter();
  const { profileId } = useBizOsProfile();
  const zip = useProfileStore((s) => s.data.zipCode);
  const openChatbot = useChatbotStore((s) => s.open);
  const [busy, setBusy] = useState<string | null>(null);

  async function startPlan(trigger: string, id: string) {
    if (!profileId) {
      router.push("/personal-os/plans");
      return;
    }
    setBusy(id);
    try {
      const plan = await bizOsService.createPlan(profileId, { trigger });
      router.push(`/personal-os/plans/${plan.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start that.");
    } finally {
      setBusy(null);
    }
  }

  async function pickDinner() {
    const cleaned = (zip || "").replace(/\D/g, "").slice(0, 5);
    if (cleaned.length !== 5) {
      router.push("/try-free");
      return;
    }
    setBusy("dinner");
    try {
      let tier: "seeded" | "unseeded" = "unseeded";
      try {
        const market = await resolveMarketForZip(cleaned);
        if (market) tier = "seeded";
      } catch {
        tier = "unseeded";
      }
      const proof = await fetchLocalProof({ zip: cleaned, tier });
      toast.success(proof.reply);
      openChatbot?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sky couldn't pick dinner just now.");
    } finally {
      setBusy(null);
    }
  }

  const start = (item: (typeof STARTERS)[number]) => {
    if ("action" in item && item.action === "dinner") {
      void pickDinner();
      return;
    }
    if (item.id === "remind") {
      void startPlan("reminder", item.id);
      if (layout === "pills") openChatbot?.();
      return;
    }
    if ("trigger" in item && item.trigger) {
      void startPlan(item.trigger, item.id);
    }
  };

  if (layout === "pills") {
    return (
      <section className="mx-auto mb-8 max-w-3xl">
        <h2 className="text-xl font-bold">One place for everything you&apos;re juggling</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap one. Sky will actually start it — not a brochure.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {STARTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={Boolean(busy)}
              onClick={() => start(item)}
              className="rounded-full border border-[#e6e4f0] bg-white px-4 py-2 text-sm font-semibold hover:border-[#b9aef7] disabled:opacity-60"
            >
              {busy === item.id ? "Starting…" : item.label}
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Start something with Sky</h2>
        <p className="mt-1 text-sm text-slate-500">Tap one and she actually starts it — not a brochure.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STARTERS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              disabled={Boolean(busy)}
              onClick={() => start(item)}
              className="group rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_10px_40px_-24px_rgba(76,29,149,0.35)] transition hover:-translate-y-0.5 hover:border-violet-200 disabled:opacity-60"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-700 group-hover:bg-violet-100">
                <Icon className="h-4 w-4" />
              </span>
              <div className="mt-3 text-sm font-semibold text-slate-900">
                {busy === item.id ? "Starting…" : item.label}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">{item.hint}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
