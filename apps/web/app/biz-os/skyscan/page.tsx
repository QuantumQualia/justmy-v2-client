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

export default function SkyScanPage() {
  const invalidateHome = useInvalidateBizOsHome();
  const { data: scans, setData: setScans, pageReady, profileId } = useBizOsFetch(
    (id) => bizOsService.listSkyscans(id),
    [] as any[],
  );
  const [running, setRunning] = useState(false);
  const [requestingCrew, setRequestingCrew] = useState(false);
  const [flag, setFlag] = useState<string | null>(null);

  async function run() {
    if (!profileId) return;
    setRunning(true);
    try {
      const report = await bizOsService.runSkyscan(profileId);
      setScans((prev) => [report, ...prev]);
      await invalidateHome();
    } finally {
      setRunning(false);
    }
  }

  async function funCrew() {
    if (!profileId || requestingCrew) return;
    setRequestingCrew(true);
    try {
      const res = await bizOsService.funCrew(profileId);
      setFlag(`Flagged plan #${res.planId} for FunCrew.`);
      await invalidateHome();
    } finally {
      setRequestingCrew(false);
    }
  }

  if (!pageReady) return <BizOsSkeleton />;

  const latest = scans[0];
  const scores = (latest?.scores || {}) as Record<string, number>;
  const channels = [
    { key: "search_indexing", label: "Search indexing", max: 30 },
    { key: "review_authority", label: "Review authority", max: 30 },
    { key: "ai_presence", label: "Conversational AI", max: 40 },
  ];

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow="Visibility"
        title="SKYSCAN"
        description="A 30 / 30 / 40 snapshot of search, reviews, and conversational AI. We email an HTML report after each run."
        actions={
          <Button onClick={() => void run()} disabled={running || !profileId}>
            {running ? "Scanning…" : latest ? "Re-run SKYSCAN" : "Run SKYSCAN"}
          </Button>
        }
      />

      {latest ? (
        <BizOsCard className="bg-linear-to-br from-white to-violet-50/60">
          <p className="text-sm text-slate-500">Overall visibility</p>
          <div className="mt-2 flex flex-wrap items-end gap-6">
            <p className="text-6xl font-semibold tracking-tight">
              {latest.overallScore}
              <span className="text-lg font-medium text-slate-400">/100</span>
            </p>
            <div className="min-w-48 flex-1">
              <BizOsProgress value={latest.overallScore} />
            </div>
          </div>
        </BizOsCard>
      ) : (
        <BizOsEmpty
          title="No scans yet"
          body="Run your first estimated audit. We’ll score search, reviews, and how AI assistants might talk about you."
          action={
            <Button onClick={() => void run()} disabled={running || !profileId}>
              {running ? "Scanning…" : "Run SKYSCAN"}
            </Button>
          }
        />
      )}

      {latest ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {channels.map((ch) => {
            const value = scores[ch.key] ?? 0;
            return (
              <BizOsCard key={ch.key}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{ch.label}</p>
                <p className="mt-2 text-3xl font-semibold">
                  {value}
                  <span className="text-sm font-medium text-slate-400">/{ch.max}</span>
                </p>
                <div className="mt-3">
                  <BizOsProgress value={(value / ch.max) * 100} />
                </div>
              </BizOsCard>
            );
          })}
        </div>
      ) : null}

      {scans.length > 1 ? (
        <BizOsCard>
          <h2 className="text-sm font-semibold">Score history</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm text-slate-600">
            {scans.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span>{new Date(s.scannedAt).toLocaleString()}</span>
                <span className="font-semibold text-slate-800">{s.overallScore}/100</span>
              </li>
            ))}
          </ul>
        </BizOsCard>
      ) : null}

      <BizOsCard className="border-violet-200 bg-violet-50/70">
        <h2 className="font-semibold">Want FunCrew to close the gaps?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Flags your active Battle Plan. This is the ticket — no extra queue.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void funCrew()} disabled={requestingCrew || !profileId}>
            {requestingCrew ? "Sending…" : "Request FunCrew"}
          </Button>
          <Link
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
            href="/biz-os/battle-plans"
          >
            Open Battle Plans
          </Link>
        </div>
        {flag ? <p className="mt-3 text-sm text-violet-800">{flag}</p> : null}
      </BizOsCard>
    </BizOsPage>
  );
}
