import { LegalNote, LegalSection, LegalTable, type LegalJumpLink } from "@/components/marketing/legal-page";

export const PRIVACY_JUMP: LegalJumpLink[] = [
  {
    id: "collect",
    label: "Information We Collect",
  },
  {
    id: "use",
    label: "How We Use It",
  },
  {
    id: "ai",
    label: "AI Features & AskSKY!",
  },
  {
    id: "share",
    label: "How We Share It",
  },
  {
    id: "cookies",
    label: "Cookies & Advertising",
  },
  {
    id: "apps",
    label: "Mobile Apps",
  },
  {
    id: "retention",
    label: "Retention",
  },
  {
    id: "choices",
    label: "Your Choices & Rights",
  },
  {
    id: "children",
    label: "Children's Privacy",
  },
  {
    id: "security",
    label: "Security",
  },
  {
    id: "transfers",
    label: "International Users",
  },
  {
    id: "links",
    label: "Third-Party Links",
  },
  {
    id: "changes",
    label: "Changes",
  },
  {
    id: "contact",
    label: "Contact Us",
  },
];

export function PrivacySections() {
  return (
    <>
      <LegalSection id="collect" title={<>Information We Collect</>}>
        <p>
          We collect information in a few different ways: what you give us directly, what we collect automatically as
          you use the Service, and what we receive from other sources.
        </p>
        <h3>Information you give us</h3>
        <ul>
          <li>
            <b>Account &amp; profile information</b> &mdash; name, email address, phone number, password, and, for a
            business or organization profile, your business name, address, category, and the content you add to it.
          </li>
          <li>
            <b>Content you submit</b> &mdash; articles, comments, photos, prize submissions, event listings, and
            anything else you post, upload, or publish through the Service.
          </li>
          <li>
            <b>Payment information</b> &mdash; when you purchase a paid plan, our payment processor collects your card
            or bank details on our behalf; JustMy does not store full card numbers on its own servers.
          </li>
          <li>
            <b>Communications</b> &mdash; information you provide when you contact support, respond to a survey, or
            otherwise write to us.
          </li>
        </ul>
        <h3>Information we collect automatically</h3>
        <ul>
          <li>
            <b>Usage data</b> &mdash; pages and features you use, searches and questions you ask, articles you read,
            links you click, and the actions you take (for example, sharing, referring, or redeeming a credit).
          </li>
          <li>
            <b>Device &amp; log data</b> &mdash; IP address, browser type, operating system, device identifiers, and
            crash or performance logs.
          </li>
          <li>
            <b>Location data</b> &mdash; your approximate location based on IP address, and your precise device location
            if you grant that permission in our mobile app, so we can show you local news, events, and businesses
            relevant to where you are.
          </li>
          <li>
            <b>Cookies &amp; similar technologies</b> &mdash; see <a href="#cookies">Cookies &amp; Advertising</a>{" "}
            below.
          </li>
        </ul>
        <h3>Information we receive from other sources</h3>
        <p>
          We may receive information about you from business partners, sponsors, referral partners, public records or
          civic data sources used in our local news coverage, and from third-party login providers if you choose to sign
          in that way.
        </p>
      </LegalSection>

      <LegalSection id="use" title={<>How We Use Information</>}>
        <ul>
          <li>
            Provide, maintain, and personalize the Service, including showing you local news, events, and businesses
            relevant to your market;
          </li>
          <li>Operate your account and any business or organization profile you manage;</li>
          <li>Process payments and manage subscriptions;</li>
          <li>Power AI Features such as AskSKY! (see below);</li>
          <li>
            Run promotions and contests, including Win with Sky! and the Prize Closet, and track entries, referrals, and
            credits;
          </li>
          <li>
            Send you service messages, respond to support requests, and, where you&apos;ve agreed to receive them,
            marketing messages;
          </li>
          <li>Measure and improve the Service, including through analytics and testing;</li>
          <li>Detect, investigate, and prevent fraud, abuse, and security incidents; and</li>
          <li>Comply with legal obligations and enforce our Terms of Service.</li>
        </ul>
      </LegalSection>

      <LegalSection id="ai" title={<>AI Features &amp; AskSKY!</>}>
        <p>
          When you ask AskSKY! a question, or use another AI-powered feature of the Service, we collect the input you
          provide (your question, prompt, or uploaded material) along with contextual information such as your market,
          account type, and relevant usage history, so AskSKY! can generate a useful response.
        </p>
        <ul>
          <li>
            Your inputs and the AI&apos;s responses may be processed by JustMy and by third-party AI providers we use to
            power these features.
          </li>
          <li>
            Except where we tell you otherwise or applicable law requires otherwise, we may use your inputs and the
            resulting interactions to maintain, improve, and train JustMy&apos;s own services. We are not able to offer
            a way to exclude a specific conversation from this use today; if that changes, we&apos;ll update this
            section.
          </li>
          <li>
            Please don&apos;t share confidential information, sensitive personal information, or information about
            someone else that you&apos;re not authorized to share, in a question or prompt to an AI Feature.
          </li>
          <li>
            AI Features are not a substitute for professional legal, medical, financial, or other expert advice, and any
            information AskSKY! gives you about local civic matters, news, or safety should be independently verified
            &mdash; see our Terms of Service for more on this.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="share" title={<>How We Share Information</>}>
        <p>
          We do not sell your personal information for money. We do share information in the following circumstances:
        </p>
        <LegalTable
          head={["Who", "Why"]}
          rows={[
            [
              <>Service providers</>,
              <>
                Hosting, analytics, customer support, email delivery, and payment processing, under contracts that limit
                their use of your information to providing services to us.
              </>,
            ],
            [<>AI providers</>, <>To power AskSKY! and other AI Features, as described above.</>],
            [
              <>Advertising &amp; measurement partners</>,
              <>
                To deliver and measure ads through myADS and similar tools &mdash; see Cookies &amp; Advertising below.
              </>,
            ],
            [
              <>Businesses &amp; sponsors</>,
              <>
                If you interact with a business profile, sponsor, or prize partner (for example, entering a contest or
                messaging a business), relevant information about that interaction is shared with them.
              </>,
            ],
            [
              <>Other users</>,
              <>
                Information you choose to make public on your profile, articles, comments, or contest entries is visible
                to other users and the public.
              </>,
            ],
            [
              <>Legal &amp; safety</>,
              <>
                When we believe disclosure is required by law, or necessary to protect the rights, property, or safety
                of JustMy, our users, or the public.
              </>,
            ],
            [
              <>Business transfers</>,
              <>
                In connection with a merger, acquisition, financing, or sale of assets, subject to standard
                confidentiality protections.
              </>,
            ],
          ]}
        />
      </LegalSection>

      <LegalSection id="cookies" title={<>Cookies &amp; Advertising</>}>
        <p>
          JustMy and our advertising and analytics partners use cookies, pixels, SDKs, and similar technologies to
          recognize your browser or device, remember your preferences, measure how the Service is used, and show you
          relevant advertising &mdash; including through myADS, our own advertising platform, and third-party ad
          networks and exchanges.
        </p>
        <ul>
          <li>
            You can control cookies through your browser settings; blocking cookies may affect how parts of the Service
            work.
          </li>
          <li>
            Where required, we&apos;ll show a cookie or consent banner that lets you accept or decline non-essential
            cookies.
          </li>
          <li>
            You can opt out of interest-based advertising from participating companies through tools such as the Digital
            Advertising Alliance&apos;s or Network Advertising Initiative&apos;s opt-out pages, and through your
            device&apos;s ad-tracking settings.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="apps" title={<>Mobile Apps</>}>
        <p>
          Our mobile apps may request permission to access device features, which you can grant or deny through your
          device settings:
        </p>
        <ul>
          <li>
            <b>Location</b> &mdash; to show local news, events, and businesses near you;
          </li>
          <li>
            <b>Camera &amp; photos</b> &mdash; to let you upload images to a profile, article, or prize submission;
          </li>
          <li>
            <b>Push notifications</b> &mdash; to send briefings, alerts, and updates you&apos;ve opted into;
          </li>
          <li>
            <b>Contacts</b> &mdash; only if you choose to use a feature that invites or refers someone you know.
          </li>
        </ul>
        <p>Declining a permission may limit the related feature, but the rest of the app will continue to work.</p>
      </LegalSection>

      <LegalSection id="retention" title={<>Data Retention</>}>
        <p>
          We keep personal information for as long as your account is active and as needed to provide the Service,
          comply with our legal obligations, resolve disputes, and enforce our agreements. When you delete your account,
          we delete or de-identify your personal information within a reasonable period, except where we&apos;re
          required or permitted to keep it longer (for example, payment records for tax purposes, or content needed to
          resolve an active dispute).
        </p>
      </LegalSection>

      <LegalSection id="choices" title={<>Your Choices &amp; Rights</>}>
        <ul>
          <li>
            <b>Access, correct, or delete</b> the personal information in your account by updating your profile settings
            or contacting us at the email below.
          </li>
          <li>
            <b>Opt out of marketing emails</b> using the unsubscribe link in any marketing message; you&apos;ll still
            receive service-related messages about your account.
          </li>
          <li>
            <b>Manage notifications</b> through your account or device settings.
          </li>
          <li>
            <b>State privacy rights</b> &mdash; depending on where you live, you may have the right to know what
            personal information we&apos;ve collected about you, request its deletion, correct it, or opt out of certain
            sharing or targeted advertising. You can exercise these rights by contacting us at the email below; we will
            verify your request before acting on it.
          </li>
        </ul>
        <LegalNote>
          We operate first in Tennessee and are expanding to other markets and states as JustMy grows. This section will
          be expanded with state-specific disclosures (for example, under California, Colorado, or similar state privacy
          laws) as those requirements apply to us &mdash; flagged here for legal review as part of the national rollout.
        </LegalNote>
      </LegalSection>

      <LegalSection id="children" title={<>Children's Privacy</>}>
        <p>
          The Service is available only to individuals who are at least 13 years old, consistent with our Terms of
          Service. We do not knowingly collect personal information from anyone under 13. If we learn that we&apos;ve
          collected personal information from a child under 13, we will delete it promptly. If you believe a child under
          13 has provided us with personal information, please contact us at the email below.
        </p>
      </LegalSection>

      <LegalSection id="security" title={<>Security</>}>
        <p>
          We use administrative, technical, and physical safeguards designed to protect your information. No method of
          transmission or storage is completely secure, however, and we cannot guarantee absolute security. You&apos;re
          responsible for keeping your account credentials confidential.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title={<>International Users</>}>
        <p>
          JustMy is based in the United States, and the Service is operated from and directed at users in the United
          States. If you access the Service from outside the United States, your information will be transferred to and
          processed in the United States, which may have different data protection laws than your home country.
        </p>
      </LegalSection>

      <LegalSection id="links" title={<>Third-Party Links</>}>
        <p>
          The Service may link to or feature content from websites and services we don&apos;t operate, including sponsor
          and business websites, social media platforms, and news sources. This Privacy Policy doesn&apos;t apply to
          those third parties, and we encourage you to review their own privacy policies.
        </p>
      </LegalSection>

      <LegalSection id="changes" title={<>Changes to This Policy</>}>
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we&apos;ll post the updated
          policy here and update the effective date above; where required by law, we&apos;ll provide additional notice.
          Your continued use of the Service after a change is posted means you accept the updated policy.
        </p>
      </LegalSection>

      <LegalSection id="contact" title={<>Contact Us</>}>
        <p>
          If you have questions about this Privacy Policy or want to exercise any of the rights described above, contact
          us at <a href="mailto:privacy@justmy.com">privacy@justmy.com</a>.
        </p>
      </LegalSection>
    </>
  );
}
