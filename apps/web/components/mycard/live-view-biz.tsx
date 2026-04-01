"use client";

import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import {
  Upload,
  Mail,
  Calendar,
  Phone,
  MapPin,
  Link as LinkIcon,
  Globe,
  X,
} from "lucide-react";
import {
  SiFacebook,
  SiInstagram,
  SiX,
  SiLinkedin,
  SiYoutube,
  SiVimeo,
  SiYelp,
  SiBehance,
  SiDeviantart,
  SiDigg,
  SiDribbble,
  SiDiscord,
  SiEtsy,
  SiFiverr,
  SiFlickr,
  SiGithub,
  SiImdb,
  SiLastdotfm,
  SiMix,
  SiMyspace,
  SiPaypal,
  SiPinterest,
  SiQuora,
  SiReddit,
  SiSnapchat,
  SiSoundcloud,
  SiTiktok,
  SiThreads,
  SiTumblr,
  SiTwitch,
  SiVk,
  SiWhatsapp,
  SiXing,
} from "react-icons/si";
import type { ProfileKind } from "@/components/mycard/inline-edit-view";
import { openShare } from "@/components/common/share/share-store";
import type { ProfileData, SocialLink } from "@/lib/store";
import { useMycardPublicNavStore } from "@/lib/store/mycard-public-nav-store";
import { registerTypeFromProfile } from "@/lib/mycard/register-type-from-profile";
import { useTheme } from "next-themes";
import { apiRequest } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { MyCardMobileBizView } from "@/components/mycard/live-view-mobile-biz";
import { MyCardDesktopBizView } from "@/components/mycard/live-view-desktop-biz";

/** Same `Button` styles for hotlinks (`asChild` → `<a>`) and Save / Send myCARD. */
const MY_CARD_CTA_BUTTON_CLASSNAME =
  "w-full bg-gradient-to-r justmy-corners from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white border border-purple-700/40 shadow-lg shadow-purple-900/10 touch-manipulation cursor-pointer font-medium";

const getSocialIcon = (type: SocialLink["type"], size: "sm" | "md" = "md") => {
  const iconSize = size === "sm" ? 16 : 20;
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  switch (type) {
    case "facebook":
      return <SiFacebook size={iconSize} />;
    case "instagram":
      return <SiInstagram size={iconSize} />;
    case "x":
      return <SiX size={iconSize} />;
    case "linkedin":
      return <SiLinkedin size={iconSize} />;
    case "youtube":
      return <SiYoutube size={iconSize} />;
    case "vimeo":
      return <SiVimeo size={iconSize} />;
    case "yelp":
      return <SiYelp size={iconSize} />;
    case "behance":
      return <SiBehance size={iconSize} />;
    case "deviantart":
      return <SiDeviantart size={iconSize} />;
    case "digg":
      return <SiDigg size={iconSize} />;
    case "dribbble":
      return <SiDribbble size={iconSize} />;
    case "discord":
      return <SiDiscord size={iconSize} />;
    case "etsy":
      return <SiEtsy size={iconSize} />;
    case "fiverr":
      return <SiFiverr size={iconSize} />;
    case "flickr":
      return <SiFlickr size={iconSize} />;
    case "github":
      return <SiGithub size={iconSize} />;
    case "imdb":
      return <SiImdb size={iconSize} />;
    case "lastfm":
      return <SiLastdotfm size={iconSize} />;
    case "mix":
      return <SiMix size={iconSize} />;
    case "myspace":
      return <SiMyspace size={iconSize} />;
    case "paypal":
      return <SiPaypal size={iconSize} />;
    case "pinterest":
      return <SiPinterest size={iconSize} />;
    case "quora":
      return <SiQuora size={iconSize} />;
    case "reddit":
      return <SiReddit size={iconSize} />;
    case "snapchat":
      return <SiSnapchat size={iconSize} />;
    case "soundcloud":
      return <SiSoundcloud size={iconSize} />;
    case "tiktok":
      return <SiTiktok size={iconSize} />;
    case "threads":
      return <SiThreads size={iconSize} />;
    case "tumblr":
      return <SiTumblr size={iconSize} />;
    case "twitch":
      return <SiTwitch size={iconSize} />;
    case "vk":
      return <SiVk size={iconSize} />;
    case "whatsapp":
      return <SiWhatsapp size={iconSize} />;
    case "xing":
      return <SiXing size={iconSize} />;
    default:
      return <LinkIcon className={iconClass} />;
  }
};

interface MyCardBizLiveProps {
  data: ProfileData;
  profileType?: ProfileKind;
  /**
   * When true (default), registers the global myCARD public navbar for this view.
   * Set false for `/mycard/edit` preview and CMS embeds so the normal navbar stays in place.
   */
  usePublicNavbar?: boolean;
}

const MYCARD_FOOTER_AD_KEY = "system/images/mycard_footer_20260326.png";

// Selection Modal Component
interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  items: Array<{ id: string; label: string; subtitle?: string }>;
  onSelect: (id: string) => void;
  variant?: "light" | "dark";
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  items,
  onSelect,
  variant = "dark",
}) => {
  if (!isOpen) return null;

  const isLight = variant === "light";
  const overlayClass = isLight ? "bg-black/30" : "bg-black/70";
  const cardClass = isLight
    ? "bg-card p-6 rounded-2xl border border-border shadow-2xl w-full max-w-sm"
    : "bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm";
  const closeBtnClass = isLight
    ? "bg-muted hover:bg-muted"
    : "bg-slate-700 hover:bg-slate-600";
  const titleClass = isLight ? "text-foreground" : "text-white";
  const itemBtnClass = isLight
    ? "w-full p-4 border border-border bg-[var(--glass-bg)] shadow-[0_2px_10px_oklch(0_0_0/_0.06)] backdrop-blur-[12px] hover:border-primary/30 justmy-corners transition-all text-left cursor-pointer"
    : "w-full p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 justmy-corners transition-all text-left cursor-pointer";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${overlayClass} backdrop-blur-sm p-4 animate-in fade-in`}
      onClick={onClose}
    >
      <div
        className={`${cardClass} animate-in zoom-in-95 max-h-[80vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${isLight ? "bg-muted" : "bg-slate-700"
                }`}
            >
              {icon}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${titleClass}`}>{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`h-8 w-8 rounded-full ${closeBtnClass} flex items-center justify-center transition-colors cursor-pointer`}
          >
            <X className={`h-4 w-4 ${isLight ? "text-muted-foreground" : "text-slate-300"}`} />
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item.id);
              }}
              className={itemBtnClass}
            >
              <div
                className={`text-sm font-medium ${isLight ? "text-foreground" : "text-white"
                  }`}
              >
                {item.label}
              </div>
              {item.subtitle && (
                <div
                  className={`text-xs mt-1 ${isLight ? "text-muted-foreground" : "text-slate-400"
                    }`}
                >
                  {item.subtitle}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function MyCardBizLive({
  data,
  usePublicNavbar = true,
}: MyCardBizLiveProps) {
  const swiperRef = useRef<HTMLDivElement>(null);
  const contactPrevBtnRef = useRef<HTMLButtonElement>(null);
  const contactNextBtnRef = useRef<HTMLButtonElement>(null);
  /** Mobile-first: avoids one frame of phone chrome on phones before `matchMedia` runs. */
  const [isNarrowViewport, setIsNarrowViewport] = useState(true);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [shouldCenterItems, setShouldCenterItems] = useState(true);
  const setMycardPublicProfile = useMycardPublicNavStore(
    (s) => s.setMycardPublicProfile
  );

  // Keep the public myCARD in the light theme (sample design).
  // This only changes Tailwind/theme tokens (via NextThemes' `.dark` class),
  // and is scoped to the public profile view (`usePublicNavbar=true`).
  const { resolvedTheme, setTheme } = useTheme();
  const prevResolvedThemeRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!usePublicNavbar) return;

    prevResolvedThemeRef.current = resolvedTheme ?? null;
    setTheme("light");

    return () => {
      const prev = prevResolvedThemeRef.current;
      setTheme(prev === "dark" || prev === "light" ? prev : "dark");
    };
  }, [usePublicNavbar, resolvedTheme, setTheme]);

  useLayoutEffect(() => {
    if (usePublicNavbar) {
      setMycardPublicProfile(
        true,
        registerTypeFromProfile(data),
        data.slug
      );
    } else {
      setMycardPublicProfile(false);
    }
    return () => setMycardPublicProfile(false);
  }, [
    usePublicNavbar,
    data.slug,
    data.type,
    data.osName,
    setMycardPublicProfile,
  ]);

  const isLightMycard = usePublicNavbar;
  const outerTextClass = isLightMycard ? "text-foreground" : "text-white";
  const screenBgClass = isLightMycard ? "bg-background" : "bg-slate-900";
  const avatarOuterClass = isLightMycard
    ? "bg-card border-4 border-border shadow-xl"
    : "bg-slate-800 border-4 border-slate-900";
  const avatarPlaceholderBgClass = isLightMycard
    ? "bg-muted"
    : "bg-slate-700";
  const avatarPlaceholderTextClass = isLightMycard
    ? "text-muted-foreground"
    : "text-slate-400";
  const socialBtnColorClass = isLightMycard
    ? "bg-muted hover:bg-muted/70 border-border"
    : "bg-slate-800 hover:bg-slate-700 border-slate-700";
  const socialIconTextClass = isLightMycard ? "text-foreground/60" : "text-white";
  const actionGlassStyle = isLightMycard
    ? {
      background: "var(--glass-bg)",
      border: "1px solid var(--glass-border)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      boxShadow: "0 2px 12px oklch(0 0 0 / 0.08)",
    }
    : undefined;
  const nameTextClass = isLightMycard ? "text-foreground" : "text-slate-200";
  const taglineTextClass = isLightMycard
    ? "text-muted-foreground"
    : "text-slate-400";
  const aboutTitleTextClass = isLightMycard
    ? "text-foreground"
    : "text-slate-100";
  const aboutCardClass = isLightMycard
    ? "p-5 bg-card/90 rounded-lg rounded-br-none border border-border backdrop-blur-sm"
    : "p-5 bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/30 rounded-lg rounded-br-none border border-slate-700/50 backdrop-blur-sm";
  const aboutBodyTextClass = isLightMycard
    ? "text-muted-foreground"
    : "text-slate-200";

  const ctaButtonClassName = isLightMycard
    ? "block w-full py-3 px-4 justmy-corners text-center text-sm font-medium text-foreground transition-all duration-200 active:scale-95 hover:shadow-md border-[1.5px] border-border bg-[var(--hotlink-bg)] touch-manipulation cursor-pointer"
    : `block ${MY_CARD_CTA_BUTTON_CLASSNAME}`;
  const registerHref = `/register?type=${encodeURIComponent(
    registerTypeFromProfile(data)
  )}&ref=${encodeURIComponent(data.slug)}`;

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsNarrowViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Count total items
  const totalItems =
    1 + // Upload button (always present)
    (data.phones?.length ? 1 : 0) +
    (data.email ? 1 : 0) +
    (data.website ? 1 : 0) +
    (data.addresses?.length ? 1 : 0) +
    (data.calendarLink ? 1 : 0) +
    data.socialLinks.length;

  // Check if items should be centered on mobile
  useEffect(() => {
    const checkWidth = () => {
      if (!swiperRef.current) return;

      const container = swiperRef.current;
      const containerWidth = container.offsetWidth;

      // Each item is approximately 40px (h-10 w-10) + 12px spacing
      // On mobile, we consider items should be centered if they don't fill ~80% of width
      const itemWidth = 40 + 12; // item + spacing
      const estimatedTotalWidth = totalItems * itemWidth;

      const shouldCenterItems = estimatedTotalWidth < containerWidth * 0.8;

      setShouldCenterItems(shouldCenterItems);
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [totalItems]);

  const footerAdQuery = useQuery({
    queryKey: ["mycard-footer-ad-url", MYCARD_FOOTER_AD_KEY],
    queryFn: async () => {
      const payload = await apiRequest<{ url?: string }>("files/presigned-url", {
        method: "GET",
        params: { key: MYCARD_FOOTER_AD_KEY },
        skipAuth: true,
      });
      return payload.url ?? "";
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
  const footerAdUrl = footerAdQuery.data ?? "";

  const contactActions = (
    <>
      {/* Upload - Fixed, always first */}
      <button
        onClick={(e) => {
          e.preventDefault();

          openShare({
            title: data.name || "myCARD",
            description: data.tagline || "Check out this myCARD",
            url: `${process.env.NEXT_PUBLIC_APP_URL}/${data.slug}`,
            imageUrl: data.banner || data.photo || undefined,
            entityLabel: data.type || undefined,
          });
        }}
        className={`flex-shrink-0 h-10 w-10 rounded-full ${socialBtnColorClass} border flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group`}
        style={actionGlassStyle}
        title="Upload/Share"
      >
        <div className={`${socialIconTextClass} group-hover:scale-110 transition-transform`}>
          <Upload className="h-5 w-5" />
        </div>
      </button>

      {/* Phone - if phones array has items (show all phones) */}
      {data.phones && data.phones.length > 0 && (
        <button
          onClick={(e) => {
            e.preventDefault();
            if (data.phones && data.phones.length > 1) {
              setShowPhoneModal(true);
            } else {
              const firstPhone = data.phones?.[0];
              if (firstPhone) {
                window.location.href = `tel:${firstPhone.number}`;
              }
            }
          }}
          className={`flex-shrink-0 h-10 w-10 rounded-full ${socialBtnColorClass} border flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group`}
          style={actionGlassStyle}
          title={
            data.phones.length > 1
              ? `Phone (${data.phones.length} numbers)`
              : `Phone: ${data.phones[0]?.number}`
          }
        >
          <div className={`${socialIconTextClass} group-hover:scale-110 transition-transform`}>
            <Phone className="h-5 w-5" />
          </div>
          {data.phones.length > 1 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-xs flex items-center justify-center text-accent-foreground">
              {data.phones.length}
            </span>
          )}
        </button>
      )}

      {/* Email - if available */}
      {data.email && (
        <a
          href={`mailto:${data.email}`}
          className={`flex-shrink-0 h-10 w-10 rounded-full ${socialBtnColorClass} border flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group`}
          style={actionGlassStyle}
          title={`Email: ${data.email}`}
        >
          <div className={`${socialIconTextClass} group-hover:scale-110 transition-transform`}>
            <Mail className="h-5 w-5" />
          </div>
        </a>
      )}

      {/* Website - if available */}
      {data.website && (
        <a
          href={data.website}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-shrink-0 h-10 w-10 rounded-full ${socialBtnColorClass} border flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group`}
          style={actionGlassStyle}
          title={`Website: ${data.website}`}
        >
          <div className={`${socialIconTextClass} group-hover:scale-110 transition-transform`}>
            <Globe className="h-5 w-5" />
          </div>
        </a>
      )}

      {/* Address - if addresses array has items (show all addresses) */}
      {data.addresses && data.addresses.length > 0 && (
        <button
          onClick={(e) => {
            e.preventDefault();
            if (data.addresses && data.addresses.length > 1) {
              setShowAddressModal(true);
            } else {
              const firstAddress = data.addresses?.[0];
              if (firstAddress) {
                let queryString = firstAddress.address;
                if (firstAddress.latitude && firstAddress.longitude) {
                  queryString = `${firstAddress.latitude},${firstAddress.longitude}`;
                } else if (!queryString && firstAddress.title) {
                  queryString = firstAddress.title;
                }
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryString)}`,
                  "_blank"
                );
              }
            }
          }}
          className={`flex-shrink-0 h-10 w-10 rounded-full ${socialBtnColorClass} border flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group`}
          style={actionGlassStyle}
          title={
            data.addresses.length > 1
              ? `Address (${data.addresses.length} locations)`
              : `Address: ${data.addresses[0]?.address || ""}`
          }
        >
          <div className={`${socialIconTextClass} group-hover:scale-110 transition-transform`}>
            <MapPin className="h-5 w-5" />
          </div>
          {data.addresses.length > 1 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-xs flex items-center justify-center text-accent-foreground">
              {data.addresses.length}
            </span>
          )}
        </button>
      )}

      {/* Calendar Link - if available */}
      {data.calendarLink && (
        <a
          href={data.calendarLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-shrink-0 h-10 w-10 rounded-full ${socialBtnColorClass} border flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group`}
          style={actionGlassStyle}
          title="Calendar"
        >
          <div className={`${socialIconTextClass} group-hover:scale-110 transition-transform`}>
            <Calendar className="h-5 w-5" />
          </div>
        </a>
      )}

      {/* Social Links - actual social media platforms */}
      {data.socialLinks.map((link) => (
        <a
          key={link.id}
          href={link.url || "#"}
          onClick={(e) => {
            if (!link.url) {
              e.preventDefault();
            }
          }}
          className={`flex-shrink-0 h-10 w-10 rounded-full ${socialBtnColorClass} border flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group`}
          style={actionGlassStyle}
          title={link.label || link.type}
        >
          <div className={`${socialIconTextClass} group-hover:scale-110 transition-transform`}>
            {getSocialIcon(link.type)}
          </div>
        </a>
      ))}
    </>
  );

  // Prepare phone selection items
  const phoneItems = data.phones?.map((phone) => ({
    id: phone.id,
    label: phone.number,
    subtitle: phone.type ? `Type: ${phone.type}` : undefined,
  })) || [];

  // Prepare address selection items
  const addressItems = data.addresses?.map((address, index) => {
    return {
      id: address.id,
      label: address.title || `Address ${index + 1}`,
      subtitle: address.address || undefined,
    };
  }) || [];

  const handlePhoneSelect = (phoneId: string) => {
    const selectedPhone = data.phones?.find((p) => p.id === phoneId);
    if (selectedPhone) {
      window.location.href = `tel:${selectedPhone.number}`;
    }
  };

  const handleAddressSelect = (addressId: string) => {
    const selectedAddress = data.addresses?.find((a) => a.id === addressId);
    if (selectedAddress) {
      // Use address string, or construct from latitude/longitude if available
      let queryString = selectedAddress.address;
      if (selectedAddress.latitude && selectedAddress.longitude) {
        queryString = `${selectedAddress.latitude},${selectedAddress.longitude}`;
      } else if (!queryString && selectedAddress.title) {
        queryString = selectedAddress.title;
      }
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryString)}`,
        "_blank"
      );
    }
  };

  return (
    <>
      {/* Phone Selection Modal */}
      <SelectionModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        title="Select Phone Number"
        icon={<Phone className="h-5 w-5" />}
        items={phoneItems}
        onSelect={handlePhoneSelect}
        variant={usePublicNavbar ? "light" : "dark"}
      />

      {/* Address Selection Modal */}
      <SelectionModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title="Select Address"
        icon={<MapPin className="h-5 w-5" />}
        items={addressItems}
        onSelect={handleAddressSelect}
        variant={usePublicNavbar ? "light" : "dark"}
      />

      {isNarrowViewport ? (
        <MyCardMobileBizView
          data={data}
          usePublicNavbar={usePublicNavbar}
          outerTextClass={outerTextClass}
          screenBgClass={screenBgClass}
          avatarOuterClass={avatarOuterClass}
          avatarPlaceholderBgClass={avatarPlaceholderBgClass}
          avatarPlaceholderTextClass={avatarPlaceholderTextClass}
          nameTextClass={nameTextClass}
          taglineTextClass={taglineTextClass}
          aboutTitleTextClass={aboutTitleTextClass}
          aboutCardClass={aboutCardClass}
          aboutBodyTextClass={aboutBodyTextClass}
          ctaButtonClassName={ctaButtonClassName}
          registerHref={registerHref}
          footerAdUrl={footerAdUrl}
          shouldCenterItems={shouldCenterItems}
          swiperRef={swiperRef}
          contactPrevBtnRef={contactPrevBtnRef}
          contactNextBtnRef={contactNextBtnRef}
          contactActions={contactActions}
          isLightMycard={isLightMycard}
        />
      ) : (
        <MyCardDesktopBizView
          data={data}
          usePublicNavbar={usePublicNavbar}
          outerTextClass={outerTextClass}
          avatarOuterClass={avatarOuterClass}
          avatarPlaceholderBgClass={avatarPlaceholderBgClass}
          avatarPlaceholderTextClass={avatarPlaceholderTextClass}
          ctaButtonClassName={ctaButtonClassName}
          registerHref={registerHref}
          contactActions={contactActions}
        />
      )}
    </>
  );
}

