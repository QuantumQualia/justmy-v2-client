"use client";

import React from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
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
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-slate-400">
            Renders the full Navbar with profile switcher, super search bar, and hamburger menu.
            It sticks to the top of the page with a blurred background.
          </p>
          <p className="text-xs text-slate-500">
            Optionally enable business search mode for the search bar (category bento + ghost phrases).
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-800/30 p-4">
          <div className="space-y-0.5">
            <Label htmlFor={switchId} className="text-slate-300 cursor-pointer">
              Business search mode
            </Label>
            <p className="text-[11px] text-slate-500">
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
