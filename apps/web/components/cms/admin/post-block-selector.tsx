"use client";

import React from "react";
import { POST_BLOCK_TYPES } from "./block-types";
import { BlockSelector } from "./block-selector";

interface PostBlockSelectorProps {
  onSelect: (blockType: string) => void;
  className?: string;
  size?: "sm" | "default";
}

// Thin wrapper around BlockSelector with a post-tailored block set.
export function PostBlockSelector({
  onSelect,
  className,
  size = "default",
}: PostBlockSelectorProps) {
  return (
    <BlockSelector
      onSelect={onSelect}
      className={className}
      size={size}
      blockTypes={POST_BLOCK_TYPES}
    />
  );
}

