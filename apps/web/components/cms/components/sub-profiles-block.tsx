"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { SubProfilesPanel } from "@/components/common/sub-profiles";

interface SubProfilesBlockProps {
  block: PageBlock;
}

/** CMS block: ContentCard — list and create linked sub-profiles for the current profile. */
export function SubProfilesBlock({ block }: SubProfilesBlockProps) {
  return <SubProfilesPanel />;
}
