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
} from "@/components/biz-os/biz-os-ui";

const LABELS: Record<string, string> = {
  youtube: "YouTube",
  meta: "Meta (Facebook & Instagram)",
  tiktok: "TikTok Business",
  gbp: "Google Business Profile",
};

export default function BizOsSettingsPage() {
  const { data: connections, setData: setConnections, pageReady, profileId } = useBizOsFetch(
    (id) => bizOsService.listOAuthConnections(id),
    [] as OAuthConnection[],
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(row: OAuthConnection) {
    if (!profileId) return;
    setBusy(row.provider);
    try {
      const next = await bizOsService.setOAuthConnection(profileId, {
        provider: row.provider,
        connect: row.status !== "connected",
      });
      setConnections((prev) =>
        prev.map((c) => (c.provider === row.provider ? { ...c, status: next.status, accountName: next.accountName } : c)),
      );
    } finally {
      setBusy(null);
    }
  }

  if (!pageReady) return <BizOsSkeleton />;

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow="Command PRO"
        title="Connections"
        description="1-click OAuth manager. Green means we can auto-publish. Red means we generate a download bundle or send to FunCREW."
      />
      <div className="grid gap-3">
        {connections.map((row) => {
          const connected = row.status === "connected";
          return (
            <BizOsCard key={row.provider}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{LABELS[row.provider] || row.provider}</p>
                  <p className="text-sm text-slate-500">
                    {connected ? `🟢 Connected${row.accountName ? ` · ${row.accountName}` : ""}` : "🔴 Not connected"}
                  </p>
                </div>
                <Button
                  variant={connected ? "outline" : "default"}
                  disabled={busy === row.provider || !profileId}
                  onClick={() => void toggle(row)}
                >
                  {busy === row.provider ? "Saving…" : connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </BizOsCard>
          );
        })}
      </div>
    </BizOsPage>
  );
}
