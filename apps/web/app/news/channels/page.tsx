import type { Metadata } from "next";

import { ChannelsLookup } from "@/components/news/home/channels-lookup";

export const metadata: Metadata = {
  title: "Channels",
  description: "Browse every NewsSTAND channel and the stories filed there.",
};

export default function NewsChannelsPage() {
  return <ChannelsLookup />;
}
