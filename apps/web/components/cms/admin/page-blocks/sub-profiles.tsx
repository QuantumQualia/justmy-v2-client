"use client";

import React from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface SubProfilesBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function SubProfilesBlockEditor({ block, onUpdate }: SubProfilesBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-slate-400">
            Renders the ContentCard panel: list linked profiles (departments, locations, teams) and create new
            ones in a dialog when the parent allows sub-profiles and the user has admin access.
          </p>
          <p className="text-xs text-slate-500">No block settings. Data uses the active profile from the session.</p>
        </CardContent>
      </Card>
    </div>
  );
}
