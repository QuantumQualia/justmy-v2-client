"use client";

import type { ProfileData } from "@/lib/store";
import { MyCardDesktopDefaultView } from "@/components/mycard/live-view-desktop-default";
import { MyCardDesktopBizView } from "@/components/mycard/live-view-desktop-biz";
import { MyCardDesktopFoundersView } from "@/components/mycard/live-view-desktop-founders";
import { MyCardDesktopCommandView } from "@/components/mycard/live-view-desktop-command";

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
  case "biz":
      return <MyCardDesktopBizView {...props} />;
  case "founders":
      return <MyCardDesktopFoundersView {...props} />;
  case "command":
      return <MyCardDesktopCommandView {...props} />;
  default:
    return <MyCardDesktopDefaultView {...props} />;
  }
}

