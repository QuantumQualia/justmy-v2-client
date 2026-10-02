"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  CreditCard,
  Crosshair,
  Mail,
  Radar,
  Star,
} from "lucide-react";
import { useBizOsHome } from "@/components/biz-os/use-biz-os-profile";
import {
  BizOsCard,
  BizOsHeader,
  BizOsPage,
  BizOsProgress,
  BizOsSetupNotice,
  BizOsSkeleton,
} from "@/components/biz-os/biz-os-ui";
import { currentOsLabel } from "@/lib/plan-features";

export default function BizOsHomePage() {
  const { data, ready, me } = useBizOsHome();

  if (!ready) return <BizOsSkeleton />;

  const plan = data?.activePlan;
  const scan = data?.latestScan;
  const profile = data?.profile;
  const firstName = String(profile?.name || "").split(" ")[0];
  const osLabel = currentOsLabel(profile?.osName || me?.osName || me?.profileType);

  const modules = [
    {
      label: "myCARD",
      href: "/biz-os/onboard",
      value: "Edit your digital card",
      icon: CreditCard,
    },
    {
      label: "Battle Plan",
      href: plan ? `/biz-os/battle-plans/${plan.id}` : "/biz-os/battle-plans",
      value: plan ? `${plan.progress}% complete` : "Start a plan",
      icon: Crosshair,
    },
    {
      label: "Reputation",
      href: "/biz-os/reputation",
      value: profile?.googleStarRating
        ? `${profile.googleStarRating} · ${profile.googleRatingCount || 0} reviews`
        : "Connect Google",
      icon: Star,
    },
    {
      label: "SkySCAN",
      href: "/biz-os/skyscan",
      value: scan ? `${scan.overallScore}/100 visibility` : "Run first audit",
      icon: Radar,
    },
  ];

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow={profile?.zipCode ? `${profile.zipCode} · ${osLabel}` : osLabel}
        title={firstName ? `Welcome back, ${firstName}.` : "Let’s grow today."}
        description="Polish your card, run visibility, and keep a Battle Plan next to Sky — AskSKY stays with you."
        actions={
          <>
            <Button asChild>
              <Link href={plan ? `/biz-os/battle-plans/${plan.id}` : "/biz-os/battle-plans"}>
                {plan ? "Resume plan" : "Start a plan"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/biz-os/onboard">Edit myCARD</Link>
            </Button>
          </>
        }
      />

      <BizOsSetupNotice />

      {plan ? (
        <BizOsCard>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Top priority</p>
              <h2 className="mt-1 text-xl font-semibold">{plan.title}</h2>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{plan.progress}%</p>
          </div>
          <div className="mt-3">
            <BizOsProgress value={plan.progress} />
          </div>
          <ul className="mt-4 space-y-2">
            {plan.tasks?.slice(0, 4).map((t: { id: number; status: string; taskText: string }) => (
              <li key={t.id} className="flex items-start gap-2 text-sm">
                <span
                  className={
                    t.status === "completed"
                      ? "mt-0.5 h-4 w-4 shrink-0 rounded-full bg-success"
                      : "mt-0.5 h-4 w-4 shrink-0 rounded-full border border-border"
                  }
                />
                <span className={t.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}>
                  {t.taskText}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href={`/biz-os/battle-plans/${plan.id}`}
            className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-primary"
          >
            Open full battle plan →
          </Link>
        </BizOsCard>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-3xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary text-primary group-hover:bg-primary group-hover:text-white">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{card.label}</p>
              <p className="mt-1 font-medium text-foreground">{card.value}</p>
            </Link>
          );
        })}
      </div>

      <BizOsCard>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Mail className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">Keep neighbors in the loop</h2>
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Coming soon
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Weekly Battle Plan check-ins and monthly SkySCAN stats will email this profile once we have live activity data.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                Weekly digest
              </span>
              <span className="rounded-full border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                Monthly stats
              </span>
            </div>
          </div>
        </div>
      </BizOsCard>
    </BizOsPage>
  );
}
