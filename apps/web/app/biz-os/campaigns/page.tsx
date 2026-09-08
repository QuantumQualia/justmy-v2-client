"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { bizOsService } from "@/lib/services/biz-os";
import { useBizOsFetch } from "@/components/biz-os/use-biz-os-profile";
import {
  BizOsCard,
  BizOsHeader,
  BizOsPage,
  BizOsProgress,
  BizOsSkeleton,
} from "@/components/biz-os/biz-os-ui";
import { BizOsPlanGate } from "@/components/biz-os/plan-gate";

export default function CampaignsPage() {
  const { data: scans, pageReady, profileId } = useBizOsFetch(
    (id) => bizOsService.listSkyscans(id),
    [] as Awaited<ReturnType<typeof bizOsService.listSkyscans>>,
  );
  const { data: campaigns, setData: setCampaigns } = useBizOsFetch(
    (id) => bizOsService.listCampaigns(id),
    [] as Awaited<ReturnType<typeof bizOsService.listCampaigns>>,
    "campaigns",
  );
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [comp1, setComp1] = useState("");
  const [comp2, setComp2] = useState("");

  const latest = scans[0];
  const sov = latest?.auditData?.shareOfVoice;
  const targets = latest?.auditData?.extractedTargets || [];

  useEffect(() => {
    const active = campaigns.find((c) => c.status === "active");
    if (!active) return;
    setComp1(active.competitor1Name || "");
    setComp2(active.competitor2Name || "");
  }, [campaigns]);

  async function saveCompetitors() {
    if (!profileId || savingCampaign) return;
    setSavingCampaign(true);
    try {
      const active = campaigns.find((c) => c.status === "active");
      const row = await bizOsService.upsertCampaign(profileId, {
        id: active?.id,
        name: active?.name || "Primary campaign",
        competitor1Name: comp1.trim() || null,
        competitor2Name: comp2.trim() || null,
        makeActive: true,
      });
      setCampaigns((prev) => [row, ...prev.filter((c) => c.id !== row.id)]);
    } finally {
      setSavingCampaign(false);
    }
  }

  if (!pageReady) return <BizOsSkeleton />;

  return (
    <BizOsPlanGate
      minTier="enterprise"
      title="Campaigns"
      body="War room, two competitors, and share of AI voice are included with Enterprise."
    >
      <BizOsPage>
        <BizOsHeader
          eyebrow="Enterprise"
          title="Campaign war room"
          description="Track up to two competitors. Re-run SkySCAN to refresh share of voice."
          actions={
            <Button asChild variant="outline">
              <Link href="/biz-os/skyscan">Open SkySCAN</Link>
            </Button>
          }
        />
      <BizOsCard>
        {sov ? (
          <div>
            <p className="text-sm text-slate-600">
              Market share of AI voice {sov.clientShare}% · rank #{sov.rank}
            </p>
            <div className="mt-2">
              <BizOsProgress value={sov.clientShare} />
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <p>
                {sov.clientName}: {sov.clientShare}%
              </p>
              {sov.competitors.map((c) => (
                <p key={c.name} className="text-slate-600">
                  {c.name}: {c.share}%
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Add up to two competitor names, then re-run SkySCAN for share of voice.
          </p>
        )}
        {targets.length ? (
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {targets.map((t) => (
              <li key={t.label}>
                <span className="font-medium text-slate-800">{t.kind}:</span> {t.label}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Competitor 1 name"
            value={comp1}
            onChange={(e) => setComp1(e.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Competitor 2 name"
            value={comp2}
            onChange={(e) => setComp2(e.target.value)}
          />
        </div>
        <Button className="mt-3" variant="outline" disabled={savingCampaign} onClick={() => void saveCompetitors()}>
          {savingCampaign ? "Saving…" : "Save competitors"}
        </Button>
        {campaigns.length ? (
          <label className="mt-3 block text-sm text-slate-600">
            Active campaign
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={campaigns.find((c) => c.status === "active")?.id || ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                const row = campaigns.find((c) => c.id === id);
                if (!row || !profileId) return;
                void bizOsService
                  .upsertCampaign(profileId, {
                    id: row.id,
                    name: row.name,
                    makeActive: true,
                    targetKeywords: row.targetKeywords || undefined,
                    competitor1Name: row.competitor1Name,
                    competitor1Url: row.competitor1Url,
                    competitor2Name: row.competitor2Name,
                    competitor2Url: row.competitor2Url,
                  })
                  .then((saved) => {
                    setCampaigns((prev) =>
                      prev.map((c) => ({ ...c, status: c.id === saved.id ? "active" : "paused" })),
                    );
                  });
              }}
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </BizOsCard>
    </BizOsPage>
    </BizOsPlanGate>
  );
}
