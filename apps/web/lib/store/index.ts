/**
 * Store Index
 * Central export point for all Zustand stores
 */

export { useProfileStore } from "./profile-store";
export type { ProfileData, SocialLink, Hotlink, Phone, Address, SocialType } from "./profile-store";
export { mapApiProfileToProfileData } from "./profile-mapper";
export type { ApiProfileResponse } from "./profile-mapper";
export { useSearchStore } from "./search-store";
export type { SearchResultItem } from "./search-store";