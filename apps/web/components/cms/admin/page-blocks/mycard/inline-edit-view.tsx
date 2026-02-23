"use client";

import React from "react";
import { Label } from "@workspace/ui/components/label";
import type { PageBlock } from "@/lib/services/cms";

interface InlineEditViewBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function InlineEditViewBlockEditor({ block, onUpdate }: InlineEditViewBlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-400">
          This block displays the inline edit view for the current profile. 
          It uses data from the profile store automatically.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          No configuration needed. The component will use the profile data from the global store.
        </p>
      </div>
    </div>
  );
}
