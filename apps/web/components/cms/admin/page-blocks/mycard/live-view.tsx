"use client";

import React from "react";
import { Label } from "@workspace/ui/components/label";
import type { PageBlock } from "@/lib/services/cms";

interface LiveViewBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function LiveViewBlockEditor({ block, onUpdate }: LiveViewBlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-400">
          This block displays the live view of the current profile card. 
          It uses data from the profile store automatically.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          No configuration needed. The component will use the profile data from the global store.
        </p>
      </div>
    </div>
  );
}
