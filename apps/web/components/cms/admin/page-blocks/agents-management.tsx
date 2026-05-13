"use client";

import React from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface AgentsManagementBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function AgentsManagementBlockEditor({
  block,
  onUpdate,
}: AgentsManagementBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card className="border-slate-700 bg-slate-800/50 text-slate-200">
        <CardContent className="space-y-2 p-4 pt-4">
          <p className="text-sm text-slate-400">
            Renders the multi-agent management panel for the currently active profile, including
            agent CRUD and knowledge source management.
          </p>
          <p className="text-xs text-slate-500">
            No block-specific settings are required. The active profile comes from the surrounding
            app context. Use the block Styles panel to control layout, spacing, width, and
            container behavior.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
