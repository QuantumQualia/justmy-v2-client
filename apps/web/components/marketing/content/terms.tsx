import { LegalNote, LegalSection, LegalSubheading, type LegalJumpLink } from "@/components/marketing/legal-page";

export const TERMS_JUMP: LegalJumpLink[] = [
  {
    id: "agreement",
    label: "Agreement",
  },
  {
    id: "account",
    label: "Your Account",
  },
  {
    id: "apps",
    label: "Apps",
  },
  {
    id: "contributors",
    label: "Your Content",
  },
  {
    id: "ai-features",
    label: "AI Features",
  },
  {
    id: "payment",
    label: "Payment",
  },
  {
    id: "visitors",
    label: "Visitors",
  },
  {
    id: "other-sites",
    label: "Other Sites",
  },
  {
    id: "dmca",
    label: "Copyright / DMCA",
  },
  {
    id: "ip",
    label: "Intellectual Property",
  },
  {
    id: "ads",
    label: "Advertising",
  },
  {
    id: "partners",
    label: "Partner Integrations",
  },
  {
    id: "domains",
    label: "Domain Names",
  },
  {
    id: "changes",
    label: "Changes",
  },
  {
    id: "termination",
    label: "Termination",
  },
  {
    id: "warranties",
    label: "Warranties",
  },
  {
    id: "liability",
    label: "Liability",
  },
  {
    id: "indemnification",
    label: "Indemnification",
  },
  {
    id: "misc",
    label: "Governing Law & Misc.",
  },
];

export function TermsSections() {
  return (
    <>
      <LegalSection id="agreement" title={<>Agreement to Terms</>}>
        <p>
          These Terms of Service (this &ldquo;Agreement&rdquo;) govern your access to and use of justmy.com, all local
          JustMy market sites (including JustMyMemphis and other markets as they launch), the JustMy mobile and web
          applications, Biz OS and other JustMy business dashboards, AskSKY! and all other AI-powered features, and all
          other content, tools, and services JustMy makes available (collectively, the &ldquo;Service&rdquo;). The
          Service is owned and operated by JustMyCities, Inc. (&ldquo;JustMy,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
          or &ldquo;our&rdquo;).
        </p>
        <p>
          The Service is offered to you subject to your acceptance, without modification, of this Agreement and of all
          other operating rules, policies (including our Privacy Policy), and procedures we may publish from time to
          time. Please read this Agreement carefully. By accessing or using any part of the Service, you agree to be
          bound by this Agreement. If you do not agree to all of its terms, you may not access or use the Service. The
          Service is available only to individuals who are at least 13 years old.
        </p>
      </LegalSection>

      <LegalSection id="account" title={<>Your JustMy Account and Profile</>}>
        <p>
          If you create a personal, business, or organization profile on the Service, you are responsible for
          maintaining the security of your account and profile, and you are fully responsible for all activity that
          occurs under your account, including activity by anyone you&apos;ve given access to it. You must not describe
          your profile or assign keywords, categories, or tags to it in a misleading or unlawful manner, including in a
          way intended to trade on the name or reputation of others. JustMy may change or remove any description,
          keyword, or category it considers inappropriate, unlawful, or otherwise likely to create liability for JustMy.
          You must notify us immediately of any unauthorized use of your account or any other breach of security. JustMy
          is not liable for any loss or damage arising from your failure to protect your account credentials.
        </p>
      </LegalSection>

      <LegalSection id="apps" title={<>Mobile and Web Applications</>}>
        <p>
          JustMy may make its Service available through mobile applications and installable web applications (each, an
          &ldquo;App&rdquo;). Subject to your compliance with this Agreement, JustMy grants you a limited,
          non-exclusive, non-transferable, revocable license to download and use an App on a device you own or control,
          solely to access the Service for its intended purpose.
        </p>
        <ul>
          <li>
            If you download an App through a third-party app store (such as the Apple App Store or Google Play), your
            use of the App is also subject to that store&apos;s own terms of service, and those terms govern in the
            event of a conflict with this section specifically.
          </li>
          <li>
            An App may request permission to access device features such as location, camera, photos, contacts, or push
            notifications. You can control these permissions through your device settings; disabling a permission may
            limit or disable related features of the Service.
          </li>
          <li>
            JustMy may automatically check for, download, and install updates to an App. Some updates may be required
            before you can continue using the App.
          </li>
          <li>
            You may not reverse-engineer, decompile, or attempt to extract the source code of an App, except to the
            extent applicable law expressly permits it despite this restriction.
          </li>
          <li>JustMy may suspend or discontinue an App, or any feature of it, at any time.</li>
        </ul>
      </LegalSection>

      <LegalSection id="contributors" title={<>Responsibility of Contributors</>}>
        <p>
          If you maintain a profile, comment, post an article, post links, or otherwise make (or allow a third party to
          make) material available through the Service (any such material, &ldquo;Content&rdquo;), you are entirely
          responsible for that Content and any harm resulting from it &mdash; regardless of its form (text, graphics,
          audio, video, software, or AI-assisted output). By making Content available, you represent and warrant that:
        </p>
        <ul>
          <li>
            your use of the Content will not infringe the proprietary rights (including copyright, patent, trademark, or
            trade secret rights) of any third party;
          </li>
          <li>
            if your employer has rights to intellectual property you create, you have either received your
            employer&apos;s permission to post the Content, or secured a waiver of your employer&apos;s rights in it;
          </li>
          <li>
            you have complied with any third-party licenses relating to the Content and have done everything necessary
            to pass through any required terms to end users;
          </li>
          <li>
            the Content does not contain or install viruses, worms, malware, Trojan horses, or other harmful code;
          </li>
          <li>
            the Content is not spam, is not machine- or randomly-generated in a way designed to mislead, and does not
            exist to drive traffic to third-party sites, boost third-party search rankings, further unlawful acts such
            as phishing, or mislead recipients about its source (such as spoofing);
          </li>
          <li>
            the Content is not pornographic, does not threaten or incite violence against any person or group, and does
            not violate the privacy or publicity rights of any third party;
          </li>
          <li>
            your profile is not promoted through unwanted electronic messages, such as spam links on newsgroups, email
            lists, other sites, or similar unsolicited methods;
          </li>
          <li>
            your profile&apos;s name does not mislead readers into thinking you are a different person, business, or
            organization; and
          </li>
          <li>
            where Content includes computer code, you have accurately described its type, nature, uses, and effects.
          </li>
        </ul>
        <p>
          By submitting Content to JustMy, you grant JustMy a worldwide, royalty-free, non-exclusive license to
          reproduce, modify, adapt, and publish the Content solely to display, distribute, and promote your profile and
          the Service. If you delete Content, JustMy will make reasonable efforts to remove it from the Service, but
          cached or referenced copies may not be removed immediately.
        </p>
        <p>
          JustMy has the right, but not the obligation, to (i) refuse or remove any Content that, in JustMy&apos;s
          reasonable opinion, violates this Agreement or is otherwise harmful or objectionable, or (ii) terminate or
          deny access to the Service to anyone, for any reason, at JustMy&apos;s sole discretion. JustMy has no
          obligation to refund amounts already paid.
        </p>
      </LegalSection>

      <LegalSection id="ai-features" title={<>AI-Powered Features (AskSKY! and Other AI Tools)</>}>
        <p>
          The Service includes features powered by artificial intelligence and machine learning, including AskSKY!,
          JustMy&apos;s AI assistant, and other AI-assisted tools that may help you ask questions, find local
          information, draft content, or manage your business profile (collectively, &ldquo;AI Features&rdquo;). AI
          Features may run on models JustMy has built, trained, or licensed from third-party AI providers.
        </p>
        <h3>Output may be wrong &mdash; verify before you rely on it</h3>
        <p>
          AI Features generate responses automatically based on your input and available data, and that output can be
          incomplete, outdated, or incorrect. AskSKY! and other AI Features are not a substitute for professional legal,
          medical, financial, journalistic, or other expert advice, and are not a guaranteed source of civic, news, or
          safety information. You are responsible for independently verifying any AI-generated output before relying on
          it, publishing it, acting on it, or sharing it with anyone else &mdash; including content you publish to your
          business or personal profile.
        </p>
        <h3>What you submit to an AI Feature</h3>
        <p>
          Inputs you provide to an AI Feature (questions, prompts, documents, images, or other material) may be
          processed by JustMy and its third-party AI providers to generate a response to you and, except where JustMy
          tells you otherwise or applicable law requires otherwise, to maintain, improve, and train JustMy&apos;s
          services. Do not submit confidential or sensitive information, or information about a third party that you are
          not authorized to share, through an AI Feature.
        </p>
        <h3>Acceptable use of AI Features</h3>
        <p>
          You agree not to use an AI Feature to generate or distribute Content that would otherwise violate this
          Agreement, to impersonate a real person or organization, to generate false or misleading civic or news-related
          information, or to automate spam, harassment, or other abuse of the Service.
        </p>
        <h3>Ownership of AI output</h3>
        <p>
          As between you and JustMy, JustMy does not claim ownership of output you generate through an AI Feature for
          your own profile or business use, provided your use complies with this Agreement. Because AI output can
          resemble output generated for other users asking similar questions, JustMy cannot guarantee that any
          AI-generated output is unique or free of third-party rights, and the representations and obligations in
          &ldquo;Responsibility of Contributors&rdquo; above still apply to anything you publish.
        </p>
        <p>JustMy may limit, rate-limit, suspend, or discontinue any AI Feature, or any part of it, at any time.</p>
      </LegalSection>

      <LegalSection id="payment" title={<>Payment and Renewal</>}>
        <h3>General Terms</h3>
        <p>
          By selecting a paid plan or feature &mdash; including Biz OS, Command OS, Command PRO, Enterprise OS, or any
          other paid upgrade &mdash; you agree to pay the one-time and/or recurring fees shown at checkout (additional
          payment terms may be included in other communications). Subscription fees are charged on a pre-pay basis on
          the day you sign up and cover that subscription period. Payments are not refundable except as required by law.
        </p>
        <h3>Automatic Renewal</h3>
        <p>
          Unless you cancel before the end of your current subscription period, your subscription will automatically
          renew, and you authorize JustMy to charge the then-current fee (plus applicable taxes) to the payment method
          on file. You may cancel a subscription at any time by submitting your request to JustMy in writing.
        </p>
        <h3>Business &amp; Enterprise Services</h3>
        <p>
          By signing up for a business or enterprise services account, you agree to pay the applicable setup and
          recurring fees, invoiced starting the day your services are established and in advance of use. JustMy may
          change payment terms and fees upon thirty (30) days&apos; prior written notice. You may cancel such services
          at any time on thirty (30) days&apos; written notice to JustMy.
        </p>
        <h3>Support</h3>
        <p>
          Paid plans that include priority support give you the ability to request technical support by email at any
          time, with reasonable efforts by JustMy to respond within one business day. Priority support requests take
          precedence over support requests from free-plan users. All support is provided in accordance with
          JustMy&apos;s standard support practices and policies.
        </p>
      </LegalSection>

      <LegalSection id="visitors" title={<>Responsibility of Service Visitors</>}>
        <p>
          JustMy has not reviewed, and cannot review, all material &mdash; including software, articles, and
          AI-generated content &mdash; posted through the Service, and is not responsible for that material&apos;s
          content, use, or effects. Operating the Service does not mean JustMy endorses any material posted on it or
          believes it to be accurate, useful, or non-harmful. You are responsible for protecting yourself and your
          systems from viruses and other harmful content. The Service may contain content that is offensive, inaccurate,
          or otherwise objectionable, and may contain material that infringes the rights of third parties. JustMy
          disclaims responsibility for any harm resulting from your use of the Service or from downloading any content
          posted on it.
        </p>
      </LegalSection>

      <LegalSection id="other-sites" title={<>Content Posted on Other Websites</>}>
        <p>
          JustMy has not reviewed, and cannot review, all material available through sites and pages that link to or
          from the Service, and has no control over those non-JustMy sites. Linking to a non-JustMy site or page does
          not mean JustMy endorses it. You are responsible for protecting yourself and your systems from harmful content
          on those sites. JustMy disclaims responsibility for any harm resulting from your use of non-JustMy websites
          and webpages.
        </p>
      </LegalSection>

      <LegalSection id="dmca" title={<>Copyright Infringement and DMCA Policy</>}>
        <p>
          JustMy respects the intellectual property rights of others and asks the same of its users. If you believe
          material on or linked to by the Service infringes your copyright, please notify JustMy in accordance with
          JustMy&apos;s Digital Millennium Copyright Act (&ldquo;DMCA&rdquo;) policy. JustMy will respond to valid
          notices, including by removing the infringing material or disabling links to it, and will terminate the access
          of repeat infringers. JustMy has no obligation to refund amounts previously paid to an account terminated on
          this basis.
        </p>
      </LegalSection>

      <LegalSection id="ip" title={<>Intellectual Property</>}>
        <p>
          This Agreement does not transfer any JustMy or third-party intellectual property to you; all right, title, and
          interest in that property remains solely with JustMy (or its licensors) as between the parties. JustMy,
          justmy.com, AskSKY!, the JustMy logo, and all other trademarks, service marks, graphics, and logos used in
          connection with the Service are trademarks of JustMy or its licensors. Other trademarks used in connection
          with the Service may belong to third parties. Your use of the Service grants you no right or license to use
          any JustMy or third-party trademark.
        </p>
      </LegalSection>

      <LegalSection id="ads" title={<>Advertisements</>}>
        <p>
          JustMy reserves the right to display advertisements on your profile and throughout the Service unless you have
          purchased an ad-free plan.
        </p>
        <LegalSubheading>Attribution</LegalSubheading>
        <p>
          JustMy reserves the right to display attribution links, such as &ldquo;Powered by JustMy,&rdquo; in your
          profile&apos;s footer or toolbar.
        </p>
      </LegalSection>

      <LegalSection id="partners" title={<>Partner Integrations</>}>
        <p>
          By activating a feature or integration from one of JustMy&apos;s partners (for example, a payment processor,
          ad network, or syndication partner), you agree to that partner&apos;s own terms of service. You may opt out of
          a partner&apos;s terms at any time by deactivating that integration.
        </p>
      </LegalSection>

      <LegalSection id="domains" title={<>Domain Names</>}>
        <p>
          If you register, use, or transfer a domain name through the Service, you acknowledge that use of the domain
          name is also subject to the policies of the Internet Corporation for Assigned Names and Numbers
          (&ldquo;ICANN&rdquo;), including its Registration Rights and Responsibilities.
        </p>
        <LegalNote>
          Kept from the prior Terms for coverage in case custom-domain mapping is offered to Enterprise OS clients
          &mdash; flag to remove if JustMy doesn&apos;t offer domain registration or mapping today.
        </LegalNote>
      </LegalSection>

      <LegalSection id="changes" title={<>Changes</>}>
        <p>
          JustMy may modify or replace this Agreement at its sole discretion. It is your responsibility to check this
          Agreement periodically. Your continued use of the Service after any changes are posted constitutes acceptance
          of those changes. New features or services JustMy introduces in the future &mdash; including new AI Features
          &mdash; are also subject to this Agreement.
        </p>
      </LegalSection>

      <LegalSection id="termination" title={<>Termination</>}>
        <p>
          JustMy may terminate your access to all or part of the Service at any time, with or without cause or notice,
          effective immediately. You may terminate this Agreement or your account at any time by discontinuing use of
          the Service. If you have a paid account, JustMy may only terminate it for a material breach you fail to cure
          within thirty (30) days of notice, except that JustMy may terminate the Service immediately as part of a
          general shutdown. Provisions of this Agreement that by their nature should survive termination will survive,
          including ownership, warranty disclaimers, indemnification, and limitations of liability.
        </p>
      </LegalSection>

      <LegalSection id="warranties" title={<>Disclaimer of Warranties</>}>
        <p>
          The Service, including all AI Features, is provided &ldquo;as is.&rdquo; JustMy and its suppliers and
          licensors disclaim all warranties of any kind, express or implied, including the warranties of
          merchantability, fitness for a particular purpose, and non-infringement. JustMy does not warrant that the
          Service will be error-free, that access will be uninterrupted, or that any AI-generated output will be
          accurate or complete. You use the Service, and rely on any content obtained through it, at your own discretion
          and risk.
        </p>
        <LegalSubheading id="liability">Limitation of Liability</LegalSubheading>
        <p>
          In no event will JustMy, or its suppliers or licensors, be liable under any theory of liability for: (i)
          special, incidental, or consequential damages; (ii) the cost of procuring substitute products or services;
          (iii) interruption of use or loss or corruption of data; or (iv) amounts exceeding the fees you paid to JustMy
          in the twelve (12) months before the claim arose. JustMy has no liability for failure or delay due to matters
          beyond its reasonable control. The foregoing does not apply where prohibited by law.
        </p>
        <LegalSubheading>General Representation and Warranty</LegalSubheading>
        <p>
          You represent and warrant that (i) your use of the Service will comply with JustMy&apos;s Privacy Policy, this
          Agreement, and all applicable laws and regulations, including those governing online conduct, acceptable
          content, and the export of technical data, and (ii) your use of the Service will not infringe or
          misappropriate any third party&apos;s intellectual property rights.
        </p>
      </LegalSection>

      <LegalSection id="indemnification" title={<>Indemnification</>}>
        <p>
          You agree to indemnify and hold harmless JustMy, its contractors, and its licensors, and their respective
          directors, officers, employees, and agents, from and against any claims and expenses, including
          attorneys&apos; fees, arising out of your use of the Service, including any violation of this Agreement.
        </p>
      </LegalSection>

      <LegalSection id="misc" title={<>Governing Law &amp; Miscellaneous</>}>
        <p>
          This Agreement constitutes the entire agreement between you and JustMy concerning its subject matter, and may
          only be modified by a written amendment signed by an authorized JustMy executive or by JustMy posting a
          revised version. This Agreement is governed by the laws of the State of Tennessee, U.S.A., excluding its
          conflict-of-law provisions, and the proper venue for disputes is the state and federal courts located in
          Shelby County, TN.
        </p>
        <p>
          Except for claims for injunctive or equitable relief or claims regarding intellectual property rights (which
          may be brought in any competent court without posting a bond), any dispute arising under this Agreement will
          be finally settled under the Comprehensive Arbitration Rules of the Judicial Arbitration and Mediation
          Service, Inc. (&ldquo;JAMS&rdquo;) by three arbitrators appointed under those rules. Arbitration will take
          place in Memphis, TN, in English, and the award may be enforced in any court. The prevailing party in any
          action to enforce this Agreement is entitled to costs and attorneys&apos; fees.
        </p>
        <p>
          If any part of this Agreement is held invalid or unenforceable, that part will be construed to reflect the
          parties&apos; original intent, and the remaining portions remain in full force. A party&apos;s waiver of any
          term or breach in one instance does not waive that term or any later breach. You may assign your rights under
          this Agreement only to a party that agrees to be bound by its terms; JustMy may assign its rights without
          condition. This Agreement binds and benefits the parties and their successors and permitted assigns.
        </p>
      </LegalSection>
    </>
  );
}
