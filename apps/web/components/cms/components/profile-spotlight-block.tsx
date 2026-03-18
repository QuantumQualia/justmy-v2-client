"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Share2,
  X,
} from "lucide-react";
import type { PageBlock } from "@/lib/services/cms";
import { profilesService } from "@/lib/services/profiles";
import { getVideoEmbedUrl } from "@/lib/utils/video";
import { openShare } from "@/components/common/share/share-store";
import { AdBanner, type AdBannerHotlink } from "@/components/common/ad-banner";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import { Button } from "@workspace/ui/components/button";
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
  videos?: { id: string; videoUrl: string; title?: string }[];
  phones?: PublicProfilePhone[];
  locations?: PublicProfileLocation[];
  hotlinks?: PublicProfileHotlink[];
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

function buildAdBannerHotlinks(
  profile: PublicProfile,
): [AdBannerHotlink, AdBannerHotlink, AdBannerHotlink] | null {
  const raw = (profile.hotlinks ?? []).map((h) => ({
    label: h.label,
    href: h.link,
  }));

  const defaults: AdBannerHotlink[] = [
    { label: "View Profile", href: `/${profile.slug}` },
  ];
  if (profile.website) {
    defaults.push({ label: "Website", href: profile.website });
  }
  defaults.push({ label: "Share", href: `/${profile.slug}` });

  const combined = [...raw, ...defaults];
  if (combined.length < 3) return null;

  return [combined[0]!, combined[1]!, combined[2]!];
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

function SpotlightView({ profile }: { profile: PublicProfile }) {
  const videoUrl = profile.videos?.[0]?.videoUrl?.trim() || 'https://www.youtube.com/watch?v=wDchsz8nmbo';
  const adHotlinks = buildAdBannerHotlinks(profile);

  return (
    <Card className="overflow-hidden border-border py-0 rounded-br-none">
      {/* Hero: video or banner */}
      {videoUrl ? (
        <div className="relative w-full bg-muted pt-[56.25%]">
          {getVideoEmbedUrl(videoUrl) ? (
            <iframe
              src={getVideoEmbedUrl(videoUrl)!}
              title="Profile video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <video
              src={videoUrl}
              controls
              className="absolute inset-0 h-full w-full"
            />
          )}
        </div>
      ) : profile.banner ? (
        <div className="relative w-full">
          <img
            src={profile.banner}
            alt={profile.name || profile.slug}
            className="w-full object-cover"
          />
        </div>
      ) : null}

      <CardContent className="space-y-4 px-5 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Left: photo + name + contact bar */}
          <div className="flex items-center gap-4">
            <a
              href={`/${profile.slug}`}
              target="_blank"
              rel="noreferrer"
              className="block h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted shadow transition-transform hover:scale-105"
            >
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.name || profile.slug}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground">
                  {(profile.name || profile.slug || "?").charAt(0)}
                </div>
              )}
            </a>

            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="text-base font-bold leading-tight text-foreground">
                {profile.name || profile.slug}
              </h3>
              <ContactBar profile={profile} />
            </div>
          </div>

          {/* View Profile button: bottom on mobile, right on desktop */}
          <div className="mx-auto sm:ml-auto sm:mr-0 sm:flex-shrink-0">
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1.5 h-3 w-3" />
                View Profile
              </a>
            </Button>
          </div>
        </div>

        {/* Ad banner with hotlinks */}
        {profile.banner && adHotlinks && (
          <AdBanner
            imageSrc={profile.banner}
            imageAlt={`${profile.name || profile.slug} banner`}
            imageElement={
              <img
                src={profile.banner}
                alt={`${profile.name || profile.slug} banner`}
                className="h-full w-full rounded-lg rounded-br-none object-cover mt-5"
              />
            }
            bannerLink={`/${profile.slug}`}
            profileSlug={profile.slug}
            hotlinks={adHotlinks}
          />
        )}
      </CardContent>
    </Card>
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
            {profile.about || profile.tagline}
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

        setPrimaryProfile(
          primarySlug
            ? bySlug.get(primarySlug) ?? { slug: primarySlug }
            : null,
        );
        setFeedProfiles(
          feedSlugs.map((s) => bySlug.get(s) ?? { slug: s }),
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
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
