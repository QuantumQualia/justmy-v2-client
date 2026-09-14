import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "Pricing",
  "Compare Biz OS, Command OS, Command PRO, and Enterprise plans.",
);

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
