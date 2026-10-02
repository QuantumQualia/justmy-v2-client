"use client";

import { MycardContentSections } from "@/components/mycard/mycard-content-sections";

interface MyCardContentLiteViewProps {
  profileType?: string;
  profileSlug: string;
  variant?: "light" | "dark";
  selectedTabId?: number | null;
  selectedTabTitle?: string;
}

export function MyCardContentLiteView({ profileSlug }: MyCardContentLiteViewProps) {
  return <MycardContentSections profileSlug={profileSlug} layout="carousel" />;
}
