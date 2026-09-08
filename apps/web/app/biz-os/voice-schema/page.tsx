"use client";

import { BizOsComingSoonPage } from "@/components/biz-os/coming-soon";

export default function VoiceSchemaComingSoonPage() {
  return (
    <BizOsComingSoonPage
      eyebrow="Command PRO"
      title="Voice schema"
      body="Omni-assistant / Siri speakable schema is not live yet. LocalBusiness JSON-LD already publishes from myCARD."
      planHint="Keep name, address, and hours complete on myCARD so GEO schema stays green on SkySCAN."
      minTier="command_pro"
    />
  );
}
