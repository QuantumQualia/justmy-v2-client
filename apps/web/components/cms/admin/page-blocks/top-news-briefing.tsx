"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface TopNewsBriefingBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function TopNewsBriefingBlockEditor({}: TopNewsBriefingBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Renders the Daily Drop Top News briefing for the current market.
          </p>
          <CardDescription className="text-xs text-muted-foreground">
            No configuration needed. Data comes from the ai/daily-drop/briefing API. When unavailable,
            a simple &quot;Coming Soon&quot; placeholder will be shown.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

