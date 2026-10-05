"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Clock, Gift, Megaphone, Star } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

import {
  BizOsCard,
  BizOsEmpty,
  BizOsHeader,
  BizOsPage,
  BizOsSkeleton,
} from "@/components/biz-os/biz-os-ui";
import { useBizOsFetch } from "@/components/biz-os/use-biz-os-profile";
import { PrizeCard } from "@/components/prize-closet/prize-card";
import { PrizeStatusBadge } from "@/components/prize-closet/prize-status-badge";
import { formatPrizeDates, prizeClosetService, type PrizeSubmission } from "@/lib/services/prize-closet";

const EMPTY: PrizeSubmission[] = [];
const NEW_HREF = "/biz-os/prize-closet/new";

const WHY = [
  {
    icon: Gift,
    title: "Featured homepage placement",
    body: "Your business and content run on the JustMy homepage for the full contest window.",
  },
  {
    icon: Clock,
    title: "Daily mention in Sky's briefing",
    body: "Sky name-drops your prize in her morning briefing every day the contest runs.",
  },
  {
    icon: Megaphone,
    title: "Riding whatever JustMy runs",
    body: "Included in JustMy's own active advertising that month — TV, social, and more, at no extra cost.",
  },
  {
    icon: Star,
    title: "Real local goodwill",
    body: "You become the reason someone's neighbor just won something — that sticks.",
  },
];

export default function BizOsPrizeClosetPage() {
  const { data: submissions, pageReady } = useBizOsFetch((id) => prizeClosetService.mine(id), EMPTY);
  const [openId, setOpenId] = useState<number | null>(null);

  if (!pageReady) return <BizOsSkeleton lines={5} />;

  const open = submissions.find((s) => s.id === openId) ?? null;

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow="WIN WITH SKY!"
        title="The Prize Closet"
        description="Put your business up as this month's prize — get featured on the homepage, mentioned in Sky's daily briefing, and talked about for the right reasons."
        actions={
          <Button asChild className="bg-brand-gradient text-primary-foreground">
            <Link href={NEW_HREF}>
              Submit a New Prize <ArrowRight />
            </Link>
          </Button>
        }
      />

      <section className="justmy-corners-xl bg-foreground p-6 text-background shadow-card sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl">Why businesses keep putting up prizes.</h2>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-background/65">
              It&apos;s not a discount &mdash; it&apos;s free advertising with a built-in reason for people to pay
              attention.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-background/30 bg-background/10 text-background hover:bg-background/15 hover:text-background"
          >
            <Link href="/prize-closet">See The Prize Closet Page</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map(({ icon: Icon, title, body }) => (
            <div key={title} className="justmy-corners-lg border border-background/10 bg-background/5 p-4">
              <span className="mb-2.5 inline-flex size-8 items-center justify-center justmy-corners-sm bg-background/10">
                <Icon className="size-4" aria-hidden />
              </span>
              <p className="text-sm font-bold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-background/65">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <div>
        <h2 className="mb-4 font-serif text-xl">Your Prize Submissions</h2>
        {submissions.length === 0 ? (
          <BizOsEmpty
            title="Your Prize Closet is empty — let's fix that."
            body="Businesses who put up a prize get featured on the homepage and mentioned daily in Sky's briefing for the whole run. It takes a few minutes to submit."
            action={
              <Button asChild>
                <Link href={NEW_HREF}>Submit Your First Prize</Link>
              </Button>
            }
          />
        ) : (
          <BizOsCard padded={false} className="overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead className="hidden bg-secondary/70 text-left text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground md:table-header-group">
                <tr>
                  <th className="px-5 py-3.5">Prize</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Run Dates</th>
                  <th className="px-5 py-3.5">Entries</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => {
                  const confirmed = s.status === "APPROVED" || s.status === "LIVE" || s.status === "COMPLETED";
                  const dates = formatPrizeDates(s.requestedStart, s.requestedEnd);
                  return (
                    <tr
                      key={s.id}
                      className="block border-t border-border px-5 py-3 first:border-t-0 md:table-row md:p-0"
                    >
                      <td className="block py-1 md:table-cell md:px-5 md:py-4">
                        <p className="font-bold">{s.title || s.description}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          ${s.retailValue.toLocaleString("en-US")} ARV &middot; {s.winners}{" "}
                          {s.winners === 1 ? "winner" : "winners"}
                        </p>
                      </td>
                      <td className="block py-1 md:table-cell md:px-5 md:py-4">
                        <PrizeStatusBadge status={s.status} />
                      </td>
                      <td className="block py-1 md:table-cell md:px-5 md:py-4">
                        {confirmed ? dates : `Requested: ${dates}`}
                      </td>
                      <td className="block py-1 md:table-cell md:px-5 md:py-4">
                        {s.status === "LIVE" || s.status === "COMPLETED"
                          ? s.entries.toLocaleString("en-US")
                          : "—"}
                      </td>
                      <td className="block py-1 md:table-cell md:px-5 md:py-4 md:text-right">
                        {s.status === "CHANGES" ? (
                          <Button asChild variant="link" size="sm" className="px-0">
                            <Link href={`${NEW_HREF}?from=${s.id}`}>Fix &amp; Resubmit &rarr;</Link>
                          </Button>
                        ) : (
                          <Button
                            variant="link"
                            size="sm"
                            className="px-0"
                            aria-expanded={openId === s.id}
                            onClick={() => setOpenId(openId === s.id ? null : s.id)}
                          >
                            {openId === s.id ? "Hide" : s.status === "COMPLETED" ? "View Results" : "View"} &rarr;
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </BizOsCard>
        )}
      </div>

      {open ? (
        <div className="space-y-3">
          {open.reviewNotes ? (
            <BizOsCard className="border-primary/30 bg-secondary/50 text-sm">
              <b>Notes from JustMy:</b> {open.reviewNotes}
            </BizOsCard>
          ) : null}
          <PrizeCard
            business={open.businessName}
            title={open.title || open.description}
            blurb={open.blurb || open.description}
            imageUrl={open.imageUrl}
            period={formatPrizeDates(open.requestedStart, open.requestedEnd)}
            value={`$${open.retailValue.toLocaleString("en-US")}`}
            market={open.scope === "NATIONAL" ? "All markets" : (open.marketName ?? "Your market")}
            winners={open.winners}
            redeemNote={open.redeemNote}
          />
        </div>
      ) : null}
    </BizOsPage>
  );
}
