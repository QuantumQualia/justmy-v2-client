"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { AskSkyConcierge } from "@/components/biz-os/asksky-concierge";
import { useProfileStore } from "@/lib/store";
import { useBizOsProfile, useProfileStoreHydrated } from "@/components/biz-os/use-biz-os-profile";
import {
  BizOsCard,
  BizOsPage,
  BizOsSkeleton,
  OsPaneSwitch,
} from "@/components/biz-os/biz-os-ui";
import { publicMycardUrl } from "@/lib/mycard/public-url";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

const InlineEdit = dynamic(() => import("@/components/mycard/inline-edit-view"), {
  ssr: false,
  loading: () => (
    <div className="space-y-3 p-6">
      <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
    </div>
  ),
});

function PersonalOsCardInner() {
  const { ready } = useBizOsProfile();
  const profileHydrated = useProfileStoreHydrated();
  const data = useProfileStore((s) => s.data);
  const setData = useProfileStore((s) => s.setData);
  const updateSocialLink = useProfileStore((s) => s.updateSocialLink);
  const addSocialLink = useProfileStore((s) => s.addSocialLink);
  const removeSocialLink = useProfileStore((s) => s.removeSocialLink);
  const updateHotlink = useProfileStore((s) => s.updateHotlink);
  const addHotlink = useProfileStore((s) => s.addHotlink);
  const removeHotlink = useProfileStore((s) => s.removeHotlink);
  const [mobilePane, setMobilePane] = useState<"editor" | "sky">("editor");

  if (!ready || !profileHydrated) return <BizOsSkeleton />;

  const liveUrl = publicMycardUrl(data.slug);

  return (
    <BizOsPage className="flex h-full min-h-0 flex-1 flex-col gap-2 space-y-0 overflow-hidden sm:gap-3 lg:gap-4">
      <div className="shrink-0 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 lg:block">
              Studio
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl lg:mt-1 lg:text-3xl">
              Your myCARD
            </h1>
            <p className="mt-1 hidden text-sm leading-relaxed text-slate-500 lg:block">
              Edit on the left. Sky drafts copy and contact on the right — nothing publishes until you apply.
            </p>
          </div>
          {liveUrl ? (
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                <span className="sm:hidden">Open live</span>
                <span className="hidden sm:inline">Open live myCARD</span>
              </a>
            </Button>
          ) : null}
        </div>
        <OsPaneSwitch
          value={mobilePane}
          onChange={setMobilePane}
          options={[
            { id: "editor", label: "Editor" },
            { id: "sky", label: "AskSKY" },
          ]}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 items-stretch gap-4 overflow-hidden lg:grid-cols-[minmax(0,58%)_minmax(0,42%)]">
        <BizOsCard
          padded={false}
          className={cn(
            "min-h-0 flex-col overflow-hidden lg:flex",
            mobilePane === "editor" ? "flex" : "max-lg:!hidden",
          )}
        >
          <div className="hidden shrink-0 border-b border-slate-100 px-5 py-3 lg:block">
            <p className="text-sm font-semibold">Editor</p>
            <p className="text-xs text-slate-500">Tap fields on the card to edit.</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-[375px] px-3 py-3 sm:px-0 sm:py-4">
              <InlineEdit
                mode="edit"
                appearance="light"
                data={data}
                onDataChange={setData}
                onSocialLinkUpdate={updateSocialLink}
                onSocialLinkAdd={addSocialLink}
                onSocialLinkRemove={removeSocialLink}
                onHotlinkUpdate={updateHotlink}
                onHotlinkAdd={addHotlink}
                onHotlinkRemove={removeHotlink}
              />
            </div>
          </div>
        </BizOsCard>
        <div
          className={cn(
            "min-h-0 flex-col overflow-hidden lg:flex",
            mobilePane === "sky" ? "flex" : "max-lg:!hidden",
          )}
        >
          <AskSkyConcierge fillViewport stage="personal_card" />
        </div>
      </div>
    </BizOsPage>
  );
}

export default function PersonalOsCardPage() {
  return (
    <Suspense fallback={<BizOsSkeleton />}>
      <PersonalOsCardInner />
    </Suspense>
  );
}
