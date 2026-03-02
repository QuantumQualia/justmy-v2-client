"use client";

import React from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface SuperSearchBarBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function SuperSearchBarBlockEditor({ block, onUpdate }: SuperSearchBarBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-slate-400">
            Renders the floating Super Search Bar with voice search. It uses the global search store;
            when the user submits a query, the Search Results Panel (if present on the page) will show results.
          </p>
          <p className="text-xs text-slate-500">
            No configuration needed. Add a Search Results Panel block below to display results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
