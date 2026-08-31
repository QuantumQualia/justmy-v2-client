"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { bizOsService, type OAuthConnection } from "@/lib/services/biz-os";
import { useBizOsFetch, useBizOsProfile } from "@/components/biz-os/use-biz-os-profile";
import {
  BizOsCard,
  BizOsEmpty,
  BizOsHeader,
  BizOsPage,
  BizOsSkeleton,
} from "@/components/biz-os/biz-os-ui";
import { hasAccess } from "@/lib/plan-features";
import { canonicalizeOsName } from "@/lib/os-types";

const LABELS: Record<string, string> = {
  youtube: "YouTube",
  meta: "Meta (Facebook & Instagram)",
  tiktok: "TikTok Business",
  gbp: "Google Business Profile",
};

const HINTS: Record<string, { ready: string; waiting: string }> = {
  youtube: {
    ready: "Google OAuth with YouTube upload access. You still post from the broadcast pack until auto-post is wired.",
    waiting: "Add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET and this redirect URI in Google Cloud.",
  },
  gbp: {
    ready: "Google OAuth with Business Profile access. You still post from the broadcast pack until auto-post is wired.",
    waiting: "Same Google Cloud OAuth client as YouTube. Enable Business Profile APIs on that project.",
  },
  meta: {
    ready: "Meta OAuth for Facebook Pages and Instagram.",
    waiting: "Not configured. Add META_APP_ID and META_APP_SECRET, or send the pack to FunCREW.",
  },
  tiktok: {
    ready: "TikTok OAuth for business posting.",
    waiting: "Not configured. Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET, or send the pack to FunCREW.",
  },
};

export default function BizOsSettingsPage() {
  const { me } = useBizOsProfile();
  const osName = canonicalizeOsName(me?.osName || me?.profileType);
  const isCommandPro = hasAccess(osName, "command_pro");
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

  if (!isCommandPro) {
    return (
      <BizOsPage>
        <BizOsHeader
          eyebrow="Connections"
          title="Social connections"
          description="Command PRO owners connect YouTube, Meta, TikTok, and Google Business Profile. SmartHandoff is a JustMy text line to JR — you do not connect Twilio."
        />
        <BizOsEmpty
          title="Command PRO required"
          body="Upgrade to Command PRO to connect your social accounts for SkySCAN broadcast packs."
          action={
            <Button asChild>
              <Link href="/biz-os/pricing">View plans</Link>
            </Button>
          }
        />
      </BizOsPage>
    );
  }

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow="Command PRO"
        title="Social connections"
        description="Connect the accounts you own. SmartHandoff is not listed here — JustMy texts JR, then FunCREW. You do not OAuth Twilio."
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
                  <p className="font-semibold">{LABELS[row.provider] || row.provider}</p>
                  <p className="text-sm text-slate-500">
                    {connected
                      ? `🟢 Connected${row.accountName ? ` · ${row.accountName}` : ""}`
                      : row.configured
                        ? "🔴 Not connected"
                        : "⚪ App not configured"}
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
                    {busy === row.provider ? "Redirecting…" : row.configured ? "Connect with OAuth" : "Unavailable"}
                  </Button>
                )}
              </div>
            </BizOsCard>
          );
        })}
      </div>
    </BizOsPage>
  );
}
