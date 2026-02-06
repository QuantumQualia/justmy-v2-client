"use client";

import React, { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { Button } from "@workspace/ui/components/button";
import { useIsMobile } from "@/hooks/use-is-mobile";
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
import type { Phone as PhoneType, Address } from "@/lib/store";
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
import type { ProfileKind } from "@/components/mycard/inline-edit";
import PhoneCaseWrapper from "@/components/mycard/phone-case-wrapper";
import { openShare } from "@/components/share/share-store";
import type { ProfileData, SocialLink } from "@/lib/store";

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

interface MyCardLiveProps {
  data: ProfileData;
  profileType?: ProfileKind;
}

// Selection Modal Component
interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  items: Array<{ id: string; label: string; subtitle?: string }>;
  onSelect: (id: string) => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  items,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm animate-in zoom-in-95 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4 text-slate-300" />
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item.id);
                onClose();
              }}
              className="w-full p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-lg transition-all text-left cursor-pointer"
            >
              <div className="text-sm font-medium text-white">{item.label}</div>
              {item.subtitle && (
                <div className="text-xs text-slate-400 mt-1">{item.subtitle}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function MyCardLive({
  data,
  profileType = "personal",
}: MyCardLiveProps) {
  const swiperRef = useRef<HTMLDivElement>(null);
  const [shouldCenter, setShouldCenter] = useState(false);
  const isMobile = useIsMobile();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

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

      setShouldCenter(shouldCenterItems);
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [totalItems]);

  const content = (
    <div className="text-white w-full">
      {/* Mobile View Container */}
      <div className="w-full mx-auto bg-slate-900 relative overflow-hidden">
        {/* Banner and Profile Image */}
        <div className="relative">
          <div className="relative h-48 bg-gradient-to-r from-orange-600 to-amber-600 overflow-hidden rounded-b-lg">
            <div className="absolute inset-0 bg-black/10" />
            {data.banner ? (
              <img
                src={data.banner}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>

          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-slate-800 border-4 border-slate-900 overflow-hidden">
                {data.photo ? (
                  <img
                    src={data.photo}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-slate-700">
                    <span className="text-2xl font-bold text-slate-400">
                      {data.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 pt-16 pb-8 space-y-6">
          {/* Social Links - Swiper Slider */}
          <div className="relative" ref={swiperRef}>
            <Swiper
              modules={[FreeMode]}
              freeMode={true}
              slidesPerView="auto"
              spaceBetween={12}
              mousewheel={true}
              grabCursor={true}
              className={`!px-1 ${shouldCenter ? '[&_.swiper-wrapper]:justify-center' : '[&_.swiper-wrapper]:justify-start'}`}
            >
              {/* Upload - Fixed, always first */}
              <SwiperSlide className="!w-auto !h-[45px] !flex items-center justify-center">
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
                  className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group"
                  title="Upload/Share"
                >
                  <div className="text-white group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5" />
                  </div>
                </button>
              </SwiperSlide>

              {/* Phone - if phones array has items (show all phones) */}
              {data.phones && data.phones.length > 0 && (
                <SwiperSlide className="!w-auto !h-[45px] !flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (data.phones && data.phones.length > 1) {
                        setShowPhoneModal(true);
                      } else {
                        // Single phone - call directly
                        const firstPhone = data.phones?.[0];
                        if (firstPhone) {
                          window.location.href = `tel:${firstPhone.number}`;
                        }
                      }
                    }}
                    className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group"
                    title={
                      data.phones.length > 1
                        ? `Phone (${data.phones.length} numbers)`
                        : `Phone: ${data.phones[0]?.number}`
                    }
                  >
                    <div className="text-white group-hover:scale-110 transition-transform">
                      <Phone className="h-5 w-5" />
                    </div>
                    {data.phones.length > 1 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-xs flex items-center justify-center text-white">
                        {data.phones.length}
                      </span>
                    )}
                  </button>
                </SwiperSlide>
              )}

              {/* Email - if available */}
              {data.email && (
                <SwiperSlide className="!w-auto !h-[45px] !flex items-center justify-center">
                  <a
                    href={`mailto:${data.email}`}
                    className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group"
                    title={`Email: ${data.email}`}
                  >
                    <div className="text-white group-hover:scale-110 transition-transform">
                      <Mail className="h-5 w-5" />
                    </div>
                  </a>
                </SwiperSlide>
              )}

              {/* Website - if available */}
              {data.website && (
                <SwiperSlide className="!w-auto !h-[45px] !flex items-center justify-center">
                  <a href={data.website} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group" title={`Website: ${data.website}`}>
                    <div className="text-white group-hover:scale-110 transition-transform">
                      <Globe className="h-5 w-5" />
                    </div>
                  </a>
                </SwiperSlide>
              )}

              {/* Address - if addresses array has items (show all addresses) */}
              {data.addresses && data.addresses.length > 0 && (
                <SwiperSlide className="!w-auto !h-[45px] !flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (data.addresses && data.addresses.length > 1) {
                        setShowAddressModal(true);
                      } else {
                        // Single address - open directly
                        const firstAddress = data.addresses?.[0];
                        if (firstAddress) {
                          // Use address string, or construct from latitude/longitude if available
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
                    className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group"
                    title={
                      data.addresses.length > 1
                        ? `Address (${data.addresses.length} locations)`
                        : `Address: ${data.addresses[0]?.address || ""}`
                    }
                  >
                    <div className="text-white group-hover:scale-110 transition-transform">
                      <MapPin className="h-5 w-5" />
                    </div>
                    {data.addresses.length > 1 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-xs flex items-center justify-center text-white">
                        {data.addresses.length}
                      </span>
                    )}
                  </button>
                </SwiperSlide>
              )}

              {/* Calendar Link - if available */}
              {data.calendarLink && (
                <SwiperSlide className="!w-auto !h-[45px] !flex items-center justify-center">
                  <a
                    href={data.calendarLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group"
                    title="Calendar"
                  >
                    <div className="text-white group-hover:scale-110 transition-transform">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </a>
                </SwiperSlide>
              )}

              {/* Social Links - actual social media platforms */}
              {data.socialLinks.map((link) => (
                <SwiperSlide key={link.id} className="!w-auto !h-[45px] !flex items-center justify-center">
                  <a
                    href={link.url || "#"}
                    onClick={(e) => {
                      if (!link.url) {
                        e.preventDefault();
                      }
                    }}
                    className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer group"
                    title={link.label || link.type}
                  >
                    <div className="text-white group-hover:scale-110 transition-transform">
                      {getSocialIcon(link.type)}
                    </div>
                  </a>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Name and Tagline */}
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-slate-200">{data.name}</h1>
            <p className="text-sm text-slate-400 break-words">{data.tagline}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button className="w-full bg-gradient-to-r from-slate-800 to-slate-800/90 hover:from-slate-700 hover:to-slate-700/90 text-white border border-slate-700/50 shadow-lg shadow-slate-900/20 touch-manipulation cursor-pointer font-medium">
              Save to Contacts
            </Button>
            <Button className="w-full bg-gradient-to-r from-slate-800 to-slate-800/90 hover:from-slate-700 hover:to-slate-700/90 text-white border border-slate-700/50 shadow-lg shadow-slate-900/20 touch-manipulation cursor-pointer font-medium">
              Send myCARD
            </Button>
          </div>

          {/* Hotlinks */}
          {data.hotlinks.length > 0 && (
            <div className="space-y-2">
              {data.hotlinks.map((hotlink) => (
                <a
                  key={hotlink.id}
                  href={hotlink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/30 rounded-xl border border-slate-700/50 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 backdrop-blur-sm group"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-100 block truncate">
                      {hotlink.title}
                    </span>
                    {hotlink.url && (
                      <span className="text-xs text-slate-400/80 block truncate mt-1">
                        {hotlink.url}
                      </span>
                    )}
                  </div>
                  <LinkIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          )}

          {/* About Section */}
          {data.about && (
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-100">About</h2>
              <div className="p-5 bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/30 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {data.about}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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

  // On mobile, render content directly without phone case
  // On desktop, wrap in PhoneCaseWrapper to simulate mobile device
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
      />

      {/* Address Selection Modal */}
      <SelectionModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title="Select Address"
        icon={<MapPin className="h-5 w-5" />}
        items={addressItems}
        onSelect={handleAddressSelect}
      />

      {isMobile ? content : <PhoneCaseWrapper>{content}</PhoneCaseWrapper>}
    </>
  );
}

