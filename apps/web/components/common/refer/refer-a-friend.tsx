"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useProfileStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Copy, Check, UserPlus, Users } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { useReferrals } from "./use-referrals";

/** One referred profile (signed up using current profile's referral code). */
export interface ReferredProfile {
  id: string;
  name: string;
  slug: string;
  osName: string;
  joinedAt: string;
}

export function ReferAFriend() {
  const referralCode = useProfileStore((s) => s.data.referralCode);
  const {
    referrals,
    isLoading,
    error,
    page,
    total,
    totalPages,
    pageSize,
    goToPage,
  } = useReferrals();
  const [copied, setCopied] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState("");

  const columns = React.useMemo<ColumnDef<ReferredProfile>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Link
              href={`/${row.original.slug}`}
              className="font-medium text-emerald-300 hover:text-emerald-200 hover:underline"
            >
              {row.original.name}
            </Link>
            {row.original.osName && (
              <span className="text-xs text-white/60">{row.original.osName}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "joinedAt",
        header: "Joined",
        cell: ({ row }) => (
          <span className="text-white/70">
            {new Date(row.original.joinedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ),
      },
    ],
    []
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/register${referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ""}`;
    setShareUrl(url);
  }, [referralCode]);

  const codeToShow = referralCode || "—";
  const displayCode = referralCode ? referralCode : "No code yet";

  const handleCopyCode = React.useCallback(() => {
    if (!referralCode) return;
    void navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralCode]);

  const handleCopyLink = React.useCallback(() => {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  return (
    <div className="space-y-6">
      {/* Refer section: show code + copy / share */}
      <Card className="rounded-2xl rounded-br-none border border-white/15 bg-white/5 backdrop-blur-md overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
            <UserPlus className="size-5" />
            Your referral code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-mono text-lg font-semibold text-white tracking-wide"
              aria-label="Referral code"
            >
              {displayCode}
            </span>
            {referralCode && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2 border border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                {copied ? "Copied" : "Copy code"}
              </Button>
            )}
          </div>
          {shareUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-white/70">Share link:</span>
              <code className="max-w-full truncate rounded bg-white/10 px-2 py-1 text-sm text-white/90">
                {shareUrl}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 text-white/90 hover:bg-white/10 hover:text-white"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                Copy link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral list: people who signed up with this profile's code */}
      <Card className="rounded-2xl rounded-br-none border border-white/15 bg-white/5 backdrop-blur-md overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
            <Users className="size-5" />
            People you referred
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<ReferredProfile, unknown>
            columns={columns}
            data={referrals ?? []}
            loading={isLoading}
            error={error}
            total={total}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={goToPage}
            emptyMessage="No one has used your code yet. Share your link to get started."
          />
        </CardContent>
      </Card>
    </div>
  );
}
