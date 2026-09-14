import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "Connect account",
  "Finishing your social account connection.",
);

export default function OauthCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
