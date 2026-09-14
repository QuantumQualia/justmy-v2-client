import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "myCARD",
  "Edit your Biz OS digital card — photo, about, links, and public listing.",
);

export default function BizOsOnboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
