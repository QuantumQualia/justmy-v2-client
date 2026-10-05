import type { Metadata } from "next";

import { ReferFriendPage } from "@/components/refer/refer-friend-page";

export const metadata: Metadata = {
  title: "Refer a Friend",
  description: "Bring your people. Your friend gets their own free NewsSTAND and you both earn credits.",
};

export default function ReferPage() {
  return <ReferFriendPage />;
}
