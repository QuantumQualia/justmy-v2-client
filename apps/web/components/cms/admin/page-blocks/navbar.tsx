"use client";

import React from "react";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import type { PageBlock } from "@/lib/services/cms";

interface NavbarBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function NavbarBlockEditor({ block, onUpdate }: NavbarBlockEditorProps) {
  const updateField = (field: string, value: unknown) => {
    onUpdate({ ...block, [field]: value });
  };

  const businessSearchMode = Boolean((block as { businessSearchMode?: boolean }).businessSearchMode);
  const switchId = `navbar-business-search-${block.id ?? "new"}`;

  return (
    <div className="space-y-4">
      

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted p-4">
          <div className="space-y-0.5">
            <Label htmlFor={switchId} className="text-muted-foreground cursor-pointer">
              Business search mode
            </Label>
            <p className="text-[11px] text-muted-foreground">
              When on, the search bar shows category bento grid and ghost phrases for business discovery.
            </p>
          </div>
          <Switch
            id={switchId}
            checked={businessSearchMode}
            onCheckedChange={(checked) => updateField("businessSearchMode", checked)}
          />
        </div>
      </div>
    </div>
  );
}
