"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { bizOsService, type OAuthConnection } from "@/lib/services/biz-os";
import { useBizOsFetch } from "@/components/biz-os/use-biz-os-profile";
import {
  BizOsCard,
  BizOsHeader,
  BizOsPage,
  BizOsSkeleton,
  ComingSoonBadge,
} from "@/components/biz-os/biz-os-ui";
import { BizOsPlanGate } from "@/components/biz-os/plan-gate";

const LABELS: Record<string, string> = {
  youtube: "YouTube",
  meta: "Meta (Facebook & Instagram)",
  tiktok: "TikTok Business",
  gbp: "Google Business Profile",
};

const HINTS: Record<string, { ready: string; waiting: string }> = {
  youtube: {
    ready: "Google OAuth with YouTube upload access. Auto-post is coming soon — use the broadcast pack until then.",
    waiting: "Add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET and the callback URI in Google Cloud.",
  },
  gbp: {
    ready: "Google OAuth with Business Profile access. Auto-post is coming soon — use the broadcast pack until then.",
    waiting: "Same Google Cloud OAuth client as YouTube. Enable Business Profile APIs on that project.",
  },
  meta: {
    ready: "Meta OAuth for Facebook Pages and Instagram.",
    waiting: "Meta app keys are not on this API yet.",
  },
  tiktok: {
    ready: "TikTok OAuth for business posting.",
    waiting: "TikTok app keys are not on this API yet.",
  },
};

export default function BizOsSettingsPage() {
  const { data: connections, setData: setConnections, pageReady, profileId } = useBizOsFetch(
    (id) => bizOsService.listOAuthConnections(id),
    [] as OAuthConnection[],
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function connect(row: OAuthConnection) {
    if (!profileId || !row.configured) return;
    setBusy(row.provider);
    setError("");
    try {
      const { authUrl } = await bizOsService.startOAuthConnection(profileId, row.provider);
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start OAuth.");
      setBusy(null);
    }
  }

  async function disconnect(row: OAuthConnection) {
    if (!profileId) return;
    setBusy(row.provider);
    setError("");
    try {
      const next = await bizOsService.setOAuthConnection(profileId, {
        provider: row.provider,
        connect: false,
      });
      setConnections((prev) =>
        prev.map((c) => (c.provider === row.provider ? { ...c, ...next } : c)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect.");
    } finally {
      setBusy(null);
    }
  }

  if (!pageReady) return <BizOsSkeleton />;

  return (
    <BizOsPlanGate
      minTier="command_pro"
      title="Social connections"
      body="Connect YouTube, Meta, TikTok, and Google Business Profile on Command PRO and Enterprise."
    >
    <BizOsPage>
      <BizOsHeader
        eyebrow="Command PRO"
        title="Social connections"
        description="Connect the accounts you own. Auto-post is coming soon. SmartHandoff is not listed here."
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="grid gap-3">
        {connections.map((row) => {
          const connected = row.status === "connected";
          const hint = HINTS[row.provider];
          return (
            <BizOsCard key={row.provider}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{LABELS[row.provider] || row.provider}</p>
                    {!row.configured ? <ComingSoonBadge /> : null}
                  </div>
                  <p className="text-sm text-slate-500">
                    {connected
                      ? `🟢 Connected${row.accountName ? ` · ${row.accountName}` : ""}`
                      : row.configured
                        ? "🔴 Not connected"
                        : "Coming soon — FunCREW can post from the pack"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{row.configured ? hint?.ready : hint?.waiting}</p>
                </div>
                {connected ? (
                  <Button
                    variant="outline"
                    disabled={busy === row.provider || !profileId}
                    onClick={() => void disconnect(row)}
                  >
                    {busy === row.provider ? "Saving…" : "Disconnect"}
                  </Button>
                ) : (
                  <Button
                    disabled={!row.configured || busy === row.provider || !profileId}
                    onClick={() => void connect(row)}
                  >
                    {busy === row.provider ? "Redirecting…" : row.configured ? "Connect with OAuth" : "Coming soon"}
                  </Button>
                )}
              </div>
            </BizOsCard>
          );
        })}
      </div>
    </BizOsPage>
    </BizOsPlanGate>
  );
}
