"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  bizOsService,
  type SkyScanCheck,
  type SkyScanReport,
} from "@/lib/services/biz-os";
import { useBizOsFetch, useBizOsProfile, useInvalidateBizOsHome } from "@/components/biz-os/use-biz-os-profile";
import {
  BizOsCard,
  BizOsEmpty,
  BizOsHeader,
  BizOsPage,
  BizOsProgress,
  BizOsSkeleton,
} from "@/components/biz-os/biz-os-ui";
import { useAskSkyConciergeStore, type ConciergeAction } from "@/lib/store/asksky-concierge-store";
import { hasAccess, osNameToAccountTier, accountTierLabel } from "@/lib/plan-features";
import { canonicalizeOsName, isBusinessOs } from "@/lib/os-types";

const HIDDEN_CHECKS = new Set(["directory_sync", "owner_reply", "smarthandoff", "geo_smarthandoff"]);

const CHANNELS = [
  { key: "search_indexing" as const, label: "Search indexing", max: 30, checks: ["google_index", "bing_index", "nap", "json_ld"] },
  {
    key: "review_authority" as const,
    label: "Review authority",
    max: 30,
    // Outscraper / Twilio: add "directory_sync", "smarthandoff" when those services are live.
    checks: ["google_volume", "google_rating", "google_recency"],
  },
  {
    key: "ai_presence" as const,
    label: "Conversational AI / GEO",
    max: 40,
    // Twilio: add "geo_smarthandoff" when SmartHandoff is live.
    checks: ["brand_recognition", "realtime_accuracy", "asksky_verification"],
  },
];

function statusDot(status: SkyScanCheck["status"] | undefined) {
  if (status === "pass") return "bg-emerald-500";
  if (status === "gap") return "bg-amber-400";
  if (status === "unavailable") return "bg-slate-300";
  return "bg-rose-500";
}

function checksFor(report: SkyScanReport | undefined, keys: string[]) {
  const all = report?.auditData?.checks || [];
  return keys.map((key) => all.find((c) => c.key === key)).filter(Boolean) as SkyScanCheck[];
}

export default function SkyScanPage() {
  const invalidateHome = useInvalidateBizOsHome();
  const { me } = useBizOsProfile();
  const { data: scans, setData: setScans, pageReady, profileId } = useBizOsFetch(
    (id) => bizOsService.listSkyscans(id),
    [] as SkyScanReport[],
  );
  const { data: campaigns, setData: setCampaigns } = useBizOsFetch(
    (id) => bizOsService.listCampaigns(id),
    [] as Awaited<ReturnType<typeof bizOsService.listCampaigns>>,
    "campaigns",
  );
  const [running, setRunning] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [comp1, setComp1] = useState("");
  const [comp2, setComp2] = useState("");
  const setDockOpen = useAskSkyConciergeStore((s) => s.setDockOpen);
  const setTurns = useAskSkyConciergeStore((s) => s.setTurns);

  const osName = canonicalizeOsName(me?.osName || me?.profileType);
  const isCommand = hasAccess(osName, "command");
  const isCommandPro = hasAccess(osName, "command_pro");
  const isEnterprise = hasAccess(osName, "enterprise");
  const planLabel = accountTierLabel(osNameToAccountTier(osName));

  async function run() {
    if (!profileId) return;
    setRunning(true);
    try {
      const report = await bizOsService.runSkyscan(profileId);
      setScans((prev) => [report, ...prev]);
      await invalidateHome();
      openAskSky(report);
    } finally {
      setRunning(false);
    }
  }

  function openAskSky(report: SkyScanReport) {
    const audit = report.auditData || {};
    const gaps = (audit.checks || [])
      .filter((c) => !HIDDEN_CHECKS.has(c.key) && (c.status === "fail" || c.status === "gap"))
      .slice(0, 3);
    const gapLine = gaps.length ? gaps.map((g) => g.label).join(", ") : "no major gaps";
    let text = `Your SkySCAN is ${report.overallScore}/100. Biggest gaps: ${gapLine}.`;
    let actions: ConciergeAction[] = [
      { id: "a", label: "Option A: Generate Free DIY BattlePlan", kind: "diy" },
      { id: "b", label: "Option B: Upgrade to Command OS to Auto-Fix", kind: "upgrade" },
    ];
    if (isEnterprise) {
      text = `${text}\nI extracted entity and topical targets so we can route them into a campaign.`;
      actions = [
        { id: "a", label: 'Option A: Attach to active BattlePlan', kind: "attach_campaign" },
        { id: "b", label: "Option B: Start a New Separate Campaign", kind: "new_campaign" },
        { id: "c", label: "Option C: Have #FunCREW Squad Execute Hands-Free", kind: "funcrew_ent" },
      ];
    } else if (isCommand) {
      const flags = audit.flags || {};
      // When Twilio is ready, append: · ${flags.smartHandoff ? "🟢" : "🟡"} SmartHandoff
      text = `${text}\n${flags.geoLocked ? "🟢" : "🟡"} GEO locking · ${flags.kbSynced ? "🟢" : "🟡"} Knowledge Base sync`;
      actions = [
        { id: "a", label: "Create My Custom BattlePlan", kind: "command_plan" },
        { id: "b", label: "Request #FunCREW Execution", kind: "funcrew" },
      ];
    }
    setDockOpen(true);
    setTurns((prev) => [
      ...prev.filter((t) => !t.text.startsWith("Your SkySCAN is")),
      { role: "asksky", text, actions },
    ]);
  }

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
      setCampaigns((prev) => {
        const rest = prev.filter((c) => c.id !== row.id);
        return [row, ...rest];
      });
    } finally {
      setSavingCampaign(false);
    }
  }

  if (!pageReady) return <BizOsSkeleton />;

  const bizOsListing = isBusinessOs(me?.osName || me?.profileType);
  if (!bizOsListing) {
    return (
      <BizOsPage>
        <BizOsHeader
          eyebrow="Visibility"
          title="SkySCAN"
          description="Live 30 / 30 / 40 audit of search, reviews, and conversational AI."
        />
        <BizOsEmpty
          title="Biz OS listing required"
          body="SkySCAN is only available after you sign in with a Biz OS profile. Personal and newsstand accounts cannot run it. Claim or open a business listing to continue."
          action={
            <Button asChild>
              <Link href="/biz-os/onboard">Open myCARD / claim</Link>
            </Button>
          }
        />
      </BizOsPage>
    );
  }

  const latest = scans[0];
  const scores = latest?.scores || {};
  const header = latest?.auditData?.header;
  const flags = latest?.auditData?.flags;
  const sov = latest?.auditData?.shareOfVoice;
  const targets = latest?.auditData?.extractedTargets || [];
  const visibleChecks = (latest?.auditData?.checks || []).filter((c) => !HIDDEN_CHECKS.has(c.key));
  const winning = visibleChecks.filter((c) => c.status === "pass").slice(0, 3);
  const opportunities = visibleChecks.filter((c) => c.status === "fail" || c.status === "gap").slice(0, 3);

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow="Visibility"
        title="SkySCAN"
        description={
          isCommand
            ? `${header?.name || "Your business"} · ${planLabel}`
            : "A live 30 / 30 / 40 audit of search, reviews, and conversational AI."
        }
        actions={
          <Button onClick={() => void run()} disabled={running || !profileId}>
            {running ? "Scanning…" : latest ? "Re-run SkySCAN" : "Run SkySCAN"}
          </Button>
        }
      />

      {header?.name ? (
        <BizOsCard>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Business</p>
          <p className="mt-1 text-lg font-semibold">{header.name}</p>
          <p className="mt-1 text-sm text-slate-600">
            {[header.address, header.website, header.category].filter(Boolean).join(" · ") || "Add address, website, and category on myCARD"}
          </p>
        </BizOsCard>
      ) : null}

      {latest ? (
        <BizOsCard className="bg-linear-to-br from-white to-violet-50/60">
          <p className="text-sm text-slate-500">Overall score</p>
          <div className="mt-2 flex flex-wrap items-end gap-6">
            <p className="text-6xl font-semibold tracking-tight">
              {latest.overallScore}
              <span className="text-lg font-medium text-slate-400">/100</span>
            </p>
            <div className="min-w-48 flex-1">
              <BizOsProgress value={latest.overallScore} />
            </div>
          </div>
          {isCommand && flags ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                {flags.geoLocked ? "🟢" : "🟡"} GEO locking
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                {flags.kbSynced ? "🟢" : "🟡"} Knowledge Base sync
              </span>
              {/* <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                {flags.smartHandoff ? "🟢" : "🟡"} SmartHandoff
              </span> */}
            </div>
          ) : null}
        </BizOsCard>
      ) : (
        <BizOsEmpty
          title="No scans yet"
          body="Run a live audit. We’ll check Google/Bing index, Google reviews, and three local AI prompts."
          action={
            <Button onClick={() => void run()} disabled={running || !profileId}>
              {running ? "Scanning…" : "Run SkySCAN"}
            </Button>
          }
        />
      )}

      {latest ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {CHANNELS.map((ch) => {
            const value = scores[ch.key] ?? 0;
            const items = checksFor(latest, ch.checks);
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
                <ul className="mt-3 space-y-1.5">
                  {items.map((item) => (
                    <li key={item.key} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${statusDot(item.status)}`} />
                      <span>
                        <span className="font-medium text-slate-800">{item.label}</span>
                        {item.detail ? ` — ${item.detail}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </BizOsCard>
            );
          })}
        </div>
      ) : null}

      {isCommand && latest ? (
        <BizOsCard>
          <h2 className="text-sm font-semibold">Plain-English breakdown</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Winning areas</p>
              <ul className="mt-1 list-disc pl-4 text-slate-600">
                {winning.length ? winning.map((w) => <li key={w.key}>{w.label}</li>) : <li>Run another scan after you fill gaps.</li>}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">AI opportunities</p>
              <ul className="mt-1 list-disc pl-4 text-slate-600">
                {opportunities.length ? opportunities.map((w) => <li key={w.key}>{w.label}</li>) : <li>Looking strong across GEO probes.</li>}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">Why JustMy beats agencies</p>
              <p className="mt-1 text-slate-600">
                Live GEO probes plus your myCARD facts — not a monthly PDF. AskSKY turns gaps into a BattlePlan the same day.
              </p>
            </div>
          </div>
        </BizOsCard>
      ) : null}

      {isEnterprise ? (
        <BizOsCard>
          <h2 className="text-sm font-semibold">Enterprise war room</h2>
          {sov ? (
            <div className="mt-3">
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
            <p className="mt-2 text-sm text-slate-500">Add up to two competitor names, then re-run SkySCAN for share of voice.</p>
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
      ) : null}

      {isCommandPro && latest ? (
        <BizOsCard>
          <h2 className="text-sm font-semibold">Approve & broadcast</h2>
          <p className="mt-1 text-sm text-slate-600">
            Connected networks publish automatically. Unconnected accounts get a download bundle or FunCREW handoff.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
              href="/biz-os/settings"
            >
              OAuth connections
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setDockOpen(true);
                setTurns((t) => [
                  ...t,
                  {
                    role: "asksky",
                    text: "Ready to broadcast this scan’s BattlePlan across networks?",
                    actions: [
                      { id: "polish", label: "Polish Plan with AskSKY!", kind: "polish" },
                      { id: "broadcast", label: "Approve & Broadcast Across Networks", kind: "broadcast" },
                    ],
                  },
                ]);
              }}
            >
              Open broadcast actions
            </Button>
          </div>
        </BizOsCard>
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
        <h2 className="font-semibold">Next step</h2>
        <p className="mt-1 text-sm text-slate-600">
          AskSKY opens after each scan with the right BattlePlan or upgrade path for your plan.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
            href="/biz-os/battle-plans"
          >
            Open Battle Plans
          </Link>
        </div>
      </BizOsCard>
    </BizOsPage>
  );
}
