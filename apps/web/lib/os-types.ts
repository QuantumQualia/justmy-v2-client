/**
 * Operating system identity.
 *
 * **Backend contract:** OS.name codes (uppercase) on `osName`. Profile.type is a synced copy.
 * Register/OAuth send `osName`.
 *
 * **Frontend kinds:** lowercase slugs for URLs (`?type=command`). `growth` is Command OS.
 */

export const PROFILE_KINDS = [
  "personal",
  "biz",
  "growth",
  "command_pro",
  "enterprise",
  "founder",
  "city",
  "network",
] as const;

export type ProfileKind = (typeof PROFILE_KINDS)[number];

export const OS_NAMES = [
  "PERSONAL",
  "BIZ",
  "COMMAND",
  "COMMAND_PRO",
  "ENTERPRISE",
  "GROWTH",
  "FOUNDER",
  "CITY",
  "NETWORK",
] as const;

export type OsName = (typeof OS_NAMES)[number];

export const PROFILE_KIND_SET = new Set<string>(PROFILE_KINDS);

const PROFILE_TO_OS: Record<ProfileKind, OsName> = {
  personal: "PERSONAL",
  biz: "BIZ",
  growth: "COMMAND",
  command_pro: "COMMAND_PRO",
  enterprise: "ENTERPRISE",
  founder: "FOUNDER",
  city: "CITY",
  network: "NETWORK",
};

const OS_TO_PROFILE: Record<OsName, ProfileKind> = {
  PERSONAL: "personal",
  BIZ: "biz",
  COMMAND: "growth",
  COMMAND_PRO: "command_pro",
  ENTERPRISE: "enterprise",
  GROWTH: "growth",
  FOUNDER: "founder",
  CITY: "city",
  NETWORK: "network",
};

export const PROFILE_KIND = {
  PERSONAL: "personal",
  BIZ: "biz",
  GROWTH: "growth",
  COMMAND_PRO: "command_pro",
  ENTERPRISE: "enterprise",
  FOUNDER: "founder",
  CITY: "city",
  NETWORK: "network",
} as const satisfies Record<string, ProfileKind>;

export const OS_NAME = {
  PERSONAL: "PERSONAL",
  BIZ: "BIZ",
  COMMAND: "COMMAND",
  COMMAND_PRO: "COMMAND_PRO",
  ENTERPRISE: "ENTERPRISE",
  GROWTH: "GROWTH",
  FOUNDER: "FOUNDER",
  CITY: "CITY",
  NETWORK: "NETWORK",
} as const satisfies Record<string, OsName>;

export const DEFAULT_PROFILE_KIND: ProfileKind = "personal";
export const DEFAULT_OS_NAME: OsName = "PERSONAL";

export const BUSINESS_OS_FAMILY: readonly string[] = [
  "BIZ",
  "COMMAND",
  "COMMAND_PRO",
  "ENTERPRISE",
  "GROWTH",
  "FOUNDER",
];

const OS_ALIASES: Record<string, OsName> = {
  GROWTH: "COMMAND",
  FOUNDER: "COMMAND_PRO",
  COMMAND: "COMMAND",
  COMMAND_PRO: "COMMAND_PRO",
  ENTERPRISE: "ENTERPRISE",
  BIZ: "BIZ",
  PERSONAL: "PERSONAL",
  CITY: "CITY",
  NETWORK: "NETWORK",
};

export function canonicalizeOsName(raw?: string | null): string {
  const u = String(raw || "").trim().toUpperCase();
  if (!u) return OS_NAME.PERSONAL;
  return OS_ALIASES[u] || u;
}

export function isBusinessOs(raw?: string | null): boolean {
  const u = String(raw || "").trim().toUpperCase();
  if (!u) return false;
  if (BUSINESS_OS_FAMILY.includes(u)) return true;
  return BUSINESS_OS_FAMILY.includes(canonicalizeOsName(u));
}

export const PROFILE_KIND_ALIASES: Readonly<Record<string, ProfileKind>> = {
  command: "growth",
  command_os: "growth",
  commandpro: "command_pro",
  "command-pro": "command_pro",
};

export const REGISTER_TYPE_QUERY_BY_KIND: Partial<Record<ProfileKind, string>> = {
  growth: "command",
};

export function profileKindToRegisterQueryParam(kind: ProfileKind): string {
  return REGISTER_TYPE_QUERY_BY_KIND[kind] ?? kind;
}

const PROFILE_KIND_DISPLAY_SHORT: Record<ProfileKind, string> = {
  personal: "Personal",
  biz: "Biz",
  growth: "Command",
  command_pro: "Command PRO",
  enterprise: "Enterprise",
  founder: "Founder",
  city: "City",
  network: "Network",
};

const PROFILE_KIND_DISPLAY_OS: Record<ProfileKind, string> = {
  personal: "Personal OS",
  biz: "Biz OS",
  growth: "Command OS",
  command_pro: "Command PRO",
  enterprise: "Enterprise",
  founder: "Founders OS",
  city: "City OS",
  network: "Network OS",
};

export const PROFILE_KINDS_BUSINESS: readonly ProfileKind[] = [
  "biz",
  "growth",
  "command_pro",
  "enterprise",
  "founder",
  "city",
  "network",
];

const BUSINESS_SET = new Set<string>(PROFILE_KINDS_BUSINESS);

export function isProfileKind(value: string): value is ProfileKind {
  return PROFILE_KIND_SET.has(value);
}

export function normalizeProfileKindInput(raw: string): ProfileKind | undefined {
  const lower = raw.trim().toLowerCase();
  if (!lower) return undefined;
  const fromAlias = PROFILE_KIND_ALIASES[lower];
  if (fromAlias) return fromAlias;
  if (isProfileKind(lower)) return lower;
  const asOs = osNameToProfileKind(raw);
  if (asOs) return asOs;
  return undefined;
}

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
  const canonical = canonicalizeOsName(u);
  if (isOsName(canonical)) return OS_TO_PROFILE[canonical];
  return undefined;
}

export function isBusinessProfileKind(kind: ProfileKind): boolean {
  return BUSINESS_SET.has(kind);
}
