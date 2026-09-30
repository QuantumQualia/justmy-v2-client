"use client";

import React from "react";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import type { PageBlock } from "@/lib/services/cms";

interface DayInHistoryBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function DayInHistoryBlockEditor({ block, onUpdate }: DayInHistoryBlockEditorProps) {
  const updateField = (field: string, value: any) => {
    onUpdate({
      ...block,
      [field]: value,
    });
  };

  const embedded = Boolean((block as any).embedded);
  const switchId = `day-in-history-embedded-${block.id ?? "new"}`;

  return (
    <div className="space-y-4">
      

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted p-4">
          <div className="space-y-0.5">
            <Label htmlFor={switchId} className="text-muted-foreground cursor-pointer">
              Embedded section (no outer card)
            </Label>
            <p className="text-[11px] text-muted-foreground">
              When on, renders without the outer card—e.g. inside a greeting card.
            </p>
          </div>
          <Switch
            id={switchId}
            checked={embedded}
            onCheckedChange={(checked) => updateField("embedded", checked)}
          />
        </div>
      </div>
    </div>
  );
}

