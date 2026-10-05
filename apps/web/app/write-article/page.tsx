import type { Metadata } from "next";
import Link from "next/link";
import { AlignLeft, ArrowRight, Home, Star, User } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  CheckList,
  CtaBand,
  Eyebrow,
  FeatureCard,
  GradientText,
  ImagePlaceholder,
  MarketingHero,
  MarketingPage,
  MarketingSection,
  SectionHead,
  StepsGrid,
} from "@/components/marketing/marketing-ui";

export const metadata: Metadata = {
  title: "Write an Article",
  description:
    "This is your NewsSTAND. Own it. Tell a local story that matters — Sky helps you write it, and you earn credits as it spreads.",
};

const SUBMIT_HREF = "/personal-os/content";

const IDEAS = [
  "A local business that deserves more love",
  "What changed in your neighborhood this year",
  "The best teacher you ever had",
  "A volunteer story no one's told",
  "Why you opened your shop here",
  "A tradition only your community has",
  "Someone who deserves a shoutout",
  "A lesson your kid taught you",
];

export default function WriteArticlePage() {
  return (
    <MarketingPage>
      <MarketingHero
        eyebrow="SUBMIT AN ARTICLE"
        title={
          <>
            This is your <GradientText>NewsSTAND.</GradientText> Own it.
          </>
        }
        description="You don't have to be a journalist to tell a local story that matters. Parents, teachers, business owners, community advocates — this is your space. We'll even help you write it."
        actions={
          <>
            <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground">
              <Link href={SUBMIT_HREF}>
                Submit Your Story <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </>
        }
      />

      <MarketingSection tone="muted">
        <SectionHead eyebrow="EVERYONE HAS A STORY" title="Whoever you are, your neighborhood needs to hear this." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<User />}
            title="Parents"
            body={<>&ldquo;What I wish I&apos;d known before my kid started kindergarten here.&rdquo;</>}
          />
          <FeatureCard
            icon={<AlignLeft />}
            title="Teachers"
            body={<>&ldquo;The best teacher I ever had, and what she taught me.&rdquo;</>}
          />
          <FeatureCard
            icon={<Home />}
            title="Business Owners"
            body={<>&ldquo;Why I opened my shop here, and what keeps me going.&rdquo;</>}
          />
          <FeatureCard
            icon={<Star />}
            title="Community Advocates"
            body={<>&ldquo;The volunteer story nobody&apos;s told yet &mdash; until now.&rdquo;</>}
          />
        </div>
      </MarketingSection>

      <MarketingSection id="how-it-works" tone="inverse">
        <SectionHead inverse eyebrow="HOW IT WORKS" title="Simple enough to do on your lunch break." />
        <StepsGrid
          inverse
          steps={[
            {
              title: "Tell us your idea",
              body: "A few sentences about the story you want to tell — that's it to get started.",
            },
            {
              title: "Sky helps you write it",
              body: "Not a writer? AskSKY! turns your idea into a real article, in your own voice.",
            },
            {
              title: "It goes live on your NewsSTAND",
              body: "Published under your name, for your neighbors to actually find and read.",
            },
            {
              title: "Earn credits as it spreads",
              body: "Every read and every share puts credits in your pocket — see below.",
            },
          ]}
        />
      </MarketingSection>

      <MarketingSection>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <ImagePlaceholder
            label="WRITER PHOTO"
            spec="4:5 · a real local parent/teacher/business owner smiling at their phone, candid, everyday setting"
            className="aspect-[4/5]"
          />
          <div>
            <Eyebrow className="mb-3">GET PAID IN CREDITS</Eyebrow>
            <h2 className="mb-6 font-serif text-3xl sm:text-4xl">Your story has value. Literally.</h2>
            <CheckList
              items={[
                <>
                  <b className="text-foreground">Earn myCREDITS every time someone reads your article</b> &mdash; the
                  more neighbors it reaches, the more you earn.
                </>,
                <>
                  <b className="text-foreground">Earn more when people share it</b> &mdash; every share that sends new
                  readers your way adds to your balance.
                </>,
                <>
                  <b className="text-foreground">Credits never expire</b> &mdash; stack them up and spend them whenever
                  you&apos;re ready.
                </>,
                <>
                  <b className="text-foreground">Spend them on AI usage or advertising</b> &mdash; boost your own
                  business, or just keep writing for free.
                </>,
              ]}
            />
            <p className="mt-6 justmy-corners bg-accent px-4 py-3 text-sm text-accent-foreground">
              Exact credit amounts per read/share are still being finalized &mdash; this page will get the real numbers
              once that&apos;s locked in.
            </p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection tone="muted">
        <SectionHead
          eyebrow="STUCK ON WHAT TO WRITE?"
          title="Here's some ideas to get you going."
          description="Pick one, or just tell Sky your own — she'll help shape it either way."
        />
        <div className="flex flex-wrap justify-center gap-3">
          {IDEAS.map((idea) => (
            <Link
              key={idea}
              href={SUBMIT_HREF}
              className="rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-card transition-colors hover:border-primary/30 hover:bg-secondary"
            >
              {idea}
            </Link>
          ))}
        </div>
      </MarketingSection>

      <CtaBand
        id="submit"
        title="Your NewsSTAND is waiting."
        description="Share your story, let Sky help you write it, and start earning credits as your neighbors read and share it."
        actions={
          <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground">
            <Link href={SUBMIT_HREF}>Submit Your Story</Link>
          </Button>
        }
      />
    </MarketingPage>
  );
}
