"use client";

import Link from "next/link";
import { BizOsCard, BizOsHeader, BizOsPage, BizOsSkeleton } from "@/components/biz-os/biz-os-ui";
import { useBizOsHome } from "@/components/biz-os/use-biz-os-profile";
import { Lock, Sparkles } from "lucide-react";

const HREF: Record<string, string> = {
  myCARD: "/biz-os/onboard",
  "Battle Plans": "/biz-os/battle-plans",
  SKYSCAN: "/biz-os/skyscan",
  Reputation: "/biz-os/reputation",
  "App Store": "/biz-os/app-store",
  NewsSTAND: "/news",
  "Event Radar": "/news",
};

export default function AppStorePage() {
  const { data, ready } = useBizOsHome();

  if (!ready) return <BizOsSkeleton />;

  const apps = data?.apps || [];
  const installed = apps.filter((a: { isStandard?: boolean }) => a.isStandard);
  const locked = apps.filter((a: { locked?: boolean; isStandard?: boolean }) => a.locked || !a.isStandard);

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow="Catalog"
        title="APP Store"
        description="Included with Biz OS. Paid OS plans are on Pricing — every plan keeps these tools."
      />
      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Included</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {installed.map((app: { id: string; name: string; description?: string }) => (
            <Link
              key={app.id}
              href={HREF[app.name] || "/biz-os"}
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
      {locked.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Coming soon</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((app: { id: string; name: string; description?: string }) => (
              <BizOsCard key={app.id} className="border-dashed bg-slate-50/80">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-200 text-slate-600">
                  <Lock className="h-4 w-4" />
                </span>
                <p className="mt-3 font-semibold">{app.name}</p>
                <p className="mt-1 text-sm text-slate-500">{app.description}</p>
                <Link
                  href="/biz-os/pricing"
                  className="mt-4 inline-flex text-sm font-semibold text-violet-700 hover:underline"
                >
                  See plans
                </Link>
              </BizOsCard>
            ))}
          </div>
        </section>
      ) : null}
    </BizOsPage>
  );
}
