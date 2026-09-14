import type { Metadata } from "next";

const NOINDEX: Metadata["robots"] = { index: false, follow: false };

/** Authenticated Biz OS shell — titles for the tab, never index the dashboard. */
export function bizOsMetadata(title: string, description: string): Metadata {
  const ogTitle = title === "Biz OS" ? "Biz OS" : `${title} · Biz OS`;
  return {
    title,
    description,
    robots: NOINDEX,
    openGraph: {
      title: ogTitle,
      description,
    },
    twitter: {
      title: ogTitle,
      description,
    },
  };
}

export const BIZ_OS_LAYOUT_METADATA = bizOsMetadata(
  "Biz OS",
  "Your business operating system — myCARD, Battle Plans, SkySCAN, reputation, and local visibility.",
);
