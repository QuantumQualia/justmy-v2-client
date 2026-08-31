"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bizOsService } from "@/lib/services/biz-os";
import { BizOsCard, BizOsHeader, BizOsPage } from "@/components/biz-os/biz-os-ui";

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
      .then(() => {
        window.location.replace("/biz-os/settings");
      })
      .catch((caught: unknown) => {
        setFailed(true);
        setMessage(caught instanceof Error ? caught.message : "Could not finish OAuth.");
      });
  }, []);

  return (
    <BizOsPage>
      <BizOsHeader eyebrow="Command PRO" title="Social connections" />
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
