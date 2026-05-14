import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AskSKY embed",
  description: "Embedded AskSKY assistant for iframes and external pages.",
  robots: { index: false, follow: false },
};

export default function EmbedAskSkyLayout({ children }: { children: ReactNode }) {
  return children;
}
