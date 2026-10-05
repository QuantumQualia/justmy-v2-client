"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Sparkles, Store, Users } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";

import { Eyebrow, FeatureCard } from "@/components/marketing/marketing-ui";
import { ReferBusinessForm } from "@/components/news/home/refer-business-dialog";
import { WinWithSky } from "@/components/news/home/win-with-sky";
import { useProfileStore } from "@/lib/store";

export function ReferBusinessPage() {
  const profile = useProfileStore((s) => s.data);
  const marketId = Number(profile.markets?.[0]?.id) || undefined;
  const zip = profile.zipCode ?? "";

  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-full text-muted-foreground">
          <Link href="/">
            <ArrowLeft /> Back to NewsSTAND
          </Link>
        </Button>

        <div className="grid items-start gap-10 py-10 lg:grid-cols-[1.1fr_1fr]">
          <header className="max-w-xl">
            <Eyebrow className="mb-3">WIN WITH SKY! &middot; REFER A BUSINESS</Eyebrow>
            <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-5xl">
              Know a spot that should be on JustMy?
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Tell Sky about a local business you love. We&apos;ll start their free business card, reach out on your
              behalf, and you earn myCREDITS for speaking up.
            </p>
            <ul className="mt-8 space-y-4">
              <Outcome
                icon={<Sparkles />}
                title="New to JustMy: 100 myCREDITS"
                body="We open their free card and send a claim invite. Your credits land the moment they claim."
              />
              <Outcome
                icon={<Users />}
                title="Already invited: 50 myCREDITS now"
                body="Other neighbors asked too. Your name joins theirs on the next nudge — and you get 25 more when they claim."
              />
              <Outcome
                icon={<Store />}
                title="Already on JustMy: 50 myCREDITS"
                body="Thanks for vouching. Your credits are yours right away."
              />
            </ul>
          </header>

          <Card className="gap-0 p-6 shadow-card sm:p-8">
            <h2 className="mb-1 font-serif text-2xl">Recommend a business</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Add their email and Sky sends the invite for you. No email? We&apos;ll copy a claim link you can pass
              along.
            </p>
            <ReferBusinessForm marketId={marketId} defaultZip={zip} askZip submitLabel="Recommend this business" />
          </Card>
        </div>

        <section className="mb-14 grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="We do the asking"
            body="Sky emails the owner with a free, ready-to-claim card — and names every neighbor who recommended them."
          />
          <FeatureCard
            title="No spam, ever"
            body="One invite, and at most one gentle reminder every two weeks. Owners can unsubscribe in one click."
          />
          <FeatureCard
            title="Free for them"
            body="Biz OS costs nothing to claim, so you're handing a neighbor a real win, not a sales pitch."
          />
        </section>
      </div>

      <WinWithSky market={{ marketId, zipcode: zip, city: null }} current="business" />
    </main>
  );
}

function Outcome({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center justmy-corners-sm bg-accent text-primary [&_svg]:size-5">
        {icon}
      </span>
      <span>
        <b className="block">{title}</b>
        <span className="text-sm leading-relaxed text-muted-foreground">{body}</span>
      </span>
    </li>
  );
}
