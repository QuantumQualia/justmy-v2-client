import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "Campaigns",
  "Run and track Biz OS campaigns.",
);

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
