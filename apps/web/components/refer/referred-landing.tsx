"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, Briefcase, Check, Heart, Home, Star } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { cn } from "@workspace/ui/lib/utils";

type Track = "personal" | "business" | "nonprofit";

type Pane = {
  quote: string;
  pillars: Array<{ tag: string; title: string; items: ReactNode[] }>;
  cta: { tag: string; title: string; body: string; fine: string };
  upsell?: Array<{ title: string; body: string }>;
};

const PICKER: Array<{ id: Track; icon: ReactNode; title: string; body: string }> = [
  { id: "personal", icon: <Home />, title: "I'm a local", body: "I want the news, deals, and events happening around me." },
  { id: "business", icon: <Briefcase />, title: "I run a business", body: "I want more customers to find and choose me." },
  {
    id: "nonprofit",
    icon: <Heart />,
    title: "I lead a nonprofit",
    body: "I want to reach more donors, volunteers, and neighbors.",
  },
];

const PANES: Record<Track, Pane> = {
  personal: {
    quote: "Personal OS is built for exactly this — your city, your life, one place. And it's free.",
    pillars: [
      {
        tag: "LOCAL EVERYTHING",
        title: "Your city, finally in one place.",
        items: [
          <>
            News, weather, traffic, and events for <b>your exact ZIP code</b>, every morning.
          </>,
          <>
            Ask Sky anything local &mdash; <b>&ldquo;where&apos;s good tacos tonight&rdquo;</b> or{" "}
            <b>&ldquo;when&apos;s the farmers market&rdquo;</b> &mdash; and get a real answer.
          </>,
          <>Win With Sky! &mdash; real local prizes from real local businesses, every month.</>,
        ],
      },
      {
        tag: "PRODUCTIVITY APPS",
        title: "Tools for your actual life.",
        items: [
          <>
            <b>myPLANS</b> &mdash; turn anything you&apos;re trying to do into a plan Sky helps you follow through on.
          </>,
          <>
            <b>myCREDITS</b> &mdash; earn credits just by referring friends, sharing stories, and showing up.
          </>,
          <>Write with Sky and publish your own stories to your city&apos;s NewsSTAND.</>,
        ],
      },
    ],
    cta: {
      tag: "PERSONAL OS · FREE",
      title: "Create my free Personal OS",
      body: "No credit card. No catch. Just your city, your tools, and Sky in your corner.",
      fine: "Takes under a minute",
    },
  },
  business: {
    quote: "Biz OS gets you found, free. When you're ready to grow faster, I'll show you what's next.",
    pillars: [
      {
        tag: "LOCAL EVERYTHING",
        title: "Be where your customers already are.",
        items: [
          <>A real profile on your city&apos;s NewsSTAND &mdash; not buried in a directory.</>,
          <>
            <b>Claim your Dot</b> so Sky can actually answer when neighbors ask about you.
          </>,
          <>Always-on reach through myBANNER &mdash; no credits spent, ever.</>,
        ],
      },
      {
        tag: "PRODUCTIVITY APPS",
        title: "Marketing that runs itself.",
        items: [
          <>
            <b>SkyCAST</b> builds your social calendar and suggests posts &mdash; you just click publish.
          </>,
          <>
            <b>BattlePLANS</b> turns any business goal into a checklist you&apos;ll actually finish.
          </>,
          <>Post updates and offers any time &mdash; no publishing fees, ever.</>,
        ],
      },
    ],
    cta: {
      tag: "BIZ OS · FREE, FOREVER",
      title: "Create my free Biz OS",
      body: "Everything above, free from day one. Upgrade only when you're ready.",
      fine: "No credit card required",
    },
    upsell: [
      {
        title: "Want it done for you?",
        body: "Command OS puts your marketing on autopilot — self-serve, whenever you're ready.",
      },
      {
        title: "Want our team on it?",
        body: "Command PRO hands your account to a real JustMy team member, including #FunCrew.",
      },
    ],
  },
  nonprofit: {
    quote: "JustMy has already helped Memphis nonprofits raise over $5 million. Let's do that for yours too.",
    pillars: [
      {
        tag: "LOCAL EVERYTHING",
        title: "Your mission, told where people already look.",
        items: [
          <>A real profile on your city&apos;s NewsSTAND, reaching donors and volunteers directly.</>,
          <>Sky can answer questions about your mission the moment someone asks.</>,
          <>Share your story and events with the whole community, free.</>,
        ],
      },
      {
        tag: "PRODUCTIVITY APPS",
        title: "Run your mission, not just your inbox.",
        items: [
          <>
            <b>BattlePLANS</b> turns your next campaign or event into a plan your whole team can follow.
          </>,
          <>
            Earn your way to <b>Command OS tools</b> as your reach and referrals grow &mdash; free the whole way.
          </>,
          <>With JustMy, your organization is never alone in telling its story.</>,
        ],
      },
    ],
    cta: {
      tag: "BIZ OS FOR NONPROFITS · FREE",
      title: "Get my nonprofit's free Biz OS",
      body: "Free to start, with a clear path to more as your organization grows.",
      fine: "No credit card required",
    },
  },
};

export function ReferredLanding({
  code,
  referrerName,
  referrerFirstName,
}: {
  code: string;
  referrerName: string | null;
  referrerFirstName: string | null;
}) {
  const [track, setTrack] = useState<Track>("personal");
  const pane = PANES[track];
  const startHref = `/try-free?for=${track}&ref=${encodeURIComponent(code)}`;
  const friend = referrerFirstName || "your friend";

  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="flex justify-end pt-5 text-sm">
          <Link href="/login" className="font-semibold text-muted-foreground hover:text-primary">
            Already have an account? Log in
          </Link>
        </div>

        <section className="mx-auto max-w-3xl py-10">
          <div className="justmy-corners-xl bg-foreground p-7 text-background shadow-card sm:p-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-gradient font-serif text-lg font-bold text-primary-foreground">
                S
              </span>
              <p className="font-bold leading-tight">
                Sky <span className="block text-xs font-medium text-background/60">JustMy&apos;s AI assistant</span>
              </p>
            </div>
            <p className="mb-3 text-lg leading-relaxed">
              Hi! 👋 {referrerName ? <b>{referrerName}</b> : "A friend"} thought you&apos;d love it here, so they sent
              you your own invite to JustMy.
            </p>
            <p className="text-base leading-relaxed text-background/80">
              I&apos;m Sky &mdash; think of me as your local guide. My job is to get you set up with exactly what you
              need, in about a minute. The moment you join, you and {friend} both earn credits.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-background/15 px-4 py-2 text-sm font-bold">
              <Star className="size-4" aria-hidden /> You&apos;ll start with 50 myCREDITS the moment you join
            </p>
            <p className="mt-6 font-serif text-xl">So &mdash; what brings you here today?</p>
          </div>
        </section>

        <RadioGroup
          value={track}
          onValueChange={(v) => setTrack(v as Track)}
          aria-label="What brings you here?"
          className="mb-10 grid gap-4 sm:grid-cols-3"
        >
          {PICKER.map((option) => (
            <label
              key={option.id}
              className={cn(
                "relative flex cursor-pointer flex-col justmy-corners-xl border-2 bg-card p-5 shadow-card transition-colors hover:border-primary/30 hover:bg-secondary",
                track === option.id ? "border-primary bg-secondary" : "border-border"
              )}
            >
              <RadioGroupItem value={option.id} className="absolute right-4 top-4" />
              <span className="mb-3 inline-flex size-10 items-center justify-center justmy-corners-sm bg-accent text-primary [&_svg]:size-5">
                {option.icon}
              </span>
              <b className="mb-1">{option.title}</b>
              <span className="text-sm leading-relaxed text-muted-foreground">{option.body}</span>
            </label>
          ))}
        </RadioGroup>

        <section aria-live="polite" className="pb-12">
          <p className="mx-auto mb-8 max-w-2xl text-center font-serif text-xl italic leading-relaxed sm:text-2xl">
            &ldquo;{pane.quote}&rdquo;
          </p>
          <div className="mb-6 grid gap-5 md:grid-cols-2">
            {pane.pillars.map((pillar) => (
              <Card key={pillar.title} className="gap-0 p-6">
                <span className="mb-3 w-fit rounded-full bg-secondary px-3 py-1 text-[11px] font-extrabold tracking-wide text-secondary-foreground">
                  {pillar.tag}
                </span>
                <h3 className="mb-4 font-serif text-xl">{pillar.title}</h3>
                <ul className="space-y-3">
                  {pillar.items.map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-6 justmy-corners-xl bg-foreground p-7 text-background shadow-card md:flex-row md:items-center">
            <div className="flex-1">
              <span className="mb-3 inline-block rounded-full bg-background/15 px-3 py-1 text-[11px] font-extrabold tracking-wide">
                {pane.cta.tag}
              </span>
              <h3 className="mb-1.5 font-serif text-2xl">{pane.cta.title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-background/75">{pane.cta.body}</p>
            </div>
            <div className="md:text-center">
              <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
                <Link href={startHref}>
                  Get Started Free <ArrowRight />
                </Link>
              </Button>
              <p className="mt-2 text-xs text-background/60">{pane.cta.fine}</p>
            </div>
          </div>

          {pane.upsell ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {pane.upsell.map((chip) => (
                <div key={chip.title} className="justmy-corners-lg border border-border bg-card p-5">
                  <b className="mb-1 block text-sm">{chip.title}</b>
                  <span className="text-sm leading-relaxed text-muted-foreground">{chip.body}</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <div className="bg-secondary/60">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 text-center sm:grid-cols-3 sm:px-6">
          {[
            { value: "4,000+", label: "Local businesses and nonprofits already on JustMy" },
            { value: "$5M+", label: "Raised by nonprofits on JustMy, in Memphis alone" },
            { value: "Every ZIP", label: "Our goal: covering every zip code in the country" },
          ].map((stat) => (
            <div key={stat.value}>
              <p className="font-serif text-3xl text-secondary-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
