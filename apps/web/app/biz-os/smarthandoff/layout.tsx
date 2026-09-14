import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "SmartHandoff",
  "AskSKY handoff to JR and FunCREW when you need live help.",
);

export default function SmartHandoffLayout({ children }: { children: React.ReactNode }) {
  return children;
}
