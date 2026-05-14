"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AskSkyWidget, type AskSkyVariant } from "@/components/asksky/asksky-widget";

function normalizeVariant(raw: string | null): AskSkyVariant {
  const v = String(raw ?? "inline").toLowerCase();
  if (v === "voice" || v === "chatbot" || v === "inline") {
    return v;
  }
  return "inline";
}

function AskSkyEmbedInner() {
  const searchParams = useSearchParams();
  const profileSlug = searchParams.get("profileSlug")?.trim() ?? "";
  const agentToken = searchParams.get("agentToken")?.trim() ?? "";
  const variant = normalizeVariant(searchParams.get("variant"));
  const embedKey = React.useMemo(
    () => `static-embed:${profileSlug || "x"}:${agentToken.slice(0, 16)}`,
    [profileSlug, agentToken],
  );

  return (
    <div className="min-h-[100dvh] min-w-0 bg-black p-3 sm:p-4">
      <AskSkyWidget
        profileSlug={profileSlug}
        agentToken={agentToken}
        variant={variant}
        embedKey={embedKey}
      />
    </div>
  );
}

export default function EmbedAskSkyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-black text-sm text-slate-400">
          Loading…
        </div>
      }
    >
      <AskSkyEmbedInner />
    </Suspense>
  );
}
