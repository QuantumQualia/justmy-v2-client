"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ImageCropModal, ImageInsertDialog } from "@/components/common/image-dialogs";
import { readFileAsDataUrl } from "@/lib/read-image-files";
import { AIAboutAssistant } from "@/components/mycard/ai-about-assistant";
import { ContentHubLiteView } from "@/components/content/content-hub-lite-view";
import { MyCardContentLiteView } from "@/components/mycard/mycard-content-lite-view";
import {
  MycardFallbackBanner,
  MycardProfileAvatar,
  hasMycardMedia,
} from "@/components/mycard/mycard-cover-fallbacks";
import { cn } from "@workspace/ui/lib/utils";
import type { ProfileData, SocialLink, Hotlink, SocialType } from "@/lib/store";
import { useProfileStore } from "@/lib/store";
import { profilesService } from "@/lib/services/profiles";
import { uploadBase64Image } from "@/lib/api-client";
import { mapProfileDataToUpdateDto } from "@/lib/store/profile-mapper";
import { combineAddressFields, extractAddressFields } from "@/lib/utils/address-utils";
import { PROFILE_KIND, type ProfileKind } from "@/lib/os-types";
import {
  Pencil,
  Image as ImageIcon,
  Upload,
  Mail,
  Calendar,
  Phone,
  MapPin,
  Link as LinkIcon,
  Plus,
  Trash2,
  X,
  Globe,
  Sparkles,
  Loader2,
} from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import {
  SiFacebook,
  SiInstagram,
  SiX,
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

// Types - SocialType is imported from store

export type MyCardMode = "edit" | "live";
export type { ProfileKind } from "@/lib/os-types";
type ModalAppearance = "light" | "dark";

function modalUi(appearance: ModalAppearance = "dark") {
  const isLight = appearance === "light";
  const lightScroll =
    "[scrollbar-width:thin] [scrollbar-color:rgb(203_213_225)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300";
  return {
    isLight,
    overlay: isLight ? "bg-slate-900/40" : "bg-black/70",
    card: isLight
      ? "bg-white p-6 rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm text-slate-900"
      : "bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm",
    scroll: isLight ? lightScroll : "custom-scrollbar",
    iconWrap: isLight ? "bg-slate-100 text-slate-600" : "bg-slate-700",
    title: isLight ? "text-slate-900" : "text-white",
    desc: isLight ? "text-slate-500" : "text-slate-400",
    closeBtn: isLight ? "bg-slate-100 hover:bg-slate-200" : "bg-slate-700 hover:bg-slate-600",
    closeIcon: isLight ? "text-slate-500" : "text-slate-300",
    input: isLight
      ? "w-full bg-white border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-200"
      : "w-full bg-slate-900/50 border-slate-600 text-sm focus:border-blue-500",
    item: isLight
      ? "p-3 rounded-xl border border-slate-200 bg-slate-50"
      : "p-3 bg-slate-900/50 rounded-lg",
    itemTitle: isLight ? "text-sm font-medium text-slate-900" : "text-sm font-medium text-white",
    itemSub: isLight ? "text-xs text-slate-500" : "text-xs text-slate-400",
    addTile: isLight
      ? "flex flex-col items-center gap-1.5 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-violet-200 rounded-xl transition-all group cursor-pointer"
      : "flex flex-col items-center gap-1.5 p-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-blue-500 rounded-lg transition-all group cursor-pointer",
    addTileIcon: isLight
      ? "h-8 w-8 rounded-full bg-white border border-slate-200 text-slate-600 group-hover:border-violet-200 group-hover:text-violet-700 flex items-center justify-center transition-colors"
      : "h-8 w-8 rounded-full bg-slate-800 group-hover:bg-blue-600 flex items-center justify-center transition-colors",
    addTileLabel: isLight
      ? "text-[10px] font-medium text-slate-500 leading-tight text-center"
      : "text-[10px] font-medium text-slate-300 leading-tight text-center",
    saveBtn: isLight
      ? "px-4 py-2.5 text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
      : "px-4 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer",
    secondaryBtn: isLight
      ? "px-4 py-2.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
      : "px-4 py-2.5 text-sm font-medium bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors cursor-pointer",
    dangerBtn: isLight
      ? "px-4 py-2.5 text-sm font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
      : "px-4 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer",
    sectionLabel: isLight ? "text-sm font-semibold text-slate-500 mb-2" : "text-sm font-semibold text-slate-400 mb-2",
  };
}

// Helper: Simple field edit modal props
interface SimpleFieldEditModalProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
  placeholder: string;
  type?: "text" | "email" | "url";
  error?: string;
  validate?: (value: string) => string | undefined;
  appearance?: ModalAppearance;
}

// Helper: Simple field edit modal component
const SimpleFieldEditModal: React.FC<SimpleFieldEditModalProps> = ({
  title,
  description,
  icon,
  value,
  onChange,
  onSave,
  onCancel,
  onRemove,
  showRemove = false,
  placeholder,
  type = "text",
  error,
  validate,
  appearance = "dark",
}) => {
  const ui = modalUi(appearance);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (validate) {
      const validationError = validate(newValue);
      // Error handling is done by parent component
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !error) {
      onSave();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", ui.iconWrap)}>
            {icon}
          </div>
          <div>
            <h3 className={cn("text-lg font-bold", ui.title)}>{title}</h3>
            <p className={cn("text-xs", ui.desc)}>{description}</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer", ui.closeBtn)}
        >
          <X className={cn("h-4 w-4", ui.closeIcon)} />
        </button>
      </div>
      <Input
        type={type}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(ui.input, "mb-1", error ? "border-red-500 focus:border-red-500" : "")}
        autoFocus
      />
      {error && <p className="text-xs text-red-400 mb-4">{error}</p>}
      <div className="flex gap-2 mt-2">
        <button
          onClick={onSave}
          disabled={!!error}
          className={cn("flex-1", ui.saveBtn)}
        >
          Save
        </button>
        {showRemove && onRemove && (
          <button
            onClick={onRemove}
            className={ui.dangerBtn}
          >
            Remove
          </button>
        )}
      </div>
    </>
  );
};

// Helper: Modal wrapper component
interface ModalWrapperProps {
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
  appearance?: ModalAppearance;
  cardClassName?: string;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  onClose,
  children,
  maxHeight = "max-h-[80vh]",
  appearance = "dark",
  cardClassName,
}) => {
  const ui = modalUi(appearance);
  const node = (
    <div
      className={cn("fixed inset-0 z-[80] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in", ui.overlay)}
      onClick={onClose}
    >
      <div
        className={cn(ui.card, "animate-in zoom-in-95 overflow-y-auto", ui.scroll, maxHeight, cardClassName)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
};

// Helper: Modal header component
interface ModalHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClose: () => void;
  appearance?: ModalAppearance;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ title, description, icon, onClose, appearance = "dark" }) => {
  const ui = modalUi(appearance);
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", ui.iconWrap)}>
          {icon}
        </div>
        <div>
          <h3 className={cn("text-lg font-bold", ui.title)}>{title}</h3>
          <p className={cn("text-xs", ui.desc)}>{description}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer", ui.closeBtn)}
      >
        <X className={cn("h-4 w-4", ui.closeIcon)} />
      </button>
    </div>
  );
};

export interface InlineEditProps {
  mode?: MyCardMode;
  /** Match public myCARD chrome (`light`) or the CMS dark editor. */
  appearance?: "light" | "dark";
  profileType?: ProfileKind;
  data: ProfileData;
  onDataChange: (updates: Partial<ProfileData>) => void;
  onSocialLinkUpdate: (id: string, updates: Partial<SocialLink>) => void;
  onSocialLinkAdd: (link: SocialLink) => void;
  onSocialLinkRemove: (id: string) => void;
  onHotlinkUpdate: (id: string, updates: Partial<Hotlink>) => void;
  onHotlinkAdd: (hotlink: Hotlink) => void;
  onHotlinkRemove: (id: string) => void;
}

const LIGHT_CTA_CLASSNAME =
  "block w-full py-3 px-4 justmy-corners text-center text-sm font-medium text-foreground transition-all duration-200 active:scale-95 hover:shadow-md border-[1.5px] border-border bg-[var(--hotlink-bg)] touch-manipulation cursor-pointer";

export default function InlineEdit({
  mode = "edit",
  appearance = "dark",
  data,
  onDataChange,
  onSocialLinkUpdate,
  onSocialLinkAdd,
  onSocialLinkRemove,
  onHotlinkUpdate,
  onHotlinkAdd,
  onHotlinkRemove,
}: InlineEditProps) {

  const isEditMode = mode === "edit";
  const isLight = appearance === "light";
  const ui = modalUi(appearance);
  const contactBtnClass = isLight
    ? "h-10 w-10 rounded-full border flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer bg-muted hover:bg-muted/70 border-border"
    : "h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors touch-manipulation relative cursor-pointer";
  const contactGlassStyle = isLight
    ? {
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 2px 12px oklch(0 0 0 / 0.08)",
      }
    : undefined;
  const contactIconClass = isLight ? "text-foreground/60" : undefined;
  const editPencilBtnClass = isLight
    ? "absolute right-0 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 group-hover:opacity-100 touch-manipulation h-9 w-9 rounded-lg bg-[var(--glass-bg)] border border-border hover:border-primary/30 flex items-center justify-center transition-all duration-200 cursor-pointer"
    : "absolute right-0 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 group-hover:opacity-100 touch-manipulation h-9 w-9 rounded-lg bg-gradient-to-br from-slate-700/60 to-slate-800/60 hover:from-blue-600 hover:to-blue-700 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-blue-500/30 cursor-pointer";
  const dashedAddClass = isLight
    ? "w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-[var(--glass-bg)] hover:bg-muted/60 transition-all duration-200 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
    : "w-full p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/20 rounded-xl border-2 border-dashed border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all duration-200 text-sm font-medium text-slate-400 hover:text-slate-300 cursor-pointer";
  const ctaButtonClassName = isLight
    ? LIGHT_CTA_CLASSNAME
    : "w-full bg-gradient-to-r from-slate-800 to-slate-800/90 hover:from-slate-700 hover:to-slate-700/90 text-white border border-slate-700/50 shadow-lg shadow-slate-900/20 touch-manipulation cursor-pointer font-medium";

  // Get profileId from data
  const profileId = data.id;

  // Auto-save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editingTagline, setEditingTagline] = useState(false);

  // Track initial load and last saved data
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lastSavedDataRef = useRef<string>("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extract only auto-save fields (name, tagline) for comparison
  const getAutoSaveFields = (profileData: ProfileData) => {
    return JSON.stringify({
      name: profileData.name,
      tagline: profileData.tagline,
    });
  };

  // Save function
  const performSave = async (profileData: ProfileData) => {
    if (!profileId) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const updateDto = mapProfileDataToUpdateDto(profileData);

      await profilesService.updateProfile(profileId, updateDto);

      setIsSaving(false);
      // Update last saved auto-save fields after successful save
      lastSavedDataRef.current = getAutoSaveFields(profileData);
    } catch (error) {
      setIsSaving(false);
      setSaveError(error instanceof Error ? error.message : "Failed to save profile");
    }
  };

  // Debounced save using use-debounce
  const debouncedSave = useDebouncedCallback(
    performSave,
    1000 // 1 second debounce
  );

  // Handle initial load - mark as complete after 1 second
  useEffect(() => {
    if (isInitialLoad) {
      const initTimer = setTimeout(() => {
        setIsInitialLoad(false);
        // Only track auto-save fields for comparison
        lastSavedDataRef.current = getAutoSaveFields(data);
      }, 1000); // 1 second grace period for initial load

      return () => clearTimeout(initTimer);
    }
  }, [isInitialLoad, data, profileId]);

  // Auto-save effect: only tracks changes to name, tagline, and about
  useEffect(() => {
    // Skip if still in initial load
    if (isInitialLoad) {
      return;
    }

    // Clear any existing save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Only save if in edit mode and profileId exists
    if (!isEditMode || !profileId) {
      return;
    }

    // Only check auto-save fields (name, tagline)
    const currentAutoSaveFields = getAutoSaveFields(data);

    // Check if auto-save fields actually changed
    if (lastSavedDataRef.current === currentAutoSaveFields) {
      return;
    }

    // AskSKY Apply (and other store writes) update tagline without the inline
    // editor being open. Don't PATCH the whole profile again.
    if (!editingName && !editingTagline) {
      lastSavedDataRef.current = currentAutoSaveFields;
      return;
    }

    // Wait for data to stabilize (500ms) then trigger debounced save
    saveTimeoutRef.current = setTimeout(() => {
      debouncedSave(data);
      // Update last saved reference after scheduling save
      lastSavedDataRef.current = currentAutoSaveFields;
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data.name, data.tagline, editingName, editingTagline, isEditMode, profileId, isInitialLoad, debouncedSave]);

  // Inline editing states
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingSocialLink, setEditingSocialLink] = useState<string | null>(null);
  const [editingSocialLinkUrl, setEditingSocialLinkUrl] = useState<string | undefined>(undefined); // Local state for editing
  const [editingHotlink, setEditingHotlink] = useState<string | null>(null);
  const [editingWebsite, setEditingWebsite] = useState<string | undefined>(undefined); // Local state for website editing
  const [editingEmail, setEditingEmail] = useState<string | undefined>(undefined); // Local state for email editing
  const [editingCalendarLink, setEditingCalendarLink] = useState<string | undefined>(undefined); // Local state for calendar link editing
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [editingFixedItem, setEditingFixedItem] = useState<"email" | "website" | "calendarLink" | "phone" | "address" | null>(null);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newPhoneType, setNewPhoneType] = useState("");
  const [newAddress, setNewAddress] = useState({ title: "", address: "", city: "", state: "", zipCode: "", country: "US" });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    website?: string;
    calendarLink?: string;
    phone?: string;
    socialLink?: string;
    hotlink?: Record<string, string | undefined>; // keyed by hotlink id
  }>({});
  const [imageUploadType, setImageUploadType] = useState<"banner" | "profile" | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInsertOpen, setImageInsertOpen] = useState(false);
  const pendingImageKindRef = useRef<"banner" | "profile" | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return undefined; // Empty is allowed (can be removed)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) return "Phone number is required";
    // Remove common phone formatting characters
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    // Check if it's all digits and has reasonable length (7-15 digits)
    const phoneRegex = /^\d{7,15}$/;
    if (!phoneRegex.test(cleaned)) {
      return "Please enter a valid phone number (7-15 digits)";
    }
    return undefined;
  };

  const validateUrl = (url: string): string | undefined => {
    if (!url.trim()) return undefined; // Empty is allowed (can be removed)
    try {
      // Try to create a URL object - this validates the format
      const urlObj = new URL(url);
      // Check if it's http or https
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return "URL must start with http:// or https://";
      }
      return undefined;
    } catch {
      // If URL constructor throws, it's invalid
      // But also allow if user is still typing (might not have protocol yet)
      if (url.trim() && !url.match(/^https?:\/\//i)) {
        return "Please enter a valid URL (e.g., https://example.com)";
      }
      return undefined;
    }
  };

  const addSocialLink = (type: SocialType) => {
    const getLabel = (socialType: SocialType): string => {
      const labels: Record<SocialType, string> = {
        facebook: "Facebook",
        instagram: "Instagram",
        x: "X (Twitter)",
        linkedin: "LinkedIn",
        youtube: "YouTube",
        vimeo: "Vimeo",
        yelp: "Yelp",
        behance: "Behance",
        deviantart: "DeviantArt",
        digg: "Digg",
        dribbble: "Dribbble",
        discord: "Discord",
        etsy: "Etsy",
        fiverr: "Fiverr",
        flickr: "Flickr",
        github: "GitHub",
        imdb: "IMDb",
        lastfm: "Last.fm",
        mix: "Mix",
        myspace: "MySpace",
        paypal: "PayPal",
        pinterest: "Pinterest",
        quora: "Quora",
        reddit: "Reddit",
        snapchat: "Snapchat",
        soundcloud: "SoundCloud",
        tiktok: "TikTok",
        threads: "Threads",
        tumblr: "Tumblr",
        twitch: "Twitch",
        vk: "VK",
        whatsapp: "WhatsApp",
        xing: "Xing",
      };
      return labels[socialType] || socialType.charAt(0).toUpperCase() + socialType.slice(1);
    };

    const newLink: SocialLink = {
      id: Date.now().toString(),
      type,
      url: "",
      label: getLabel(type),
    };
    onSocialLinkAdd(newLink);
    setShowAddSocial(false);
    // Open edit modal immediately for the newly added social link
    setEditingSocialLink(newLink.id);
    setEditingSocialLinkUrl(""); // Initialize with empty URL for new link
  };

  const addFixedItem = (type: "email" | "website" | "calendarLink" | "phone" | "address") => {
    setShowAddSocial(false);
    setEditingFixedItem(type);
    if (type === "phone") {
      setNewPhoneNumber("");
      setNewPhoneType("");
    } else if (type === "address") {
      setNewAddress({ title: "", address: "", city: "", state: "", zipCode: "", country: "" });
      setEditingAddressId(null);
    } else if (type === "website") {
      setEditingWebsite(""); // Initialize with empty string for new website
    } else if (type === "email") {
      setEditingEmail(""); // Initialize with empty string for new email
    } else if (type === "calendarLink") {
      setEditingCalendarLink(""); // Initialize with empty string for new calendar link
    }
  };

  const handleSaveFixedItem = () => {
    if (!editingFixedItem) return;

    if (editingFixedItem === "phone") {
      if (!newPhoneNumber.trim()) return;
      // Clean phone number (remove formatting)
      const cleanedNumber = newPhoneNumber.replace(/[\s\-\(\)\.]/g, "");
      const newPhone = {
        id: Date.now().toString(),
        number: cleanedNumber,
        type: newPhoneType.trim() || undefined,
      };
      const updatedPhones = [...(data.phones || []), newPhone];
      onDataChange({ phones: updatedPhones });
      performSave({ ...data, phones: updatedPhones });
      setNewPhoneNumber("");
      setNewPhoneType("");
      setValidationErrors((prev) => ({ ...prev, phone: undefined }));
    } else if (editingFixedItem === "address") {
      if (!newAddress.address.trim()) return;

      // Combine address fields into a single address string
      const combinedAddress = combineAddressFields({
        address: newAddress.address.trim(),
        city: newAddress.city.trim() || undefined,
        state: newAddress.state.trim() || undefined,
        zipCode: newAddress.zipCode.trim() || undefined,
        country: newAddress.country.trim() || undefined,
      });

      if (editingAddressId) {
        // Update existing address
        const updatedAddresses = data.addresses?.map((addr) =>
          addr.id === editingAddressId
            ? {
              ...addr,
              title: newAddress.title.trim() || undefined,
              address: combinedAddress,
            }
            : addr
        ) || [];
        onDataChange({ addresses: updatedAddresses });
        performSave({ ...data, addresses: updatedAddresses });
        setEditingAddressId(null);
      } else {
        // Add new address
        const address = {
          id: Date.now().toString(),
          title: newAddress.title.trim() || undefined,
          address: combinedAddress,
        };
        const updatedAddresses = [...(data.addresses || []), address];
        onDataChange({ addresses: updatedAddresses });
        performSave({ ...data, addresses: updatedAddresses });
      }
      setNewAddress({ title: "", address: "", city: "", state: "", zipCode: "", country: "" });
    } else {
      // For email, website, calendarLink - they will be edited in the modal
      // This is just to open the edit modal
    }
  };

  const addHotlink = () => {
    if (data.hotlinks.length >= 3) {
      return; // Limit to max 3 hotlinks
    }
    const newHotlink: Hotlink = {
      id: Date.now().toString(),
      title: "New Hotlink",
      url: "",
    };
    onHotlinkAdd(newHotlink);
    setEditingHotlink(newHotlink.id);
  };


  const getSocialIcon = (type: SocialType, size: "sm" | "md" = "md") => {
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
        return <FaLinkedin size={iconSize} />;
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

  // Only actual social media platforms (no upload, email, contact, phone, address)
  const socialTypes: SocialType[] = [
    "facebook", "instagram", "x", "linkedin", "youtube", "vimeo", "yelp",
    "behance", "deviantart", "digg", "dribbble", "discord", "etsy", "fiverr",
    "flickr", "github", "imdb", "lastfm", "mix", "myspace", "paypal",
    "pinterest", "quora", "reddit", "snapchat", "soundcloud", "tiktok",
    "threads", "tumblr", "twitch", "vk", "whatsapp", "xing"
  ];

  const availableSocialTypes = socialTypes.filter(
    (type) => !data.socialLinks.some((link) => link.type === type)
  );

  const openImageInsert = (kind: "banner" | "profile") => {
    pendingImageKindRef.current = kind;
    setImageUploadType(kind);
    setImageInsertOpen(true);
  };

  const handleImageCrop = async (croppedImage: string) => {
    if (!imageUploadType) return;

    try {
      const response = await uploadBase64Image<{ key: string; url: string }>(croppedImage);

      const imageKey = response.key;
      const imageUrl = response.url;

      if (imageUploadType === "banner") {
        // update the banner image in the data for immediate preview
        onDataChange({ banner: imageUrl });
        // Save banner update to API with stored key/URL
        await performSave({ ...data, banner: imageKey });
      } else if (imageUploadType === "profile") {
        // update the profile image in the data for immediate preview
        onDataChange({ photo: imageUrl });
        // Save photo update to API with stored key/URL
        await performSave({ ...data, photo: imageKey });
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setImagePreview(null);
      setImageUploadType(null);
    }
  };

  return (
    <div className={cn("w-full relative", isLight ? "text-foreground" : "text-white")}>
      {/* Mobile View Container */}
      <div
        className={cn(
          "w-full max-w-[375px] mx-auto relative overflow-hidden",
          isLight ? "bg-background border border-border/60 rounded-2xl shadow-sm" : "bg-slate-900 rounded-2xl shadow-2xl",
        )}
      >
        {/* Banner and Profile Image - Step 1 */}
        <div className="relative">
          {/* Edit Step Badge */}
          {isEditMode && !isLight && (
            <div className="absolute left-2 top-2 flex items-center gap-2 z-20">
              <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                1
              </div>
            </div>
          )}
          <div className="relative">
            <div
              className={cn(
                "relative h-48 overflow-hidden group",
                isLight ? "rounded-b-3xl" : "",
              )}
            >
              <div className="absolute inset-0 z-[1] bg-black/10 pointer-events-none" />
              <button
                type="button"
                onClick={() => openImageInsert("banner")}
                className="absolute top-3 right-3 z-10 rounded-lg cursor-pointer bg-black/50 p-2 backdrop-blur-sm transition-colors touch-manipulation hover:bg-black/70"
                aria-label="Edit banner image"
              >
                <Pencil className="h-4 w-4 text-white" />
              </button>
              {hasMycardMedia(data.banner) ? (
                <img src={data.banner} alt="Banner" className="w-full h-full object-cover object-center" />
              ) : (
                <>
                  <MycardFallbackBanner name={data.name} />
                  <button
                    type="button"
                    onClick={() => openImageInsert("banner")}
                    className="absolute inset-x-0 top-0 bottom-16 z-[1] flex cursor-pointer items-center justify-center"
                  >
                    <div className="text-center">
                      <ImageIcon className="mx-auto mb-2 h-8 w-8 text-white/70" />
                      <p className="text-xs text-white/80">Tap to upload banner</p>
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* Profile Picture */}
            <div className="absolute -bottom-12 left-1/2 z-20 -translate-x-1/2">
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageInsert("profile");
                  }}
                  className={cn(
                    "h-24 w-24 overflow-hidden rounded-full",
                    isLight ? "bg-card border-4 border-border shadow-xl" : "bg-slate-800 border-4 border-slate-900",
                  )}
                  aria-label="Edit profile photo"
                >
                  <MycardProfileAvatar name={data.name} photo={data.photo} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageInsert("profile");
                  }}
                  className="absolute -bottom-0.5 -right-0.5 z-10 rounded-lg bg-black/50 p-1.5 backdrop-blur-sm transition-colors touch-manipulation hover:bg-black/70"
                  aria-label="Edit profile photo"
                >
                  <Pencil className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 pt-16 pb-8 space-y-6">
          {/* Social Links - Step 1 (continued) */}
          <div className="relative">
            <div className={cn("flex items-center justify-center gap-3 flex-wrap", contactIconClass)}>
              {/* Upload - Fixed, always first */}
              <button
                onClick={() => {
                  // TODO: Handle upload action
                }}
                className={contactBtnClass}
                style={contactGlassStyle}
                title="Upload/Share"
              >
                <Upload className="h-5 w-5" />
              </button>

              {/* Phone - if phones array has items */}
              {data.phones && data.phones.length > 0 && (
                <button
                  onClick={() => setEditingFixedItem("phone")}
                  className={contactBtnClass}
                  style={contactGlassStyle}
                  title={
                    data.phones.length > 1
                      ? `Phone (${data.phones.length} numbers)`
                      : `Phone: ${data.phones[0]?.number}`
                  }
                >
                  <Phone className="h-5 w-5" />
                  {data.phones.length > 1 && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-1 h-4 w-4 rounded-full text-xs flex items-center justify-center",
                        isLight ? "bg-violet-600 text-white" : "bg-blue-500 text-white",
                      )}
                    >
                      {data.phones.length}
                    </span>
                  )}
                </button>
              )}

              {/* Email - if available */}
              {data.email && (
                <button
                  onClick={() => {
                    setEditingFixedItem("email");
                    setEditingEmail(data.email); // Initialize with current email
                  }}
                  className={contactBtnClass}
                  style={contactGlassStyle}
                  title={`Email: ${data.email}`}
                >
                  <Mail className="h-5 w-5" />
                </button>
              )}

              {/* Website - if available */}
              {data.website && (
                <button
                  onClick={() => {
                    setEditingFixedItem("website");
                    setEditingWebsite(data.website); // Initialize with current website
                  }}
                  className={contactBtnClass}
                  style={contactGlassStyle}
                  title={`Website: ${data.website}`}
                >
                  <Globe className="h-5 w-5" />
                </button>
              )}

              {/* Address - if addresses array has items */}
              {data.addresses && data.addresses.length > 0 && (
                <button
                  onClick={() => setEditingFixedItem("address")}
                  className={contactBtnClass}
                  style={contactGlassStyle}
                  title={
                    data.addresses.length > 1
                      ? `Address (${data.addresses.length} locations)`
                      : `Address: ${data.addresses[0]?.address || ""}`
                  }
                >
                  <MapPin className="h-5 w-5" />
                  {data.addresses.length > 1 && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-1 h-4 w-4 rounded-full text-xs flex items-center justify-center",
                        isLight ? "bg-violet-600 text-white" : "bg-blue-500 text-white",
                      )}
                    >
                      {data.addresses.length}
                    </span>
                  )}
                </button>
              )}

              {/* Calendar Link - if available */}
              {data.calendarLink && (
                <button
                  onClick={() => {
                    setEditingFixedItem("calendarLink");
                    setEditingCalendarLink(data.calendarLink); // Initialize with current calendar link
                  }}
                  className={contactBtnClass}
                  style={contactGlassStyle}
                  title="Calendar"
                >
                  <Calendar className="h-5 w-5" />
                </button>
              )}

              {/* Social Links - actual social media platforms */}
              {data.socialLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    setEditingSocialLink(link.id);
                    setEditingSocialLinkUrl(link.url); // Initialize with current URL
                  }}
                  className={contactBtnClass}
                  style={contactGlassStyle}
                >
                  {getSocialIcon(link.type)}
                </button>
              ))}
              {showAddSocial ? (
                <ModalWrapper
                  appearance={appearance}
                  onClose={() => setShowAddSocial(false)}
                  cardClassName="flex flex-col p-5"
                >
                  <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <h3 className={cn("text-lg font-bold", ui.title)}>Add Contact</h3>
                    <button
                      onClick={() => setShowAddSocial(false)}
                      className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer", ui.closeBtn)}
                    >
                      <X className={cn("h-4 w-4", ui.closeIcon)} />
                    </button>
                  </div>
                  <div className={cn("overflow-y-auto flex-1 min-h-0", ui.scroll)}>
                    <div className="mb-4">
                      <h4 className={ui.sectionLabel}>Contact Info</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {!data.email && (
                          <button onClick={() => addFixedItem("email")} className={ui.addTile}>
                            <div className={ui.addTileIcon}>
                              <Mail className="h-4 w-4" />
                            </div>
                            <span className={ui.addTileLabel}>Email</span>
                          </button>
                        )}
                        {!data.website && (
                          <button onClick={() => addFixedItem("website")} className={ui.addTile}>
                            <div className={ui.addTileIcon}>
                              <Globe className="h-4 w-4" />
                            </div>
                            <span className={ui.addTileLabel}>Website</span>
                          </button>
                        )}
                        {!data.calendarLink && (
                          <button onClick={() => addFixedItem("calendarLink")} className={ui.addTile}>
                            <div className={ui.addTileIcon}>
                              <Calendar className="h-4 w-4" />
                            </div>
                            <span className={ui.addTileLabel}>Calendar</span>
                          </button>
                        )}
                        <button onClick={() => addFixedItem("phone")} className={ui.addTile}>
                          <div className={ui.addTileIcon}>
                            <Phone className="h-4 w-4" />
                          </div>
                          <span className={ui.addTileLabel}>Phone</span>
                        </button>
                        <button onClick={() => addFixedItem("address")} className={ui.addTile}>
                          <div className={ui.addTileIcon}>
                            <MapPin className="h-4 w-4" />
                          </div>
                          <span className={ui.addTileLabel}>Address</span>
                        </button>
                      </div>
                    </div>

                    {availableSocialTypes.length > 0 && (
                      <div>
                        <h4 className={ui.sectionLabel}>Social Media</h4>
                        <div className="grid grid-cols-3 gap-2 pr-2">
                          {availableSocialTypes.map((type) => (
                            <button
                              key={type}
                              onClick={() => addSocialLink(type)}
                              className={ui.addTile}
                            >
                              <div className={ui.addTileIcon}>
                                {getSocialIcon(type, "sm")}
                              </div>
                              <span className={cn(ui.addTileLabel, "capitalize")}>{type}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {availableSocialTypes.length === 0 && !data.email && !data.website && !data.calendarLink && (
                    <p className={cn("text-sm text-center py-4", ui.desc)}>All items have been added</p>
                  )}
                </ModalWrapper>
              ) : (availableSocialTypes.length > 0 || !data.email || !data.website || !data.calendarLink || true) ? (
                <button
                  onClick={() => setShowAddSocial(true)}
                  className={cn(contactBtnClass, "border-dashed")}
                  style={
                    isLight && contactGlassStyle
                      ? { ...contactGlassStyle, border: "1px dashed var(--glass-border)" }
                      : contactGlassStyle
                  }
                >
                  <Plus className={cn("h-5 w-5", isLight ? "text-muted-foreground" : "text-slate-400")} />
                </button>
              ) : null}
            </div>
          </div>

          {/* Social Link Edit Modal */}
          {editingSocialLink && (() => {
            const link = data.socialLinks.find(l => l.id === editingSocialLink);
            if (!link) return null;

            const currentUrl = editingSocialLinkUrl !== undefined ? editingSocialLinkUrl : link.url;

            return (
              <ModalWrapper
                appearance={appearance}
                onClose={() => {
                  setEditingSocialLink(null);
                  setEditingSocialLinkUrl(undefined);
                  setValidationErrors((prev) => ({ ...prev, socialLink: undefined }));
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", ui.iconWrap)}>
                      {getSocialIcon(link.type)}
                    </div>
                    <div>
                      <h3 className={cn("text-lg font-bold", ui.title)}>{link.label || link.type}</h3>
                      <p className={cn("text-xs", ui.desc)}>Enter your profile URL</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingSocialLink(null);
                      setEditingSocialLinkUrl(undefined);
                      setValidationErrors((prev) => ({ ...prev, socialLink: undefined }));
                    }}
                    className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer", ui.closeBtn)}
                  >
                    <X className={cn("h-4 w-4", ui.closeIcon)} />
                  </button>
                </div>
                <Input
                  value={currentUrl}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditingSocialLinkUrl(value);
                    const error = validateUrl(value);
                    setValidationErrors((prev) => ({ ...prev, socialLink: error }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !validationErrors.socialLink) {
                      onSocialLinkUpdate(link.id, { url: currentUrl });
                      performSave(data);
                      setEditingSocialLink(null);
                      setEditingSocialLinkUrl(undefined);
                      setValidationErrors((prev) => ({ ...prev, socialLink: undefined }));
                    }
                    if (e.key === "Escape") {
                      setEditingSocialLink(null);
                      setEditingSocialLinkUrl(undefined);
                      setValidationErrors((prev) => ({ ...prev, socialLink: undefined }));
                    }
                  }}
                  placeholder="https://..."
                  className={cn(ui.input, "mb-1", validationErrors.socialLink ? "border-red-500 focus:border-red-500" : "")}
                  autoFocus
                />
                {validationErrors.socialLink && (
                  <p className="text-xs text-red-400 mb-4">{validationErrors.socialLink}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      if (!validationErrors.socialLink) {
                        // Update store and save to API
                        onSocialLinkUpdate(link.id, { url: currentUrl });
                        performSave(data);
                        setEditingSocialLink(null);
                        setEditingSocialLinkUrl(undefined);
                        setValidationErrors((prev) => ({ ...prev, socialLink: undefined }));
                      }
                    }}
                    disabled={!!validationErrors.socialLink}
                    className={cn("flex-1", ui.saveBtn)}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      onSocialLinkRemove(link.id);
                      // Save removal to API
                      performSave({ ...data, socialLinks: data.socialLinks.filter(l => l.id !== link.id) });
                      setEditingSocialLink(null);
                      setEditingSocialLinkUrl(undefined);
                      setValidationErrors((prev) => ({ ...prev, socialLink: undefined }));
                    }}
                    className={ui.dangerBtn}
                  >
                    Delete
                  </button>
                </div>
              </ModalWrapper>
            );
          })()}

          {/* Fixed Item Edit Modals */}
          {editingFixedItem === "email" && (
            <ModalWrapper
              appearance={appearance}
              onClose={() => {
                setEditingFixedItem(null);
                setEditingEmail(undefined);
                setValidationErrors((prev) => ({ ...prev, email: undefined }));
              }}
            >
              <SimpleFieldEditModal
                appearance={appearance}
                title="Email"
                description="Enter your email address"
                icon={<Mail className="h-5 w-5" />}
                value={editingEmail !== undefined ? editingEmail : (data.email || "")}
                onChange={(value) => {
                  setEditingEmail(value);
                  const error = validateEmail(value);
                  setValidationErrors((prev) => ({ ...prev, email: error }));
                }}
                onSave={() => {
                  const currentEmail = editingEmail !== undefined ? editingEmail : (data.email || "");
                  if (!validationErrors.email) {
                    onDataChange({ email: currentEmail });
                    performSave({ ...data, email: currentEmail });
                    setEditingFixedItem(null);
                    setEditingEmail(undefined);
                    setValidationErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                onCancel={() => {
                  setEditingFixedItem(null);
                  setEditingEmail(undefined);
                  setValidationErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="your@email.com"
                type="email"
                error={validationErrors.email}
                validate={validateEmail}
              />
            </ModalWrapper>
          )}

          {editingFixedItem === "website" && (
            <ModalWrapper
              appearance={appearance}
              onClose={() => {
                setEditingFixedItem(null);
                setEditingWebsite(undefined);
                setValidationErrors((prev) => ({ ...prev, website: undefined }));
              }}
            >
              <SimpleFieldEditModal
                appearance={appearance}
                title="Website"
                description="Enter your website URL"
                icon={<Globe className="h-5 w-5" />}
                value={editingWebsite !== undefined ? editingWebsite : (data.website || "")}
                onChange={(value) => {
                  setEditingWebsite(value);
                  const error = validateUrl(value);
                  setValidationErrors((prev) => ({ ...prev, website: error }));
                }}
                onSave={() => {
                  const currentWebsite = editingWebsite !== undefined ? editingWebsite : (data.website || "");
                  if (!validationErrors.website) {
                    onDataChange({ website: currentWebsite });
                    performSave({ ...data, website: currentWebsite });
                    setEditingFixedItem(null);
                    setEditingWebsite(undefined);
                    setValidationErrors((prev) => ({ ...prev, website: undefined }));
                  }
                }}
                onCancel={() => {
                  setEditingFixedItem(null);
                  setEditingWebsite(undefined);
                  setValidationErrors((prev) => ({ ...prev, website: undefined }));
                }}
                onRemove={data.website ? () => {
                  onDataChange({ website: undefined });
                  performSave({ ...data, website: undefined });
                  setEditingFixedItem(null);
                  setEditingWebsite(undefined);
                  setValidationErrors((prev) => ({ ...prev, website: undefined }));
                } : undefined}
                showRemove={!!data.website}
                placeholder="https://..."
                type="url"
                error={validationErrors.website}
                validate={validateUrl}
              />
            </ModalWrapper>
          )}

          {editingFixedItem === "calendarLink" && (
            <ModalWrapper
              appearance={appearance}
              onClose={() => {
                setEditingFixedItem(null);
                setEditingCalendarLink(undefined);
                setValidationErrors((prev) => ({ ...prev, calendarLink: undefined }));
              }}
            >
              <SimpleFieldEditModal
                appearance={appearance}
                title="Calendar Link"
                description="Enter your calendar booking URL"
                icon={<Calendar className="h-5 w-5" />}
                value={editingCalendarLink !== undefined ? editingCalendarLink : (data.calendarLink || "")}
                onChange={(value) => {
                  setEditingCalendarLink(value);
                  const error = validateUrl(value);
                  setValidationErrors((prev) => ({ ...prev, calendarLink: error }));
                }}
                onSave={() => {
                  const currentCalendarLink = editingCalendarLink !== undefined ? editingCalendarLink : (data.calendarLink || "");
                  if (!validationErrors.calendarLink) {
                    onDataChange({ calendarLink: currentCalendarLink });
                    performSave({ ...data, calendarLink: currentCalendarLink });
                    setEditingFixedItem(null);
                    setEditingCalendarLink(undefined);
                    setValidationErrors((prev) => ({ ...prev, calendarLink: undefined }));
                  }
                }}
                onCancel={() => {
                  setEditingFixedItem(null);
                  setEditingCalendarLink(undefined);
                  setValidationErrors((prev) => ({ ...prev, calendarLink: undefined }));
                }}
                onRemove={data.calendarLink ? () => {
                  onDataChange({ calendarLink: undefined });
                  performSave({ ...data, calendarLink: undefined });
                  setEditingFixedItem(null);
                  setEditingCalendarLink(undefined);
                  setValidationErrors((prev) => ({ ...prev, calendarLink: undefined }));
                } : undefined}
                showRemove={!!data.calendarLink}
                placeholder="https://..."
                type="url"
                error={validationErrors.calendarLink}
                validate={validateUrl}
              />
            </ModalWrapper>
          )}

          {editingFixedItem === "phone" && (
            <ModalWrapper
              appearance={appearance}
              onClose={() => {
                setEditingFixedItem(null);
                setValidationErrors({});
              }}
            >
              <ModalHeader
                appearance={appearance}
                title="Phone Numbers"
                description="Manage your phone numbers"
                icon={<Phone className="h-5 w-5" />}
                onClose={() => {
                  setEditingFixedItem(null);
                  setValidationErrors({});
                }}
              />
              <>
                <div className="space-y-3 mb-4">
                  {data.phones?.map((phone) => (
                    <div key={phone.id} className={cn("flex items-center gap-2", ui.item)}>
                      <div className="flex-1">
                        <div className={ui.itemTitle}>{phone.number}</div>
                        {phone.type && <div className={ui.itemSub}>{phone.type}</div>}
                      </div>
                      <button
                        onClick={() => {
                          const updatedPhones = data.phones?.filter((p) => p.id !== phone.id);
                          onDataChange({ phones: updatedPhones });
                          performSave({ ...data, phones: updatedPhones });
                        }}
                        className="p-1.5 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mb-4">
                  <div>
                    <Input
                      type="tel"
                      value={newPhoneNumber}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewPhoneNumber(value);
                        const error = validatePhone(value);
                        setValidationErrors((prev) => ({ ...prev, phone: error }));
                      }}
                      placeholder="Phone number"
                      className={cn(ui.input, validationErrors.phone ? "border-red-500 focus:border-red-500" : "")}
                    />
                    {validationErrors.phone && (
                      <p className="text-xs text-red-400 mt-1">{validationErrors.phone}</p>
                    )}
                  </div>
                  <Input
                    value={newPhoneType}
                    onChange={(e) => setNewPhoneType(e.target.value)}
                    placeholder="Type (e.g., mobile, work)"
                    className={ui.input}
                  />
                  <button
                    onClick={() => {
                      const error = validatePhone(newPhoneNumber);
                      if (!error) {
                        handleSaveFixedItem();
                        setValidationErrors((prev) => ({ ...prev, phone: undefined }));
                      }
                    }}
                    disabled={!newPhoneNumber.trim() || !!validationErrors.phone}
                    className={cn("w-full", ui.saveBtn)}
                  >
                    Add Phone
                  </button>
                </div>
                <button
                  onClick={() => {
                    setEditingFixedItem(null);
                    setValidationErrors({});
                  }}
                  className={cn("w-full", ui.secondaryBtn)}
                >
                  Done
                </button>
              </>
            </ModalWrapper>
          )}

          {editingFixedItem === "address" && (
            <ModalWrapper
              appearance={appearance}
              onClose={() => {
                setEditingFixedItem(null);
                setEditingAddressId(null);
                setNewAddress({ title: "", address: "", city: "", state: "", zipCode: "", country: "" });
                setValidationErrors({});
              }}
            >
              <ModalHeader
                appearance={appearance}
                title="Addresses"
                description="Manage your addresses"
                icon={<MapPin className="h-5 w-5" />}
                onClose={() => {
                  setEditingFixedItem(null);
                  setEditingAddressId(null);
                  setNewAddress({ title: "", address: "", city: "", state: "", zipCode: "", country: "" });
                  setValidationErrors({});
                }}
              />
              <>
                <div className="space-y-3 mb-4">
                  {data.addresses?.map((address) => {
                    // Extract address fields for display/editing
                    const extractedFields = extractAddressFields(address.address);
                    return (
                      <div key={address.id} className={ui.item}>
                        <div className="flex items-start justify-between">
                          <div className={cn("flex-1 text-sm", ui.itemTitle)}>
                            {address.title && (
                              <div className={cn("font-semibold mb-1", isLight ? "text-violet-700" : "text-blue-400")}>{address.title}</div>
                            )}
                            <div className="font-medium">{extractedFields.address}</div>
                            {(extractedFields.city || extractedFields.state || extractedFields.zipCode) && (
                              <div className={cn("text-xs mt-1", ui.itemSub)}>
                                {[extractedFields.city, extractedFields.state, extractedFields.zipCode].filter(Boolean).join(", ")}
                              </div>
                            )}
                            {extractedFields.country && <div className={cn("text-xs", ui.itemSub)}>{extractedFields.country}</div>}
                          </div>
                          <div className="flex gap-2 ml-2">
                            <button
                              onClick={() => {
                                // Load address into edit form
                                setEditingAddressId(address.id);
                                setNewAddress({
                                  title: address.title || "",
                                  address: extractedFields.address || "",
                                  city: extractedFields.city || "",
                                  state: extractedFields.state || "",
                                  zipCode: extractedFields.zipCode || "",
                                  country: extractedFields.country || "",
                                });
                              }}
                              className={cn("p-1.5 transition-colors cursor-pointer", isLight ? "text-slate-400 hover:text-slate-700" : "text-blue-400 hover:text-blue-300")}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const updatedAddresses = data.addresses?.filter((a) => a.id !== address.id);
                                onDataChange({ addresses: updatedAddresses });
                                performSave({ ...data, addresses: updatedAddresses });
                              }}
                              className="p-1.5 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2 mb-4">
                  <Input
                    value={newAddress.title}
                    onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                    placeholder="Title (e.g., Office, Home)"
                    className={ui.input}
                  />
                  <Input
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    placeholder="Street address"
                    className={ui.input}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="City"
                      className={ui.input}
                    />
                    <Input
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      placeholder="State"
                      className={ui.input}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                      placeholder="ZIP Code"
                      className={ui.input}
                    />
                    <Input
                      value={newAddress.country}
                      onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                      placeholder="Country"
                      className={ui.input}
                    />
                  </div>
                  <button
                    onClick={handleSaveFixedItem}
                    disabled={!newAddress.address.trim()}
                    className={cn("w-full", ui.saveBtn)}
                  >
                    {editingAddressId ? "Update Address" : "Add Address"}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setEditingFixedItem(null);
                    setEditingAddressId(null);
                    setNewAddress({ title: "", address: "", city: "", state: "", zipCode: "", country: "" });
                    setValidationErrors({});
                  }}
                  className={cn("w-full", ui.secondaryBtn)}
                >
                  Done
                </button>
              </>
            </ModalWrapper>
          )}

          {/* Name and Tagline - Step 1 (continued) */}
          <div className="text-center space-y-2">
            <div className="relative inline-block group w-full max-w-md">
              {editingName ? (
                <Input
                  value={data.name}
                  onChange={(e) => onDataChange({ name: e.target.value })}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingName(false);
                  }}
                  className={cn(
                    "w-full text-xl font-bold text-center rounded-lg p-2 focus:outline-none focus:ring-2",
                    isLight
                      ? "font-serif bg-background border border-primary focus:ring-primary text-foreground"
                      : "bg-slate-800 border border-blue-500 focus:ring-blue-500 text-slate-200",
                  )}
                  autoFocus
                />
              ) : (
                <>
                  {data.name ? (
                    <div className="flex items-center justify-center gap-2">
                      <h1
                        className={cn(
                          "text-xl md:text-2xl font-bold font-serif",
                          isLight ? "text-foreground" : "text-slate-200",
                        )}
                      >
                        {data.name}
                      </h1>
                      <button
                        onClick={() => setEditingName(true)}
                        className={editPencilBtnClass}
                      >
                        <Pencil className={cn("h-4 w-4", isLight ? "text-foreground/70" : "text-blue-400 group-hover:text-white transition-colors")} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingName(true)}
                      className={dashedAddClass}
                    >
                      + Add Name
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="relative inline-block group w-full max-w-md">
              {editingTagline ? (
                <textarea
                  value={data.tagline}
                  onChange={(e) => onDataChange({ tagline: e.target.value })}
                  onBlur={() => setEditingTagline(false)}
                  className={cn(
                    "w-full min-h-[60px] p-2 text-sm text-center rounded-lg focus:outline-none focus:ring-2 resize-none",
                    isLight
                      ? "text-muted-foreground bg-background border border-primary focus:ring-primary"
                      : "text-slate-400 bg-slate-800 border border-blue-500 focus:ring-blue-500",
                  )}
                  autoFocus
                />
              ) : (
                <>
                  {data.tagline ? (
                    <div className="flex items-center justify-center gap-2">
                      <p className={cn("text-sm break-words", isLight ? "text-muted-foreground" : "text-slate-400")}>
                        {data.tagline}
                      </p>
                      <button
                        onClick={() => setEditingTagline(true)}
                        className={editPencilBtnClass}
                      >
                        <Pencil className={cn("h-4 w-4", isLight ? "text-foreground/70" : "text-blue-400 group-hover:text-white transition-colors")} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingTagline(true)}
                      className={dashedAddClass}
                    >
                      + Add Tagline
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Hotlinks - Step 2 */}
          <div className="relative space-y-2">
            {/* Edit Step Badge */}
            {isEditMode && !isLight && (
              <div className="absolute left-0 top-0 flex items-center gap-2 z-20">
                <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                  2
                </div>
              </div>
            )}
            {data.hotlinks.map((hotlink) => (
              <div key={hotlink.id} className="relative group">
                {editingHotlink === hotlink.id ? (
                  <div
                    className={cn(
                      "p-5 rounded-2xl border-2 shadow-xl backdrop-blur-sm",
                      isLight
                        ? "bg-card border-primary/40"
                        : "bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900 border-blue-500/60",
                    )}
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className={cn("block text-xs font-semibold uppercase tracking-wide", isLight ? "text-muted-foreground" : "text-slate-300")}>Title</label>
                        <Input
                          value={hotlink.title}
                          onChange={(e) => onHotlinkUpdate(hotlink.id, { title: e.target.value })}
                          className={cn(
                            "h-12 rounded-xl px-4 text-sm font-semibold border-2 transition-all duration-200 shadow-sm focus:ring-2",
                            isLight
                              ? "bg-background border-border text-foreground focus:border-primary focus:ring-primary/40"
                              : "bg-slate-900/90 border-slate-600/40 text-slate-100 focus:border-blue-500 focus:ring-blue-500/40 focus:shadow-md focus:shadow-blue-500/20",
                          )}
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={cn("block text-xs font-semibold uppercase tracking-wide", isLight ? "text-muted-foreground" : "text-slate-300")}>URL</label>
                        <Input
                          value={hotlink.url}
                          onChange={(e) => {
                            const value = e.target.value;
                            onHotlinkUpdate(hotlink.id, { url: value });
                            const error = validateUrl(value);
                            setValidationErrors((prev) => ({
                              ...prev,
                              hotlink: {
                                ...prev.hotlink,
                                [hotlink.id]: error,
                              },
                            }));
                          }}
                          placeholder="https://example.com"
                          className={cn(
                            "h-12 rounded-xl px-4 text-sm font-medium border-2 transition-all duration-200 shadow-sm focus:ring-2",
                            isLight
                              ? "bg-background text-foreground placeholder:text-muted-foreground"
                              : "bg-slate-900/90 text-slate-100",
                            validationErrors.hotlink?.[hotlink.id]
                              ? isLight
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                                : "border-red-500 focus:border-red-500 focus:ring-red-500/40 focus:shadow-red-500/20"
                              : isLight
                                ? "border-border focus:border-primary focus:ring-primary/40"
                                : "border-slate-600/40 focus:border-blue-500 focus:ring-blue-500/40 focus:shadow-blue-500/20",
                          )}
                        />
                        {validationErrors.hotlink?.[hotlink.id] && (
                          <p className={cn("text-xs mt-1", isLight ? "text-red-600" : "text-red-400")}>{validationErrors.hotlink[hotlink.id]}</p>
                        )}
                      </div>
                      <div className="flex gap-3 pt-1">
                        <Button
                          onClick={() => {
                            if (!validationErrors.hotlink?.[hotlink.id]) {
                              // Save hotlink changes to API
                              performSave(data);
                              setEditingHotlink(null);
                              setValidationErrors((prev) => ({
                                ...prev,
                                hotlink: {
                                  ...prev.hotlink,
                                  [hotlink.id]: undefined,
                                },
                              }));
                            }
                          }}
                          disabled={!!validationErrors.hotlink?.[hotlink.id]}
                          className={cn(
                            "flex-1 text-sm font-medium cursor-pointer",
                            isLight
                              ? "bg-violet-600 text-white hover:bg-violet-700 disabled:bg-slate-100 disabled:text-slate-400"
                              : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-600/20",
                          )}
                        >
                          Save Changes
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingHotlink(null);
                            setValidationErrors((prev) => ({
                              ...prev,
                              hotlink: {
                                ...prev.hotlink,
                                [hotlink.id]: undefined,
                              },
                            }));
                          }}
                          variant="outline"
                          className={cn(
                            "px-4 text-sm font-medium cursor-pointer",
                            isLight
                              ? "border-border bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                              : "bg-slate-700/50 hover:bg-slate-700/70 border-slate-600/50 text-slate-300 hover:text-slate-100",
                          )}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : isLight ? (
                  <div className="relative group/item">
                    <button
                      type="button"
                      onClick={() => setEditingHotlink(hotlink.id)}
                      className={ctaButtonClassName}
                      title={hotlink.url ? `${hotlink.title} — ${hotlink.url}` : hotlink.title}
                    >
                      <span className="min-w-0 truncate">{hotlink.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onHotlinkRemove(hotlink.id);
                        performSave({ ...data, hotlinks: data.hotlinks.filter((h) => h.id !== hotlink.id) });
                      }}
                      className="absolute right-2 top-1/2 z-10 -translate-y-1/2 h-8 w-8 rounded-full border border-border bg-[var(--glass-bg)] opacity-100 sm:opacity-0 group-hover/item:opacity-100 flex items-center justify-center cursor-pointer"
                      aria-label="Remove hotlink"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/30 rounded-xl border border-slate-700/50 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 group/item backdrop-blur-sm">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-slate-100 block truncate">{hotlink.title}</span>
                      {hotlink.url && (
                        <span className="text-xs text-slate-400/80 block truncate mt-1">{hotlink.url}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingHotlink(hotlink.id)}
                        className="h-9 w-9 rounded-lg bg-slate-700/60 hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-blue-500/30 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4 text-blue-400 group-hover/item:text-white transition-colors" />
                      </button>
                      <button
                        onClick={() => {
                          onHotlinkRemove(hotlink.id);
                          // Save removal to API
                          performSave({ ...data, hotlinks: data.hotlinks.filter(h => h.id !== hotlink.id) });
                        }}
                        className="h-9 w-9 rounded-lg bg-slate-700/60 hover:bg-gradient-to-br hover:from-red-600 hover:to-red-700 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-red-500/30 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 text-red-400 group-hover/item:text-white transition-colors" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {data.hotlinks.length < 3 && (
              <button
                onClick={addHotlink}
                className={dashedAddClass}
              >
                + Add Hotlink
              </button>
            )}
            <button type="button" className={ctaButtonClassName}>
              Save to Contacts
            </button>
            <button type="button" className={ctaButtonClassName}>
              Send myCARD
            </button>
          </div>

          {isLight && data.slug ? (
            <MyCardContentLiteView
              profileType={data.type}
              profileSlug={data.slug}
              variant="light"
            />
          ) : null}

          {/* About Section - Step 3 */}
          <div className="relative group">
            {/* Edit Step Badge */}
            {isEditMode && !isLight && (
              <div className="absolute left-0 top-2 flex items-center gap-2 z-20">
                <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                  3
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h2
                className={cn(
                  "font-bold font-serif",
                  isLight ? "text-xl text-foreground" : "text-lg text-slate-100 ml-8",
                )}
              >
                About
              </h2>
              {!editingAbout && data.about && (
                <button
                  onClick={() => setEditingAbout(true)}
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer",
                    isLight
                      ? "bg-[var(--glass-bg)] border border-border hover:border-primary/30"
                      : "bg-gradient-to-br from-slate-700/60 to-slate-800/60 hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-blue-500/30",
                  )}
                >
                  <Pencil className={cn("h-4 w-4", isLight ? "text-foreground/70" : "text-blue-400 group-hover:text-white transition-colors")} />
                </button>
              )}
            </div>
            {editingAbout ? (
              <div
                className={cn(
                  "p-5 rounded-2xl border-2 shadow-xl backdrop-blur-sm",
                  isLight
                    ? "bg-card border-primary/40"
                    : "bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900 border-blue-500/60",
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className={cn("block text-xs font-semibold uppercase tracking-wide", isLight ? "text-muted-foreground" : "text-slate-300")}>About Text</label>
                    <button
                      onClick={() => setShowAIAssistant(true)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      title="AskSKY! suggestions for your About section"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      AskSKY!
                    </button>
                  </div>
                  <textarea
                    value={data.about}
                    onChange={(e) => onDataChange({ about: e.target.value })}
                    className={cn(
                      "w-full min-h-[220px] p-5 text-sm leading-relaxed border-2 rounded-xl focus:outline-none focus:ring-2 resize-none transition-all duration-200 overflow-y-auto",
                      ui.scroll,
                      isLight
                        ? "text-foreground bg-background border-border focus:ring-primary/40 focus:border-primary placeholder:text-muted-foreground"
                        : "text-slate-100 bg-slate-900/90 border-slate-600/30 focus:ring-blue-500/40 focus:border-blue-500/80 placeholder:text-slate-500/70",
                    )}
                    placeholder="Tell people about yourself..."
                    autoFocus
                  />
                  <div className="flex gap-3 pt-1">
                    <Button
                      onClick={() => {
                        // Save about changes to API
                        performSave(data);
                        setEditingAbout(false);
                      }}
                      className="flex-1 bg-violet-600 text-white hover:bg-violet-700 text-sm font-medium cursor-pointer"
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => setEditingAbout(false)}
                      variant="outline"
                      className={cn(
                        "px-4 text-sm font-medium cursor-pointer",
                            isLight
                              ? "border-border bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                              : "bg-slate-700/50 hover:bg-slate-700/70 border-slate-600/50 text-slate-300 hover:text-slate-100",
                      )}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {data.about ? (
                  isLight ? (
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{data.about}</p>
                  ) : (
                    <div className="p-5 bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/30 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{data.about}</p>
                    </div>
                  )
                ) : (
                  <button
                    onClick={() => setEditingAbout(true)}
                    className={dashedAddClass}
                  >
                    + Add About
                  </button>
                )}
              </>
            )}
          </div>

          {!isLight && data.type === PROFILE_KIND.PERSONAL ? (
            <div className="relative">
              {isEditMode && (
                <div className="absolute left-0 top-2 flex items-center gap-2 z-20">
                  <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    4
                  </div>
                </div>
              )}
              <ContentHubLiteView />
            </div>
          ) : null}

          <ImageInsertDialog
            variant={isLight ? "light" : "default"}
            open={imageInsertOpen}
            title={imageUploadType === "profile" ? "Choose profile photo" : "Choose banner image"}
            onOpenChange={(open) => {
              setImageInsertOpen(open);
              if (!open && !imagePreview) {
                pendingImageKindRef.current = null;
              }
            }}
            onPick={async (result) => {
              const kind = pendingImageKindRef.current ?? imageUploadType;
              if (!kind) return;
              pendingImageKindRef.current = kind;
              let src: string;
              if (result.kind === "url") {
                src = result.imageSrc;
              } else {
                const f = result.files[0];
                if (!f) return;
                src = await readFileAsDataUrl(f);
              }
              setImageUploadType(kind);
              setImagePreview(src);
            }}
          />

          {/* Image Crop Modal */}
          {imageUploadType && imagePreview && (
            <ImageCropModal
              variant={isLight ? "light" : "default"}
              imageSrc={imagePreview}
              cropKind={imageUploadType}
              aspectRatio={imageUploadType === "banner" ? 1200 / 630 : 1}
              onCrop={handleImageCrop}
              onCancel={() => {
                setImagePreview(null);
                setImageUploadType(null);
              }}
            />
          )}

          {/* AI About Assistant Modal */}
          <AIAboutAssistant
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            onAccept={(text) => {
              onDataChange({ about: text });
              setShowAIAssistant(false);
              // Auto-save will handle saving to API
            }}
            profileData={data}
            appearance={appearance}
          />
        </div>
      </div>
    </div>
  );
}
