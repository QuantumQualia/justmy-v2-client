"use client";

import React from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface MyformManagementBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function MyformManagementBlockEditor(_props: MyformManagementBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card className="border-slate-700 bg-slate-800/50 text-slate-200">
        <CardContent className="space-y-2 p-4 pt-4">
          <p className="text-sm text-slate-400">
            Full manager on <strong>this page URL</strong>: list by default; add{" "}
            <code className="text-slate-200">?myform=new</code>,{" "}
            <code className="text-slate-200">?myform=edit&amp;formId=…</code>, or{" "}
            <code className="text-slate-200">?myform=submissions&amp;formId=…</code> to open submissions in a dialog.
          </p>
          <p className="text-xs text-slate-500">
            No block-specific settings. The active profile comes from app context. Use the block Styles
            panel for layout, spacing, and width.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
