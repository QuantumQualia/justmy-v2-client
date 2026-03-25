"use client";

import React, { useState, useEffect } from "react";
import { Eye, Pencil, Share2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import InlineEdit from "@/components/mycard/inline-edit-view";
import MyCardLive from "@/components/mycard/live-view";
import { useProfileStore } from "@/lib/store";
import { openShare } from "@/components/common/share/share-store";
import type { PageBlock } from "@/lib/services/cms";

interface InlineEditViewBlockProps {
  block: PageBlock;
}

export function InlineEditViewBlock({ block }: InlineEditViewBlockProps) {
  const [viewMode, setViewMode] = useState<"edit" | "live">("edit");

  // Get profile data and actions from store
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

  const handleShare = () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/${data.slug}`;
    openShare({
      title: data.name || "myCARD",
      description: data.tagline || "Check out my JustMy myCARD",
      url,
      imageUrl: data.banner || data.photo || undefined,
      entityLabel: data.type || undefined,
    });
  };

  return (
    <div>
      {/* Info Banner (edit mode only) */}
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

      {/* myCARD View */}
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
          <MyCardLive data={data} usePublicNavbar={false} />
        )}
      </div>

      {/* Sticky Footer with View Toggle & Share */}
      <div className="sticky bottom-0 z-40 backdrop-blur-md mt-6">
        <div className="flex items-center justify-center gap-3 py-4 px-4">
          <Button
            variant="outline"
            className="flex-1 max-w-[200px] bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 text-slate-200 hover:text-white cursor-pointer"
            onClick={() => setViewMode((prev) => (prev === "edit" ? "live" : "edit"))}
          >
            {viewMode === "edit" ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Live Preview
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Edit myCARD
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1 max-w-[200px] bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 text-slate-200 hover:text-white cursor-pointer"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share myCARD
          </Button>
        </div>
      </div>
    </div>
  );
}
