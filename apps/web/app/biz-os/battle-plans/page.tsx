"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { bizOsService } from "@/lib/services/biz-os";
import { useBizOsFetch, useInvalidateBizOsHome } from "@/components/biz-os/use-biz-os-profile";
import {
  BizOsCard,
  BizOsEmpty,
  BizOsHeader,
  BizOsPage,
  BizOsProgress,
  BizOsSkeleton,
} from "@/components/biz-os/biz-os-ui";
import { cn } from "@workspace/ui/lib/utils";

const GOALS = [
  { id: "foot-traffic", label: "Foot traffic", hint: "More people through the door" },
  { id: "reviews", label: "More reviews", hint: "Fresh public proof" },
  { id: "leads", label: "Inbound leads", hint: "Calls, forms, bookings" },
  { id: "awareness", label: "Brand awareness", hint: "Show up locally" },
];

export default function BattlePlansPage() {
  const invalidateHome = useInvalidateBizOsHome();
  const { data: plans, setData: setPlans, pageReady, profileId } = useBizOsFetch(
    (id) => bizOsService.listPlans(id),
    [] as any[],
  );
  const [goal, setGoal] = useState("foot-traffic");
  const [custom, setCustom] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!profileId) return;
    setCreating(true);
    try {
      const plan = await bizOsService.createPlan(profileId, goal, custom || undefined);
      setPlans((p) => [plan, ...p]);
      await invalidateHome();
    } finally {
      setCreating(false);
    }
  }

  if (!pageReady) return <BizOsSkeleton />;

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow="30 days"
        title="Battle Plans"
        description="Pick a goal. AskSKY turns it into a checklist and emails a JR welcome."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <BizOsCard>
          <h2 className="text-lg font-semibold">New plan</h2>
          <p className="mt-1 text-sm text-slate-500">Choose what to push this month.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id)}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-left transition",
                  goal === g.id
                    ? "border-violet-500 bg-violet-50 text-violet-900"
                    : "border-slate-200 hover:border-violet-200",
                )}
              >
                <p className="text-sm font-semibold">{g.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{g.hint}</p>
              </button>
            ))}
          </div>
          <input
            className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400"
            placeholder="Optional custom goal"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <Button className="mt-4" disabled={creating || !profileId} onClick={() => void create()}>
            {creating ? "Building…" : "Generate plan"}
          </Button>
        </BizOsCard>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Your plans</h2>
          {plans.length === 0 ? (
            <BizOsEmpty title="None yet" body="Generate a plan to see it here. You can run more than one over time." />
          ) : (
            plans.map((p) => (
              <Link
                key={p.id}
                href={`/biz-os/battle-plans/${p.id}`}
                className="block rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_40px_-24px_rgba(76,29,149,0.35)] transition hover:border-violet-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{p.title}</p>
                  <span className="text-sm font-medium text-slate-500">{p.progress}%</span>
                </div>
                <div className="mt-2">
                  <BizOsProgress value={p.progress} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {p.status}
                  {p.needsSupport ? " · FunCrew flagged" : ""}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </BizOsPage>
  );
}
