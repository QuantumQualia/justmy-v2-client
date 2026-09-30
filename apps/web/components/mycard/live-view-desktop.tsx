"use client";

import type { ProfileData } from "@/lib/store";
import { MyCardDesktopDefaultView } from "@/components/mycard/live-view-desktop-default";
import { MyCardDesktopBizView } from "@/components/mycard/live-view-desktop-biz";
import { profileVideo } from "@/components/mycard/mycard-video";
import { resolveMycardLayout } from "@/lib/os-types";

interface MyCardDesktopViewProps {
  data: ProfileData;
  usePublicNavbar: boolean;
  outerTextClass: string;
  avatarOuterClass: string;
  ctaButtonClassName: string;
  registerHref: string;
  contactActions: React.ReactNode;
}

export function MyCardDesktopView(props: MyCardDesktopViewProps) {
  const layout = resolveMycardLayout(props.data.osName);
  const pitch = profileVideo(props.data.videos, "PITCH");

  if (layout === "biz" && pitch?.videoUrl) return <MyCardDesktopBizView {...props} />;
  return <MyCardDesktopDefaultView {...props} />;
}
