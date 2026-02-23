"use client";

import React from "react";
import { MediaCard, MediaCardProps } from "@/components/mycard/media-card";
import { useProfileStore } from "@/lib/store";
import type { PageBlock } from "@/lib/services/cms";

interface MediaCardBlockProps {
  block: PageBlock;
}

export function MediaCardBlock({ block }: MediaCardBlockProps) {
  // Get profile data from store
  const data = useProfileStore((state) => state.data);

  // Get profile URL from block or generate from slug
  const profileUrl = block.profileUrl || (data.slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/${data.slug}` : "");

  const props: MediaCardProps = {
    profileData: data,
    profileUrl,
    onDownload: block.onDownload,
  };

  return <MediaCard {...props} />;
}
