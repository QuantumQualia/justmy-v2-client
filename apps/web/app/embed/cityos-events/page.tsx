import { Suspense } from "react";
import { headers } from "next/headers";
import { CityOsEventsEmbedClient } from "./city-os-events-embed-client";
import { hostFromReferrerUrl } from "@/lib/embed/referrer-domain";

export default async function EmbedCityOsEventsPage() {
  const referer = (await headers()).get("referer");
  const referrerHintDomain = hostFromReferrerUrl(referer);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[120px] items-center justify-center text-sm text-slate-400">Loading…</div>
      }
    >
      <CityOsEventsEmbedClient referrerHintDomain={referrerHintDomain} />
    </Suspense>
  );
}
