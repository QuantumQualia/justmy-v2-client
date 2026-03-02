"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { DayInHistory } from "@/components/common/welcome/day-in-history";

interface DayInHistoryBlockProps {
  block: PageBlock;
}

export function DayInHistoryBlock({ block }: DayInHistoryBlockProps) {
  const embedded = Boolean(block.embedded);

  return <DayInHistory embedded={embedded} />;
}

