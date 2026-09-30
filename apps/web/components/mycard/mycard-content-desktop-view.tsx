"use client";

import { MycardContentSections } from "@/components/mycard/mycard-content-sections";

interface MyCardContentDesktopViewProps {
  profileType?: string;
  profileSlug: string;
  profileName?: string;
  profilePhoto?: string | null;
  variant?: "light" | "dark";
  selectedTabId?: number | null;
  selectedTabTitle?: string;
}

export function MyCardContentDesktopView({ profileSlug }: MyCardContentDesktopViewProps) {
  return <MycardContentSections profileSlug={profileSlug} layout="grid" />;
}
