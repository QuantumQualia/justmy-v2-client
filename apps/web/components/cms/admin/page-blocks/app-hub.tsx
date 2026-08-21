"use client";

import React from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface AppHubBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function AppHubBlockEditor({ block, onUpdate }: AppHubBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Renders the App Hub with active (installed) apps and the discovery library.
            Users can install, uninstall, preview, and open apps from within the block.
          </p>
          <p className="text-xs text-muted-foreground">
            No configuration needed. Apps are loaded automatically based on the current profile's OS.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
