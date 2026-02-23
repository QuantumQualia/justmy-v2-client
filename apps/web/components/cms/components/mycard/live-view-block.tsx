"use client";

import React from "react";
import MyCardLive from "@/components/mycard/live-view";
import { useProfileStore } from "@/lib/store";
import type { PageBlock } from "@/lib/services/cms";

interface LiveViewBlockProps {
  block: PageBlock;
}

export function LiveViewBlock({ block }: LiveViewBlockProps) {
  // Get profile data from store
  const data = useProfileStore((state) => state.data);

  return <MyCardLive data={data} profileType={block.profileType} />;
}
