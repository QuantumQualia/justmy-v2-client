"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { ContentHubView } from "@/components/content/content-hub-view";

interface ContentHubViewBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the Content Hub management viewer.
 */
export function ContentHubViewBlock({ block }: ContentHubViewBlockProps) {
  return <ContentHubView />;
}

