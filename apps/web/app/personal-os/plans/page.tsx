"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, PartyPopper, Plane, Utensils, Home } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { bizOsService, type BattlePlan } from "@/lib/services/biz-os";
import { useBizOsFetch } from "@/components/biz-os/use-biz-os-profile";
import { BizOsEmpty, BizOsPage, BizOsSkeleton } from "@/components/biz-os/biz-os-ui";
import { cn } from "@workspace/ui/lib/utils";

const TEMPLATES = [
  { trigger: "week", label: "Plan my week", hint: "Days, must-dos, reminders", icon: CalendarDays },
  { trigger: "trip", label: "Trip planning", hint: "Dates, home base, itinerary", icon: Plane },
  { trigger: "event", label: "Plan an event", hint: "Guest list, timing, share", icon: PartyPopper },
  { trigger: "diet", label: "Diet planning", hint: "Meals and groceries", icon: Utensils },
  { trigger: "house", label: "Buying a house", hint: "Search, offers, paper", icon: Home },
];

function statusLabel(status: string) {
  if (status === "draft") return "Draft";
  if (status === "active") return "Live";
  return status;
}

export default function PersonalOsPlansPage() {
  const router = useRouter();
  const { data: plans, pageReady, profileId } = useBizOsFetch(
    (id) => bizOsService.listPlans(id),
    [] as BattlePlan[],
  );
  const [creating, setCreating] = useState<string | null>(null);

  async function start(trigger: string) {
    if (!profileId) return;
    setCreating(trigger);
    try {
      const plan = await bizOsService.createPlan(profileId, { trigger });
      router.push(`/personal-os/plans/${plan.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start that plan.");
    } finally {
      setCreating(null);
    }
  }

  if (!pageReady) return <BizOsSkeleton />;

  return (
    <BizOsPage>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">myPLANS</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Your plans</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Sky drafts the steps. You shape them. Make it live when it’s real.
          </p>
        </div>
        <Button disabled={Boolean(creating) || !profileId} onClick={() => void start("week")}>
          {creating ? "Drafting…" : "Plan my week"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.trigger}
              type="button"
              disabled={Boolean(creating)}
              onClick={() => void start(t.trigger)}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_10px_40px_-24px_rgba(76,29,149,0.35)] transition hover:-translate-y-0.5 hover:border-violet-200 disabled:opacity-60"
            >
              <Icon className="h-4 w-4 text-violet-600" />
              <div className="mt-3 text-sm font-semibold text-slate-900">
                {creating === t.trigger ? "Drafting…" : t.label}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">{t.hint}</div>
            </button>
          );
        })}
      </div>

      {plans.length === 0 ? (
        <BizOsEmpty
          title="No plans yet"
          body="Start a week, a trip, or an event. Sky drafts the steps, you shape them, then it goes live."
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/personal-os/plans/${plan.id}`} className="block">
              <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_40px_-24px_rgba(76,29,149,0.35)] transition hover:border-violet-200">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{plan.title}</div>
                    {plan.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{plan.description}</p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      plan.status === "draft"
                        ? "bg-amber-50 text-amber-800"
                        : "bg-violet-50 text-violet-800",
                    )}
                  >
                    {statusLabel(plan.status)}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${Math.min(100, Math.max(0, plan.progress || 0))}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{plan.progress}%</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </BizOsPage>
  );
}
