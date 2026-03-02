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
  return <SearchResultsPanel />;
}
