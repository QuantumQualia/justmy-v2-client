"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Check,
  ChevronDown,
  Copy,
  Crosshair,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { bizOsService } from "@/lib/services/biz-os";
import { profilesService } from "@/lib/services/profiles";
import { ApiClientError } from "@/lib/api-client";
import { useInvalidateBizOsHome, useBizOsFetch } from "@/components/biz-os/use-biz-os-profile";
import { useProfileStore } from "@/lib/store";
import { BizOsCard, BizOsHeader, BizOsPage, BizOsProgress, BizOsSkeleton } from "@/components/biz-os/biz-os-ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MILESTONES = [50, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
const FAQ = [
  {
    q: "Why do reviews matter for ChatGPT, Gemini & Apple Intelligence search?",
    a: "AI search engines weigh review volume and recency as a trust signal when ranking local businesses in conversational answers. More recent 5-star reviews means a better shot at being the business AskSKY, ChatGPT, or Gemini recommend first.",
  },
  {
    q: "How do I text a review link to a customer?",
    a: "Tap “Send via SMS” above. It opens your phone’s messages app with a friendly pre-written note and your Google review link. You can also copy AskSKY’s draft from the co-pilot.",
  },
  {
    q: "How does the QR code turn foot traffic into reviews?",
    a: "Customers scan the code at checkout and land directly on your Google review page — no searching, no typing your business name. Place it where people are already pausing (counter, receipt) for the highest completion rate.",
  },
] as const;

type HoursRow = { weekday: number; openTime: string; endTime: string; isClosed: boolean };

function defaultHours(): HoursRow[] {
  return DAYS.map((_, weekday) => ({
    weekday,
    openTime: "09:00",
    endTime: "17:00",
    isClosed: weekday === 0,
  }));
}

function hoursFromRep(data: any): HoursRow[] {
  if (!Array.isArray(data?.businessHours) || !data.businessHours.length) return defaultHours();
  const byDay = new Map(data.businessHours.map((h: { weekday: number }) => [h.weekday, h]));
  return DAYS.map((_, weekday) => {
    const row = byDay.get(weekday) as HoursRow | undefined;
    return {
      weekday,
      openTime: row?.openTime || "09:00",
      endTime: row?.endTime || "17:00",
      isClosed: row?.isClosed ?? weekday === 0,
    };
  });
}

function nextMilestone(count: number) {
  return MILESTONES.find((n) => n > count) ?? count + 50;
}

function starRow(rating: number | null) {
  const filled = rating != null && Number.isFinite(rating) ? Math.round(Math.min(5, Math.max(0, rating))) : 0;
  return (
    <span className="tracking-tight text-amber-500" aria-hidden>
      {"★".repeat(filled)}
      <span className="text-slate-200">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200/70 p-3.5">
      <span className="text-sm text-slate-700">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-violet-600"
      />
    </label>
  );
}

export default function ReputationPage() {
  const router = useRouter();
  const invalidateHome = useInvalidateBizOsHome();
  const profile = useProfileStore((s) => s.data);
  const qrRef = useRef<HTMLDivElement>(null);
  const { data: rep, setData: setRep, pageReady, profileId } = useBizOsFetch(
    (id) => bizOsService.reputation(id),
    null as any,
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [manualId, setManualId] = useState("");
  const [showPlaceId, setShowPlaceId] = useState(false);
  const [publishAddress, setPublishAddress] = useState(true);
  const [publishReview, setPublishReview] = useState(true);
  const [hours, setHours] = useState<HoursRow[]>(defaultHours);
  const [faq, setFaq] = useState<string | null>(FAQ[0].q);
  const [copied, setCopied] = useState<"link" | "sms" | null>(null);
  const [searching, setSearching] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [planMsg, setPlanMsg] = useState<string | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!rep) return;
    setPublishReview(Boolean(rep.publishReview ?? rep.showStars));
    setPublishAddress(rep.publishAddress !== false);
    if (rep.googlePlaceId) setManualId(rep.googlePlaceId);
    setHours(hoursFromRep(rep));
  }, [rep]);

  const businessName = String(rep?.name || "").trim() || String(profile.name || "").trim();
  const address = String(rep?.address || "").trim() || String(profile.addresses?.[0]?.address || "").trim();
  const reviewCount = Number(rep?.googleReviewCount || 0);
  const rating = rep?.googleRating != null ? Number(rep.googleRating) : null;
  const reviewUrl = rep?.directReviewUrl || "";
  const verified = Boolean(rep?.isVerified);
  const milestone = nextMilestone(reviewCount);
  const remaining = Math.max(0, milestone - reviewCount);
  const city =
    String(profile.zipCode || "")
      .replace(/^\d+\s*/, "")
      .trim() || "your city";

  const smsBody = useMemo(() => {
    const who = businessName || "us";
    return `Hi! If you have a minute, would you leave ${who} a Google review? It really helps neighbors find us. ${reviewUrl}`;
  }, [businessName, reviewUrl]);

  async function search() {
    if (!profileId) return;
    setSearching(true);
    try {
      const res = await bizOsService.reputationSearch(profileId, query);
      setResults(res.results || []);
    } finally {
      setSearching(false);
    }
  }

  async function verify(place: { placeId?: string; rating?: number; reviewCount?: number }) {
    if (!profileId || !place.placeId) return;
    const data = await bizOsService.reputationVerify(profileId, {
      googlePlaceId: place.placeId,
      rating: place.rating,
      reviewCount: place.reviewCount,
    });
    setRep(data);
    setResults([]);
    setSyncError(null);
    await invalidateHome();
  }

  async function syncFromGoogle() {
    if (!profileId) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const data = await bizOsService.reputationSync(profileId);
      setRep(data);
      await invalidateHome();
    } catch (err) {
      setSyncError(
        err instanceof ApiClientError
          ? err.message
          : "Could not refresh this listing from Google.",
      );
    } finally {
      setSyncing(false);
    }
  }

  async function savePrivacy(next?: { publishAddress?: boolean; publishReview?: boolean }) {
    if (!profileId) return;
    await profilesService.updateProfile(profileId, {
      publishSetting: {
        publishAddress: next?.publishAddress ?? publishAddress,
        publishReview: next?.publishReview ?? publishReview,
      },
    });
  }

  async function saveHours() {
    if (!profileId) return;
    setSavingHours(true);
    try {
      await profilesService.updateProfile(profileId, { businessHours: hours });
    } finally {
      setSavingHours(false);
    }
  }

  async function copyLink() {
    if (!reviewUrl) return;
    await navigator.clipboard.writeText(reviewUrl);
    setCopied("link");
    window.setTimeout(() => setCopied(null), 1800);
  }

  async function copySmsDraft() {
    await navigator.clipboard.writeText(smsBody);
    setCopied("sms");
    window.setTimeout(() => setCopied(null), 1800);
  }

  function downloadSvg() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml;charset=utf-8",
    });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "review-qr.svg";
    a.click();
    URL.revokeObjectURL(href);
  }

  function downloadPng() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const href = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
    img.onload = () => {
      const size = 512;
      const pad = 48;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "review-qr.png";
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
      URL.revokeObjectURL(href);
    };
    img.src = href;
  }

  function printCounterPdf() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg || !reviewUrl) return;
    const markup = new XMLSerializer().serializeToString(svg);
    const safeName = (businessName || "Scan to review")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const html = `<!DOCTYPE html><html><head><title>Counter QR</title>
      <style>
        @page { size: 4in 6in; margin: 0.4in; }
        body { font-family: system-ui, sans-serif; text-align: center; padding: 24px; color: #111827; }
        h1 { font-size: 18px; margin: 0 0 8px; }
        p { color: #6b7280; font-size: 13px; }
        .qr { margin: 24px auto; width: 240px; padding: 16px; background: #fff; border: 1px solid #e5e7eb; }
        .qr svg { width: 208px; height: 208px; display: block; margin: 0 auto; }
      </style></head><body>
      <h1>${safeName}</h1>
      <p>Scan to leave a Google review</p>
      <div class="qr">${markup}</div>
      <p>#grabmyCARD</p>
      </body></html>`;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    if (!doc) {
      iframe.remove();
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    const cleanup = () => iframe.remove();
    iframe.contentWindow?.addEventListener("afterprint", cleanup);
    window.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 50);
  }

  async function addReviewGoal() {
    if (!profileId) return;
    setCreatingPlan(true);
    try {
      const plan = await bizOsService.createPlan(profileId, "reviews");
      await invalidateHome();
      setPlanMsg(`Reviews goal added to Battle Plan #${plan.id}.`);
      router.push(`/biz-os/battle-plans/${plan.id}`);
    } finally {
      setCreatingPlan(false);
    }
  }

  if (!pageReady) return <BizOsSkeleton lines={6} />;

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow="Reputation engine"
        title="Turn happy customers into 5-star reviews"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <BizOsCard>
            <h2 className="text-sm font-semibold text-slate-500">Google Business Profile</h2>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void search();
                }}
                placeholder="Search for your business on Google..."
                className="h-11 rounded-xl border-slate-200 pl-10 pr-24"
              />
              <Button
                type="button"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => void search()}
                disabled={searching}
              >
                {searching ? "Searching…" : "Search"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Search can use a cached listing. Connecting or Refresh from Google pulls live ratings.
            </p>

            {results.length ? (
              <div className="mt-3 space-y-2">
                {results.map((r) => (
                  <button
                    key={r.placeId || r.name}
                    type="button"
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition hover:border-violet-400 hover:bg-violet-50/40"
                    onClick={() => void verify(r)}
                  >
                    <span className="font-medium text-slate-900">{r.name}</span>
                    <span className="mt-0.5 block text-slate-500">{r.address}</span>
                    {r.rating ? (
                      <span className="mt-1 block text-xs text-slate-400">
                        {r.rating} · {r.reviewCount || 0} reviews
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50 p-5">
              {verified ? (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-lg">
                      {profile.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        "📍"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{businessName || "Your business"}</p>
                      {address ? <p className="mt-0.5 text-xs text-slate-500">{address}</p> : null}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {starRow(rating)}
                        <span className="text-sm font-semibold text-slate-800">
                          {rating != null && Number.isFinite(rating) ? rating.toFixed(1) : "—"}
                        </span>
                        <span className="text-xs text-slate-400">· {reviewCount} reviews</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800">
                      <Check className="h-3 w-3" />
                      Verified
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={syncing}
                      onClick={() => void syncFromGoogle()}
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
                      {syncing ? "Refreshing…" : "Refresh from Google"}
                    </Button>
                    {syncError ? <p className="max-w-[14rem] text-right text-xs text-rose-600">{syncError}</p> : null}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Search Google to connect your listing. We’ll pull your rating and generate a direct review link.
                </p>
              )}
            </div>

            <button
              type="button"
              className="mt-3 text-xs font-medium text-slate-400 hover:text-violet-700"
              onClick={() => setShowPlaceId((v) => !v)}
            >
              {showPlaceId ? "Hide Place ID" : "Have a Place ID?"}
            </button>
            {showPlaceId ? (
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="ChIJ… Place ID"
                  className="rounded-xl"
                />
                <Button variant="outline" onClick={() => void verify({ placeId: manualId })}>
                  Save Place ID
                </Button>
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              <ToggleRow
                label="Show Google reviews badge on myCARD & myPROFILE"
                checked={publishReview}
                onCheckedChange={(next) => {
                  setPublishReview(next);
                  void savePrivacy({ publishReview: next });
                }}
              />
              <ToggleRow
                label="Publish address on myCARD"
                checked={publishAddress}
                onCheckedChange={(next) => {
                  setPublishAddress(next);
                  void savePrivacy({ publishAddress: next });
                }}
              />
            </div>
          </BizOsCard>

          <BizOsCard>
            <h2 className="text-sm font-semibold text-slate-500">Review acquisition toolkit</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/70 p-4">
                <p className="mb-2 text-xs font-medium text-slate-500">Direct review link</p>
                <div className="mb-3 truncate rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {reviewUrl || "Verify a listing to generate a link."}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700"
                    disabled={!reviewUrl}
                    onClick={() => void copyLink()}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === "link" ? "Copied" : "Copy link"}
                  </Button>
                  {reviewUrl ? (
                    <a
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      href={`sms:?&body=${encodeURIComponent(smsBody)}`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Send via SMS
                    </a>
                  ) : (
                    <span className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-300">
                      Send via SMS
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/70 p-4">
                <p className="mb-3 text-xs font-medium text-slate-500">High-res QR code studio</p>
                <div
                  ref={qrRef}
                  className="mx-auto mb-3 flex aspect-square w-full max-w-[160px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-3"
                >
                  {reviewUrl ? (
                    <QRCodeSVG
                      value={reviewUrl}
                      size={140}
                      level="M"
                      includeMargin
                      bgColor="#ffffff"
                      className="h-full w-full"
                    />
                  ) : (
                    <span className="text-xs text-slate-300">QR</span>
                  )}
                </div>
                <p className="mb-3 text-center text-xs leading-relaxed text-slate-400">
                  Scans straight to your review link — printable and mobile-ready.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!reviewUrl}
                    onClick={downloadPng}
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    disabled={!reviewUrl}
                    onClick={downloadSvg}
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    SVG
                  </button>
                  <button
                    type="button"
                    disabled={!reviewUrl}
                    onClick={printCounterPdf}
                    className="flex-1 whitespace-nowrap rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Counter PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="mb-2.5 text-xs font-medium text-slate-500">Where to place your QR code</p>
              <ul className="space-y-1.5">
                {[
                  "Counter stand near checkout",
                  "Printed on invoices & receipts",
                  "Vehicle wraps & window decals",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-violet-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </BizOsCard>

          <BizOsCard>
            <h2 className="text-sm font-semibold text-slate-500">Hours</h2>
            <p className="mt-1 text-sm text-slate-500">Shown on myCARD when you publish your listing details.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {hours.map((h) => (
                <div key={h.weekday} className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm">
                  <span className="w-10 font-medium text-slate-700">{DAYS[h.weekday]}</span>
                  <input
                    type="checkbox"
                    className="accent-violet-600"
                    checked={!h.isClosed}
                    onChange={(e) =>
                      setHours((prev) =>
                        prev.map((x) => (x.weekday === h.weekday ? { ...x, isClosed: !e.target.checked } : x)),
                      )
                    }
                  />
                  <input
                    type="time"
                    disabled={h.isClosed}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 disabled:opacity-40"
                    value={h.openTime}
                    onChange={(e) =>
                      setHours((prev) =>
                        prev.map((x) => (x.weekday === h.weekday ? { ...x, openTime: e.target.value } : x)),
                      )
                    }
                  />
                  <span className="text-slate-400">–</span>
                  <input
                    type="time"
                    disabled={h.isClosed}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 disabled:opacity-40"
                    value={h.endTime}
                    onChange={(e) =>
                      setHours((prev) =>
                        prev.map((x) => (x.weekday === h.weekday ? { ...x, endTime: e.target.value } : x)),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <Button className="mt-4 rounded-lg" onClick={() => void saveHours()} disabled={savingHours}>
              {savingHours ? "Saving…" : "Save hours"}
            </Button>
          </BizOsCard>

          <BizOsCard>
            <h2 className="text-sm font-semibold text-slate-500">Why reviews matter</h2>
            <div className="mt-2 divide-y divide-slate-100">
              {FAQ.map((item) => {
                const open = faq === item.q;
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 py-3 text-left"
                      onClick={() => setFaq(open ? null : item.q)}
                    >
                      <span className="text-sm font-medium text-slate-800">{item.q}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                          open && "rotate-180",
                        )}
                      />
                    </button>
                    {open ? (
                      <p className="pb-3 text-sm leading-relaxed text-slate-500">{item.a}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </BizOsCard>
        </div>

        <aside className="space-y-6">
          <BizOsCard className="p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm font-medium text-slate-800">AskSKY review co-pilot</p>
            </div>
            <div className="mb-4 rounded-2xl rounded-tl-sm border border-slate-200/70 bg-slate-50 p-3.5">
              <p className="text-sm leading-relaxed text-slate-700">
                {verified
                  ? `You have ${reviewCount} reviews! Getting to ${milestone} will unlock higher AI search authority in ${city}. Want me to draft a customer SMS text?`
                  : "Connect your Google listing and I’ll help you ask happy customers for reviews."}
              </p>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                disabled={!reviewUrl}
                onClick={() => void copySmsDraft()}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <Copy className="h-4 w-4 text-slate-400" />
                {copied === "sms" ? "SMS draft copied" : "Draft SMS copy"}
              </button>
              <button
                type="button"
                disabled={creatingPlan}
                onClick={() => void addReviewGoal()}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Crosshair className="h-4 w-4 text-slate-400" />
                {creatingPlan ? "Adding…" : "Add goal to active battle plan"}
              </button>
            </div>
            {planMsg ? <p className="mt-3 text-xs text-violet-700">{planMsg}</p> : null}
          </BizOsCard>

          <BizOsCard className="p-5">
            <p className="mb-3 text-xs font-medium text-slate-500">Progress to next milestone</p>
            <div className="mb-2 flex items-end justify-between">
              <span className="text-3xl font-semibold tracking-tight text-slate-900">{reviewCount}</span>
              <span className="mb-1 text-xs text-slate-400">of {milestone} reviews</span>
            </div>
            <BizOsProgress value={milestone ? (reviewCount / milestone) * 100 : 0} />
            <p className="mt-2 text-xs text-slate-400">
              {remaining} reviews to your next authority tier
            </p>
            <Link
              href="/biz-os/skyscan"
              className="mt-4 inline-flex text-sm font-semibold text-violet-600 hover:text-violet-800"
            >
              See how reviews score on SKYSCAN →
            </Link>
          </BizOsCard>
        </aside>
      </div>
    </BizOsPage>
  );
}
