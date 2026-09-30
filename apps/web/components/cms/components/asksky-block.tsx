"use client";

import * as React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { AskSkyWidget, type AskSkyVariant } from "@/components/asksky/asksky-widget";

function normalizeVariant(raw: unknown): AskSkyVariant {
  const v = String(raw ?? "inline").toLowerCase();
  if (v === "voice" || v === "chatbot" || v === "inline") {
    return v;
  }
  return "inline";
}

export function AskSkyBlock({ block }: { block: PageBlock }) {
  const agentToken = String(block.askSkyAgentToken ?? block.agentToken ?? "").trim();
  const variant = normalizeVariant(block.askSkyVariant ?? block.variant);
  const embedKey = block.id?.trim() || `asksky-${agentToken.slice(0, 8)}`;

  return (
    <AskSkyWidget
      agentToken={agentToken}
      variant={variant}
      embedKey={embedKey}
    />
  );
}
