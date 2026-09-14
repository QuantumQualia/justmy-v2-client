import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "Settings",
  "Connect accounts and manage Biz OS settings.",
);

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
