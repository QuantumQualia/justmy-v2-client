import type { Metadata } from "next";
import { bizOsMetadata } from "@/lib/biz-os/seo";

export const metadata: Metadata = bizOsMetadata(
  "Voice schema",
  "Speakable schema for assistants — coming soon on Command PRO.",
);

export default function VoiceSchemaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
