import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "myFORM embed",
  description: "Embedded dynamic form for third-party sites.",
  robots: { index: false, follow: false },
};

export default function EmbedMyFormLayout({ children }: { children: ReactNode }) {
  return (
    <div className="box-border mx-auto flex min-h-0 w-full max-w-lg flex-col bg-slate-950 p-4 text-white">
      {children}
    </div>
  );
}
