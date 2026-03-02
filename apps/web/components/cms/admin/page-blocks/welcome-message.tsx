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
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
        <p className="text-sm text-slate-400">
          This block renders the AI-powered welcome message card.
        </p>
        <p className="text-xs text-slate-500">
          You can optionally override the link destination for the call-to-action.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Weather page link (optional)</Label>
        <Input
          type="text"
          placeholder="/weather"
          value={(block as any).weatherPageLink || ""}
          onChange={(e) => updateField("weatherPageLink", e.target.value)}
          className="bg-black/50 border-slate-700 text-sm text-slate-100 placeholder:text-slate-500"
        />
        <p className="text-[11px] text-slate-500">
          When empty, the default <code>/weather</code> path will be used.
        </p>
      </div>
    </div>
  );
}

