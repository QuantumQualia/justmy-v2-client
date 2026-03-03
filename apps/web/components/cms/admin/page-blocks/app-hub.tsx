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
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-slate-400">
            Renders the App Hub with active (installed) apps and the discovery library.
            Users can install, uninstall, preview, and open apps from within the block.
          </p>
          <p className="text-xs text-slate-500">
            No configuration needed. Apps are loaded automatically based on the current profile's OS.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
