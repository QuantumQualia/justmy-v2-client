"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import type { PageBlock } from "@/lib/services/cms";
import { cn } from "@workspace/ui/lib/utils";

interface QuickActionBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function QuickActionBlockEditor({ block, onUpdate }: QuickActionBlockEditorProps) {
  const updateField = (field: string, value: unknown) => {
    onUpdate({
      ...block,
      [field]: value,
    });
  };

  const label = (block.label as string) ?? "";
  const icon = (block.icon as string) ?? "";
  const variant = (block.variant as string) ?? "panel";
  const actionType = (block.actionType as string) ?? "link";
  const href = (block.href as string) ?? "";
  const actionId = (block.actionId as string) ?? "";

  const inputClass =
    "bg-muted border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1.5";

  return (
    <div className="space-y-4">
      <Card className="bg-muted border-border text-foreground">
        <CardContent className="p-4 pt-4">
          <p className="text-sm text-muted-foreground">
            A single quick action: either a link (URL) or an action (e.g. open chatbot). Choose label, icon name, and style.
          </p>
          <CardDescription className="text-xs text-muted-foreground mt-2">
            Icon: use any Lucide icon name (e.g. HelpCircle, Droplets, User). Action ID is used when type is Action (e.g. openChatbot).
          </CardDescription>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Label</Label>
        <Input
          type="text"
          placeholder="e.g. Need Help? Ask!"
          value={label}
          onChange={(e) => updateField("label", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Icon name</Label>
        <Input
          type="text"
          placeholder="e.g. HelpCircle, Droplets, User, ExternalLink"
          value={icon}
          onChange={(e) => updateField("icon", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Type</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateField("actionType", "link")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              actionType === "link"
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Link (URL)
          </button>
          <button
            type="button"
            onClick={() => updateField("actionType", "action")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              actionType === "action"
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Action (function)
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Link navigates to a URL. Action runs a handler (e.g. open AI chatbot) when the page provides it via QuickActionHandlerProvider.
        </p>
      </div>

      {actionType === "link" ? (
        <div className="space-y-2">
          <Label className="text-muted-foreground">Link URL</Label>
          <Input
            type="text"
            placeholder="/lab/daily-drop"
            value={href}
            onChange={(e) => updateField("href", e.target.value)}
            className={inputClass}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-muted-foreground">Action ID</Label>
          <Input
            type="text"
            placeholder="e.g. openChatbot"
            value={actionId}
            onChange={(e) => updateField("actionId", e.target.value)}
            className={inputClass}
          />
          <p className="text-[11px] text-muted-foreground">
            The page must wrap content with QuickActionHandlerProvider and register this ID to run a function when clicked.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-muted-foreground">Style</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateField("variant", "panel")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              variant === "panel"
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Panel (tall card)
          </button>
          <button
            type="button"
            onClick={() => updateField("variant", "button")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              variant === "button"
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Button (inline)
          </button>
        </div>
      </div>
    </div>
  );
}
