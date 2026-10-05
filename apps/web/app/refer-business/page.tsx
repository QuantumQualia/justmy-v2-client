import type { Metadata } from "next";

import { ReferBusinessPage } from "@/components/refer/refer-business-page";

export const metadata: Metadata = {
  title: "Refer a Business",
  description: "Recommend a local business to JustMy. Sky reaches out for you, and you earn myCREDITS.",
};

export default function ReferBusinessRoute() {
  return <ReferBusinessPage />;
}
