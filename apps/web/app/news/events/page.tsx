import type { Metadata } from "next";

import { EventsLookup } from "@/components/news/home/events-lookup";

export const metadata: Metadata = {
  title: "Events",
  description: "See every upcoming event in your NewsSTAND market.",
};

export default function NewsEventsPage() {
  return <EventsLookup />;
}
