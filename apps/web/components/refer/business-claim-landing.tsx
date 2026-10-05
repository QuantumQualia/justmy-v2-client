"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Play, Users } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Progress } from "@workspace/ui/components/progress";
import { cn } from "@workspace/ui/lib/utils";

import { ImagePlaceholder } from "@/components/marketing/marketing-ui";
import { DotClaimModal } from "@/components/news/asksky/dot-claim-modal";
import type { BusinessClaimPreview } from "@/lib/services/referrals";

const PRICING_HREF = "/biz-os/pricing";

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

function recommendedBy(first: string | null, others: number) {
  if (!first) return null;
  if (others <= 0) return `Recommended by ${first}`;
  return `Recommended by ${first} + ${others} ${others === 1 ? "other" : "others"}`;
}

export function BusinessClaimLanding({ preview }: { preview: BusinessClaimPreview }) {
  const [open, setOpen] = useState(false);
  const { business, firstReferrer, otherReferrers } = preview;
  const referrerFirst = firstReferrer?.split(" ")[0] ?? null;
  const claimed = preview.status === "CLAIMED";
  const pill = recommendedBy(firstReferrer, otherReferrers);
  const location = [business.city, business.zipCode].filter(Boolean).join(" · ");

  const fields = [
    { label: "Business name", value: business.name },
    { label: "Phone", value: business.phone },
    { label: "Address", value: business.hasAddress ? "Added" : null },
    { label: "Hours", value: business.hasHours ? "Added" : null },
    { label: "Photo", value: business.photo ? "Added" : null },
    { label: "Your story", value: business.hasStory ? "Added" : null },
  ];
  const done = fields.filter((f) => f.value).length;
  const percent = Math.round((done / fields.length) * 100);

  const steps = [
    {
      title: "Confirm your business info",
      body: referrerFirst
        ? `Name${business.phone ? " and phone are" : " is"} in — thanks to ${referrerFirst}'s referral.`
        : "Make sure your name and phone are right.",
      done: Boolean(business.name && business.phone),
      action: "Confirm",
    },
    {
      title: "Add your address & hours",
      body: "So Sky can tell people exactly where and when to find you.",
      done: business.hasAddress && business.hasHours,
      action: "Add now",
    },
    {
      title: "Add a photo",
      body: "Profiles with a real photo get found — and trusted — faster.",
      done: Boolean(business.photo),
      action: "Add now",
    },
    {
      title: "Claim your Dot & turn on AskSKY!",
      body: "So Sky can actually answer when neighbors ask about you.",
      done: false,
      action: "Turn on",
    },
    {
      title: "Tell your story",
      body: "A few sentences in your own words — Sky can help you write it.",
      done: business.hasStory,
      action: "Write it",
    },
    {
      title: "Invite a teammate",
      body: "Share the login so your whole team can keep things current.",
      done: false,
      action: "Invite",
    },
  ];

  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="flex justify-end pt-5 text-sm">
          <Link href="/login" className="font-semibold text-muted-foreground hover:text-primary">
            Already claimed this business? Log in
          </Link>
        </div>

        <section className="grid items-center gap-6 py-10 md:grid-cols-[1.4fr_1fr]">
          <div className="justmy-corners-xl bg-foreground p-7 text-background shadow-card sm:p-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-gradient font-serif text-lg font-bold text-primary-foreground">
                S
              </span>
              <p className="font-bold leading-tight">
                Sky <span className="block text-xs font-medium text-background/60">JustMy&apos;s AI assistant</span>
              </p>
            </div>
            {pill ? (
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-background/15 px-4 py-1.5 text-sm font-bold">
                <Users className="size-4" aria-hidden /> {pill}
              </p>
            ) : null}
            {claimed ? (
              <p className="text-lg leading-relaxed">
                Good news &mdash; <b>{business.name}</b> has already been claimed. If that was you, log in to pick up
                where you left off.
              </p>
            ) : (
              <>
                <p className="mb-3 text-lg leading-relaxed">
                  Hi, {business.name}! 👋{" "}
                  {firstReferrer ? (
                    <>
                      <b>{firstReferrer}</b> recommended you
                    </>
                  ) : (
                    "A neighbor recommended you"
                  )}
                  , so I already started your free business card below.
                </p>
                <p className="text-base leading-relaxed text-background/80">
                  Looks like this is your first time here &mdash; want the 90-second tour before we finish setting you
                  up?
                </p>
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {claimed ? (
                <Button asChild className="rounded-full bg-background text-foreground hover:bg-background/90">
                  <Link href="/login">Log in</Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  className="rounded-full bg-background text-foreground hover:bg-background/90"
                  onClick={() => setOpen(true)}
                >
                  Claim {business.name} free <ArrowRight />
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-background/30 bg-background/5 text-background hover:bg-background/15 hover:text-background"
                disabled
              >
                <Play /> Watch Sky&apos;s Welcome (0:90)
              </Button>
            </div>
          </div>
          <ImagePlaceholder
            label="Welcome video"
            spec="Sky walks new businesses through their first week"
            className="min-h-56"
          />
        </section>

        {!claimed ? (
          <section className="pb-12">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-serif text-2xl">Your free business card</h2>
              <span className="text-sm font-bold text-muted-foreground">
                {done} of {fields.length} complete &middot; {percent}%
              </span>
            </div>
            <Progress value={percent} className="mb-6" aria-label="Business card completion" />

            <Card className="mb-6 gap-0 p-6 shadow-card">
              <div className="mb-5 flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center justmy-corners-sm bg-brand-gradient font-serif text-xl font-bold text-primary-foreground">
                  {initials(business.name)}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-serif text-xl">{business.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[location, firstReferrer ? `Added via referral from ${firstReferrer}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                {fields.map((field) => (
                  <div
                    key={field.label}
                    className="flex items-center justify-between gap-3 justmy-corners border border-border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {field.label}
                      </dt>
                      <dd className={cn("truncate text-sm", !field.value && "text-muted-foreground")}>
                        {field.value ?? "Not added yet"}
                      </dd>
                    </div>
                    {field.value ? (
                      <Check className="size-4 shrink-0 text-success" aria-label="Done" />
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-primary"
                        onClick={() => setOpen(true)}
                      >
                        + Add
                      </Button>
                    )}
                  </div>
                ))}
              </dl>
            </Card>

            <Card className="mb-6 gap-0 overflow-hidden py-0 shadow-card">
              <ol>
                {steps.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex items-center gap-4 border-t border-border px-5 py-4 first:border-t-0"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
                        step.done ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground",
                      )}
                    >
                      {step.done ? <Check className="size-4" aria-hidden /> : index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block">{step.title}</b>
                      <span className="text-sm text-muted-foreground">{step.body}</span>
                    </span>
                    {step.done ? (
                      <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
                        Done
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 rounded-full text-primary"
                        onClick={() => setOpen(true)}
                      >
                        {step.action} <ArrowRight />
                      </Button>
                    )}
                  </li>
                ))}
              </ol>
            </Card>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {[
                { title: "Get found", body: "A real profile on your city's NewsSTAND, not buried in a directory." },
                {
                  title: "AskSKY! is yours",
                  body: "Your own AI helper, answering questions about your business day or night.",
                },
                { title: "Free to start", body: "Biz OS costs nothing, for as long as you want it to." },
              ].map((item) => (
                <div key={item.title} className="justmy-corners-lg border border-border bg-card p-5">
                  <b className="mb-1 block">{item.title}</b>
                  <span className="text-sm leading-relaxed text-muted-foreground">{item.body}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 justmy-corners-xl bg-secondary p-6 sm:flex-row sm:items-center">
              <div className="flex-1">
                <h3 className="font-serif text-xl text-secondary-foreground">Ready to grow faster?</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Once your free card&apos;s complete, Command OS puts your marketing on autopilot &mdash; Sky can show
                  you what that looks like, whenever you&apos;re ready.
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <Link href={PRICING_HREF}>Ask Sky About Command OS</Link>
              </Button>
            </div>
          </section>
        ) : null}
      </div>

      <div className="bg-secondary/60">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 text-center sm:grid-cols-3 sm:px-6">
          {[
            { value: "4,000+", label: "Local businesses and nonprofits already on JustMy" },
            { value: "$0", label: "What it costs to get found, today" },
            { value: "Every ZIP", label: "Our goal: covering every zip code in the country" },
          ].map((stat) => (
            <div key={stat.value}>
              <p className="font-serif text-3xl text-secondary-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <DotClaimModal
        open={open}
        onOpenChange={setOpen}
        defaultBusinessName={business.name}
        defaultZip={business.zipCode ?? undefined}
        defaultWebsite={business.website ?? undefined}
        entryCategory="business"
        businessReferralToken={preview.token}
      />
    </main>
  );
}
