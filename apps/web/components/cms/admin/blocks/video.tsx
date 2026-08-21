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
        <Label className="text-muted-foreground">Video URL</Label>
        <Input
          value={videoUrl ?? ""}
          onChange={(e) => handleFieldChange("videoUrl", e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">
          Supports embeddable URLs from YouTube, Vimeo, or direct MP4 links.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Title (optional)</Label>
        <Input
          value={title ?? ""}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          placeholder="Short title displayed above the video"
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Description (optional)</Label>
        <Input
          value={description ?? ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          placeholder="Context or summary shown below the title"
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

