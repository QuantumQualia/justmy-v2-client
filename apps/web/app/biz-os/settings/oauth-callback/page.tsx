"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bizOsService } from "@/lib/services/biz-os";
import { BizOsCard, BizOsHeader, BizOsPage } from "@/components/biz-os/biz-os-ui";

function safeReturnTo(value?: string | null) {
  const next = String(value || "").trim();
  if (!next.startsWith("/biz-os/")) return "/biz-os/settings";
  if (next.includes("://") || next.includes("\\")) return "/biz-os/settings";
  return next;
}

export default function SocialOauthCallbackPage() {
  const [message, setMessage] = useState("Finishing connection…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error_description") || params.get("error");
    const code = params.get("code");
    const state = params.get("state");
    if (err) {
      setFailed(true);
      setMessage(err);
      return;
    }
    if (!code || !state) {
      setFailed(true);
      setMessage("Missing OAuth code. Start Connect again from Connections.");
      return;
    }
    void bizOsService
      .completeOAuthConnection({ code, state })
      .then((res) => {
        window.location.replace(safeReturnTo(res.returnTo));
      })
      .catch((caught: unknown) => {
        setFailed(true);
        setMessage(caught instanceof Error ? caught.message : "Could not finish OAuth.");
      });
  }, []);

  return (
    <BizOsPage>
      <BizOsHeader eyebrow="Biz OS" title="Account connection" />
      <BizOsCard>
        <p className={failed ? "text-sm text-rose-600" : "text-sm text-slate-600"}>{message}</p>
        {failed ? (
          <Link className="mt-3 inline-block text-sm font-medium text-violet-700" href="/biz-os/settings">
            Back to Connections
          </Link>
        ) : null}
      </BizOsCard>
    </BizOsPage>
  );
}
