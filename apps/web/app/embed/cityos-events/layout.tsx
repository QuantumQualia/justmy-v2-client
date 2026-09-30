import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CityOS events embed",
  description: "Embedded CityOS events tag cloud for legacy newsstand sites (iframe).",
  robots: { index: false, follow: false },
};

export default function EmbedCityOsEventsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="box-border min-h-screen w-full bg-background text-foreground antialiased">{children}</div>
  );
}
