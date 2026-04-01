"use client";

import type { ProfileData } from "@/lib/store";
import { MyCardDesktopDefaultBizView } from "@/components/mycard/live-view-desktop-default-biz";

interface MyCardDesktopBizViewProps {
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

export function MyCardDesktopBizView(props: MyCardDesktopBizViewProps) {
  const osName = (props.data.osName ?? "").trim().toLowerCase();

  switch (osName) {
    // Future: add OS-specific desktop views here.
    default:
      return <MyCardDesktopDefaultBizView {...props} />;
  }
}

