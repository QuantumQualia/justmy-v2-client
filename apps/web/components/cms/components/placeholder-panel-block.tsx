"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { PlaceholderPanel } from "@/components/common/placeholder-panel";

interface PlaceholderPanelBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the generic placeholder panel.
 * Uses block.text for the message; defaults to "Coming Soon" when empty.
 */
export function PlaceholderPanelBlock({ block }: PlaceholderPanelBlockProps) {
  const text = (block.text as string) || "Coming Soon";
  return <PlaceholderPanel text={text} />;
}
