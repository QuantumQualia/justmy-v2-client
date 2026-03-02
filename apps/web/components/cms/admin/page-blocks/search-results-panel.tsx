"use client";

import React from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface SearchResultsPanelBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function SearchResultsPanelBlockEditor({ block, onUpdate }: SearchResultsPanelBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-slate-400">
            Collapsible panel that displays search results from the Super Search Bar. It listens to the
            global search store and shows loading, error, or result cards. The panel is hidden until
            the user has run a search.
          </p>
          <p className="text-xs text-slate-500">
            No configuration needed. Place a Super Search Bar block above (or elsewhere on the page) so
            users can trigger searches.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
