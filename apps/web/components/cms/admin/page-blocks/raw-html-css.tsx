"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
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

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-slate-400">
            Paste a fragment of HTML and optional CSS. Use for layouts, anchor links between blocks
            (<code className="text-slate-300">href=&quot;#section-id&quot;</code>), and custom styling.
          </p>
          <CardDescription className="text-xs text-slate-500">
            Content is saved as-is and rendered on the live page. Only use for trusted authors. CSS
            applies globally unless you scope selectors (for example under{" "}
            <code className="text-slate-400">.raw-html-root</code>). For Google Fonts, prefer an{" "}
            <code className="text-slate-400">@import</code> in the CSS field—
            <code className="text-slate-400">&lt;link&gt;</code> inside the HTML may not load in every
            browser when injected this way.
          </CardDescription>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label className="text-slate-300">HTML</Label>
        <Textarea
          value={html}
          onChange={(e) => updateField("html", e.target.value)}
          placeholder="<section>...</section>"
          spellCheck={false}
          className="min-h-[180px] font-mono text-sm bg-black/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">CSS</Label>
        <Textarea
          value={customCss}
          onChange={(e) => updateField("customCss", e.target.value)}
          placeholder=".raw-html-root { ... }"
          spellCheck={false}
          className="min-h-[140px] font-mono text-sm bg-black/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
        />
      </div>
    </div>
  );
}
