"use client";

import React from "react";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { splitStyleTags } from "@/lib/legacy-html";
import type { PageBlock } from "@/lib/services/cms";

interface RawHtmlCssBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function RawHtmlCssBlockEditor({ block, onUpdate }: RawHtmlCssBlockEditorProps) {
  const updateField = (field: string, value: unknown) => {
    onUpdate({
      ...block,
      [field]: value,
    });
  };

  const html = (block.html as string) ?? "";
  const customCss = (block.customCss as string) ?? "";

  const handleHtmlChange = (value: string) => {
    if (!/<\/style>|&lt;\s*\/\s*style\s*&gt;/i.test(value)) {
      updateField("html", value);
      return;
    }
    const split = splitStyleTags(value);
    const nextCss = [customCss.trim(), split.css].filter(Boolean).join("\n\n");
    onUpdate({
      ...block,
      html: split.html,
      customCss: nextCss,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-muted-foreground">HTML</Label>
        <Textarea
          value={html}
          onChange={(e) => handleHtmlChange(e.target.value)}
          placeholder="<section>...</section>"
          spellCheck={false}
          className="min-h-[180px] font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Paste a legacy section as-is. A style tag is moved into CSS.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">CSS</Label>
        <Textarea
          value={customCss}
          onChange={(e) => updateField("customCss", e.target.value)}
          placeholder=".raw-html-root { ... }"
          spellCheck={false}
          className="min-h-[140px] font-mono text-sm"
        />
      </div>
    </div>
  );
}
