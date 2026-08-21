"use client";

import React from "react";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import type { PageBlock } from "@/lib/services/cms";

interface WelcomeMessageBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function WelcomeMessageBlockEditor({ block, onUpdate }: WelcomeMessageBlockEditorProps) {
  const updateField = (field: string, value: any) => {
    onUpdate({
      ...block,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg border border-border space-y-3">
        <p className="text-sm text-muted-foreground">
          This block renders the AI-powered welcome message card.
        </p>
        <p className="text-xs text-muted-foreground">
          You can optionally override the link destination for the call-to-action.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Weather page link (optional)</Label>
        <Input
          type="text"
          placeholder="/weather"
          value={(block as any).weatherPageLink || ""}
          onChange={(e) => updateField("weatherPageLink", e.target.value)}
          className="bg-muted border-border text-sm text-foreground placeholder:text-muted-foreground"
        />
        <p className="text-[11px] text-muted-foreground">
          When empty, the default <code>/weather</code> path will be used.
        </p>
      </div>
    </div>
  );
}

