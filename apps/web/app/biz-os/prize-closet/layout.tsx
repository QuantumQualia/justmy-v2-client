import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "The Prize Closet",
  "Put your business up as the Win with Sky! prize and track your prize submissions.",
);

export default function PrizeClosetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
