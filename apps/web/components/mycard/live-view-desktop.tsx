"use client";

import type { ProfileData } from "@/lib/store";
import { MyCardDesktopDefaultView } from "@/components/mycard/live-view-desktop-default";
import { DEFAULT_OS_NAME, OS_NAME } from "@/lib/os-types";

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
  const osName = (props.data.osName ?? DEFAULT_OS_NAME).trim().toUpperCase();

  switch (osName) {
    // Future: add OS-specific desktop views here.
    // case OS_NAME.PERSONAL:
    //   return <MyCardDesktopDefaultView {...props} />;
    default:
      return <MyCardDesktopDefaultView {...props} />;
  }
}

