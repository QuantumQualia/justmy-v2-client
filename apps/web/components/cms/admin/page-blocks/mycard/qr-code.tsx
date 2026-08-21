"use client";

import React from "react";
import { Label } from "@workspace/ui/components/label";
import type { PageBlock } from "@/lib/services/cms";

interface QRCodeBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function QRCodeBlockEditor({ block, onUpdate }: QRCodeBlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-card rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          This block displays a QR code. 
          It uses the profile URL from the profile store automatically.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          No configuration needed. The component will use the profile URL from the global store.
        </p>
      </div>
    </div>
  );
}
