import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, ListChecks, Megaphone, QrCode, Smile, Star } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  CtaBand,
  FeatureCard,
  GradientText,
  ImagePlaceholder,
  MarketingHero,
  MarketingPage,
  MarketingSection,
  SectionHead,
  StepsGrid,
  TierCard,
} from "@/components/marketing/marketing-ui";

export const metadata: Metadata = {
  title: "Promote Your Event",
  description:
    "Don't just list it. Launch it. JustMy gives you the OS tools to fill the room — copy, social promotion, paid reach, and a plan.",
};

const SUBMIT_HREF = "/try-free?for=business";
const PRICING_HREF = "/biz-os/pricing";

export default function PromoteEventPage() {
  return (
    <MarketingPage>
      <MarketingHero
        eyebrow="ADVERTISE YOUR EVENT"
        title={
          <>
            Don&apos;t just list it. <GradientText>Launch it.</GradientText>
          </>
        }
        description="Anyone can put an event on a calendar. JustMy gives you the OS tools to actually fill the room — copy, social promotion, paid reach, and a plan to execute it, all in one place."
        actions={
          <>
            <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground">
              <Link href={SUBMIT_HREF}>
                Submit Your Event Free <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </>
        }
      >
        <ImagePlaceholder
          label="EVENT CROWD PHOTO"
          spec="16:9 full-bleed · a lively local crowd, concert/festival/market energy, golden-hour or evening light, candid not posed"
          className="mt-12 aspect-video"
        />
      </MarketingHero>

      <MarketingSection id="more-than-a-listing" tone="muted">
        <SectionHead
          eyebrow="MORE THAN A LISTING"
          title="Your event gets the whole OS behind it."
          description="A listing gets you seen once. These tools work the whole run-up to your event — and keep working after it's over."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<CalendarDays />}
            title="Your Event, Featured"
            body={
              <>
                A real event page on your local NewsSTAND and in the events feed &mdash; not a buried listing. People
                browsing or asking Sky &ldquo;what&apos;s going on this weekend&rdquo; will find you.
              </>
            }
            tag="EVERY PLAN"
          />
          <FeatureCard
            icon={<Smile />}
            title="AskSKY! Writes Your Copy"
            body="Tell Sky what the event is and she drafts the listing description, a social caption, and an email blurb — so a blank page never stands between you and promoting it."
            tag="EVERY PLAN"
          />
          <FeatureCard
            icon={<ListChecks />}
            title="A BattlePLAN for Your Event"
            body="Sky turns your event into a checklist — flyers, vendor emails, volunteer asks, day-of logistics — with a place to actually execute each one, not just a to-do list you forget about."
            tag="COMMAND OS+"
          />
          <FeatureCard
            icon={<Megaphone />}
            title="SkyCAST Social Promotion"
            body="A countdown of posts leading up to your event, built and scheduled for you on your social calendar — so the lead-up actually builds momentum instead of one lonely post the day before."
            tag="COMMAND OS+"
          />
          <FeatureCard
            icon={<Star />}
            title="myADS Paid Reach"
            body="When you want more than organic reach, boost your event with paid placement across streaming TV, social, and search — funded by the same credits you already earn on JustMy."
            tag="ADD-ON, ANY PLAN"
          />
          <FeatureCard
            icon={<QrCode />}
            title="QR Codes & Check-In"
            body="A scannable code for flyers, posters, and print ads that sends people straight to your event page — or doubles as day-of check-in at the door."
            tag="EVERY PLAN"
          />
        </div>
      </MarketingSection>

      <MarketingSection id="how-it-works" tone="inverse">
        <SectionHead inverse eyebrow="HOW IT WORKS" title="From submission to sold out." />
        <StepsGrid
          inverse
          steps={[
            { title: "Submit your event", body: "Tell us the what, where, and when — takes a couple of minutes." },
            {
              title: "Sky builds your plan",
              body: "AskSKY! drafts your copy and, on Command OS and up, a BattlePLAN checklist for the whole run-up.",
            },
            {
              title: "Promote on autopilot",
              body: "Your event goes live on NewsSTAND, with SkyCAST posting the countdown and myADS ready if you want to boost it.",
            },
            {
              title: "Fill the room",
              body: "Track views, shares, and RSVPs from one dashboard, right up to doors-open.",
            },
          ]}
        />
      </MarketingSection>

      <MarketingSection id="plans">
        <SectionHead eyebrow="PICK YOUR LEVEL" title="Promote it yourself, or let our team run it." />
        <div className="grid gap-5 lg:grid-cols-3">
          <TierCard
            tag="FREE LISTING"
            title="Biz OS"
            body="Get your event seen. A featured event page, AskSKY! copywriting help, and a QR code for your flyers — free to start."
            items={["Featured event page & listing", "AskSKY! event copy", "QR code for flyers & check-in"]}
            action={
              <Button asChild>
                <Link href={SUBMIT_HREF}>Submit Your Event Free</Link>
              </Button>
            }
          />
          <TierCard
            featured
            tag="SELF-SERVE PROMOTION"
            title="Command OS"
            body="Build the momentum yourself. A full BattlePLAN checklist and a SkyCAST countdown of social posts, built for you and ready to schedule."
            items={["Everything in Biz OS", "Event BattlePLAN checklist", "SkyCAST social countdown"]}
            action={
              <Button asChild className="bg-brand-gradient text-primary-foreground">
                <Link href={PRICING_HREF}>Upgrade to Command OS</Link>
              </Button>
            }
          />
          <TierCard
            tag="WE RUN IT FOR YOU"
            title="Command PRO"
            body="Hand it to our team. The JustMy #FunCrew builds your BattlePLAN, posts your SkyCAST calendar, and helps manage your myADS boost — so you focus on the event itself."
            items={[
              "Everything in Command OS",
              "JustMy team builds & posts for you",
              "Hands-on myADS campaign help",
            ]}
            action={
              <Button asChild>
                <Link href={PRICING_HREF}>Talk to Our Team</Link>
              </Button>
            }
          />
        </div>
      </MarketingSection>

      <CtaBand
        id="submit"
        title="Let's fill the room."
        description="Submit your event free, or jump straight to the OS tools that'll help you promote it right."
        actions={
          <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground">
            <Link href={SUBMIT_HREF}>Submit Your Event Free</Link>
          </Button>
        }
      />
    </MarketingPage>
  );
}
