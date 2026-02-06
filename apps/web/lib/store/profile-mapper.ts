/**
 * Profile Mapper
 * Maps API profile response to ProfileData format used by components
 * Also provides reverse mapping from ProfileData to API DTOs
 */

import type { ProfileData, SocialLink, Hotlink, Phone, Address } from "./profile-store";
import type { UpdateProfileDto, SocialLinkDto, HotlinkDto, PhoneDto, LocationDto } from "../services/profiles";

// API Response types (matching formatProfileResponse and formatPublicProfileResponse)
export interface ApiProfileResponse {
  id: string;
  name: string;
  slug: string;
  type: string;
  zipCode: string;
  tagline?: string;
  about?: string;
  email?: string | null;
  website?: string | null;
  calendarLink?: string | null;
  photo?: string | null;
  banner?: string | null;
  phones?: Array<{
    id: string;
    number: string;
    type?: string;
    extension?: string;
  }>;
  locations?: Array<{
    id: string;
    title?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
  }>;
  socialLinks?: Array<{
    id: string;
    name: string;
    link: string;
  }>;
  socials?: Array<{
    id: string;
    name: string;
    link: string;
  }>;
  hotlinks?: Array<{
    id: string;
    label: string;
    link: string;
  }>;
  ctas?: Array<{
    id: string;
    label: string;
    link: string;
  }>;
  // ... other fields not needed for myCard view
}

// Map social name to type
function mapSocialNameToType(name: string): SocialLink["type"] {
  const nameLower = name.toLowerCase();
  const mapping: Record<string, SocialLink["type"]> = {
    facebook: "facebook",
    instagram: "instagram",
    twitter: "x",
    x: "x",
    linkedin: "linkedin",
    youtube: "youtube",
    vimeo: "vimeo",
    yelp: "yelp",
    behance: "behance",
    deviantart: "deviantart",
    digg: "digg",
    dribbble: "dribbble",
    discord: "discord",
    etsy: "etsy",
    fiverr: "fiverr",
    flickr: "flickr",
    github: "github",
    imdb: "imdb",
    lastfm: "lastfm",
    mix: "mix",
    myspace: "myspace",
    paypal: "paypal",
    pinterest: "pinterest",
    quora: "quora",
    reddit: "reddit",
    snapchat: "snapchat",
    soundcloud: "soundcloud",
    tiktok: "tiktok",
    threads: "threads",
    tumblr: "tumblr",
    twitch: "twitch",
    vk: "vk",
    whatsapp: "whatsapp",
    xing: "xing",
  };
  return mapping[nameLower] || "x"; // Default to x if unknown
}

/**
 * Map API profile response to ProfileData format
 */
export function mapApiProfileToProfileData(apiProfile: ApiProfileResponse): ProfileData {
  // Map social links - only include actual social media platforms
  // Filter out upload, email, contact, phone, address from socials
  // Support both socialLinks (from formatPublicProfileResponse) and socials (from formatProfileResponse)
  const socialsArray = apiProfile.socialLinks || apiProfile.socials || [];
  const socialLinks: SocialLink[] = socialsArray
    .filter((social) => {
      const nameLower = social.name.toLowerCase();
      // Exclude special items that are handled separately
      return !["upload", "email", "contact", "phone", "address"].includes(nameLower);
    })
    .map((social) => ({
      id: social.id,
      type: mapSocialNameToType(social.name),
      url: social.link,
      label: social.name,
    }));

  // Map phones
  const phones: Phone[] = (apiProfile.phones || []).map((phone) => ({
    id: phone.id,
    number: phone.number,
    type: phone.type,
  }));

  // Map addresses from locations
  const addresses: Address[] = (apiProfile.locations || []).map((location) => ({
    id: location.id,
    title: location.title || "Office",
    address: location.address || "",
    latitude: location.latitude,
    longitude: location.longitude,
  }));

  // Map hotlinks (CTAs) - support both hotlinks and ctas
  const ctasArray = apiProfile.hotlinks || apiProfile.ctas || [];
  const hotlinks: Hotlink[] = ctasArray.map((cta) => ({
    id: cta.id,
    title: cta.label,
    url: cta.link,
  }));

  // Convert id from string to number if needed
  let profileId: number | undefined;
  if (apiProfile.id) {
    profileId = typeof apiProfile.id === 'string'
      ? parseInt(apiProfile.id, 10)
      : apiProfile.id;
    if (isNaN(profileId)) {
      profileId = undefined;
    }
  }

  // Map type - support new profile types: personal, biz, growth, founder, city, network
  // Also handle legacy mapping: old "business" type with subscription tier maps to new types
  let profileType: "personal" | "biz" | "growth" | "founder" | "city" | "network" | undefined;
  
  const apiType = apiProfile.type?.toLowerCase();
  
  // Check if it's one of the new profile types
  if (apiType === "personal" || apiType === "biz" || apiType === "growth" || 
      apiType === "founder" || apiType === "city" || apiType === "network") {
    profileType = apiType;
  } else if (apiType === "business") {
    // Legacy: Map old "business" type based on subscription tier
    // This assumes the API response includes subscription info in a parent object
    // If subscription tier is available, map accordingly
    // Otherwise default to "biz" (which was Business-Free)
    profileType = "biz"; // Default fallback for old business profiles
  }

  return {
    id: profileId,
    type: profileType,
    slug: apiProfile.slug,
    photo: apiProfile.photo || "",
    banner: apiProfile.banner || "",
    name: apiProfile.name || "",
    tagline: apiProfile.tagline || "",
    email: apiProfile.email || undefined,
    website: apiProfile.website || undefined,
    calendarLink: apiProfile.calendarLink || undefined,
    phones: phones.length > 0 ? phones : undefined,
    addresses: addresses.length > 0 ? addresses : undefined,
    socialLinks,
    hotlinks,
    about: apiProfile.about || "",
  };
}

// Map social type to name (reverse of mapSocialNameToType)
function mapSocialTypeToName(type: SocialLink["type"]): string {
  const mapping: Record<SocialLink["type"], string> = {
    facebook: "facebook",
    instagram: "instagram",
    x: "x",
    linkedin: "linkedin",
    youtube: "youtube",
    vimeo: "vimeo",
    yelp: "yelp",
    behance: "behance",
    deviantart: "deviantart",
    digg: "digg",
    dribbble: "dribbble",
    discord: "discord",
    etsy: "etsy",
    fiverr: "fiverr",
    flickr: "flickr",
    github: "github",
    imdb: "imdb",
    lastfm: "lastfm",
    mix: "mix",
    myspace: "myspace",
    paypal: "paypal",
    pinterest: "pinterest",
    quora: "quora",
    reddit: "reddit",
    snapchat: "snapchat",
    soundcloud: "soundcloud",
    tiktok: "tiktok",
    threads: "threads",
    tumblr: "tumblr",
    twitch: "twitch",
    vk: "vk",
    whatsapp: "whatsapp",
    xing: "xing",
  };
  return mapping[type] || type;
}

/**
 * Map ProfileData to UpdateProfileDto format for API
 */
export function mapProfileDataToUpdateDto(profileData: ProfileData): UpdateProfileDto {
  const dto: UpdateProfileDto = {};

  // Basic fields
  if (profileData.name) dto.name = profileData.name;
  if (profileData.tagline) dto.tagline = profileData.tagline;
  if (profileData.photo) dto.photo = profileData.photo;
  if (profileData.banner) dto.banner = profileData.banner;
  if (profileData.about) dto.about = profileData.about;

  if (profileData.email) dto.email = profileData.email;
  if (profileData.website) dto.website = profileData.website;
  if (profileData.calendarLink) dto.calendarLink = profileData.calendarLink;

  // Social links
  if (profileData.socialLinks && profileData.socialLinks.length > 0) {
    dto.socialLinks = profileData.socialLinks
      .filter((link) => link.url && link.url.trim() !== "") // Only include links with URLs
      .map((link) => ({
        name: mapSocialTypeToName(link.type),
        link: link.url,
      }));
  } else {
    dto.socialLinks = [];
  }

  // Hotlinks
  if (profileData.hotlinks && profileData.hotlinks.length > 0) {
    dto.hotlinks = profileData.hotlinks
      .filter((hotlink) => hotlink.url && hotlink.url.trim() !== "") // Only include hotlinks with URLs
      .map((hotlink) => ({
        label: hotlink.title,
        link: hotlink.url,
      }));
  } else {
    dto.hotlinks = [];
  }

  // Phones
  if (profileData.phones && profileData.phones.length > 0) {
    dto.phones = profileData.phones.map((phone) => ({
      type: phone.type || "main",
      number: phone.number,
    }));
  } else {
    dto.phones = [];
  }

  // Locations (from addresses)
  // Note: Address.address already contains the combined address string from combineAddressFields
  if (profileData.addresses && profileData.addresses.length > 0) {
    dto.locations = profileData.addresses
      .filter((addr) => addr.address && addr.address.trim() !== "") // Only include addresses with content
      .map((address) => {
        const location: LocationDto = {
          title: address.title || "Address", // Use title if available, otherwise default
          address: address.address, // Already combined address string
        };
        // Include latitude/longitude if available
        if (address.latitude) {
          location.latitude = parseFloat(address.latitude);
        }
        if (address.longitude) {
          location.longitude = parseFloat(address.longitude);
        }
        return location;
      });
  } else {
    dto.locations = [];
  }

  return dto;
}
