"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
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
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-4 pt-4">
          <p className="text-sm text-slate-400">
            This block renders the &quot;This Day in History&quot; AI card.
          </p>
          <CardDescription className="text-xs text-slate-500 mt-2">
            Choose whether to render it as a standalone card or embedded inside another layout (for example, in the greeting card).
          </CardDescription>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-800/30 p-4">
          <div className="space-y-0.5">
            <Label htmlFor={switchId} className="text-slate-300 cursor-pointer">
              Embedded section (no outer card)
            </Label>
            <p className="text-[11px] text-slate-500">
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

