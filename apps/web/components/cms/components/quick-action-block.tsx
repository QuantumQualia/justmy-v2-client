"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import {
  QuickActionItem,
  type QuickActionItemConfig,
  type QuickActionVariant,
} from "@/components/common/quick-action-item";
import { useQuickActionHandler } from "./quick-action-handler-context";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FALLBACK_ICON = LucideIcons.ExternalLink;

// Resolve Lucide icon by PascalCase name (e.g. "HelpCircle", "Droplets")
function getLucideIcon(name: string): LucideIcon {
  if (!name || typeof name !== "string") return FALLBACK_ICON;
  const key = name.trim();
  if (!key) return FALLBACK_ICON;

  const Icon = (LucideIcons as Record<string, unknown>)[key];

  // Lucide icons are forwardRef components (objects), not plain functions,
  // so we only need to ensure the key exists and cast it.
  return Icon ? (Icon as LucideIcon) : FALLBACK_ICON;
}

interface QuickActionBlockProps {
  block: PageBlock;
}

export function QuickActionBlock({ block }: QuickActionBlockProps) {
  const handlerContext = useQuickActionHandler();

  const label = (block.label as string) || "Link";
  const iconName = (block.icon as string) || "ExternalLink";
  const variant = ((block.variant as QuickActionVariant) || "panel") as QuickActionVariant;
  const actionType = ((block.actionType as string) || "link") as "link" | "action";
  const href = (block.href as string) || "#";
  const actionId = (block.actionId as string) || "";

  const Icon = getLucideIcon(iconName.trim());

  const isLink = actionType === "link";
  const handler = !isLink && actionId ? handlerContext?.getHandler(actionId) : undefined;

  const item: QuickActionItemConfig = {
    label,
    icon: Icon,
    variant,
    type: isLink ? "link" : "action",
    ...(isLink ? { href } : { onClick: handler ?? (() => {}) }),
  };

  return <QuickActionItem item={item} />;
}
