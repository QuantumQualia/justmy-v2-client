import type { Metadata } from "next";

import { NewsPageClient } from "@/components/news/news-page-client";

export const metadata: Metadata = {
  title: "Find Your Local Market",
  description:
    "Enter your zip code to visit your JustMy market site or local Daily Drop.",
};

export default function NewsLandingPage() {
  return <NewsPageClient />;
}
