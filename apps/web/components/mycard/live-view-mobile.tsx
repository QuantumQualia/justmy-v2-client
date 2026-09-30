"use client";

import React from "react";
import type { ProfileData } from "@/lib/store";
import { MyCardMobileDefaultView } from "@/components/mycard/live-view-mobile-default";
import { MyCardMobileBizView } from "@/components/mycard/live-view-mobile-biz";
import { MycardMobileFooter, MycardMobileSection, useMycardMobileSection } from "@/components/mycard/mycard-mobile-sections";
import { resolveMycardLayout } from "@/lib/os-types";

export interface MyCardMobileViewProps {
  data: ProfileData;
  usePublicNavbar: boolean;
  outerTextClass: string;
  screenBgClass: string;
  avatarOuterClass: string;
  nameTextClass: string;
  taglineTextClass: string;
  aboutTitleTextClass: string;
  aboutCardClass: string;
  aboutBodyTextClass: string;
  ctaButtonClassName: string;
  registerHref: string;
  footerAdUrl: string;
  contactActions: React.ReactNode;
  isLightMycard: boolean;
}

export function MyCardMobileView(props: MyCardMobileViewProps) {
  const section = useMycardMobileSection(props.data);
  const body =
    section !== "home" ? (
      <MycardMobileSection data={props.data} section={section} ctaButtonClassName={props.ctaButtonClassName} />
    ) : resolveMycardLayout(props.data.osName) === "biz" ? (
      <MyCardMobileBizView {...props} />
    ) : (
      <MyCardMobileDefaultView {...props} />
    );

  if (section === "asksky") return body;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1">{body}</div>
      <MycardMobileFooter registerHref={props.registerHref} />
    </div>
  );
}

