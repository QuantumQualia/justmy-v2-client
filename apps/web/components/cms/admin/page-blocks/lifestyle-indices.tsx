"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface LifestyleIndicesBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function LifestyleIndicesBlockEditor({}: LifestyleIndicesBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Renders the Lifestyle Indices panel with Health, Outdoors, and Activity gauges.
          </p>
          <CardDescription className="text-xs text-muted-foreground">
            No configuration needed. Data comes from the weather/indices API and is tied to the
            user&apos;s profile zip.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

