"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, CreditCard } from "lucide-react";
import { useProfileStore } from "@/lib/store/profile-store";
import { PersonalOsStarters } from "@/components/try-free/personal-os-starters";
import { DailyDropReadyBanner } from "@/components/try-free/daily-drop-banner";
import { bizOsService, type BattlePlan } from "@/lib/services/biz-os";
import { useBizOsFetch } from "@/components/biz-os/use-biz-os-profile";
import { BizOsPage, BizOsSkeleton } from "@/components/biz-os/biz-os-ui";
import { cn } from "@workspace/ui/lib/utils";

function statusLabel(status: string) {
  if (status === "draft") return "Draft";
  if (status === "active") return "Live";
  return status;
}

function PersonalOsHomeInner() {
  const search = useSearchParams();
  const welcome = search.get("welcome") === "1" || search.get("welcome") === "true";
  const name = useProfileStore((s) => s.data.name);
  const zip = useProfileStore((s) => s.data.zipCode);
  const firstName = String(name || "").split(" ")[0];
  const { data: plans } = useBizOsFetch((id) => bizOsService.listPlans(id), [] as BattlePlan[]);
  const recent = (plans || []).slice(0, 3);

  return (
    <BizOsPage>
      <section className="overflow-hidden rounded-3xl border border-border bg-card px-6 py-7 shadow-[0_18px_50px_-28px_rgba(76,29,149,0.45)] sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          {zip ? `${zip} · Personal OS` : "Personal OS"}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {welcome
                ? firstName
                  ? `You’re in, ${firstName}.`
                  : "You’re in."
                : firstName
                  ? `Welcome back, ${firstName}.`
                  : "Your life, one place."}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {welcome
                ? "Sky’s got your city. Start a plan, catch Daily Drop, or polish the card she can actually use."
                : "Plan the week, catch the Drop, keep a card Sky can actually use."}
            </p>
          </div>
          <Button asChild>
            <Link href="/personal-os/plans">
              Open myPLANS
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <DailyDropReadyBanner featured />
      <PersonalOsStarters layout="tiles" />

      {recent.length ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Keep going</h2>
            <Link href="/personal-os/plans" className="text-sm font-medium text-primary hover:text-primary">
              All plans
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {recent.map((plan) => (
              <Link
                key={plan.id}
                href={`/personal-os/plans/${plan.id}`}
                className="rounded-2xl border border-border bg-card p-4 shadow-card transition hover:border-primary/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      plan.status === "draft"
                        ? "bg-amber-50 text-amber-800"
                        : "bg-secondary text-primary",
                    )}
                  >
                    {statusLabel(plan.status)}
                  </span>
                  <span className="text-xs text-muted-foreground">{plan.progress}%</span>
                </div>
                <div className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">{plan.title}</div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, plan.progress || 0))}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <Link
        href="/personal-os/card"
        className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 shadow-card transition hover:border-primary/30"
      >
        <span className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
            <CreditCard className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">Your myCARD</span>
            <span className="block text-xs text-muted-foreground">The card Sky and your city see. Ask Sky to draft it.</span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </BizOsPage>
  );
}

export default function PersonalOsHomePage() {
  return (
    <Suspense fallback={<BizOsSkeleton />}>
      <PersonalOsHomeInner />
    </Suspense>
  );
}
