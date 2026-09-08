"use client";

import { BizOsComingSoonPage } from "@/components/biz-os/coming-soon";

export default function SmartHandoffComingSoonPage() {
  return (
    <BizOsComingSoonPage
      eyebrow="Command"
      title="SmartHandoff"
      body="AskSKY will text JR, then FunCREW, when a merchant needs live help. You will not connect Twilio."
      planHint="Planned for Command OS and above. SkySCAN and FunCREW handoff work today."
      minTier="command"
    />
  );
}
