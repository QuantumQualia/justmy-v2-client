"use client";

import { MarketList } from "@/components/admin/markets/market-list";
import { MarketListWidget } from "@/components/admin/market-list-widget";

export default function Market2Page() {
  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">🧪 The Lab: Market Management</h1>
          <p className="text-slate-400">Testing market management components</p>
          <p className="text-sm text-yellow-500 mt-2">
            Note: Some components are temporarily disabled due to missing UI dependencies (Select, Switch, Textarea, Tabs)
          </p>
        </div>

        <div className="space-y-8">
          {/* MarketList - Working */}
          <div className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
            <h2 className="text-emerald-500 mb-4 text-sm font-mono uppercase tracking-wider">
              Component: MarketList ✅
            </h2>
            <div className="bg-white rounded-lg p-6">
              <MarketList />
            </div>
          </div>

          {/* Original Widget */}
          <div className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
            <h2 className="text-emerald-500 mb-4 text-sm font-mono uppercase tracking-wider">
              Component: MarketListWidget (Original) ✅
            </h2>
            <MarketListWidget />
          </div>

          {/* Temporarily Disabled Components */}
          <div className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
            <h2 className="text-orange-500 mb-4 text-sm font-mono uppercase tracking-wider">
              Temporarily Disabled Components
            </h2>
            <div className="space-y-2 text-slate-400 text-sm">
              <p>• MarketIdentityForm (requires Select, Switch components)</p>
              <p>• MarketSocialsForm (should work but disabled for consistency)</p>
              <p>• MarketZipManager (requires Textarea component)</p>
              <p>• Tabs layout (requires Tabs component)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


