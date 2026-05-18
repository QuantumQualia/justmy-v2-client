import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AskSKY! embed",
  description: "Embedded AskSKY! assistant for iframes and external pages.",
  robots: { index: false, follow: false },
};

export default function EmbedAskSkyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="box-border mx-auto flex h-[100dvh] min-h-0 w-full max-w-2xl flex-col bg-transparent">
      {children}
    </div>
  );
}
