"use client";

import type React from "react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import type { PageBlock } from "@/lib/services/cms";

interface VideoBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function VideoBlockEditor({ block, onUpdate }: VideoBlockEditorProps) {
  const handleFieldChange = (field: string, value: unknown) => {
    onUpdate({
      ...block,
      [field]: value,
    });
  };

  const videoUrl = (block as any).videoUrl as string | undefined;
  const title = (block as any).title as string | undefined;
  const description = (block as any).description as string | undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-slate-300">Video URL</Label>
        <Input
          value={videoUrl ?? ""}
          onChange={(e) => handleFieldChange("videoUrl", e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
        />
        <p className="text-xs text-slate-500">
          Supports embeddable URLs from YouTube, Vimeo, or direct MP4 links.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Title (optional)</Label>
        <Input
          value={title ?? ""}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          placeholder="Short title displayed above the video"
          className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Description (optional)</Label>
        <Input
          value={description ?? ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          placeholder="Context or summary shown below the title"
          className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>
    </div>
  );
}

