import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { AskSkyTextCard } from "@/components/asksky/asksky-text-card";
import {
  CtaBand,
  Eyebrow,
  GradientText,
  MarketingHero,
  MarketingPage,
  MarketingSection,
  SectionHead,
  StatStrip,
  TierCard,
} from "@/components/marketing/marketing-ui";

export const metadata: Metadata = {
  title: "Nonprofit Support",
  description:
    "Biz OS, Command OS, and Command PRO are now open to nonprofits everywhere. With JustMy, you are Never Alone.",
};

const GET_STARTED_HREF = "/try-free?for=nonprofit";
const PRICING_HREF = "/biz-os/pricing";

export default function NonprofitsPage() {
  return (
    <MarketingPage>
      <MarketingHero
        eyebrow="FOR NONPROFITS"
        title={
          <>
            With JustMy, you are <GradientText>Never Alone.</GradientText>
          </>
        }
        description="New tools built for organizations on a mission — Biz OS, Command OS, and Command PRO are now open to nonprofits everywhere, not just here at home."
        actions={
          <>
            <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground">
              <a href="#os-tiers">
                See Your Options <ArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#letter">Read JR&apos;s Letter</a>
            </Button>
          </>
        }
      />

      <StatStrip
        stats={[
          { value: "$5M+", label: "Raised by nonprofits in Memphis, our home market" },
          { value: "4,000+", label: "Local businesses and nonprofits we've already worked with" },
          { value: "Every ZIP", label: "Our goal: every nonprofit in the country, not just ours" },
        ]}
      />

      <MarketingSection id="letter">
        <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Image
            src="/images/justmy-ceo.png"
            alt="JR Robinson, CEO and Co-Founder of JustMy"
            width={800}
            height={1000}
            className="aspect-[4/5] w-full justmy-corners-xl object-cover shadow-card"
            priority
          />
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <Eyebrow>A MESSAGE FROM OUR CEO &amp; CO-FOUNDER</Eyebrow>
            <p className="font-serif text-2xl leading-snug text-foreground">
              Nonprofits don&apos;t fail because the mission isn&apos;t worth it. They struggle because no one built the
              tools to help them thrive while they chase it.
            </p>
            <p>
              When we started JustMy here in Memphis, we set out to give every person, business, and community the
              tools to be found, heard, and thrive &mdash; and that always included the nonprofits doing the hardest,
              most important work in our city. Together, we&apos;ve helped Memphis-area nonprofits raise over $5
              million. That number means more to me than almost anything else we&apos;ve built.
            </p>
            <p>Now we want to do this for every nonprofit in the country.</p>
            <p>
              That&apos;s why we&apos;re opening up Biz OS, Command OS, and Command PRO to nonprofit organizations
              everywhere &mdash; not just here at home. These tools will help you with the things you need to do every
              single day to reach your mission, while actually thriving as an organization: getting found by the
              people you&apos;re trying to serve, telling your story, managing your donors and volunteers, and running
              your operations without burning out your team.
            </p>
            <p>
              And we aren&apos;t done yet. JustMy will keep building more apps specifically for organizations like
              yours, because your work doesn&apos;t stop, and neither will we.
            </p>
            <p>Let&apos;s grow together. With JustMy, you are Never Alone.</p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-brand-gradient text-sm font-extrabold text-primary-foreground">
                JR
              </span>
              <div>
                <p className="font-bold text-foreground">JR Robinson</p>
                <p className="text-sm">CEO &amp; Co-Founder, JustMy</p>
              </div>
            </div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection id="os-tiers" tone="muted">
        <SectionHead
          eyebrow="NEW FOR NONPROFITS"
          title="Three ways to get started."
          description="Whatever stage your organization is at, there's a JustMy OS built for it — and you can grow into the next one whenever you're ready."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <TierCard
            tag="GET FOUND"
            title="Biz OS"
            body="Your organization's home on JustMy — a public profile, your mission and programs front and center, and the local visibility every nonprofit needs to be found by the people you're trying to reach."
            items={[
              "A profile featured on your local NewsSTAND",
              "Post updates, events, and your story",
              "AskSKY! basics to help you get started",
            ]}
            action={
              <Button asChild>
                <Link href={GET_STARTED_HREF}>Get Started Free</Link>
              </Button>
            }
          />
          <TierCard
            featured
            tag="GROW YOUR REACH"
            title="Command OS"
            body="Self-serve tools to plan, schedule, and publish your organization's content and campaigns — built for teams who want to do more with the staff and volunteers they already have."
            items={[
              "Everything in Biz OS",
              "Social & content calendar tools",
              "AskSKY! for donor & volunteer communication",
            ]}
            action={
              <Button asChild className="bg-brand-gradient text-primary-foreground">
                <Link href={PRICING_HREF}>Ask About Nonprofit Pricing</Link>
              </Button>
            }
          />
          <TierCard
            tag="HANDS-ON SUPPORT"
            title="Command PRO"
            body="Our team becomes part of yours. Dedicated #FunCrew support to help with volunteers, donations, media and social content, and event planning — so your staff can stay focused on the mission."
            items={[
              "Everything in Command OS",
              "A real JustMy team member on your account",
              "Event planning & campaign support",
            ]}
            action={
              <Button asChild>
                <Link href={PRICING_HREF}>Talk to Our Team</Link>
              </Button>
            }
          />
        </div>
      </MarketingSection>

      <MarketingSection>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <SectionHead
            align="left"
            className="mb-0 sm:mb-0"
            eyebrow="ASK SKY"
            title="Questions? Just text Sky."
            description="Sky knows your local NewsSTAND — events, volunteer drives, and the businesses and nonprofits around you. Ask her anything, any time."
          />
          <AskSkyTextCard
            intro="Hey, I'm Sky - ask me anything about nonprofits, events, or what's going on nearby."
            sampleQuestion="Any volunteer events this weekend?"
            className="w-full max-w-md justify-self-center lg:justify-self-end"
          />
        </div>
      </MarketingSection>

      <MarketingSection innerClassName="max-w-3xl text-center">
        <h2 className="font-serif text-3xl sm:text-4xl">And we aren&apos;t done yet.</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          JustMy is building more apps specifically for organizations like yours &mdash; because your mission
          doesn&apos;t stand still, and neither will we. This is the start, not the finish line.
        </p>
      </MarketingSection>

      <CtaBand
        id="get-started"
        title={
          <>
            Let&apos;s grow together. <span className="text-background/70">You are Never Alone.</span>
          </>
        }
        description="Whether you're just getting started or ready for hands-on help, there's a place for your organization on JustMy today."
        actions={
          <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground">
            <Link href={GET_STARTED_HREF}>Get Started Free &mdash; Nonprofit Biz OS</Link>
          </Button>
        }
      />
    </MarketingPage>
  );
}
