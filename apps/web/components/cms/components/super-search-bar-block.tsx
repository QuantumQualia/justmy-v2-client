"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { SuperSearchBar } from "@/components/common/search/super-search-bar";

interface SuperSearchBarBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the Super Search Bar.
 * Uses global search store; optional block.placeholder can be added later for CMS-driven placeholder text.
 */
export function SuperSearchBarBlock({ block }: SuperSearchBarBlockProps) {
  return <SuperSearchBar />;
}
