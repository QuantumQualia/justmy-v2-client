"use client";

import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

export type QuickActionVariant = "panel" | "button";
export type QuickActionType = "link" | "action";

/** Config for one quick action: style (variant) and function (type + href or onClick). */
export interface QuickActionItemConfig {
  label: string;
  icon: LucideIcon;
  variant: QuickActionVariant;
  type: QuickActionType;
  href?: string;
  onClick?: () => void;
}

const panelStyles =
  "rounded-lg rounded-br-none border border-border bg-card p-4 flex flex-col items-center justify-center gap-2 min-h-[100px] text-foreground hover:bg-accent hover:border-border transition-colors";

const blockStyles =
  "rounded-lg rounded-br-none border border-border bg-card px-5 py-3 flex flex-row items-center justify-center gap-3 w-full text-foreground font-medium hover:bg-accent transition-colors";

export interface QuickActionItemProps {
  item: QuickActionItemConfig;
  className?: string;
}

/** Single quick action. Render by mapping over your quick actions array where needed. */
export function QuickActionItem({ item, className }: QuickActionItemProps) {
  const Icon = item.icon;
  const isPanel = item.variant === "panel";
  const isLink = item.type === "link" && item.href;

  const content = (
    <>
      <Icon className={cn(isPanel ? "size-8" : "size-5")} />
      <span className="text-sm font-medium">{item.label}</span>
    </>
  );

  const styles = cn(isPanel ? panelStyles : blockStyles, className);

  if (isLink) {
    return <Link href={item.href!} className={styles}>{content}</Link>;
  }

  return (
    <button type="button" onClick={item.onClick} className={styles}>
      {content}
    </button>
  );
}
