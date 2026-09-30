"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";

interface LiveViewBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function LiveViewBlockEditor({}: LiveViewBlockEditorProps) {
  return null;
}
