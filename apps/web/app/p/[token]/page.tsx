"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { bizOsService } from "@/lib/services/biz-os";

function SharedPlanInner() {
  const params = useParams<{ token: string }>();
  const search = useSearchParams();
  const [data, setData] = useState<Awaited<ReturnType<typeof bizOsService.getSharedPlan>> | null>(null);
  const [error, setError] = useState("");
  const ref = search.get("ref") || "";

  useEffect(() => {
    let cancelled = false;
    void bizOsService
      .getSharedPlan(params.token)
      .then((row) => {
        if (!cancelled) setData(row);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Plan not found.");
      });
    return () => {
      cancelled = true;
    };
  }, [params.token]);

  if (error) {
    return <div className="p-8 text-sm text-muted-foreground">{error}</div>;
  }
  if (!data) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  const signupHref = `/try-free${ref ? `?ref=${encodeURIComponent(ref)}` : data.referralCode ? `?ref=${encodeURIComponent(data.referralCode)}` : ""}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <p className="text-xs font-medium text-[#b3b1c0]">justmy.com</p>
      <h1 className="mt-2 text-2xl font-extrabold">{data.title}</h1>
      {data.description ? <p className="mt-2 text-muted-foreground">{data.description}</p> : null}
      <ol className="mt-6 space-y-2">
        {data.tasks.map((task, i) => (
          <li key={`${task.text}-${i}`} className="rounded-xl border border-[#ececf2] px-4 py-3">
            <div className="font-medium">{task.text}</div>
            {task.location ? <div className="text-xs text-violet-600">{task.location}</div> : null}
          </li>
        ))}
      </ol>
      <Link
        href={signupHref}
        className="mt-8 inline-flex rounded-full bg-[linear-gradient(135deg,#7c6cf6,#5fa8ef)] px-5 py-3 text-sm font-semibold text-white"
      >
        {data.rsvpHint}
      </Link>
      <p className="mt-3 text-xs text-muted-foreground">
        From {data.hostName}. The useful thing comes first — Sky rides along quietly.
      </p>
    </div>
  );
}

export default function SharedPlanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <SharedPlanInner />
    </Suspense>
  );
}
