"use client";

import type { ProfileData } from "@/lib/store";
import { MyCardDesktopDefaultView } from "@/components/mycard/live-view-desktop-default";
import { MyCardDesktopBizView } from "@/components/mycard/live-view-desktop-biz";
import { MyCardDesktopFounderView } from "@/components/mycard/live-view-desktop-founder";
import { MyCardDesktopCommandView } from "@/components/mycard/live-view-desktop-command";
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
    case OS_NAME.BIZ:
      return <MyCardDesktopBizView {...props} />;
    case OS_NAME.FOUNDER:
      return <MyCardDesktopFounderView {...props} />;
    case OS_NAME.GROWTH:
      return <MyCardDesktopCommandView {...props} />;
    default:
      return <MyCardDesktopDefaultView {...props} />;
  }
}

