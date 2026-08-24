"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/lib/store";
import { AskSkyConcierge } from "@/components/biz-os/asksky-concierge";
import { useBizOsProfile, useProfileStoreHydrated } from "@/components/biz-os/use-biz-os-profile";
import { BizOsCard, BizOsHeader, BizOsPage, BizOsSetupSteps, BizOsSkeleton } from "@/components/biz-os/biz-os-ui";
import { publicMycardUrl } from "@/lib/mycard/public-url";

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

function OnboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profileId, ready } = useBizOsProfile();
  const profileHydrated = useProfileStoreHydrated();
  const data = useProfileStore((s) => s.data);
  const setData = useProfileStore((s) => s.setData);
  const updateSocialLink = useProfileStore((s) => s.updateSocialLink);
  const addSocialLink = useProfileStore((s) => s.addSocialLink);
  const removeSocialLink = useProfileStore((s) => s.removeSocialLink);
  const updateHotlink = useProfileStore((s) => s.updateHotlink);
  const addHotlink = useProfileStore((s) => s.addHotlink);
  const removeHotlink = useProfileStore((s) => s.removeHotlink);
  const [stage, setStage] = useState(searchParams.get("stage") || "card");

  useEffect(() => {
    const q = searchParams.get("stage");
    if (q) setStage(q);
  }, [searchParams]);

  function goStage(next: string) {
    setStage(next);
    if (next === "skyscan") router.push("/biz-os/skyscan");
    if (next === "battle_plan") router.push("/biz-os/battle-plans");
    if (next === "reputation") router.push("/biz-os/reputation");
  }

  if (!ready || !profileHydrated) return <BizOsSkeleton />;

  const liveUrl = publicMycardUrl(data.slug);

  return (
    <BizOsPage className="flex h-[calc(100dvh-var(--biz-os-sticky-top,7rem)-4rem)] max-h-[calc(100dvh-var(--biz-os-sticky-top,7rem)-4rem)] min-h-0 flex-1 flex-col gap-6 space-y-0 overflow-hidden">
      <div className="shrink-0 space-y-6">
        <BizOsHeader
          eyebrow="Studio"
          title="Build your myCARD"
          description="Edit on the left. AskSKY drafts copy and contact details on the right — nothing publishes until you apply."
          actions={
            liveUrl ? (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-violet-300"
              >
                Open live myCARD
              </a>
            ) : null
          }
        />

        <BizOsSetupSteps />
        {profileId ? null : (
          <p className="text-sm text-amber-700">No business profile yet. Claim a Dot Hub or register as a business.</p>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(16rem,1.15fr)] items-stretch gap-4 overflow-hidden lg:grid-cols-[minmax(0,58%)_minmax(0,42%)] lg:grid-rows-none">
        <BizOsCard
          padded={false}
          className="flex min-h-0 flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-semibold">Editor</p>
            <p className="text-xs text-slate-500">Tap fields on the card to edit. Open live myCARD to see the public page.</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-[375px] py-4">
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
        <div className="flex min-h-0 flex-col overflow-hidden">
          <AskSkyConcierge fillViewport stage={stage} onStage={goStage} />
        </div>
      </div>
    </BizOsPage>
  );
}

export default function BizOsOnboardPage() {
  return (
    <Suspense fallback={<BizOsSkeleton />}>
      <OnboardInner />
    </Suspense>
  );
}
