"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface HourlyScrollBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function HourlyScrollBlockEditor({}: HourlyScrollBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Renders the Hourly Tactical Scroll, showing the next 12 hours with rain walls and commute
            markers.
          </p>
          <CardDescription className="text-xs text-muted-foreground">
            No configuration needed. Data comes from the weather/hourly API. Best used under the
            Strategic Weather hero.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

