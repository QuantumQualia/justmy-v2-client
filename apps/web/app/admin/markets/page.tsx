import type { Metadata } from "next"
import { MarketList } from "@/components/admin/markets/market-list"

export const metadata: Metadata = {
  title: "Markets",
  description: "Manage market locations and territories",
}

export default function MarketsPage() {
  return (
    <div className="min-h-screen bg-background p-10 text-foreground">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Markets</h1>
          <p className="text-muted-foreground">Manage your market locations and territories</p>
        </div>

        <div className="border border-dashed border-border p-8 rounded-xl bg-muted">
          <MarketList />
        </div>
      </div>
    </div>
  )
}

