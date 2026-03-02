"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface MarketEventsBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function MarketEventsBlockEditor({}: MarketEventsBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-slate-400">
            Renders the Daily Drop Market Events carousel (The Stage) for the current market.
          </p>
          <CardDescription className="text-xs text-slate-500">
            No configuration needed. Data comes from the ai/daily-drop/events API. When unavailable,
            a simple &quot;Coming Soon&quot; placeholder will be shown.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

