"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { openShare } from "@/components/common/share/share-store";
import type { NewsMarketContext } from "@/components/news/asksky/types";
import { ReferBusinessDialog } from "@/components/news/home/refer-business-dialog";
import { REFER_FRIEND_HREF, WRITE_ARTICLE_HREF } from "@/components/news/home/links";
import { useNewsVisitor } from "@/components/news/home/use-news-visitor";
import { apiRequest } from "@/lib/api-client";
import { useNewsAuthUiStore } from "@/lib/store/news-auth-ui-store";
import { useProfileStore } from "@/lib/store/profile-store";
import { Button } from "@workspace/ui/components/button";

const ACTIONS = [
  {
    title: "Share on Social Media",
    body: "Share the NewsSTAND and earn credits every time someone taps through.",
  },
  {
    title: "Refer a Friend",
    body: "Invite a friend to their own personal OS — you both get credits the moment they join.",
  },
  {
    title: "Refer a Business",
    body: "Know a business that needs to be found? Refer them and earn credits when they claim their Dot.",
  },
  {
    title: "Write an Article with Sky!",
    body: "Got a story only you know? Sky helps you write it — and publishing earns you credits too.",
  },
] as const;

type WinAction = "share" | "friend" | "business" | "write";

export function WinWithSky({
  market,
  current,
}: {
  market: Pick<NewsMarketContext, "marketId" | "zipcode" | "city">;
  current?: WinAction;
}) {
  const { signedIn } = useNewsVisitor();
  const referralCode = useProfileStore((s) => s.data.referralCode);
  const setAuthOpen = useNewsAuthUiStore((s) => s.setAuthOpen);
  const [credits, setCredits] = useState<number | null>(null);
  const [referOpen, setReferOpen] = useState(false);

  useEffect(() => {
    if (!signedIn) {
      setCredits(null);
      return;
    }
    let cancelled = false;
    apiRequest<{ amount: number }>("credits/earned-this-month")
      .then((result) => {
        if (!cancelled) setCredits(Number(result.amount) || 0);
      })
      .catch(() => {
        if (!cancelled) setCredits(null);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  async function shareHomepage() {
    const url = new URL(window.location.href);
    url.searchParams.delete("claim");
    if (referralCode?.trim()) url.searchParams.set("ref", referralCode.trim());
    await openShare({
      title: "NewsSTAND",
      description: "Local news, deals, and AskSKY! for your city — free on JustMy.",
      url: url.toString(),
      heading: "Share the NewsSTAND",
    });
  }

  function onReferBusiness() {
    if (!signedIn) {
      setAuthOpen(true);
      return;
    }
    setReferOpen(true);
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-3 pb-12 sm:px-6">
      <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">Win with Sky!</h2>
      <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-[16rem_1fr]">
        <div className="flex min-h-72 flex-col justify-end justmy-corners-lg bg-foreground p-6 text-background shadow-card">
          <span className="mb-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/15">
            <Play className="h-4 w-4" aria-hidden />
          </span>
          {signedIn && credits != null ? (
            <p className="mb-4 w-fit rounded-full bg-background/15 px-3 py-1 text-xs font-medium">
              {credits} credits earned this month
            </p>
          ) : null}
          <p className="text-lg font-semibold leading-snug">
            Every time you show up for your city, Sky shows up for you.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-background/80">
            Share a story, bring a friend, bring a business, or write with Sky — and rack up credits toward real prizes, every single week.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <ActionBlock
            title={ACTIONS[0].title}
            body={ACTIONS[0].body}
            onClick={shareHomepage}
            current={current === "share"}
          />
          <ActionBlock
            title={ACTIONS[1].title}
            body={ACTIONS[1].body}
            href={REFER_FRIEND_HREF}
            current={current === "friend"}
          />
          <ActionBlock
            title={ACTIONS[2].title}
            body={ACTIONS[2].body}
            onClick={onReferBusiness}
            current={current === "business"}
          />
          <ActionBlock
            title={ACTIONS[3].title}
            body={ACTIONS[3].body}
            href={WRITE_ARTICLE_HREF}
            current={current === "write"}
          />
        </div>
      </div>

      <ReferBusinessDialog
        open={referOpen}
        onOpenChange={setReferOpen}
        marketId={market.marketId}
        defaultZip={market.zipcode}
        defaultCity={market.city || undefined}
      />
    </section>
  );
}

function ActionBlock({
  title,
  body,
  href,
  onClick,
  current = false,
}: {
  title: string;
  body: string;
  href?: string;
  onClick?: () => void;
  current?: boolean;
}) {
  const button = current ? (
    <div
      aria-current="page"
      className="relative flex h-14 w-full items-center justify-center rounded-full bg-brand-gradient text-base font-medium text-primary-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
    >
      {title}
      <span className="absolute -top-2.5 right-5 rounded-full bg-background px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-foreground shadow-card">
        YOU&apos;RE HERE
      </span>
    </div>
  ) : href ? (
    <Button asChild className="h-14 w-full bg-brand-gradient text-base text-primary-foreground">
      <Link href={href}>{title}</Link>
    </Button>
  ) : (
    <Button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="h-14 w-full bg-brand-gradient text-base text-primary-foreground"
    >
      {title}
    </Button>
  );

  return (
    <div>
      {button}
      <p className="mt-2 text-center text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
