"use client";

import type { ProfileData } from "@/lib/store";
import { MyCardDesktopDefaultView } from "@/components/mycard/live-view-desktop-default";

interface MyCardDesktopViewProps {
  data: ProfileData;
  usePublicNavbar: boolean;
  outerTextClass: string;
  avatarOuterClass: string;
  avatarPlaceholderBgClass: string;
  avatarPlaceholderTextClass: string;
  ctaButtonClassName: string;
  registerHref: string;
  contactActions: React.ReactNode;
}

export function MyCardDesktopView(props: MyCardDesktopViewProps) {
  const osName = (props.data.osName ?? "").trim().toLowerCase();

  switch (osName) {
    // Future: add OS-specific desktop views here.
    default:
      return <MyCardDesktopDefaultView {...props} />;
  }
}

