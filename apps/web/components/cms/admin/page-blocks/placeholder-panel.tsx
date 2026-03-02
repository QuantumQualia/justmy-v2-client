"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
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
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-slate-400">
            A simple dashed-border placeholder panel. Use it for sections that aren’t ready yet or
            for &quot;Coming Soon&quot; messaging.
          </p>
          <CardDescription className="text-xs text-slate-500">
            When empty, the block shows &quot;Coming Soon&quot;.
          </CardDescription>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label className="text-slate-300">Text</Label>
        <Input
          type="text"
          placeholder="Coming Soon"
          value={text}
          onChange={(e) => updateField("text", e.target.value)}
          className="bg-black/50 border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1.5"
        />
      </div>
    </div>
  );
}
