"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Gift, Mail, MessageCircle, Share2 } from "lucide-react";
import { SiFacebook } from "react-icons/si";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";

import { openShare } from "@/components/common/share/share-store";
import { useReferrals } from "@/components/common/refer/use-referrals";
import { Eyebrow, StepsGrid } from "@/components/marketing/marketing-ui";
import { WinWithSky } from "@/components/news/home/win-with-sky";
import { InviteFriendDialog } from "@/components/refer/invite-friend-dialog";
import { apiRequest } from "@/lib/api-client";
import type { StoredAuthUser } from "@/lib/auth/session-user";
import { prizeClosetService, type PrizeSubmission } from "@/lib/services/prize-closet";
import { tokenStorage } from "@/lib/storage/token-storage";
import { useProfileStore } from "@/lib/store";

const REFERRER_CREDITS = 100;
const FRIEND_CREDITS = 50;

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function smsInviteBody(firstName: string, link: string) {
  return `${firstName || "A friend"} invited you to JustMy! Free local news + AI help from Sky. Join here: ${link}`;
}

export function ReferFriendPage() {
  const profile = useProfileStore((s) => s.data);
  const code = profile.referralCode?.trim() || "";
  const { referrals, total, page, totalPages, goToPage, isLoading } = useReferrals();
  const [firstName, setFirstName] = useState("");
  const [origin, setOrigin] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [prize, setPrize] = useState<PrizeSubmission | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    setFirstName(tokenStorage.getUserSync<StoredAuthUser>()?.firstName?.trim() ?? "");
    let cancelled = false;
    apiRequest<{ amount: number }>("credits/earned-this-month")
      .then((r) => !cancelled && setCredits(Number(r.amount) || 0))
      .catch(() => undefined);
    prizeClosetService
      .current()
      .then((p) => !cancelled && setPrize(p))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const link = code && origin ? `${origin}/r/${encodeURIComponent(code)}` : "";
  const marketId = Number(profile.markets?.[0]?.id) || undefined;

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function share() {
    if (!link) return;
    void openShare({
      title: "Join me on JustMy",
      description: "Your city's news, deals, and AI assistant Sky — all free. Join with my link and we both earn credits.",
      url: link,
      heading: "Share your invite",
    });
  }

  function shareFacebook() {
    if (!link) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      "_blank",
      "noopener,noreferrer,width=640,height=560"
    );
  }

  const greeting = firstName ? `${firstName}, ` : "";
  const headline =
    total > 0
      ? `${greeting}you've brought ${total} ${total === 1 ? "friend" : "friends"} to JustMy.`
      : `${greeting}your first referral is one text away.`;

  return (
    <main className="bg-background pb-0 text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/">
            <ArrowLeft /> Back to NewsSTAND
          </Link>
        </Button>

        <header className="mx-auto max-w-2xl pb-2 pt-8 text-center">
          <Eyebrow className="mb-3">WIN WITH SKY! &middot; REFER A FRIEND</Eyebrow>
          <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-5xl">
            Bring your people. Everybody wins.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Your friend gets their own free NewsSTAND &mdash; news, deals, and AskSKY! for their ZIP. You earn{" "}
            {REFERRER_CREDITS} credits and they start with {FRIEND_CREDITS} the moment they join.
          </p>
        </header>

        <section className="my-10 justmy-corners-xl bg-foreground p-6 text-background shadow-card sm:p-10">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-xl">
              {credits != null ? (
                <span className="mb-3 inline-block rounded-full bg-background/15 px-3.5 py-1.5 text-xs font-bold">
                  {credits} credits earned this month
                </span>
              ) : null}
              <h2 className="font-serif text-2xl">{headline}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-background/70">
                Every friend who joins earns you {REFERRER_CREDITS} credits
                {prize ? ` — and every referral is also an entry in the ${prize.businessName} giveaway.` : "."}
              </p>
            </div>
            {prize ? (
              <Link
                href="/prize-closet"
                className="flex items-center gap-3 justmy-corners-lg border border-background/15 bg-background/10 px-4 py-2.5 transition-colors hover:bg-background/15"
              >
                <span className="flex size-10 shrink-0 items-center justify-center justmy-corners-sm bg-brand-gradient text-primary-foreground">
                  <Gift className="size-5" aria-hidden />
                </span>
                <span>
                  <b className="block text-xs">This month&apos;s prize</b>
                  <span className="text-[11px] text-background/65">
                    {prize.businessName} &middot; {prize.title}
                  </span>
                </span>
              </Link>
            ) : null}
          </div>

          <div className="mb-5 flex flex-wrap gap-3">
            <Button type="button" onClick={share} disabled={!link} className="bg-background text-foreground hover:bg-background/90">
              <Share2 /> Share
            </Button>
            <InverseButton asLink={link ? `sms:?&body=${encodeURIComponent(smsInviteBody(firstName, link))}` : undefined}>
              <MessageCircle /> Text a Friend
            </InverseButton>
            <InverseButton onClick={() => setInviteOpen(true)} disabled={!profile.id}>
              <Mail /> Email
            </InverseButton>
            <InverseButton onClick={shareFacebook} disabled={!link}>
              <SiFacebook /> Facebook
            </InverseButton>
          </div>

          <div className="flex flex-col gap-3 justmy-corners-lg border border-background/15 bg-background/5 px-4 py-3.5 sm:flex-row sm:items-center">
            <span className="text-xs text-background/65">Your code</span>
            <span className="text-base font-extrabold tracking-[0.12em]">{code || "—"}</span>
            <span className="min-w-0 flex-1 break-all font-mono text-xs text-background/80 sm:truncate">
              {link || "Your link appears once your profile loads."}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={copyLink}
              disabled={!link}
              className="w-fit bg-background/15 text-background hover:bg-background/25 hover:text-background"
            >
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </section>

        <StepsGrid
          className="mb-14"
          steps={[
            { title: "Share your link", body: "Text it, post it, or hand someone your code — however's easiest." },
            {
              title: "They join free",
              body: "Your friend sets up their own Personal OS for their ZIP code in under a minute.",
            },
            {
              title: "You both earn credits",
              body: `${REFERRER_CREDITS} credits land in your wallet and ${FRIEND_CREDITS} in theirs — no waiting on anything.`,
            },
          ]}
        />

        <section className="mb-14">
          <h2 className="mb-4 font-serif text-2xl">People you referred</h2>
          <Card className="gap-0 overflow-hidden py-0">
            {isLoading && !referrals ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">Loading…</p>
            ) : referrals && referrals.length > 0 ? (
              <ul>
                {referrals.map((r) => (
                  <li key={r.id} className="flex items-center gap-3.5 border-t border-border px-5 py-4 first:border-t-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-extrabold text-secondary-foreground">
                      {initials(r.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{r.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Joined{" "}
                        {new Date(r.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </span>
                    <span className="hidden rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success sm:inline">
                      Joined
                    </span>
                    <span className="whitespace-nowrap text-sm font-extrabold text-primary">
                      +{REFERRER_CREDITS} credits
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="font-bold">No one yet &mdash; be the first to invite someone.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The moment your first friend joins, you&apos;ll see {REFERRER_CREDITS} credits land right here.
                </p>
              </div>
            )}
          </Card>
          {totalPages > 1 ? (
            <div className="mt-3 flex items-center justify-end gap-2 text-sm text-muted-foreground">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                Previous
              </Button>
              <span>
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                Next
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      <WinWithSky market={{ marketId, zipcode: profile.zipCode ?? "", city: null }} current="friend" />

      <section className="mt-6 bg-foreground px-4 py-14 text-center text-background">
        <h2 className="font-serif text-2xl sm:text-3xl">Your city gets better every time it grows.</h2>
        <p className="mx-auto mb-6 mt-3 max-w-md text-sm leading-relaxed text-background/70">
          Every friend you bring in gets their own free NewsSTAND &mdash; and gets you both closer to this month&apos;s
          prize.
        </p>
        <Button size="lg" className="bg-brand-gradient text-primary-foreground" onClick={share} disabled={!link}>
          Share Your Link Now <ArrowRight />
        </Button>
      </section>

      <InviteFriendDialog open={inviteOpen} onOpenChange={setInviteOpen} profileId={profile.id} />
    </main>
  );
}

function InverseButton({
  children,
  onClick,
  disabled,
  asLink,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  asLink?: string;
}) {
  const className =
    "border-background/30 bg-background/5 text-background hover:bg-background/15 hover:text-background";
  if (asLink) {
    return (
      <Button asChild variant="outline" className={className}>
        <a href={asLink}>{children}</a>
      </Button>
    );
  }
  return (
    <Button type="button" variant="outline" className={className} onClick={onClick} disabled={disabled ?? !onClick}>
      {children}
    </Button>
  );
}
