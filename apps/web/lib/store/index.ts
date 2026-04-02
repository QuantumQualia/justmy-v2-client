/**
 * Store Index
 * Central export point for all Zustand stores
 */

export { useProfileStore } from "./profile-store";
export type { ProfileData, SocialLink, Hotlink, Phone, Address, SocialType } from "./profile-store";
export type { ProfileKind, OsName } from "@/lib/os-types";
export {
  PROFILE_KINDS,
  OS_NAMES,
  PROFILE_KIND,
  OS_NAME,
  DEFAULT_PROFILE_KIND,
  DEFAULT_OS_NAME,
  PROFILE_KIND_ALIASES,
  REGISTER_TYPE_QUERY_BY_KIND,
  isProfileKind,
  isOsName,
  normalizeProfileKindInput,
  resolveProfileKindOrDefault,
  profileKindDisplayShort,
  profileKindDisplayOs,
  profileKindToRegisterQueryParam,
  profileKindToOsName,
  osNameToProfileKind,
  isBusinessProfileKind,
} from "@/lib/os-types";
export { mapApiProfileToProfileData } from "./profile-mapper";
export type { ApiProfileResponse } from "./profile-mapper";
export { useSearchStore } from "./search-store";
export type { SearchResultItem, BusinessCategory, CategoryConfig } from "./search-store";