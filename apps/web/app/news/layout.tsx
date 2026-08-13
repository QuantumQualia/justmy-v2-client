import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Find Your Local Market",
    template: "%s | JustMy News",
  },
  description:
    "Enter your zip code to go to your local JustMy market site or Daily Drop.",
  robots: {
    index: true,
    follow: true,
  },
};

/** Thin shell — landing and market pages each own their chrome/theme. */
export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
