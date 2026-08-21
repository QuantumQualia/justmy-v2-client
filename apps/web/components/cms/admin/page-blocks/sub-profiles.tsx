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
      <Card>
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Renders the ContentCard panel: list linked profiles (departments, locations, teams) and create new
            ones in a dialog when the parent allows sub-profiles and the user has admin access.
          </p>
          <p className="text-xs text-muted-foreground">No block settings. Data uses the active profile from the session.</p>
        </CardContent>
      </Card>
    </div>
  );
}
