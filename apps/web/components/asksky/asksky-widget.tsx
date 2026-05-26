"use client";

import {
  AskSkyWidgetCore,
  type AskSkyVariant,
  type AskSkyWidgetCoreProps,
} from "@workspace/asksky-embed";
import { appAskSkyTransport } from "@/lib/asksky-app-sky-transport";
import { useProfileStore } from "@/lib/store/profile-store";

export type { AskSkyVariant };

export type AskSkyWidgetProps = Omit<AskSkyWidgetCoreProps, "sky" | "visitorUserBubble">;

export function AskSkyWidget(props: AskSkyWidgetProps) {
  const profile = useProfileStore((s) => s.data);
  const visitorUserBubble = profile
    ? { photo: profile.photo ?? undefined, name: profile.name ?? undefined }
    : null;

  return (
    <AskSkyWidgetCore {...props} sky={appAskSkyTransport} visitorUserBubble={visitorUserBubble} />
  );
}
