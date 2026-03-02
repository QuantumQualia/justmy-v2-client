"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { ReferAFriend } from "@/components/common/refer";

interface ReferAFriendBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the Refer-a-Friend component.
 * Shows referral code, share link, and a table of referred profiles.
 */
export function ReferAFriendBlock({ block }: ReferAFriendBlockProps) {
  return <ReferAFriend />;
}
