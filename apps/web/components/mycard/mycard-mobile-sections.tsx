"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { FaLinkedin } from "react-icons/fa6";
import { SiFacebook, SiPinterest, SiReddit, SiX } from "react-icons/si";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { AdBanner } from "@/components/common/ad-banner";
import { AskSkyWidget } from "@/components/asksky/asksky-widget";
import { MycardAbout } from "@/components/mycard/mycard-about";
import { MycardVideo, profileVideo } from "@/components/mycard/mycard-video";
import { legacyPlainText } from "@/lib/legacy-html";
import { publicMycardUrl } from "@/lib/mycard/public-url";
import { downloadProfileVCard, profileVCardText } from "@/lib/mycard/vcard";
import {
  useMycardPublicNavStore,
  type MycardSection,
} from "@/lib/store/mycard-public-nav-store";
import type { ProfileData } from "@/lib/store";

export function mycardSectionAvailability(data: ProfileData) {
  return {
    asksky: (data.agents ?? []).some((agent) => agent.agentToken?.trim()),
    pitch: Boolean(profileVideo(data.videos, "PITCH")?.videoUrl),
    about: Boolean(
      legacyPlainText(data.about) || profileVideo(data.videos, "BRAND")?.videoUrl || data.ad?.image,
    ),
  };
}

export function useMycardMobileSection(data: ProfileData): MycardSection {
  const section = useMycardPublicNavStore((state) => state.section);
  const setNav = useMycardPublicNavStore((state) => state.setNav);
  const available = mycardSectionAvailability(data);

  useEffect(() => {
    setNav(available);
  }, [available.about, available.asksky, available.pitch, setNav]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [section]);

  if (section === "asksky" && !available.asksky) return "home";
  if (section === "pitch" && !available.pitch) return "home";
  if (section === "about" && !available.about) return "home";
  return section;
}

export function MycardMobileFooter({ registerHref }: { registerHref: string }) {
  return (
    <footer className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 border-t border-border px-4 py-3">
      <img src="/images/logo.png" alt="" className="h-8 w-8 rounded-full object-cover" />
      <Link href={registerHref} className="text-sm font-medium text-foreground">
        Create Your Own Card!
      </Link>
      <Link href="/login" className="text-sm text-muted-foreground">
        Login
      </Link>
    </footer>
  );
}

export function MycardMobileSection({
  data,
  section,
  ctaButtonClassName,
}: {
  data: ProfileData;
  section: Exclude<MycardSection, "home">;
  ctaButtonClassName: string;
}) {
  if (section === "asksky") return <AskSkySection data={data} />;
  if (section === "pitch") return <PitchSection data={data} />;
  if (section === "about") return <AboutSection data={data} ctaButtonClassName={ctaButtonClassName} />;
  return <ConnectSection data={data} />;
}

function AskSkySection({ data }: { data: ProfileData }) {
  const agent = data.agents?.find((item) => item.agentToken?.trim());
  if (!agent) return null;
  return (
    <div className="mx-auto flex h-dvh w-full max-w-xl flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <h1 className="mb-3 pr-16 text-xl font-bold text-foreground">AskSKY!</h1>
      <div className="flex min-h-0 flex-1 flex-col">
        <AskSkyWidget
          profileSlug={data.slug}
          agentToken={agent.agentToken}
          variant="inline"
          embedFill
          embedKey={`mycard-${data.slug}-${agent.id}`}
        />
      </div>
    </div>
  );
}

function PitchSection({ data }: { data: ProfileData }) {
  const pitch = profileVideo(data.videos, "PITCH");
  if (!pitch?.videoUrl) return null;
  return (
    <div className="mx-auto flex h-[calc(100dvh-var(--news-header-h,0px)-3.75rem)] w-full max-w-xl items-center justify-center bg-black pt-16">
      <MycardVideo url={pitch.videoUrl} title={pitch.title || "Pitch"} contain dark bare />
    </div>
  );
}

function AboutSection({ data, ctaButtonClassName }: { data: ProfileData; ctaButtonClassName: string }) {
  const brand = profileVideo(data.videos, "BRAND");
  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-6">
      {brand?.videoUrl ? <MycardVideo url={brand.videoUrl} title={brand.title || `${data.name} video`} /> : null}
      {data.ad?.image ? (
        <AdBanner
          imageSrc={data.ad.image}
          imageAlt={data.ad.alt || data.name}
          bannerLink={data.ad.href || undefined}
          profileSlug={data.slug}
          hotlinks={data.hotlinks.map((hotlink) => ({ label: hotlink.title, href: hotlink.url }))}
        />
      ) : data.hotlinks.length ? (
        <div className="flex flex-col gap-2">
          {data.hotlinks.map((hotlink) => (
            <a key={hotlink.id} href={hotlink.url} target="_blank" rel="noopener noreferrer" className={ctaButtonClassName}>
              <span className="min-w-0 truncate">{hotlink.title}</span>
            </a>
          ))}
        </div>
      ) : null}
      <MycardAbout about={data.about} />
    </div>
  );
}

function QrBlock({ value }: { value: string }) {
  return (
    <div className="mx-auto w-fit rounded-3xl bg-background p-3">
      <QRCodeSVG value={value} size={168} level="M" includeMargin bgColor="#FFFFFF" fgColor="#000000" />
    </div>
  );
}

function ConnectSection({ data }: { data: ProfileData }) {
  const [copied, setCopied] = useState(false);
  const cardUrl = publicMycardUrl(data.slug) || `/${data.slug}`;
  const encodedUrl = encodeURIComponent(cardUrl);
  const encodedTitle = encodeURIComponent(data.name || "myCARD");
  const shareText = encodeURIComponent(`${data.name} ${cardUrl}`);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
      <section className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <div>
          <h2 className="text-lg font-bold text-foreground">Scan to Contacts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add this profile to a phone.</p>
        </div>
        <QrBlock value={profileVCardText(data)} />
        <Button type="button" variant="outline" className="w-full" onClick={() => downloadProfileVCard(data)}>
          Save to device
        </Button>
      </section>

      <section className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <div>
          <h2 className="text-lg font-bold text-foreground">Scan to open myCARD</h2>
          <p className="mt-1 text-sm text-muted-foreground">Open this card on another phone.</p>
        </div>
        <QrBlock value={cardUrl} />
        <div className="flex items-center gap-3 rounded-full border border-border bg-muted px-3 py-2">
          <div className="min-w-0 flex-1 truncate text-sm text-foreground">{cardUrl}</div>
          <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <div>
          <h2 className="text-lg font-bold text-foreground">Share everywhere</h2>
          <p className="mt-1 text-sm text-muted-foreground">Send the card by message or social.</p>
        </div>
        {data.banner || data.photo ? (
          <img src={data.banner || data.photo} alt="" className="justmy-corners-sm aspect-[16/7] w-full object-cover" />
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ShareIcon href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} label="Facebook" className="bg-[#1877F2]">
            <SiFacebook className="h-5 w-5" />
          </ShareIcon>
          <ShareIcon href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} label="LinkedIn" className="bg-[#0A66C2]">
            <FaLinkedin className="h-5 w-5" />
          </ShareIcon>
          <ShareIcon href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} label="X" className="bg-foreground">
            <SiX className="h-5 w-5" />
          </ShareIcon>
          <ShareIcon href={`https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`} label="Pinterest" className="bg-[#E60023]">
            <SiPinterest className="h-5 w-5" />
          </ShareIcon>
          <ShareIcon href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`} label="Reddit" className="bg-[#FF4500]">
            <SiReddit className="h-5 w-5" />
          </ShareIcon>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="w-full">
            <a href={`sms:?&body=${shareText}`}>Text</a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}>Email</a>
          </Button>
        </div>
      </section>
    </div>
  );
}

function ShareIcon({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-card ${className}`}
    >
      {children}
    </a>
  );
}
