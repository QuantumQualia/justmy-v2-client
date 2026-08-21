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
      <div className="p-4 bg-card rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          This block displays the inline edit view for the current profile. 
          It uses data from the profile store automatically.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          No configuration needed. The component will use the profile data from the global store.
        </p>
      </div>
    </div>
  );
}
