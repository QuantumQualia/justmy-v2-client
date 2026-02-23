"use client";

import MyCardLive from "@/components/mycard/live-view";
import type { ProfileData } from "@/lib/store";

interface MyCardPageClientProps {
  params: { handle: string };
  initialData: ProfileData | null;
}

export default function MyCardPageClient({ params, initialData }: MyCardPageClientProps) {
  if (!initialData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-slate-400">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <MyCardLive data={initialData} />;
}
