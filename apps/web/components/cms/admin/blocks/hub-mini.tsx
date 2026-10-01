"use client";

import { useState } from "react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import type { PageBlock } from "@/lib/services/cms";

interface HubMiniBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

type HubMiniBlock = PageBlock & {
  title?: string;
  viewMode?: "magazine" | "text";
  postSlugs?: string[];
};

export function HubMiniBlockEditor({ block, onUpdate }: HubMiniBlockEditorProps) {
  const data = block as HubMiniBlock;
  const title = data.title ?? "";
  const viewMode = data.viewMode === "text" ? "text" : "magazine";
  const [slugDraft, setSlugDraft] = useState((data.postSlugs ?? []).join("\n"));

  const update = (patch: Partial<HubMiniBlock>) => {
    onUpdate({ ...data, ...patch });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-muted-foreground">Title</Label>
        <Input
          value={title}
          onChange={(event) => update({ title: event.target.value })}
          placeholder="Optional heading"
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-muted-foreground">View</Label>
        <Select
          value={viewMode}
          onValueChange={(value) => update({ viewMode: value === "text" ? "text" : "magazine" })}
        >
          <SelectTrigger className="bg-muted border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="magazine">Magazine</SelectItem>
            <SelectItem value="text">Text</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-muted-foreground">Post slugs</Label>
        <Textarea
          value={slugDraft}
          onChange={(event) => {
            const next = event.target.value;
            setSlugDraft(next);
            update({
              postSlugs: next
                .split(/[\n,]/)
                .map((slug) => slug.trim())
                .filter(Boolean),
            });
          }}
          placeholder="One slug per line"
          className="min-h-28 bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
