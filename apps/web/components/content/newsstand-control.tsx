"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { cmsService } from "@/lib/services/cms";
import { toast } from "sonner";

type NewsstandStatus = "none" | "pending" | "published";

export function NewsstandControl({
  postId,
  status,
  newsstandStatus,
  allowAdmin = false,
  onChange,
}: {
  postId?: string;
  status: string;
  newsstandStatus: NewsstandStatus;
  allowAdmin?: boolean;
  onChange: (status: NewsstandStatus) => void;
}) {
  const [busy, setBusy] = useState(false);
  if (!postId || status !== "publish") return null;

  async function run(action: "request" | "cancel" | "remove" | "accept" | "decline") {
    setBusy(true);
    try {
      const result = await cmsService.setNewsstand(postId!, action);
      onChange(result.newsstandStatus);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update newsstand");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground">Newsstand</p>
      {newsstandStatus === "none" ? (
        <Button type="button" variant="ghost" className="rounded-full" disabled={busy} onClick={() => void run("request")}>
          Request newsstand
        </Button>
      ) : null}
      {newsstandStatus === "pending" ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Requested</span>
          <Button type="button" variant="ghost" className="rounded-full" disabled={busy} onClick={() => void run("cancel")}>
            Cancel request
          </Button>
          {allowAdmin ? (
            <>
              <Button type="button" className="rounded-full" disabled={busy} onClick={() => void run("accept")}>
                Accept
              </Button>
              <Button type="button" variant="ghost" className="rounded-full" disabled={busy} onClick={() => void run("decline")}>
                Decline
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
      {newsstandStatus === "published" ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground">On newsstand</span>
          <Button type="button" variant="ghost" className="rounded-full" disabled={busy} onClick={() => void run("remove")}>
            Remove from newsstand
          </Button>
        </div>
      ) : null}
    </div>
  );
}
