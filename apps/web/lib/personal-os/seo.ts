import type { Metadata } from "next";

const NOINDEX: Metadata["robots"] = { index: false, follow: false };

export function personalOsMetadata(title: string, description: string): Metadata {
  const ogTitle = title === "Personal OS" ? "Personal OS" : `${title} · Personal OS`;
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

export const PERSONAL_OS_LAYOUT_METADATA = personalOsMetadata(
  "Personal OS",
  "Your personal operating system — myPLANS, SkyFM Daily Drop, myCARD, and Sky.",
);
