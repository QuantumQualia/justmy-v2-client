"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Globe,
  Mail,
  MapPin,
  Phone,
  Share2,
  X,
} from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import { SiFacebook, SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";
import type { PageBlock } from "@/lib/services/cms";
import { legacyPlainText } from "@/lib/legacy-html";
import { profilesService } from "@/lib/services/profiles";
import { getVideoEmbedUrl } from "@/lib/utils/video";
import { AdBanner } from "@/components/common/ad-banner";
import { openShare } from "@/components/common/share/share-store";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Card,
  CardContent,
} from "@workspace/ui/components/card";

// --- Types ---

type SpotlightBlock = PageBlock & {
  heading?: string;
  subheading?: string;
  mode?: "spotlight" | "feed";
  primaryProfileSlug?: string;
  feedProfileSlugs?: string[];
};

interface PublicProfilePhone {
  id: string;
  number: string;
  type?: string;
}

interface PublicProfileLocation {
  id: string;
  title?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
}

interface PublicProfileHotlink {
  id: string;
  label: string;
  link: string;
}

interface PublicProfile {
  slug: string;
  name?: string;
  tagline?: string;
  about?: string;
  email?: string | null;
  website?: string | null;
  calendarLink?: string | null;
  photo?: string | null;
  banner?: string | null;
  videos?: { id: string; videoUrl: string; title?: string; description?: string }[];
  socialLinks?: { id?: string; name?: string; link?: string }[];
  phones?: PublicProfilePhone[];
  locations?: PublicProfileLocation[];
  hotlinks?: PublicProfileHotlink[];
  ad?: { image?: string | null; href?: string | null; alt?: string | null } | null;
  [key: string]: any;
}

// --- Helpers ---

function openMapsForLocation(location: PublicProfileLocation) {
  let query = location.address || "";
  if (location.latitude && location.longitude) {
    query = `${location.latitude},${location.longitude}`;
  } else if (!query && location.title) {
    query = location.title;
  }
  if (!query) return;
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    "_blank",
  );
}

function shareProfile(profile: PublicProfile) {
  openShare({
    title: profile.name || profile.slug,
    description: profile.tagline || "Check out this profile on JustMy",
    url: `${typeof window !== "undefined" ? window.location.origin : ""}/${profile.slug}`,
    imageUrl: profile.banner || profile.photo || undefined,
  });
}

// --- Sub-components ---

function SelectionPopover({
  isOpen,
  onClose,
  title,
  icon,
  items,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  items: { id: string; label: string; subtitle?: string }[];
  onSelect: (id: string) => void;
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground">
              {icon}
            </div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-1.5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item.id);
                onClose();
              }}
              className="w-full cursor-pointer rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 text-left transition-colors hover:bg-accent"
            >
              <div className="text-sm font-medium text-foreground">{item.label}</div>
              {item.subtitle && (
                <div className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const ICON_BTN =
  "group relative flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-muted text-foreground transition-colors hover:bg-accent";
const ICON_SIZE = "h-4 w-4 transition-transform group-hover:scale-110";
const BADGE =
  "absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground";

function ContactBar({ profile }: { profile: PublicProfile }) {
  const phones = profile.phones ?? [];
  const locations = profile.locations ?? [];
  const [showPhones, setShowPhones] = useState(false);
  const [showLocations, setShowLocations] = useState(false);

  const handlePhoneClick = () => {
    if (phones.length > 1) {
      setShowPhones(true);
    } else if (phones[0]) {
      window.location.href = `tel:${phones[0].number}`;
    }
  };

  const handleLocationClick = () => {
    if (locations.length > 1) {
      setShowLocations(true);
    } else if (locations[0]) {
      openMapsForLocation(locations[0]);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => shareProfile(profile)} className={ICON_BTN} title="Share">
          <Share2 className={ICON_SIZE} />
        </button>

        {phones.length > 0 && (
          <button type="button" onClick={handlePhoneClick} className={ICON_BTN} title={phones.length > 1 ? `Phone (${phones.length})` : `Phone: ${phones[0]!.number}`}>
            <Phone className={ICON_SIZE} />
            {phones.length > 1 && <span className={BADGE}>{phones.length}</span>}
          </button>
        )}

        {profile.email && (
          <a href={`mailto:${profile.email}`} className={ICON_BTN} title={`Email: ${profile.email}`}>
            <Mail className={ICON_SIZE} />
          </a>
        )}

        {profile.website && (
          <a href={profile.website} target="_blank" rel="noreferrer" className={ICON_BTN} title={`Website: ${profile.website}`}>
            <Globe className={ICON_SIZE} />
          </a>
        )}

        {locations.length > 0 && (
          <button type="button" onClick={handleLocationClick} className={ICON_BTN} title={locations.length > 1 ? `Address (${locations.length})` : locations[0]!.address || "Address"}>
            <MapPin className={ICON_SIZE} />
            {locations.length > 1 && <span className={BADGE}>{locations.length}</span>}
          </button>
        )}

        {profile.calendarLink && (
          <a href={profile.calendarLink} target="_blank" rel="noreferrer" className={ICON_BTN} title="Calendar">
            <Calendar className={ICON_SIZE} />
          </a>
        )}
      </div>

      <SelectionPopover
        isOpen={showPhones}
        onClose={() => setShowPhones(false)}
        title="Select Phone Number"
        icon={<Phone className="h-4 w-4" />}
        items={phones.map((p) => ({ id: p.id, label: p.number, subtitle: p.type || undefined }))}
        onSelect={(id) => {
          const found = phones.find((p) => p.id === id);
          if (found) window.location.href = `tel:${found.number}`;
        }}
      />

      <SelectionPopover
        isOpen={showLocations}
        onClose={() => setShowLocations(false)}
        title="Select Address"
        icon={<MapPin className="h-4 w-4" />}
        items={locations.map((l, i) => ({ id: l.id, label: l.title || `Address ${i + 1}`, subtitle: l.address || undefined }))}
        onSelect={(id) => {
          const found = locations.find((l) => l.id === id);
          if (found) openMapsForLocation(found);
        }}
      />
    </>
  );
}

function spotlightSocialIcon(name: string) {
  const key = name.toLowerCase();
  if (key.includes("facebook")) return <SiFacebook className="h-3.5 w-3.5" />;
  if (key.includes("instagram")) return <SiInstagram className="h-3.5 w-3.5" />;
  if (key.includes("linkedin")) return <FaLinkedin className="h-3.5 w-3.5" />;
  if (key.includes("youtube")) return <SiYoutube className="h-3.5 w-3.5" />;
  if (key.includes("tiktok")) return <SiTiktok className="h-3.5 w-3.5" />;
  if (key === "x" || key.includes("twitter")) return <SiX className="h-3.5 w-3.5" />;
  return <Globe className="h-3.5 w-3.5" />;
}

function watchOnLabel(url: string) {
  if (/youtu\.?be/i.test(url)) return "Watch on YouTube";
  if (/vimeo/i.test(url)) return "Watch on Vimeo";
  return "Watch";
}

function SpotlightContactLines({
  icons,
  expanded,
  onToggle,
  reserveToggle,
}: {
  icons: ReactNode[];
  expanded: boolean;
  onToggle: () => void;
  reserveToggle: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [perLine, setPerLine] = useState(6);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const fit = Math.max(1, Math.floor((el.clientWidth + 8) / 40));
      setPerLine((current) => (current === fit ? current : fit));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleTakesSlot = reserveToggle || icons.length > perLine;
  const firstLineCount = toggleTakesSlot ? Math.max(1, perLine - 1) : icons.length;
  const hidden = icons.slice(firstLineCount);
  const secondLine = expanded ? hidden.slice(0, perLine) : [];
  const showToggle = toggleTakesSlot;

  return (
    <div ref={boxRef} className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        {icons.slice(0, firstLineCount)}
        {showToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className={ICON_BTN}
            title={expanded ? "Show less" : "Show more"}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className={ICON_SIZE} /> : <ChevronDown className={ICON_SIZE} />}
          </button>
        ) : null}
      </div>
      {secondLine.length > 0 ? <div className="flex items-center gap-2">{secondLine}</div> : null}
    </div>
  );
}

function SpotlightView({ profile }: { profile: PublicProfile }) {
  const video = profile.videos?.find((item) => item.videoUrl?.trim());
  const videoUrl = video?.videoUrl?.trim() || "";
  const embedUrl = videoUrl ? getVideoEmbedUrl(videoUrl) : null;
  const caption = (video?.title || video?.description || profile.tagline || "").trim();
  const socials = (profile.socialLinks ?? []).filter((link) => link.link);
  const phones = profile.phones ?? [];
  const locations = profile.locations ?? [];
  const address = locations.find((location) => location.address?.trim())?.address?.trim() || "";
  const phone = phones.find((item) => item.number?.trim())?.number?.trim() || "";
  const hasContact = Boolean(address || phone);
  const adImage = profile.ad?.image?.trim() || "";
  const hotlinks = (profile.hotlinks ?? []).filter((link) => link.label && link.link);
  const [showContact, setShowContact] = useState(false);
  const [showPhones, setShowPhones] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const profileHref = `/${profile.slug}`;

  const openPhone = () => {
    if (phones.length > 1) setShowPhones(true);
    else if (phone) window.location.href = `tel:${phone}`;
  };

  const openAddress = () => {
    if (locations.length > 1) setShowLocations(true);
    else if (locations[0]) openMapsForLocation(locations[0]);
  };

  return (
    <div className="w-full">
      <div className="justmy-corners-xl w-full overflow-hidden border border-border bg-card shadow-card">
        {embedUrl ? (
          <div className="relative w-full bg-black pt-[56.25%]">
            <iframe
              src={embedUrl}
              title={video?.title || profile.name || "Profile video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0 bg-black"
            />
          </div>
        ) : videoUrl ? (
          <video src={videoUrl} controls className="aspect-video w-full bg-black" />
        ) : profile.banner ? (
          <img
            src={profile.banner}
            alt={profile.name || profile.slug}
            className="aspect-video w-full object-cover"
          />
        ) : null}

        {caption || videoUrl ? (
          <div className="flex items-center justify-between gap-3 bg-black px-4 py-3 text-white">
            <p className="min-w-0 text-xs font-medium uppercase tracking-[0.14em]">
              {caption}
            </p>
            {videoUrl ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-[11px] text-white/80 hover:text-white hover:underline"
              >
                {watchOnLabel(videoUrl)}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={adImage ? "mt-4 flex flex-col items-center gap-4 md:flex-row md:items-center" : "mt-4 flex items-center justify-end gap-4"}>
        <div className={adImage ? "flex w-full max-w-md shrink-0 items-center gap-4 mb-5" : "flex shrink-0 items-center gap-4"}>
        <a
          href={profileHref}
          className={adImage ? "block h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-card" : "order-last block h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-card"}
          title={profile.name || profile.slug}
        >
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={profile.name || profile.slug}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
              {(profile.name || profile.slug || "?").charAt(0)}
            </span>
          )}
        </a>
        <div className={adImage ? "min-w-0 flex-1 text-left" : "min-w-0 text-right"}>
          {profile.name ? (
            <p className="text-sm font-semibold text-foreground">{profile.name}</p>
          ) : null}
          {adImage ? (
            <SpotlightContactLines
              expanded={showContact}
              onToggle={() => setShowContact((open) => !open)}
              reserveToggle={hasContact}
              icons={[
                <button key="share" type="button" onClick={() => shareProfile(profile)} className={ICON_BTN} title="Share">
                  <Share2 className={ICON_SIZE} />
                </button>,
                profile.email ? (
                  <a key="email" href={`mailto:${profile.email}`} className={ICON_BTN} title="Email">
                    <Mail className={ICON_SIZE} />
                  </a>
                ) : null,
                profile.website ? (
                  <a key="website" href={profile.website} target="_blank" rel="noreferrer" className={ICON_BTN} title="Website">
                    <Globe className={ICON_SIZE} />
                  </a>
                ) : null,
                ...socials.map((social) => (
                  <a
                    key={social.id || social.link}
                    href={social.link}
                    target="_blank"
                    rel="noreferrer"
                    className={ICON_BTN}
                    title={social.name || "Social"}
                  >
                    {spotlightSocialIcon(social.name || "")}
                  </a>
                )),
              ].filter(Boolean)}
            />
          ) : (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => shareProfile(profile)} className={ICON_BTN} title="Share">
              <Share2 className={ICON_SIZE} />
            </button>
            {profile.email ? (
              <a href={`mailto:${profile.email}`} className={ICON_BTN} title="Email">
                <Mail className={ICON_SIZE} />
              </a>
            ) : null}
            {profile.website ? (
              <a href={profile.website} target="_blank" rel="noreferrer" className={ICON_BTN} title="Website">
                <Globe className={ICON_SIZE} />
              </a>
            ) : null}
            {socials.map((social) => (
              <a
                key={social.id || social.link}
                href={social.link}
                target="_blank"
                rel="noreferrer"
                className={ICON_BTN}
                title={social.name || "Social"}
              >
                {spotlightSocialIcon(social.name || "")}
              </a>
            ))}
            {hasContact ? (
              <button
                type="button"
                onClick={() => setShowContact((open) => !open)}
                className={ICON_BTN}
                title="Learn more"
                aria-expanded={showContact}
              >
                {showContact ? <ChevronUp className={ICON_SIZE} /> : <ChevronDown className={ICON_SIZE} />}
              </button>
            ) : null}
          </div>
          )}
          {showContact && hasContact ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {address ? (
                <button type="button" onClick={openAddress} className="hover:text-foreground hover:underline">
                  {address}
                </button>
              ) : null}
              {address && phone ? <span aria-hidden> · </span> : null}
              {phone ? (
                <button type="button" onClick={openPhone} className="hover:text-foreground hover:underline">
                  {phone}
                </button>
              ) : null}
            </p>
          ) : null}
        </div>
        </div>
        {adImage ? (
          <div className="w-full min-w-0 flex-1">
            <AdBanner
              imageSrc={adImage}
              imageAlt={profile.ad?.alt || profile.name || "Ad"}
              imageElement={
                <img
                  src={adImage}
                  alt={profile.ad?.alt || ""}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              }
              bannerLink={profile.ad?.href || profileHref}
              profileSlug={profile.slug}
              hotlinks={hotlinks.map((link) => ({ label: link.label, href: link.link }))}
              compact
            />
          </div>
        ) : null}
      </div>

      <SelectionPopover
        isOpen={showPhones}
        onClose={() => setShowPhones(false)}
        title="Select Phone Number"
        icon={<Phone className="h-4 w-4" />}
        items={phones.map((item) => ({ id: item.id, label: item.number, subtitle: item.type || undefined }))}
        onSelect={(id) => {
          const found = phones.find((item) => item.id === id);
          if (found) window.location.href = `tel:${found.number}`;
        }}
      />
      <SelectionPopover
        isOpen={showLocations}
        onClose={() => setShowLocations(false)}
        title="Select Address"
        icon={<MapPin className="h-4 w-4" />}
        items={locations.map((location, index) => ({
          id: location.id,
          label: location.title || `Address ${index + 1}`,
          subtitle: location.address || undefined,
        }))}
        onSelect={(id) => {
          const found = locations.find((location) => location.id === id);
          if (found) openMapsForLocation(found);
        }}
      />
    </div>
  );
}

function FeedProfileCard({ profile }: { profile: PublicProfile }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border py-0 shadow-sm gap-3 rounded-br-none">
      {/* Banner with photo overlapping at bottom */}
      <div className="relative pb-5">
        <div className="h-36 w-full bg-muted">
          {profile.banner ? (
            <img
              src={profile.banner}
              alt={profile.name || profile.slug}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No banner
            </div>
          )}
        </div>
        {/* Photo overlapping banner bottom */}
        <div className="absolute -bottom-0 left-4 h-12 w-12 overflow-hidden rounded-full border-2 border-background bg-muted shadow-md">
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={profile.name || profile.slug}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
              {(profile.name || profile.slug || "?").charAt(0)}
            </div>
          )}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col px-4 pb-4 pt-1 text-sm">
        <h4 className="line-clamp-1 font-semibold text-foreground">
          {profile.name || profile.slug || "Profile"}
        </h4>

        {(profile.about || profile.tagline) && (
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {legacyPlainText(profile.about || profile.tagline)}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <Button asChild variant="outline" size="sm" className="h-7 px-3 text-[11px]">
            <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
              View
            </a>
          </Button>
          <button
            type="button"
            onClick={() => shareProfile(profile)}
            className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Share"
          >
            <Share2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedView({ profiles }: { profiles: PublicProfile[] }) {
  if (profiles.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden">
        <Swiper
          modules={[FreeMode, Pagination]}
          freeMode={true}
          grabCursor={true}
          pagination={{ clickable: true }}
          spaceBetween={16}
          slidesPerView="auto"
          className="[&_.swiper-wrapper]:items-stretch !pb-8 [&_.swiper-pagination-bullet]:!w-2 [&_.swiper-pagination-bullet]:!h-2 [&_.swiper-pagination-bullet]:!rounded-full [&_.swiper-pagination-bullet]:!bg-muted-foreground/40 [&_.swiper-pagination-bullet]:!opacity-100 [&_.swiper-pagination-bullet-active]:!bg-foreground [&_.swiper-pagination-bullet-active]:!scale-125"
        >
          {profiles.map((p) => (
            <SwiperSlide
              key={p.slug}
              className="!w-[260px] sm:!w-[280px] !h-auto"
            >
              <FeedProfileCard profile={p} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

// --- Main Component ---

export function ProfileSpotlightBlock({ block }: { block: PageBlock }) {
  const data = block as SpotlightBlock;
  const mode = data.mode ?? "spotlight";
  const isSpotlight = mode === "spotlight";

  const heading = data.heading;
  const subheading = data.subheading;
  const primarySlug = isSpotlight ? data.primaryProfileSlug : undefined;
  const feedSlugs = useMemo(
    () => (!isSpotlight ? (data.feedProfileSlugs ?? []) : []),
    [isSpotlight, data.feedProfileSlugs],
  );
  const feedSlugsKey = useMemo(() => feedSlugs.join("|"), [feedSlugs]);

  const [primaryProfile, setPrimaryProfile] = useState<PublicProfile | null>(
    null,
  );
  const [feedProfiles, setFeedProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const allSlugs = [
      ...(primarySlug ? [primarySlug] : []),
      ...feedSlugs,
    ];

    if (allSlugs.length === 0) {
      setPrimaryProfile(null);
      setFeedProfiles([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const { profiles } = await profilesService.getProfilesBySlugs(allSlugs);
        if (cancelled) return;

        const bySlug = new Map<string, PublicProfile>();
        for (const p of profiles) {
          if (p?.slug) bySlug.set(p.slug, p as PublicProfile);
        }

        setPrimaryProfile(primarySlug ? bySlug.get(primarySlug) ?? null : null);
        setFeedProfiles(
          feedSlugs
            .map((slug) => bySlug.get(slug))
            .filter((profile): profile is PublicProfile => Boolean(profile)),
        );
      } catch {
        if (cancelled) return;
        setPrimaryProfile(null);
        setFeedProfiles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [primarySlug, feedSlugsKey]);

  const resolvedHeading = useMemo(() => {
    if (heading) return heading;
    if (isSpotlight && primaryProfile) {
      return `Learn more about ${primaryProfile.name || primaryProfile.slug}`;
    }
    return null;
  }, [heading, isSpotlight, primaryProfile]);

  if (loading) {
    return (
      <section className="w-full">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
          <Skeleton className="h-6 w-56" />
          {isSpotlight ? (
            <>
              <Skeleton className="aspect-video w-full justmy-corners-xl" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full justmy-corners-xl" />
            </>
          ) : (
            <div className="flex gap-4 overflow-hidden">
              <Skeleton className="h-64 w-[260px] shrink-0 rounded-3xl" />
              <Skeleton className="h-64 w-[260px] shrink-0 rounded-3xl" />
              <Skeleton className="hidden h-64 w-[260px] shrink-0 rounded-3xl sm:block" />
            </div>
          )}
        </div>
      </section>
    );
  }

  const hasContent =
    (isSpotlight && primaryProfile) || (!isSpotlight && feedProfiles.length > 0);
  if (!hasContent) return null;

  return (
    <section className="w-full">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
        {(resolvedHeading || subheading) && (
          <header className="space-y-2">
            {resolvedHeading && (
              <h2 className="text-xl font-semibold text-foreground">
                {resolvedHeading}
              </h2>
            )}
            {subheading && (
              <p className="text-sm text-muted-foreground">{subheading}</p>
            )}
          </header>
        )}

        {isSpotlight && primaryProfile && (
          <SpotlightView profile={primaryProfile} />
        )}

        {!isSpotlight && <FeedView profiles={feedProfiles} />}
      </div>
    </section>
  );
}
