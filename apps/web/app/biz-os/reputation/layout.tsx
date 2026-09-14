import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "Reputation",
  "Track Google reviews, ratings, and reputation for your Biz OS listing.",
);

export default function ReputationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
