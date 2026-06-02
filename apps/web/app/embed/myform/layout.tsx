import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@workspace/asksky-embed/glass.css";

export const metadata: Metadata = {
  title: "myFORM embed",
  description: "Embedded dynamic form for third-party sites.",
  robots: { index: false, follow: false },
};

export default function EmbedMyFormLayout({ children }: { children: ReactNode }) {
  return (
    <div className="box-border mx-auto flex w-full max-w-lg flex-col bg-transparent px-3 py-3 sm:px-4 sm:py-4">
      {children}
    </div>
  );
}
