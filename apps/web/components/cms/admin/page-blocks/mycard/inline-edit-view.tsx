"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";

interface InlineEditViewBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function InlineEditViewBlockEditor({}: InlineEditViewBlockEditorProps) {
  return null;
}
