import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Check, PenLine, Share2, Store, UserPlus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";

import {
  CheckList,
  DraftBadge,
  Eyebrow,
  FeatureCard,
  GradientText,
  ImagePlaceholder,
  MarketingPage,
  MarketingSection,
  SectionHead,
} from "@/components/marketing/marketing-ui";
import { PrizeCard, type PrizeCardProps } from "@/components/prize-closet/prize-card";
import { formatPrizeDates, prizeClosetService } from "@/lib/services/prize-closet";

export const metadata: Metadata = {
  title: "The Prize Closet",
  description:
    "Every share, referral, and article you publish on JustMy is an entry. Businesses put up the prizes — and get featured citywide for doing it.",
};

const HERO_VIMEO_ID = "1133304253";
const SUBMIT_HREF = "/biz-os/prize-closet/new";
const GET_STARTED_HREF = "/try-free?for=business";
const RULES_HREF = "/prize-closet/official-rules";

const FALLBACK_PRIZE: Omit<PrizeCardProps, "action"> = {
  business: "Southern Grind Coffee Co.",
  title: "A year of free coffee, gift cards, and a few surprises.",
  blurb:
    "Southern Grind is this month's Win with Sky! prize partner — every qualifying entry during the contest window below is in the running.",
  imageUrl: "https://justmy.com/upload/images/6ac181613f8c7.png",
  period: "Jul 1 – Jul 30",
  value: "$450",
  market: "Memphis",
  winners: 1,
};

const RULES_SUMMARY = [
  "No purchase necessary to enter or win.",
  "Open to eligible JustMy users in the market(s) the contest runs in; employees and affiliates of JustMy and the sponsoring business are not eligible.",
  "Entry period and odds vary by contest; see the dates posted above for the current window.",
  "One winner is selected at random from all qualifying entries after the entry period closes, unless otherwise stated.",
  "Prize is non-transferable and cannot be redeemed for cash, unless JustMy states otherwise for a specific prize.",
  "Winners are notified directly and must respond by the stated deadline or the prize may be forfeited.",
  "By accepting a prize, winners agree to JustMy's use of their name and likeness in future promotion of the program.",
  "Prizes valued at $600 or more are reported to the winner for tax purposes as required by law.",
  "Void where prohibited. JustMy may modify or cancel a promotion if necessary.",
];

const PAST_WINNERS = [
  { name: "Marcus T.", prize: "Southern Grind coffee for a year" },
  { name: "Dana R.", prize: "Dinner for four, Overton Square" },
  { name: "Priya K.", prize: "Weekend car detail package" },
  { name: "The Okafor Family", prize: "Family photo session" },
];

async function loadCurrentPrize(): Promise<Omit<PrizeCardProps, "action">> {
  try {
    const live = await prizeClosetService.current();
    if (!live) return FALLBACK_PRIZE;
    return {
      business: live.businessName,
      title: live.title ?? live.description,
      blurb: live.blurb ?? live.description,
      imageUrl: live.imageUrl,
      period: formatPrizeDates(live.requestedStart, live.requestedEnd),
      value: `$${live.retailValue.toLocaleString("en-US")}`,
      market: live.scope === "NATIONAL" ? "All markets" : (live.marketName ?? "Your city"),
      winners: live.winners,
      redeemNote: live.redeemNote,
    };
  } catch {
    return FALLBACK_PRIZE;
  }
}

export default async function PrizeClosetPage() {
  const prize = await loadCurrentPrize();

  return (
    <MarketingPage>
      <section className="relative isolate flex min-h-[34rem] items-center overflow-hidden bg-foreground text-background">
        <iframe
          title=""
          aria-hidden
          tabIndex={-1}
          src={`https://player.vimeo.com/video/${HERO_VIMEO_ID}?background=1&autoplay=1&loop=1&muted=1&autopause=0`}
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-video min-h-full w-[177.78%] min-w-full -translate-x-1/2 -translate-y-1/2 border-0 motion-reduce:hidden"
          allow="autoplay; fullscreen"
        />
        <div className="absolute inset-0 -z-10 bg-foreground/65" />
        <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
          <Eyebrow className="mb-4 text-background/75">WIN WITH SKY!</Eyebrow>
          <h1 className="font-serif text-4xl leading-[1.08] tracking-tight sm:text-6xl">
            Welcome to <GradientText>The Prize Closet.</GradientText>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-background/80">
            Every share, referral, and article you publish on JustMy is an entry. Businesses put up the prizes &mdash;
            and get featured citywide for doing it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground">
              <a href="#current-prize">See This Month&apos;s Prize</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-background/40 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              <a href="#submit">Submit a Prize</a>
            </Button>
          </div>
        </div>
      </section>

      <MarketingSection id="current-prize" tone="muted">
        <SectionHead eyebrow="THIS MONTH'S PRIZE" title="What you could win right now." />
        <PrizeCard
          {...prize}
          action={
            <Button asChild>
              <a href="#how-to-enter">How to Enter</a>
            </Button>
          }
        />
      </MarketingSection>

      <MarketingSection id="how-to-enter">
        <SectionHead
          eyebrow="HOW TO ENTER"
          title="Every credit-earning action is an entry."
          description="You don't need to do anything extra — if you're earning credits on JustMy during the contest window, you're already entered."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <EnterCard
            icon={<Share2 />}
            title="Share on Social Media"
            body="Post any story or event from the NewsSTAND."
            rule="1 entry per distinct platform/page you share to — sharing the same post twice to the same page only counts once."
          />
          <EnterCard
            icon={<UserPlus />}
            title="Refer a Friend"
            body="Invite a friend to their own Personal OS."
            rule="1 entry per referral that actually signs up — not per invite sent."
          />
          <EnterCard
            icon={<Store />}
            title="Refer a Business"
            body="Know a business that needs to be found? Refer them."
            rule="1 entry per business that signs up and claims their Dot — no cap, more signups is always more entries."
          />
          <EnterCard
            icon={<PenLine />}
            title="Write an Article with Sky!"
            body="Got a story only you know? Sky helps you write it."
            rule="1 entry per published article."
          />
        </div>
      </MarketingSection>

      <MarketingSection tone="inverse">
        <SectionHead eyebrow="FOR BUSINESS OWNERS" title="Why businesses put up the prize." inverse />
        <div className="grid items-center gap-10 md:grid-cols-2">
          <ul className="space-y-5">
            {[
              "Featured on the JustMy homepage, with your own content and advertising banner, for the full contest window.",
              "Included in whatever advertising JustMy is running that month — TV, social, and more.",
              "A mention in Sky's daily morning briefing, every day the contest runs.",
              "Real local goodwill — your business becomes the reason someone's neighbor just won something.",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-base leading-relaxed text-background/85">
                <Check className="mt-1 size-5 shrink-0 text-background" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://justmy.com/upload/images/6ac181604e0ad.png"
            alt="Local business owner featured on JustMy"
            className="aspect-[4/3] w-full justmy-corners-xl object-cover"
          />
        </div>
      </MarketingSection>

      <MarketingSection>
        <SectionHead eyebrow="WHEN YOU SUBMIT A PRIZE" title="You pick the shape of the campaign." />
        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard
            title="Run it locally"
            body="The prize runs in your own market only — a fast, focused way to drive referrals and signups right where your customers are."
          />
          <FeatureCard
            title="Go national"
            body="Run the same prize across every JustMy market at once, for businesses with a presence (or ambitions) beyond one city."
          />
          <FeatureCard
            title="Partner campaign"
            body="Pair your prize with a bigger partnership JustMy is running — a national brand teaming up with a specific market for a joint promotion. Tell us the partner and the idea when you submit."
          />
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          You also suggest your preferred run dates when you submit &mdash; JustMy confirms the final schedule based on
          what&apos;s already on the calendar.
        </p>
      </MarketingSection>

      <MarketingSection tone="muted" innerClassName="max-w-3xl">
        <Card className="gap-0 p-8 sm:p-10">
          <DraftBadge className="mb-5 w-fit">DRAFT &mdash; pending attorney review, not final legal copy</DraftBadge>
          <h3 className="mb-5 font-serif text-2xl">Official Rules (summary)</h3>
          <CheckList items={RULES_SUMMARY} className="mb-8" />
          <Button asChild className="w-fit">
            <Link href={RULES_HREF}>Read Full Official Rules</Link>
          </Button>
        </Card>
      </MarketingSection>

      <MarketingSection>
        <SectionHead eyebrow="PAST WINNERS" title="Real neighbors, real prizes." />
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {PAST_WINNERS.map((winner) => (
            <div key={winner.name}>
              <ImagePlaceholder
                label="WINNER PHOTO"
                spec="1:1 · candid, holding/receiving the prize"
                className="aspect-square"
              />
              <p className="mt-3 font-bold">{winner.name}</p>
              <p className="text-sm text-muted-foreground">Won: {winner.prize}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <section id="submit" className="scroll-mt-20 px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-4xl justmy-corners-xl bg-foreground px-6 py-14 text-center text-background shadow-card sm:px-12">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">Want your business to be the prize?</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-background/70">
            Submitting a prize happens from your Biz OS dashboard &mdash; that&apos;s where you&apos;ll upload the prize
            photo, set its value, and pick your dates.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground">
              <Link href={SUBMIT_HREF}>Submit a Prize (Biz OS Dashboard)</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-background/40 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              <Link href={GET_STARTED_HREF}>Don&apos;t have Biz OS? Get Started Free</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}

function EnterCard({ icon, title, body, rule }: { icon: ReactNode; title: string; body: string; rule: string }) {
  return (
    <FeatureCard icon={icon} title={title} body={body}>
      <p className="mt-4 justmy-corners bg-secondary px-3.5 py-2.5 text-xs leading-relaxed text-secondary-foreground">
        {rule}
      </p>
    </FeatureCard>
  );
}
