"use client";

import React from "react";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import type { PageBlock } from "@/lib/services/cms";

interface PlaceholderPanelBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function PlaceholderPanelBlockEditor({ block, onUpdate }: PlaceholderPanelBlockEditorProps) {
  const updateField = (field: string, value: unknown) => {
    onUpdate({
      ...block,
      [field]: value,
    });
  };

  const text = (block.text as string) ?? "";

  return (
    <div className="space-y-4">
      

      <div className="space-y-2">
        <Label className="text-muted-foreground">Text</Label>
        <Input
          type="text"
          placeholder="Coming Soon"
          value={text}
          onChange={(e) => updateField("text", e.target.value)}
          className="bg-muted border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1.5"
        />
      </div>
    </div>
  );
}
