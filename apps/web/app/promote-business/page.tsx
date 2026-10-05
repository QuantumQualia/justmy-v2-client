import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  CheckList,
  CtaBand,
  GradientText,
  ImagePlaceholder,
  MarketingHero,
  MarketingPage,
  MarketingSection,
  SectionHead,
  StatStrip,
  TierCard,
} from "@/components/marketing/marketing-ui";

export const metadata: Metadata = {
  title: "Promote Your Business",
  description:
    "Biz OS gets your business found by neighbors, by Sky, and by every AI that comes next — and it's free, starting today.",
};

const GET_STARTED_HREF = "/try-free?for=business";
const PRICING_HREF = "/biz-os/pricing";

export default function PromoteBusinessPage() {
  return (
    <MarketingPage>
      <MarketingHero
        eyebrow="PROMOTE YOUR BUSINESS"
        title={
          <>
            If AI doesn&apos;t know you exist, <GradientText>neither does anyone else.</GradientText>
          </>
        }
        description="Biz OS gets your business found by neighbors, by Sky, and by every AI that comes next — and it's free, starting today."
        actions={
          <>
            <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground">
              <Link href={GET_STARTED_HREF}>
                Get Started Free <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#paid-perks">See What&apos;s in Paid Plans</a>
            </Button>
          </>
        }
      >
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card. No contract. Upgrade only when you&apos;re ready.
        </p>
      </MarketingHero>

      <StatStrip
        stats={[
          { value: "4,000+", label: "Local businesses and nonprofits already on JustMy" },
          { value: "$0", label: "What Biz OS costs to get your business found, today" },
          { value: "Every ZIP", label: "Our goal: covering every zip code in the country" },
        ]}
      />

      <MarketingSection id="get-started">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="mb-4 inline-flex rounded-full bg-brand-gradient px-4 py-2 text-xs font-extrabold tracking-wide text-primary-foreground">
              100% FREE, NO CATCH
            </span>
            <h2 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
              Everything you need to get found, free from day one.
            </h2>
            <CheckList
              className="mb-8 mt-6 space-y-4 [&_li]:text-[15px]"
              items={[
                <>
                  <b className="text-foreground">A real business profile</b> on your local NewsSTAND, built to be
                  found &mdash; not buried in a directory.
                </>,
                <>
                  <b className="text-foreground">Claim your Dot</b> so AskSKY! can actually answer questions about
                  your business when neighbors ask her.
                </>,
                <>
                  <b className="text-foreground">Post updates, offers, and articles</b> whenever you want &mdash; no
                  publishing fees.
                </>,
                <>
                  <b className="text-foreground">Always-on banner placement</b> on your profile through myBANNER
                  &mdash; free reach, no credits spent.
                </>,
                <>
                  <b className="text-foreground">A free QR code</b> that sends customers straight to your profile
                  from flyers, menus, or your storefront window.
                </>,
                <>
                  <b className="text-foreground">Earn myCREDITS</b> just by referring people and engaging with your
                  community &mdash; spend them on AI usage or advertising.
                </>,
              ]}
            />
            <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground">
              <Link href={GET_STARTED_HREF}>Get Started Free</Link>
            </Button>
          </div>
          <ImagePlaceholder
            label="BUSINESS OWNER PHOTO"
            spec="4:5 · a real local business owner checking their profile on their phone, warm/candid, in their own shop"
            className="aspect-[4/5]"
          />
        </div>
      </MarketingSection>

      <MarketingSection id="paid-perks" tone="muted">
        <SectionHead
          eyebrow="READY TO GROW FASTER?"
          title="Free gets you found. Paid gets you growing."
          description="Start on Biz OS for as long as you want. When you're ready to do more with less effort, here's what's waiting."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <TierCard
            tag="COMMAND OS"
            title="Do more, yourself."
            body="Self-serve tools that put your marketing on autopilot, without hiring anyone new."
            items={[
              "SkyCAST — build your social calendar, Sky suggests posts, you publish with one click",
              "BattlePLANS — turn any goal into a checklist you can actually execute, with Sky's help",
              "Higher AskSKY! usage — no more hitting a free-tier limit mid-month",
              "Ad-free profile — your page, without anyone else's ads on it",
            ]}
            action={
              <Button asChild>
                <Link href={PRICING_HREF}>Ask About Command OS</Link>
              </Button>
            }
          />
          <TierCard
            featured
            tag="COMMAND PRO"
            title="Hand it to our team."
            body="Everything in Command OS, plus a real JustMy team member working your account."
            items={[
              "SkyCAST PRO — our team builds, creates, and publishes your content for you",
              "Hands-on myADS campaign management across streaming TV, social, and search",
              "Priority email support — real responses, same business day",
              "#FunCrew support for events, promotions, and campaigns",
            ]}
            action={
              <Button asChild className="bg-brand-gradient text-primary-foreground">
                <Link href={PRICING_HREF}>Talk to Our Team</Link>
              </Button>
            }
          />
        </div>
      </MarketingSection>

      <CtaBand
        title="Get found today. It's free."
        description="Set up your Biz OS profile in minutes, and upgrade whenever you're ready to grow faster."
        actions={
          <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground">
            <Link href={GET_STARTED_HREF}>Get Started Free</Link>
          </Button>
        }
      />
    </MarketingPage>
  );
}
