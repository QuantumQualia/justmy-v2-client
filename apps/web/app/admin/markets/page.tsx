import type { Metadata } from "next"
import { AdminPage, AdminPanel } from "@/components/admin/admin-page"
import { MarketList } from "@/components/admin/markets/market-list"

export const metadata: Metadata = {
  title: "Markets",
  description: "Manage market locations and territories",
}

export default function MarketsPage() {
  return (
    <AdminPage
      title="Markets"
      description="Manage locations, territories, and the sponsor profiles that run on NewsSTAND and Sky."
      width="5xl"
    >
      <AdminPanel>
        <MarketList />
      </AdminPanel>
    </AdminPage>
  )
}
