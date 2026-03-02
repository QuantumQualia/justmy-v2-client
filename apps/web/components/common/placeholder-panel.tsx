"use client";

import * as React from "react";

interface PlaceholderPanelProps {
  /** Text to display inside the placeholder. Defaults to "Coming Soon". */
  text?: string;
}

/**
 * Generic dashed-border placeholder panel for blocks that don't have content yet
 * or are waiting on backend integration.
 *
 * Matches the visual style of the market sponsor placeholder in the ad banner block.
 */
export function PlaceholderPanel({ text = "Coming Soon" }: PlaceholderPanelProps) {
  return (
    <section className="relative w-full overflow-hidden rounded-lg rounded-br-none border border-dashed border-slate-600 bg-slate-800/30 py-8 text-center">
      <p className="text-sm text-slate-500">{text}</p>
    </section>
  );
}

