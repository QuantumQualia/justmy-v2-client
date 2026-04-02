"use client";

import type { ProfileData } from "@/lib/store";
import { MyCardMobileDefaultView } from "@/components/mycard/live-view-mobile-default";
import { MyCardMobileBizView } from "@/components/mycard/live-view-mobile-biz";
import { MyCardMobileFounderView } from "@/components/mycard/live-view-mobile-founder";
import { MyCardMobileCommandView } from "@/components/mycard/live-view-mobile-command";
import { DEFAULT_OS_NAME, OS_NAME } from "@/lib/os-types";

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
  const osName = (props.data.osName ?? DEFAULT_OS_NAME).trim().toUpperCase();

  switch (osName) {
    // Future: add OS-specific mobile views here.
    case OS_NAME.BIZ:
       return <MyCardMobileBizView {...props} />;
    case OS_NAME.FOUNDER:
       return <MyCardMobileFounderView {...props} />;
    case OS_NAME.COMMAND:
       return <MyCardMobileCommandView {...props} />;
    default:
      return <MyCardMobileDefaultView {...props} />;
  }
}
