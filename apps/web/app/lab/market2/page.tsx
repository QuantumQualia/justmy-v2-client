import { Metadata } from "next";
import { MarketListWidget } from "@/components/admin/market-list-widget";

export const metadata: Metadata = {
  title: "Market Lab",
  description: "Testing the Territory Management widgets in isolation. Development lab for Market Engine components.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MarketLabPage() {
  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">🧪 The Lab: Market Engine</h1>
          <p className="text-slate-400">duy Testing the Territory Management widgets in isolation.</p>
        </div>

        <div className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
          <h2 className="text-emerald-500 mb-4 text-sm font-mono uppercase tracking-wider">
            Component: MarketListWidget
          </h2>
          <MarketListWidget />
        </div>
      </div>
    </div>
  );
}
