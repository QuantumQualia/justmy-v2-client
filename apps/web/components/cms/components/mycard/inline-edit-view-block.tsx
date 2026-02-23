"use client";

import React from "react";
import InlineEdit from "@/components/mycard/inline-edit-view";
import { useProfileStore } from "@/lib/store";
import type { PageBlock } from "@/lib/services/cms";

interface InlineEditViewBlockProps {
  block: PageBlock;
}

export function InlineEditViewBlock({ block }: InlineEditViewBlockProps) {
  // Get profile data from store
  const data = useProfileStore((state) => state.data);
  const setData = useProfileStore((state) => state.setData);
  const updateSocialLink = useProfileStore((state) => state.updateSocialLink);
  const addSocialLink = useProfileStore((state) => state.addSocialLink);
  const removeSocialLink = useProfileStore((state) => state.removeSocialLink);
  const updateHotlink = useProfileStore((state) => state.updateHotlink);
  const addHotlink = useProfileStore((state) => state.addHotlink);
  const removeHotlink = useProfileStore((state) => state.removeHotlink);

  return (
    <InlineEdit
      mode="edit"
      data={data}
      onDataChange={setData}
      onSocialLinkUpdate={updateSocialLink}
      onSocialLinkAdd={addSocialLink}
      onSocialLinkRemove={removeSocialLink}
      onHotlinkUpdate={updateHotlink}
      onHotlinkAdd={addHotlink}
      onHotlinkRemove={removeHotlink}
    />
  );
}
