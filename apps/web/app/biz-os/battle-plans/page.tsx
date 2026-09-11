"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { bizOsService, type BattlePlan } from "@/lib/services/biz-os";
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

function statusLabel(status: string) {
  if (status === "draft") return "Draft";
  if (status === "archived") return "Archived";
  return "Live";
}

export default function BattlePlansPage() {
  const router = useRouter();
  const invalidateHome = useInvalidateBizOsHome();
  const { data: plans, pageReady, profileId } = useBizOsFetch(
    (id) => bizOsService.listPlans(id),
    [] as BattlePlan[],
  );
  const [creating, setCreating] = useState(false);

  async function startPlan() {
    if (!profileId) return;
    setCreating(true);
    try {
      const plan = await bizOsService.createPlan(profileId, { trigger: "manual" });
      await invalidateHome();
      router.push(`/biz-os/battle-plans/${plan.id}`);
    } finally {
      setCreating(false);
    }
  }

  if (!pageReady) return <BizOsSkeleton />;

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow="BattlePLAN"
        title="Your plans"
        description="Tell Sky what you’re working on. She drafts a plan, you shape it, then it goes live."
        actions={
          <Button disabled={creating || !profileId} onClick={() => void startPlan()}>
            {creating ? "Starting…" : "Start a plan"}
          </Button>
        }
      />
      <div className="space-y-3">
        {plans.length === 0 ? (
          <BizOsEmpty
            title="No plans yet"
            body="Start a plan and talk to Sky. A conversation becomes a tracked checklist once you approve it."
          />
        ) : (
          plans.map((p) => (
            <Link
              key={p.id}
              href={`/biz-os/battle-plans/${p.id}`}
              className="block rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_40px_-24px_rgba(76,29,149,0.35)] transition hover:border-violet-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.title}</p>
                  {p.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.description}</p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    p.status === "draft"
                      ? "bg-violet-50 text-violet-800"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {statusLabel(p.status)}
                </span>
              </div>
              {p.status !== "draft" ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{p.progress}% complete</span>
                  </div>
                  <div className="mt-1">
                    <BizOsProgress value={p.progress} />
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Not live yet — keep talking, then approve.</p>
              )}
            </Link>
          ))
        )}
      </div>
      {plans.length === 0 ? (
        <BizOsCard className="border-violet-100 bg-violet-50/40">
          <h2 className="font-semibold">Start a plan</h2>
          <p className="mt-1 text-sm text-slate-600">
            Bring a goal, not a task list. Sky checks this business’s brain first, then drafts a checklist you can
            cut and add to.
          </p>
          <Button className="mt-4" disabled={creating || !profileId} onClick={() => void startPlan()}>
            {creating ? "Starting…" : "Tell Sky what you’re working on"}
          </Button>
        </BizOsCard>
      ) : null}
    </BizOsPage>
  );
}
