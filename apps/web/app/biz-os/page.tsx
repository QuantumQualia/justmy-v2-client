"use client";

import Link from "next/link";
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

export default function BizOsHomePage() {
  const { data, ready } = useBizOsHome();

  if (!ready) return <BizOsSkeleton />;

  const plan = data?.activePlan;
  const scan = data?.latestScan;
  const profile = data?.profile;
  const firstName = String(profile?.name || "").split(" ")[0];

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
      value: plan ? `${plan.progress}% complete` : "Start a 30-day plan",
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
      label: "SKYSCAN",
      href: "/biz-os/skyscan",
      value: scan ? `${scan.overallScore}/100 visibility` : "Run first audit",
      icon: Radar,
    },
  ];

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow={profile?.zipCode ? `${profile.zipCode} · Biz OS` : "Biz OS"}
        title={firstName ? `Welcome back, ${firstName}.` : "Let’s grow today."}
        description="Polish your card, run visibility, and work a 30-day plan — AskSKY stays with you."
        actions={
          <>
            <Link
              className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-600/20"
              href={plan ? `/biz-os/battle-plans/${plan.id}` : "/biz-os/battle-plans"}
            >
              {plan ? "Resume plan" : "Start a plan"}
            </Link>
            <Link
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              href="/biz-os/onboard"
            >
              Edit myCARD
            </Link>
          </>
        }
      />

      <BizOsSetupNotice />

      {plan ? (
        <BizOsCard>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">Top priority</p>
              <h2 className="mt-1 text-xl font-semibold">{plan.title}</h2>
            </div>
            <p className="text-sm font-medium text-slate-500">{plan.progress}%</p>
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
                      ? "mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-500"
                      : "mt-0.5 h-4 w-4 shrink-0 rounded-full border border-slate-300"
                  }
                />
                <span className={t.status === "completed" ? "text-slate-400 line-through" : "text-slate-700"}>
                  {t.taskText}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href={`/biz-os/battle-plans/${plan.id}`}
            className="mt-4 inline-flex text-sm font-semibold text-violet-600 hover:text-violet-800"
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
              className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_40px_-24px_rgba(76,29,149,0.35)] transition hover:-translate-y-0.5 hover:border-violet-200"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 group-hover:bg-violet-600 group-hover:text-white">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{card.label}</p>
              <p className="mt-1 font-medium text-slate-800">{card.value}</p>
            </Link>
          );
        })}
      </div>

      <BizOsCard>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <Mail className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">Keep neighbors in the loop</h2>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Coming soon
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Weekly Battle Plan check-ins and monthly SKYSCAN stats will email this profile once we have live activity data.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400">
                Weekly digest
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400">
                Monthly stats
              </span>
            </div>
          </div>
        </div>
      </BizOsCard>
    </BizOsPage>
  );
}
