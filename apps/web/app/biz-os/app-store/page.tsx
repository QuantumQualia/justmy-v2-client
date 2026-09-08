"use client";

import Link from "next/link";
import { BizOsCard, BizOsHeader, BizOsPage, BizOsSkeleton, ComingSoonBadge } from "@/components/biz-os/biz-os-ui";
import { useBizOsHome, useBizOsProfile } from "@/components/biz-os/use-biz-os-profile";
import { currentOsLabel, hasAccess } from "@/lib/plan-features";
import { canonicalizeOsName } from "@/lib/os-types";
import { Lock, Sparkles } from "lucide-react";

const HREF: Record<string, string> = {
  myCARD: "/biz-os/onboard",
  "Battle Plans": "/biz-os/battle-plans",
  SkySCAN: "/biz-os/skyscan",
  Reputation: "/biz-os/reputation",
  "App Store": "/biz-os/app-store",
  NewsSTAND: "/news",
  "Event Radar": "/news",
  "Social Syndication": "/biz-os/settings",
  Campaigns: "/biz-os/campaigns",
  SmartHandoff: "/biz-os/smarthandoff",
  "Media engine": "/biz-os/media-engine",
  "Voice schema": "/biz-os/voice-schema",
};

type CatalogApp = {
  id: string;
  name: string;
  description?: string;
  isStandard?: boolean;
  locked?: boolean;
  comingSoon?: boolean;
  href?: string;
  minOs?: string;
};

export default function AppStorePage() {
  const { me } = useBizOsProfile();
  const osName = canonicalizeOsName(me?.osName || me?.profileType);
  const { data, ready } = useBizOsHome();

  if (!ready) return <BizOsSkeleton />;

  const apps = (data?.apps || []) as CatalogApp[];
  const included = apps.filter((a) => a.isStandard);
  const extras = apps.filter((a) => !a.isStandard);

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow="Catalog"
        title="APP Store"
        description={`${currentOsLabel(osName)} includes the core tools. Paid extras that you already unlocked open here; the rest stay on Pricing or Coming soon.`}
      />
      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Included</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {included.map((app) => (
            <Link
              key={app.id}
              href={app.href || HREF[app.name] || "/biz-os"}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_40px_-24px_rgba(76,29,149,0.35)] transition hover:-translate-y-0.5 hover:border-violet-200"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="mt-3 font-semibold">{app.name}</p>
              <p className="mt-1 text-sm text-slate-500">{app.description}</p>
              <p className="mt-4 text-xs font-semibold text-emerald-600">Included</p>
            </Link>
          ))}
        </div>
      </section>
      {extras.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Paid OS</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {extras.map((app) => {
              const href = app.href || HREF[app.name] || "/biz-os/pricing";
              const unlocked = app.minOs ? hasAccess(osName, app.minOs) : false;
              const soon = Boolean(app.comingSoon);
              return (
                <BizOsCard key={app.id} className="border-dashed bg-slate-50/80">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-200 text-slate-600">
                    <Lock className="h-4 w-4" />
                  </span>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{app.name}</p>
                    {soon ? <ComingSoonBadge /> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{app.description}</p>
                  <Link
                    href={unlocked ? href : "/biz-os/pricing"}
                    className="mt-4 inline-flex text-sm font-semibold text-violet-700 hover:underline"
                  >
                    {soon ? (unlocked ? "Learn more" : "See plans") : unlocked ? "Open" : "See plans"}
                  </Link>
                </BizOsCard>
              );
            })}
          </div>
        </section>
      ) : null}
    </BizOsPage>
  );
}
