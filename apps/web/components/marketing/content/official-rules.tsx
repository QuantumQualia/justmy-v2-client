import Link from "next/link";
import { LegalNote, LegalSection, type LegalJumpLink } from "@/components/marketing/legal-page";

export const OFFICIAL_RULES_JUMP: LegalJumpLink[] = [
  { id: "sponsor", label: "Sponsor" },
  { id: "no-purchase", label: "No Purchase Necessary" },
  { id: "eligibility", label: "Eligibility" },
  { id: "entry-period", label: "Entry Period" },
  { id: "how-to-enter", label: "How to Enter" },
  { id: "amoe", label: "Mail-In Entry" },
  { id: "prizes", label: "Prizes" },
  { id: "odds", label: "Odds" },
  { id: "winner", label: "Winner Selection" },
  { id: "prize-conditions", label: "Prize Conditions" },
  { id: "taxes", label: "Taxes" },
  { id: "publicity", label: "Publicity" },
  { id: "general", label: "General Conditions" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "privacy", label: "Privacy" },
  { id: "disputes", label: "Disputes & Governing Law" },
  { id: "winners-list", label: "Winners List" },
];

export function OfficialRulesSections() {
  return (
    <>
      <LegalSection id="sponsor" title="Sponsor and Administrator">
        <p>
          Each Win with Sky! Prize Closet promotion (each, a &ldquo;Promotion&rdquo;) is administered by JustMyCities,
          Inc. (&ldquo;JustMy&rdquo;), together with the participating business that provides the prize for that
          Promotion (the &ldquo;Prize Sponsor&rdquo;). JustMy and the Prize Sponsor are referred to together as the
          &ldquo;Sponsors.&rdquo; The Prize Sponsor for the current Promotion is named on{" "}
          <Link href="/prize-closet">The Prize Closet</Link> page.
        </p>
        <p>
          These Official Rules apply to every Promotion unless a specific Promotion posts additional or different terms,
          in which case those terms control for that Promotion only.
        </p>
      </LegalSection>

      <LegalSection id="no-purchase" title="No Purchase Necessary">
        <p>
          NO PURCHASE OR PAYMENT OF ANY KIND IS NECESSARY TO ENTER OR WIN. A PURCHASE OR PAID PLAN WILL NOT INCREASE
          YOUR CHANCES OF WINNING. VOID WHERE PROHIBITED.
        </p>
        <p>
          You may enter by taking part in the credit-earning activities described under &ldquo;How to Enter,&rdquo; or
          by the free mail-in method described under &ldquo;Alternate Method of Entry.&rdquo; Both methods carry equal
          weight.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="Eligibility">
        <p>
          Each Promotion is open only to legal residents of the United States who are at least eighteen (18) years old
          (or the age of majority in their state of residence, if higher) at the time of entry, and who live in the
          JustMy market or markets in which that Promotion runs, as posted on The Prize Closet page.
        </p>
        <p>
          Employees, officers, and directors of JustMy and of the Prize Sponsor, their parent companies, affiliates,
          subsidiaries, advertising and promotion agencies, and the immediate family members (spouse, parents,
          siblings, and children) and household members of each of them, are not eligible.
        </p>
      </LegalSection>

      <LegalSection id="entry-period" title="Entry Period">
        <p>
          Each Promotion begins and ends on the dates posted for it on The Prize Closet page (the &ldquo;Entry
          Period&rdquo;). Unless otherwise stated, the Entry Period begins at 12:00:00 a.m. Central Time on the start
          date and ends at 11:59:59 p.m. Central Time on the end date. JustMy&apos;s computer is the official timekeeping
          device for every Promotion.
        </p>
        <LegalNote>
          <b>Pending attorney sign-off:</b> exact Entry Period dates and time zone for each market&apos;s Promotion
          are set per campaign and must be confirmed before that Promotion launches.
        </LegalNote>
      </LegalSection>

      <LegalSection id="how-to-enter" title="How to Enter">
        <p>
          During the Entry Period, eligible JustMy users automatically receive entries for the credit-earning actions
          below. You don&apos;t need to do anything extra &mdash; if you&apos;re earning credits on JustMy during the
          Entry Period, you&apos;re already entered.
        </p>
        <ul>
          <li>
            <b>Share on Social Media</b> &mdash; one (1) entry per distinct platform or page you share a NewsSTAND story
            or event to. Sharing the same post twice to the same page counts once.
          </li>
          <li>
            <b>Refer a Friend</b> &mdash; one (1) entry for each person you refer who actually signs up for JustMy with
            your link or code. Invites that don&apos;t result in a signup do not earn entries.
          </li>
          <li>
            <b>Refer a Business</b> &mdash; one (1) entry for each business you refer that signs up and claims its Dot.
            There is no cap on business-referral entries.
          </li>
          <li>
            <b>Write an Article with Sky!</b> &mdash; one (1) entry for each article you publish to the NewsSTAND during
            the Entry Period.
          </li>
        </ul>
        <p>
          Entries generated through automated means, fake accounts, self-referrals, or any other method JustMy
          determines to be fraudulent or abusive are void, and the accounts involved may be disqualified.
        </p>
      </LegalSection>

      <LegalSection id="amoe" title="Alternate Method of Entry">
        <p>
          To enter without using the JustMy app, posting on social media, or referring anyone, hand-print your full
          name, mailing address, email address, phone number, date of birth, and the name of the Promotion you are
          entering on a 3&quot; &times; 5&quot; card, and mail it in a stamped envelope to:
        </p>
        <p>
          <b>
            Win with Sky! Prize Closet &mdash; Mail-In Entry
            <br />
            JustMyCities, Inc.
            <br />
            [Street Address]
            <br />
            Memphis, TN [ZIP]
          </b>
        </p>
        <p>
          Limit one (1) mail-in entry per person per envelope, per day, for each Promotion. Mail-in entries must be
          postmarked during the Entry Period and received within seven (7) days after it ends. Each valid mail-in entry
          receives the same number of entries as the single highest-earning online action above. Mechanically
          reproduced, illegible, incomplete, or late entries are void. JustMy is not responsible for lost, late,
          misdirected, or postage-due mail.
        </p>
        <LegalNote>
          <b>Pending attorney sign-off:</b> the mailing address above is a placeholder. This free alternate method of
          entry is what keeps the Promotion a sweepstakes rather than a lottery &mdash; confirm the address, entry
          weighting, and per-person limits with counsel before launch.
        </LegalNote>
      </LegalSection>

      <LegalSection id="prizes" title="Prizes">
        <p>
          The prize for each Promotion, its approximate retail value (&ldquo;ARV&rdquo;), and the number of winners are
          posted on The Prize Closet page for that Promotion. ARV is determined by the Prize Sponsor in good faith at
          the time the Promotion is submitted; the actual value may vary, and any difference between ARV and actual
          value will not be awarded.
        </p>
        <p>
          Prizes are provided and fulfilled directly by the Prize Sponsor using the fulfillment method posted with the
          prize (for example, in-store pickup within a stated number of days). JustMy is not responsible for a Prize
          Sponsor&apos;s failure to fulfill a prize, but will make reasonable efforts to help the winner obtain it or a
          prize of comparable value.
        </p>
      </LegalSection>

      <LegalSection id="odds" title="Odds">
        <p>
          The odds of winning depend on the total number of eligible entries received during the Entry Period. Odds and
          the number of available prizes vary by Promotion.
        </p>
      </LegalSection>

      <LegalSection id="winner" title="Winner Selection and Notification">
        <p>
          Unless a Promotion states otherwise, one (1) winner per prize is selected in a random drawing from all
          eligible entries received during the Entry Period, conducted by JustMy within ten (10) business days after the
          Entry Period ends. JustMy&apos;s decisions are final and binding on all matters relating to the Promotion.
        </p>
        <p>
          Potential winners are notified directly using the email address or phone number on their JustMy account, or
          the contact information on their mail-in entry. A potential winner must respond by the deadline stated in the
          notification (no less than seventy-two (72) hours) and may be required to sign and return an affidavit of
          eligibility, liability release, and, where lawful, a publicity release. If a potential winner does not respond
          in time, cannot be reached, is found ineligible, or does not comply with these Official Rules, the prize may
          be forfeited and an alternate winner may be selected from the remaining eligible entries.
        </p>
      </LegalSection>

      <LegalSection id="prize-conditions" title="Prize Conditions">
        <ul>
          <li>
            Prizes are non-transferable and cannot be redeemed for cash or substituted, unless JustMy states otherwise
            for a specific prize.
          </li>
          <li>
            The Prize Sponsor may substitute a prize of equal or greater value if the advertised prize becomes
            unavailable.
          </li>
          <li>
            Any part of a prize not claimed or used by the redemption deadline posted with the prize is forfeited.
          </li>
          <li>Restrictions posted by the Prize Sponsor with the prize (for example, excluded sale items) apply.</li>
        </ul>
      </LegalSection>

      <LegalSection id="taxes" title="Taxes">
        <p>
          Winners are solely responsible for all federal, state, and local taxes on any prize. If the total value of
          prizes a winner receives from JustMy in a calendar year is $600 or more, the winner must provide a valid
          taxpayer identification number and will receive an IRS Form 1099 reporting that value, as required by law.
          A winner who does not provide the required tax information may forfeit the prize.
        </p>
      </LegalSection>

      <LegalSection id="publicity" title="Publicity">
        <p>
          Except where prohibited by law, by accepting a prize, each winner agrees that JustMy and the Prize Sponsor may
          use the winner&apos;s name, city, likeness, photograph, and statements about the Promotion for advertising and
          promotion of the Win with Sky! program, in any media, without further compensation, notice, or approval.
        </p>
      </LegalSection>

      <LegalSection id="general" title="General Conditions">
        <p>
          JustMy reserves the right to cancel, suspend, or modify any Promotion, or any part of it, if fraud, technical
          failure, or any other factor beyond JustMy&apos;s reasonable control impairs the integrity or proper
          functioning of the Promotion. In that event, JustMy may select winners from eligible entries received before
          the action was taken.
        </p>
        <p>
          JustMy may disqualify anyone it finds tampering with the entry process or the operation of a Promotion, acting
          in violation of these Official Rules or the <Link href="/terms">Terms of Service</Link>, or acting in an
          unsportsmanlike or disruptive manner. Each Promotion is void where prohibited or restricted by law.
        </p>
        <LegalNote>
          <b>Pending attorney sign-off:</b> some states (for example, Florida and New York) require registration and
          bonding for promotions above certain total prize values. Confirm any state registration requirements for each
          market before that Promotion launches.
        </LegalNote>
      </LegalSection>

      <LegalSection id="liability" title="Limitation of Liability and Release">
        <p>
          By entering, you agree to release and hold harmless JustMy, the Prize Sponsor, and their respective parents,
          affiliates, officers, directors, employees, and agents from any claims, losses, or damages arising out of your
          participation in a Promotion or the acceptance, use, or misuse of any prize. The Sponsors are not responsible
          for lost, late, incomplete, or misdirected entries, or for any technical malfunction of the JustMy app,
          network, or third-party platforms that affects entry.
        </p>
      </LegalSection>

      <LegalSection id="privacy" title="Privacy">
        <p>
          Information collected in connection with a Promotion is used as described in JustMy&apos;s{" "}
          <Link href="/privacy">Privacy Policy</Link>. Winner contact information is shared with the Prize Sponsor only
          as needed to fulfill the prize.
        </p>
      </LegalSection>

      <LegalSection id="disputes" title="Disputes and Governing Law">
        <p>
          These Official Rules and any dispute arising from a Promotion are governed by the laws of the State of
          Tennessee, U.S.A., excluding its conflict-of-law provisions. Consistent with the{" "}
          <Link href="/terms">Terms of Service</Link>, the proper venue for any dispute is the state and federal courts
          located in Shelby County, TN, and disputes are subject to the arbitration provisions set out there.
        </p>
      </LegalSection>

      <LegalSection id="winners-list" title="Winners List">
        <p>
          For the name of a Promotion&apos;s winner, send a self-addressed, stamped envelope within sixty (60) days after
          that Promotion&apos;s Entry Period ends to the mailing address in &ldquo;Alternate Method of Entry,&rdquo;
          marked &ldquo;Winners List&rdquo; and naming the Promotion.
        </p>
      </LegalSection>
    </>
  );
}
