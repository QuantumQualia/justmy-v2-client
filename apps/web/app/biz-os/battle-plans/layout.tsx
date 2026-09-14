import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "Battle Plans",
  "Tell Sky what you are working on. She drafts a plan, you shape it, then it goes live.",
);

export default function BattlePlansLayout({ children }: { children: React.ReactNode }) {
  return children;
}
