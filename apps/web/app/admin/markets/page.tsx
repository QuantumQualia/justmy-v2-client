import type { Metadata } from "next"
import { MarketList } from "@/components/admin/markets/market-list"

export const metadata: Metadata = {
  title: "Markets",
  description: "Manage market locations and territories",
}

export default function MarketsPage() {
  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Markets</h1>
          <p className="text-slate-400">Manage your market locations and territories</p>
        </div>

        <div className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
          <MarketList />
        </div>
      </div>
    </div>
  )
}

