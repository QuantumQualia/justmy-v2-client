import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "Battle Plan",
  "Work a Battle Plan with Sky — conversation, checklist, and live tasks.",
);

export default function BattlePlanDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
