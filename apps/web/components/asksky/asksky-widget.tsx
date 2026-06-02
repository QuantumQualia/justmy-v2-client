"use client";

import type { AskSkyWidgetCoreProps } from "@workspace/asksky-embed";
import {
  AskSkyWidgetCore,
  type AskSkyVariant,
} from "@workspace/asksky-embed";
import { appAskSkyTransport } from "@/lib/asksky-app-sky-transport";
import { useProfileStore } from "@/lib/store/profile-store";
import * as React from "react";
import { createAskSkyContactLeadCaptureRenderer } from "@/components/forms/asksky-contact-lead-capture";

export type { AskSkyVariant };

export type AskSkyWidgetProps = Omit<AskSkyWidgetCoreProps, "sky" | "visitorUserBubble">;

export function AskSkyWidget(props: AskSkyWidgetProps) {
  const profile = useProfileStore((s) => s.data);
  const visitorUserBubble = profile
    ? { photo: profile.photo ?? undefined, name: profile.name ?? undefined }
    : null;

  const renderContactLeadCapture = React.useMemo(() => createAskSkyContactLeadCaptureRenderer(), []);

  return (
    <AskSkyWidgetCore
      {...props}
      sky={appAskSkyTransport}
      visitorUserBubble={visitorUserBubble}
      renderContactLeadCapture={renderContactLeadCapture}
    />
  );
}
