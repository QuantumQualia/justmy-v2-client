"use client";

import React from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface ContentHubViewBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function ContentHubViewBlockEditor({
  block,
  onUpdate,
}: ContentHubViewBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Renders the Content Hub View for managing hub folders, tab folders, and tab posts.
          </p>
          <p className="text-xs text-muted-foreground">
            No configuration is required. Data is loaded for the authenticated profile.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

