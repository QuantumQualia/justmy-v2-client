import type { Metadata } from "next";

import { NewsMarketPageClient } from "@/components/news/news-market-page-client";
import { marketSlugToTitle } from "@/lib/news/market-routing";

type PageProps = {
  params: Promise<{ marketSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { marketSlug } = await params;
  const isZipcode = /^\d{5}(?:-\d{4})?$/.test(marketSlug);
  const marketName = marketSlugToTitle(marketSlug);
  const title = isZipcode
    ? `Coming Soon · ${marketSlug}`
    : `Coming Soon · ${marketName}`;
  return {
    title,
    description: isZipcode
      ? `Local news for ZIP code ${marketSlug} is coming soon.`
      : `${marketName} Daily Drop is coming soon.`,
  };
}

export default async function NewsMarketPage({ params }: PageProps) {
  const { marketSlug } = await params;
  return <NewsMarketPageClient marketSlug={marketSlug} />;
}
