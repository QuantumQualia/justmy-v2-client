import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "SkySCAN",
  "Audit local visibility and publish a SkySCAN report for your business.",
);

export default function SkyScanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
