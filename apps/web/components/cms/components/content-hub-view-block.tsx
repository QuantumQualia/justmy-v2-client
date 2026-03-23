"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { ContentHubView } from "@/components/content/content-hub-view";
import { ContentHubLiteView } from "@/components/content/content-hub-lite-view";
import { useProfileStore } from "@/lib/store";

interface ContentHubViewBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the Content Hub management viewer.
 */
export function ContentHubViewBlock({ block }: ContentHubViewBlockProps) {
  const profileType = useProfileStore((s) => s.data.type);
  const allowsSubProfiles = useProfileStore((s) => s.data.allowsSubProfiles === true);
  const isPersonalLite = profileType === "personal" && !allowsSubProfiles;

  return isPersonalLite ? <ContentHubLiteView /> : <ContentHubView />;
}

