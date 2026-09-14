import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "Media engine",
  "Article and video production for Command PRO — coming soon.",
);

export default function MediaEngineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
