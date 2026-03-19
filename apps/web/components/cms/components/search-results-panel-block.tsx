"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { SearchResultsPanel } from "@/components/common/search/search-results-panel";

interface SearchResultsPanelBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the Search Results Panel.
 * Listens to the global search store; shows results when user has searched via Super Search Bar.
 */
export function SearchResultsPanelBlock({ block }: SearchResultsPanelBlockProps) {
  // Search results panel is now mounted globally in `apps/web/app/layout.tsx`,
  // so rendering it from CMS blocks would cause duplicates.
  void block;
  return null;
}
