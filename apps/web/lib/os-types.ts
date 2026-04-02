/**
 * Operating system identity: six OS values used across the app.
 *
 * **Backend contract (wire format):** only these six kinds — lowercase on profiles (`type`),
 * uppercase on auth/API (`profileType` / `osName`). Nothing else is stored or sent to the API.
 *
 * **Frontend-only aliases:** marketing URLs like `?type=command` map to canonical `growth` via
 * `PROFILE_KIND_ALIASES` + `normalizeProfileKindInput`. Add more aliases here over time; resolve
 * to `ProfileKind` before any API call. Use `profileKindToRegisterQueryParam` when building
 * user-facing register links so growth shows as `command` in the query string.
 *
 * **Display:** use `profileKindDisplayShort` / `profileKindDisplayOs` for UI copy (e.g. growth → "Command OS").
 */

export const PROFILE_KINDS = [
  "personal",
  "biz",
  "growth",
  "founder",
  "city",
  "network",
] as const;

export type ProfileKind = (typeof PROFILE_KINDS)[number];

export const OS_NAMES = [
  "PERSONAL",
  "BIZ",
  "GROWTH",
  "FOUNDER",
  "CITY",
  "NETWORK",
] as const;

export type OsName = (typeof OS_NAMES)[number];

/** Fast membership checks for `ProfileData.type` / register query strings. */
export const PROFILE_KIND_SET = new Set<string>(PROFILE_KINDS);

const PROFILE_TO_OS: Record<ProfileKind, OsName> = {
  personal: "PERSONAL",
  biz: "BIZ",
  growth: "GROWTH",
  founder: "FOUNDER",
  city: "CITY",
  network: "NETWORK",
};

const OS_TO_PROFILE: Record<OsName, ProfileKind> = {
  PERSONAL: "personal",
  BIZ: "biz",
  GROWTH: "growth",
  FOUNDER: "founder",
  CITY: "city",
  NETWORK: "network",
};

/** Named constants for comparisons, e.g. `data.type === PROFILE_KIND.PERSONAL`. */
export const PROFILE_KIND = {
  PERSONAL: "personal",
  BIZ: "biz",
  GROWTH: "growth",
  FOUNDER: "founder",
  CITY: "city",
  NETWORK: "network",
} as const satisfies Record<
  "PERSONAL" | "BIZ" | "GROWTH" | "FOUNDER" | "CITY" | "NETWORK",
  ProfileKind
>;

export const OS_NAME = {
  PERSONAL: "PERSONAL",
  BIZ: "BIZ",
  GROWTH: "GROWTH",
  FOUNDER: "FOUNDER",
  CITY: "CITY",
  NETWORK: "NETWORK",
} as const satisfies Record<
  "PERSONAL" | "BIZ" | "GROWTH" | "FOUNDER" | "CITY" | "NETWORK",
  OsName
>;

export const DEFAULT_PROFILE_KIND: ProfileKind = "personal";
export const DEFAULT_OS_NAME: OsName = "PERSONAL";

/**
 * User-facing / marketing tokens only (e.g. `register?type=command`) → canonical `ProfileKind`.
 * Inbound only; never sent to the backend — always resolve then use `profileKindToOsName` / `type`.
 */
export const PROFILE_KIND_ALIASES: Readonly<Record<string, ProfileKind>> = {
  command: "growth",
};

/**
 * Preferred `?type=` value for outbound links per canonical kind (omit key = use canonical slug).
 * Example: growth → `command` in the URL while the API still receives `GROWTH` / `growth`.
 */
export const REGISTER_TYPE_QUERY_BY_KIND: Partial<Record<ProfileKind, string>> = {
  growth: "command",
};

/** Build `type` query param for register URLs shown to users. */
export function profileKindToRegisterQueryParam(kind: ProfileKind): string {
  return REGISTER_TYPE_QUERY_BY_KIND[kind] ?? kind;
}

/** User-facing strings (marketing names may differ from internal keys, e.g. growth → Command). */
const PROFILE_KIND_DISPLAY_SHORT: Record<ProfileKind, string> = {
  personal: "Personal",
  biz: "Biz",
  growth: "Command",
  founder: "Founder",
  city: "City",
  network: "Network",
};

const PROFILE_KIND_DISPLAY_OS: Record<ProfileKind, string> = {
  personal: "Personal OS",
  biz: "Biz OS",
  growth: "Command OS",
  founder: "Founders OS",
  city: "City OS",
  network: "Network OS",
};

/** Kinds that use business/org fields on register (non-personal). */
export const PROFILE_KINDS_BUSINESS: readonly ProfileKind[] = [
  "biz",
  "growth",
  "founder",
  "city",
  "network",
];

const BUSINESS_SET = new Set<string>(PROFILE_KINDS_BUSINESS);

export function isProfileKind(value: string): value is ProfileKind {
  return PROFILE_KIND_SET.has(value);
}

/**
 * Maps URL fragments, API `type` strings, etc. to a canonical `ProfileKind`.
 * Returns `undefined` if the string is not a known kind or alias.
 */
export function normalizeProfileKindInput(raw: string): ProfileKind | undefined {
  const lower = raw.trim().toLowerCase();
  if (!lower) return undefined;
  const fromAlias = PROFILE_KIND_ALIASES[lower];
  if (fromAlias) return fromAlias;
  if (isProfileKind(lower)) return lower;
  return undefined;
}

/**
 * Parse query / env input into a canonical kind, falling back when missing or unknown.
 */
export function resolveProfileKindOrDefault(
  raw: string | null | undefined,
  fallback: ProfileKind = DEFAULT_PROFILE_KIND
): ProfileKind {
  const v = raw?.trim();
  if (!v) return fallback;
  return normalizeProfileKindInput(v) ?? fallback;
}

export function profileKindDisplayShort(kind: ProfileKind): string {
  return PROFILE_KIND_DISPLAY_SHORT[kind];
}

export function profileKindDisplayOs(kind: ProfileKind): string {
  return PROFILE_KIND_DISPLAY_OS[kind];
}

export function isOsName(value: string): value is OsName {
  return (OS_NAMES as readonly string[]).includes(value);
}

export function profileKindToOsName(kind: ProfileKind): OsName {
  return PROFILE_TO_OS[kind];
}

export function osNameToProfileKind(name: string): ProfileKind | undefined {
  const u = name.trim().toUpperCase();
  if (isOsName(u)) return OS_TO_PROFILE[u];
  return undefined;
}

export function isBusinessProfileKind(kind: ProfileKind): boolean {
  return BUSINESS_SET.has(kind);
}
