"use client";

import type { ProfileData } from "@/lib/store";
import { MyCardMobileDefaultView } from "@/components/mycard/live-view-mobile-default";
import { MyCardMobileBizView } from "@/components/mycard/live-view-mobile-biz";

export interface MyCardMobileViewProps {
  data: ProfileData;
  usePublicNavbar: boolean;
  outerTextClass: string;
  screenBgClass: string;
  avatarOuterClass: string;
  avatarPlaceholderBgClass: string;
  avatarPlaceholderTextClass: string;
  nameTextClass: string;
  taglineTextClass: string;
  aboutTitleTextClass: string;
  aboutCardClass: string;
  aboutBodyTextClass: string;
  ctaButtonClassName: string;
  registerHref: string;
  footerAdUrl: string;
  shouldCenterItems: boolean;
  swiperRef: React.RefObject<HTMLDivElement | null>;
  contactPrevBtnRef: React.RefObject<HTMLButtonElement | null>;
  contactNextBtnRef: React.RefObject<HTMLButtonElement | null>;
  contactActions: React.ReactNode;
  isLightMycard: boolean;
}

export function MyCardMobileView(props: MyCardMobileViewProps) {
  const osName = (props.data.osName ?? "").trim().toLowerCase();

  switch (osName) {
    case "biz":
      return <MyCardMobileBizView {...props} />;
    default:
      return <MyCardMobileDefaultView {...props} />;
  }
}
