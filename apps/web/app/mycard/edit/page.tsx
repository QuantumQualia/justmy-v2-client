"use client";

import { useState, useEffect } from "react";
import InlineEdit from "@/components/mycard/inline-edit-view";
import MyCardLive from "@/components/mycard/live-view";
import { ArrowLeft, Eye, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { useProfileStore } from "@/lib/store";
import { openShare } from "@/components/common/share/share-store";

export default function ProfilePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"edit" | "live">("edit");
  
  // Use ProfileStore for own profile
  const data = useProfileStore((state) => state.data);
  const setData = useProfileStore((state) => state.setData);
  const updateSocialLink = useProfileStore((state) => state.updateSocialLink);
  const addSocialLink = useProfileStore((state) => state.addSocialLink);
  const removeSocialLink = useProfileStore((state) => state.removeSocialLink);
  const updateHotlink = useProfileStore((state) => state.updateHotlink);
  const addHotlink = useProfileStore((state) => state.addHotlink);
  const removeHotlink = useProfileStore((state) => state.removeHotlink);
  const fetchProfileData = useProfileStore((state) => state.fetchProfileData);

  // Fetch own profile data on mount
  useEffect(() => {
    fetchProfileData("me");
  }, [fetchProfileData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header Section */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <h1 className="text-lg font-bold text-white">myCARD Editor</h1>
                <p className="text-xs text-slate-400">Edit your {data?.type || 'personal'} digital card</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-slate-300">Auto-saving</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Info Banner */}
          {viewMode === "edit" && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 leading-relaxed">
                  <span className="font-semibold text-blue-400">Tip:</span> Click on any section with a red numbered badge to start editing. Your changes are automatically saved as you work.
                </p>
              </div>
            </div>
          </div>
          )}
          
          {/* Editor Component */}
          <div className="flex justify-center">
            {viewMode === "edit" ? (
              <InlineEdit
                mode="edit"
                data={data}
                onDataChange={setData}
                onSocialLinkUpdate={updateSocialLink}
                onSocialLinkAdd={addSocialLink}
                onSocialLinkRemove={removeSocialLink}
                onHotlinkUpdate={updateHotlink}
                onHotlinkAdd={addHotlink}
                onHotlinkRemove={removeHotlink}
              />
            ) : (
              <MyCardLive data={data} />
            )}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="sticky bottom-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 py-4">
            <Button
              variant="outline"
              className="flex-1 max-w-[200px] bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 text-slate-200 hover:text-white cursor-pointer"
              onClick={() =>
                setViewMode((prev) => (prev === "edit" ? "live" : "edit"))
              }
            >
              <Eye className="h-4 w-4 mr-2" />
              {viewMode === "edit" ? "Live Preview" : "Edit myCARD"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 max-w-[200px] bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 text-slate-200 hover:text-white cursor-pointer"
              onClick={() => {
                const url = `${process.env.NEXT_PUBLIC_APP_URL}/${data.slug}`;
                openShare({
                  title: data.name || "myCARD",
                  description: data.tagline || "Check out my JustMy myCARD",
                  url,
                  imageUrl: data.banner || data.photo || undefined,
                  entityLabel: data.type || undefined,
                });
              }}
            >
              {/* We can keep the Eye icon for consistency or swap to Share later */}
              <Eye className="h-4 w-4 mr-2" />
              Share myCARD
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
