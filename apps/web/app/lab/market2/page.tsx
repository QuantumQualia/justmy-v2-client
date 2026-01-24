"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketList } from "@/components/admin/markets/market-list";
import { MarketIdentityForm } from "@/components/admin/markets/market-identity-form";
import { MarketSocialsForm } from "@/components/admin/markets/market-socials-form";
import { MarketZipManager } from "@/components/admin/markets/market-zip-manager";
import { MarketListWidget } from "@/components/admin/market-list-widget";

export default function Market2Page() {
  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">🧪 The Lab: Market Management</h1>
          <p className="text-slate-400">Testing all market management components with mock data</p>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-slate-900">
            <TabsTrigger value="list">Market List</TabsTrigger>
            <TabsTrigger value="identity">Identity Form</TabsTrigger>
            <TabsTrigger value="socials">Socials Form</TabsTrigger>
            <TabsTrigger value="zips">Zip Manager</TabsTrigger>
            <TabsTrigger value="combined">Combined</TabsTrigger>
            <TabsTrigger value="widget">Widget</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
            <h2 className="text-emerald-500 mb-4 text-sm font-mono uppercase tracking-wider">
              Component: MarketList
            </h2>
            <div className="bg-white rounded-lg p-6">
              <MarketList />
            </div>
          </TabsContent>

          <TabsContent value="identity" className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
            <h2 className="text-emerald-500 mb-4 text-sm font-mono uppercase tracking-wider">
              Component: MarketIdentityForm
            </h2>
            <div className="bg-white rounded-lg p-6">
              <MarketIdentityForm />
            </div>
          </TabsContent>

          <TabsContent value="socials" className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
            <h2 className="text-emerald-500 mb-4 text-sm font-mono uppercase tracking-wider">
              Component: MarketSocialsForm
            </h2>
            <div className="bg-white rounded-lg p-6">
              <MarketSocialsForm />
            </div>
          </TabsContent>

          <TabsContent value="zips" className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
            <h2 className="text-emerald-500 mb-4 text-sm font-mono uppercase tracking-wider">
              Component: MarketZipManager
            </h2>
            <div className="bg-white rounded-lg p-6">
              <MarketZipManager />
            </div>
          </TabsContent>

          <TabsContent value="combined" className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
            <h2 className="text-emerald-500 mb-4 text-sm font-mono uppercase tracking-wider">
              Combined View: All Forms
            </h2>
            <div className="bg-white rounded-lg p-6 space-y-6">
              <MarketIdentityForm />
              <MarketSocialsForm />
              <MarketZipManager />
            </div>
          </TabsContent>

          <TabsContent value="widget" className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
            <h2 className="text-emerald-500 mb-4 text-sm font-mono uppercase tracking-wider">
              Component: MarketListWidget (Original)
            </h2>
            <MarketListWidget />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

