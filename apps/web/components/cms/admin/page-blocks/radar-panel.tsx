"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface RadarPanelBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function RadarPanelBlockEditor({}: RadarPanelBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Renders the Radar – Visual Truth panel with a live precipitation map centered on the
            user&apos;s market.
          </p>
          <CardDescription className="text-xs text-muted-foreground">
            No configuration needed. Data comes from the weather/radar API. When radar isn&apos;t
            available, a helpful placeholder is shown instead.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

