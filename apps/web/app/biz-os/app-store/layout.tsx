import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "Apps",
  "Browse Biz OS apps available on your current plan.",
);

export default function AppStoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
