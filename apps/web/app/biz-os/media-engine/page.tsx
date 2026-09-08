"use client";

import { BizOsComingSoonPage } from "@/components/biz-os/coming-soon";

export default function MediaEngineComingSoonPage() {
  return (
    <BizOsComingSoonPage
      eyebrow="Command PRO"
      title="Media engine"
      body="Bi-weekly article and video production is not live yet. Command PRO can still connect accounts and download a SkySCAN caption pack."
      planHint="Use SkySCAN Approve & broadcast for JustMy publish + the S3 pack until this engine ships."
      minTier="command_pro"
    />
  );
}
